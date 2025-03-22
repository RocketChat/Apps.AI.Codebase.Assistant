import { namedTypes } from "ast-types"
import path from "path"
import { parse } from "recast"
import * as tsParser from "recast/parsers/typescript"

import { CodeModel } from "@/lib/models/code"
import { ISourceFile } from "../sourceFile.types"
import { IFileProcessor } from "./file.types"

import { TreeNode } from "./core/treeNode"
import { Classes } from "./syntax/classes"
import { Enums } from "./syntax/enums"
import { Functions } from "./syntax/functions"
import { Interface } from "./syntax/interface"
import { Namespaces } from "./syntax/namespaces"
import { TypeAlias } from "./syntax/typeAlias"
import { VariableDeclarations } from "./syntax/variableDeclarations"
import { DevDocModel } from "@/lib/models/devdoc"

export class FileProcessor implements IFileProcessor {
   process(sourceFile: ISourceFile, nodesRef: Record<string, CodeModel | DevDocModel>): void {
      const fileContent = sourceFile.read()
      const ast = parse(fileContent, {
         parser: tsParser,
      })

      let treeNodes: TreeNode[] = []
      for (let node of ast.program.body) {
         if (namedTypes.ExportDefaultDeclaration.check(node)) node = (node as any).declaration
         if (namedTypes.ExportNamedDeclaration.check(node)) node = (node as any).declaration
         // if (namedTypes.ExpressionStatement.check(node))
         // 	node = (node as any).expression

         // if (namedTypes.CallExpression.check(node)) {
         // 	console.log(Functions.flattenCallExpression(node as any))
         // 	console.log(node)
         // }
         if (namedTypes.FunctionDeclaration.check(node))
            /* Functions */
            treeNodes.push(Functions.Handle(node))
         else if (namedTypes.TSInterfaceDeclaration.check(node))
            /* Interfaces */
            treeNodes.push(Interface.Handle(node as any))
         else if (namedTypes.TSTypeAliasDeclaration.check(node))
            /* Type Aliases */
            treeNodes.push(TypeAlias.Handle(node))
         else if (namedTypes.TSEnumDeclaration.check(node))
            /* Enums */
            treeNodes.push(Enums.Handle(node as any))
         else if (namedTypes.ClassDeclaration.check(node))
            /* Classes */
            treeNodes.push(Classes.Handle(node))
         else if (namedTypes.TSModuleDeclaration.check(node))
            /* Namespaces */
            treeNodes.push(Namespaces.Handle(node))
         else if (namedTypes.VariableDeclaration.check(node))
            /* Variables */
            treeNodes.push(...VariableDeclarations.Handle(node))
      }

      // Resolve imports
      const parsedImports = new Map<string, string>() // { importName: absolutePath }
      {
         const imports = ast.program.body
            .filter((node: any) => namedTypes.ImportDeclaration.check(node)) // Filter out all non-import nodes
            .filter((node: any) => node.source.value.startsWith(".")) // Filter out all library/non-relative imports
         for (const i of imports) {
            if (!(i as any).specifiers[0]) continue
            const importName = (i as any).specifiers[0].local.name
            const relativePath = (i as any).source.value

            const currentFileDirectory = sourceFile
               .getFullPath()
               .slice(0, sourceFile.getFullPath().lastIndexOf("/"))

            let finalPath = ""
            const backSteps = relativePath.match(/\.\.\//g)
            if (backSteps) {
               const currentFileDirectoryParts = currentFileDirectory.split("/")
               finalPath = path.join(...currentFileDirectoryParts, relativePath).replaceAll("\\", "/")
            } else {
               finalPath = path.join(currentFileDirectory, relativePath).replaceAll("\\", "/") + ".ts"
            }

            parsedImports.set(importName, finalPath)
         }
      }

      // Replace import names with absolute paths
      const nodesInFile: Record<string, string> = {} // { name: id }
      for (const node of treeNodes) {
         node.sourceFileRelativePath = sourceFile.getFullPath()
         nodesInFile[node.name] = node.getID()
      }

      for (const treeNode of treeNodes) {
         treeNode.name ||= "Anonymous"
         treeNode.sourceFileRelativePath = sourceFile.getFullPath()
         treeNode.uses = treeNode.uses
            .filter((x) => x.name)
            .map((x) => {
               if (parsedImports.has(x.name)) x.name = `${parsedImports.get(x.name)!}:${x.name}`
               if (nodesInFile[x.name]) {
                  x.name = nodesInFile[x.name]
               }
               return x
            })
      }

      // Add the nodes to the global reference
      const fileContentLines = fileContent.split("\n")

      for (const treeNode of treeNodes) {
         if (!treeNode.body) {
            const startLine = treeNode.location.start.line - 1
            const endLine = treeNode.location.end.line + 1
            treeNode.body = fileContentLines.slice(startLine, endLine).join("\n").trim()
         }

         const dbNode = CodeModel.fromTreeNode(treeNode)
         nodesRef[dbNode.id] = dbNode
      }

      // Create file node
      const fileNode = new CodeModel({
         id: sourceFile.getFullPath(),
         name: sourceFile.getFullPath(),
         type: "File",

         code: fileContent,

         filePath: sourceFile.getFullPath(),
         relations: treeNodes.map((x) => ({
            target: x.getID(),
            relation: "CONTAINS",
         })),

         nameEmbeddings: [],
         codeEmbeddings: [],

         isFile: true,
         descriptor: "Node",
      })
      nodesRef[fileNode.id] = fileNode
   }
}
