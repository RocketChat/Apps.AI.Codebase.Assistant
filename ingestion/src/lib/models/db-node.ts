import { TreeNode } from "../../process/prepare/processor/core/treeNode"

export type DBNodeRelationType = "CONTAINS" | "USES"
export type DBNodeRelation = { target: string; relation: DBNodeRelationType }

export class DBNode {
   id: string
   name: string
   type: string

   code: string

   filePath: string
   relations: DBNodeRelation[]

   nameEmbeddings: number[]
   codeEmbeddings: number[]

   isFile: boolean
   descriptor: "Node" | string

   constructor(node: {
      id: string
      name: string
      type: string
      code: string
      filePath: string
      relations: DBNodeRelation[]
      nameEmbeddings: number[]
      codeEmbeddings: number[]
      descriptor: "Node" | string

      isFile?: boolean
   }) {
      this.id = node.id
      this.name = node.name
      this.type = node.type

      this.code = node.code

      this.filePath = node.filePath
      this.relations = node.relations

      this.nameEmbeddings = node.nameEmbeddings
      this.codeEmbeddings = node.codeEmbeddings

      this.isFile = node.isFile || false
      this.descriptor = node.descriptor
   }

   static fromTreeNode(node: TreeNode): DBNode {
      return new DBNode({
         id: node.getID(),
         name: node.name,
         type: node.type,

         code: node.body,

         filePath: node.sourceFileRelativePath,
         relations: node.uses.map((use) => ({
            target: use.name,
            relation: "USES",
         })),

         nameEmbeddings: [],
         codeEmbeddings: [],

         isFile: false,
         descriptor: "Node",
      })
   }

   getNodeName(): string {
      return this.name
   }
}
