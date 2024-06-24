import {
   BindingElement,
   Node,
   SyntaxKind,
   TemplateExpression,
   VariableStatement,
   ts,
} from "ts-morph"
import { Commons } from "./commons"

export const notFoundKindNames = new Set<string>()

export class TreeNode {
   node: Node<ts.Node>
   isFile: boolean

   constructor(node: Node<ts.Node>, isFile?: boolean) {
      this.node = node
      this.isFile = isFile || false
   }

   getName(): string {
      switch (this.node.getKind()) {
         case ts.SyntaxKind.SourceFile:
            return this.node.getSourceFile().getBaseName()
         case ts.SyntaxKind.VariableStatement:
            return (
               (this.node as VariableStatement)
                  .getDeclarations()?.[0]
                  ?.getName() || ""
            )
         case ts.SyntaxKind.ClassDeclaration:
         case ts.SyntaxKind.Decorator:
         case ts.SyntaxKind.EnumDeclaration:
         case ts.SyntaxKind.EnumMember:
         case ts.SyntaxKind.FunctionDeclaration:
         case ts.SyntaxKind.FunctionType:
         case ts.SyntaxKind.FunctionExpression:
         case ts.SyntaxKind.ArrowFunction:
         case ts.SyntaxKind.MethodDeclaration:
         case ts.SyntaxKind.InterfaceDeclaration:
         case ts.SyntaxKind.ModuleDeclaration:
         case ts.SyntaxKind.TypeAliasDeclaration:
         case ts.SyntaxKind.VariableDeclaration:
         case ts.SyntaxKind.PropertyDeclaration:
         case ts.SyntaxKind.TypeParameter:
         case ts.SyntaxKind.Identifier:
         case ts.SyntaxKind.Parameter:
            return this.node.getSymbol()?.getName() ?? ""
         case ts.SyntaxKind.TemplateExpression:
            return (
               (this.node as TemplateExpression)
                  .getParent()
                  .getSymbol()
                  ?.getName() || ""
            )
         case ts.SyntaxKind.BindingElement:
            return (this.node as BindingElement).getName()
         default:
            notFoundKindNames.add(this.node.getKindName())
            return (
               this.node.getSymbol()?.getFullyQualifiedName().split(".")[1] ||
               ""
            )
      }
   }

   getFilePath(): string {
      return this.node
         .getSourceFile()
         .getFilePath()
         .slice(Commons.getProjectPath().length)
   }

   getID(): string {
      const filePath = this.getFilePath()
      const nodeName = this.getName()
      const lineNumberStart = this.node.getStartLineNumber()
      const lineNumberEnd = this.node.getEndLineNumber()
      const kind = this.node.getKind()

      if (this.isFile) return `${filePath}`

      return `${filePath}:${nodeName}:${lineNumberStart}:${lineNumberEnd}:${kind}`
   }

   getKind(): SyntaxKind {
      if (this.isFile) return SyntaxKind.SourceFile
      return this.node.getKind()
   }

   getKindName(): string {
      if (this.isFile) return "File"
      return this.node.getKindName()
   }

   getType(): string {
      if (this.isFile) return "File"
      try {
         return this.node.getType().getText() || "any"
      } catch (error) {
         return "any"
      }
   }
}
