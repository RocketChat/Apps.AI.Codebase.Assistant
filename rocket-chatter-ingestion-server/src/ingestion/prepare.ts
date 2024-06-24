import {
   existsSync,
   mkdirSync,
   readFileSync,
   readdirSync,
   rmSync,
   writeFileSync,
} from "fs"
import path from "path"
import { Node, Project, SourceFile, ts } from "ts-morph"
import { Commons } from "../core/commons"
import { DBNode } from "../core/dbNode"
import { TreeNode } from "../core/treeNode"
import { RefNode } from "./prepare.types"

const unhandledRefKinds = new Set<string>()

const TRACKED_KINDS = [
   ts.SyntaxKind.FunctionDeclaration,
   ts.SyntaxKind.ArrowFunction,
   ts.SyntaxKind.SourceFile,
   ts.SyntaxKind.MethodDeclaration,
   ts.SyntaxKind.PropertyDeclaration,
   ts.SyntaxKind.ClassDeclaration,
   ts.SyntaxKind.InterfaceDeclaration,
   ts.SyntaxKind.ModuleDeclaration,
   ts.SyntaxKind.TemplateExpression,
   ts.SyntaxKind.EnumDeclaration,
   ts.SyntaxKind.TypeAliasDeclaration,
   ts.SyntaxKind.VariableDeclaration,
]

namespace Helpers {
   export function moveUpUntilParentFound(
      node: Node,
      allowedParents: ts.SyntaxKind[]
   ): Node<ts.FunctionDeclaration> | undefined {
      const parent = node.getParent()
      if (!parent) {
         return undefined // Reached the top of the file
      }

      if (allowedParents.includes(parent.getKind())) {
         return parent as Node<ts.FunctionDeclaration>
      }

      return moveUpUntilParentFound(parent, allowedParents)
   }

   export function writeNodesRangeToFile(
      nodes: Record<string, DBNode>,
      fileName: string,
      start: number,
      end: number
   ) {
      const entries = Object.entries(nodes).slice(start, end)
      if (entries.length === 0) return 0
      const batch = Object.fromEntries(entries)
      writeFileSync(`data/${fileName}`, JSON.stringify(batch, null, 2))

      return entries.length
   }
}

let done = 0

namespace Algorithms {
   async function processRefNode(
      nodes: Record<string, DBNode>,
      node: Node<ts.Node>,
      fileNode: DBNode
   ) {
      try {
         const refNode = DBNode.fromTreeNode(new TreeNode(node))
         const fnID = refNode.id
         nodes[fnID] = refNode
         nodes[fnID].relations.push({
            relation: fileNode.isFile ? "IN_FILE" : "LOCAL_OF",
            target: fileNode.id,
         })

         // Establish relations between nodes
         if ((node as any).findReferencesAsNodes) {
            ;(node as RefNode).findReferencesAsNodes().forEach((ref) => {
               try {
                  switch (ref.getKind()) {
                     case ts.SyntaxKind.ArrowFunction:
                     case ts.SyntaxKind.FunctionDeclaration:
                     case ts.SyntaxKind.FunctionExpression: {
                        const nodeLocation = ref.getFirstAncestorByKind(
                           ts.SyntaxKind.CallExpression
                        )
                        if (!nodeLocation) return

                        const parent = Helpers.moveUpUntilParentFound(
                           nodeLocation,
                           TRACKED_KINDS
                        )
                        if (!parent) return

                        const parentID = new TreeNode(parent).getID()

                        const isAlreadyRelated = nodes[fnID].relations.some(
                           (rel) => {
                              return rel.target === parentID
                           }
                        )
                        if (isAlreadyRelated) return

                        nodes[fnID].relations.push({
                           relation: "CALLED_BY",
                           target: parentID,
                        })

                        break
                     }

                     case ts.SyntaxKind.Identifier: {
                        const nodeLocation = ref.getFirstAncestor()
                        if (!nodeLocation) return

                        const parent = Helpers.moveUpUntilParentFound(
                           nodeLocation,
                           TRACKED_KINDS
                        )
                        if (!parent) return

                        const parentID = new TreeNode(parent).getID()
                        const isAlreadyRelated = nodes[fnID].relations.some(
                           (rel) => {
                              return rel.target === parentID
                           }
                        )
                        if (isAlreadyRelated) return

                        nodes[fnID].relations.push({
                           relation: "USED_IN",
                           target: parentID,
                        })

                        break
                     }

                     default: {
                        unhandledRefKinds.add(ref.getKindName())
                     }
                  }
               } catch (e) {}
            })

            for (const type of TRACKED_KINDS) {
               ;(node as RefNode).getChildrenOfKind(type).forEach((child) => {
                  processRefNode(nodes, child, fileNode)
               })
            }
         }

         try {
            const jobs = node.getLocals().map(async (local) => {
               const declaration = local.getDeclarations()[0]
               if (!declaration) return
               await processRefNode(nodes, declaration, refNode)
            })
            await Promise.all(jobs)
         } catch (e) {
            console.log(e)
         }
      } catch (e) {
         console.log("Error while processing node:", node)
      }
   }

   export async function processSourceFile(
      nodes: Record<string, DBNode>,
      sourceFile: SourceFile
   ) {
      const fileNode = DBNode.fromTreeNode(new TreeNode(sourceFile, true))
      nodes[fileNode.id] = fileNode
      const allNodes = TRACKED_KINDS.map((kind) =>
         sourceFile.getDescendantsOfKind(kind)
      ).flat()

      const jobs = allNodes.map((x) => processRefNode(nodes, x, fileNode))
      await Promise.all(jobs)
   }
}

export async function prepareCodebase(
   projectPath: string,
   batchSize = 50,
   startFrom: number = 0
) {
   Commons.setProjectPath(path.resolve(projectPath))

   console.log("🕒 Preparing Nodes")

   const project = new Project()
   project.addSourceFilesAtPaths(`${projectPath}/**/*.ts`) // glob patterns
   console.log("🟢 TOTAL FILES:", project.getSourceFiles().length)
   const files = project.getSourceFiles().slice(startFrom)

   /// cleanup process
   // create directory named "data"
   const dataFolder = "data"
   if (existsSync(dataFolder)) {
      rmSync(dataFolder, { recursive: true })
   }
   mkdirSync(dataFolder)
   ///

   let nBatches = 0
   let nodesProcessed = 0
   let nOutputFilesProcessed = 0
   while (nBatches * batchSize < startFrom + files.length) {
      let nodes: Record<string, DBNode> = {}

      const start = nBatches * batchSize
      const end = Math.min((nBatches + 1) * batchSize, startFrom + files.length)

      console.log(`\n🕒 Processing ${start}-${end} files`)

      // Process files in batches of size "batch"
      try {
         const jobs = files
            .slice(start, end)
            .map((x) => Algorithms.processSourceFile(nodes, x))
         await Promise.all(jobs)
      } catch {
         console.error(`Error in processing ${start}-${end} files`)
      }

      {
         /**
          * After gathering all the nodes from the files, it's not guranteed that they can't
          * be more than `batchSize` nodes. So, we need to split the nodes into batches of
          * `batchSize` nodes separately.
          */
         for (
            let nodeBatchStart = 0;
            nodeBatchStart < Object.keys(nodes).length;
            nodeBatchStart += batchSize
         ) {
            nodesProcessed += Helpers.writeNodesRangeToFile(
               nodes,
               `batch-${++nOutputFilesProcessed}.json`,
               nodeBatchStart,
               nodeBatchStart + batchSize
            )
         }
      }

      ++nBatches

      console.log(`✅ Processed ${start}-${end} files\n`)
   }

   console.log(`✅ Prepared ${nodesProcessed} nodes`)
}

export async function prepareNodesEmbeddings(dir: string, nodesPerFile = 50) {
   console.log("🕒 Preparing Embeddings")

   if (existsSync("data/embeddings"))
      rmSync("data/embeddings", { recursive: true })
   mkdirSync("data/embeddings")

   const files = readdirSync(dir)
      .filter((x) => x.endsWith(".json"))
      .map((x) => `./${dir}/${x}`) // convert path like "batch-1.json" to "./data/batch-1.json"

   const embeddingsPerNode = 2
   const maxAllowedEmbeddingsPerMinute = 2800 // openai limitation for embeddings
   const nFilesPerBatch = Math.floor(
      maxAllowedEmbeddingsPerMinute / nodesPerFile / embeddingsPerNode
   )

   let batch = 0
   for (let i = 0; i < files.length; i += nFilesPerBatch) {
      const start = i
      const end = Math.min(i + nFilesPerBatch, files.length)

      console.log(`\n🕒 Embedding ${start}-${end} files`)

      let nodes: Record<string, DBNode> = {}
      for (const file of files.slice(start, end)) {
         // to convert file content from a plain string to js object
         const data = JSON.parse(readFileSync(file, "utf-8"))
         nodes = { ...nodes, ...data }
      }

      console.log(Object.values(nodes).length)
      const jobs = Object.values(nodes).map(async (x) => {
         nodes[x.id] = await DBNode.fillEmbeddings(new DBNode(x))
      })
      await Promise.all(jobs)

      writeFileSync(
         `data/embeddings/batch-${++batch}.json`,
         JSON.stringify(nodes, null, 2)
      )

      console.log(`✅ Embedded ${start}-${end} files\n`)

      console.log(`🕒 Waiting for 60 seconds`)
      await new Promise((resolve) => setTimeout(resolve, 60 * 1000))
   }

   console.log(`✅ Prepared embeddings for nodes`)
}
