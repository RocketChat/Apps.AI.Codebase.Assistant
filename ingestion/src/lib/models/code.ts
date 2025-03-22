import { TreeNode } from "../../process/prepare/processor/core/treeNode"
import { BaseNode, BaseRelation, EmbeddingsContainer, NodeDescriptor } from "."

export type CodeModelRelation = BaseRelation

export interface CodeModelProps extends BaseNode, EmbeddingsContainer {
   name: string
   type: string
   code: string
   filePath: string
   isFile?: boolean
   descriptor: NodeDescriptor
}

export class CodeModel implements CodeModelProps {
   id: string
   name: string
   type: string
   code: string
   filePath: string
   relations: CodeModelRelation[]
   nameEmbeddings: number[]
   codeEmbeddings: number[]
   isFile: boolean
   descriptor: NodeDescriptor

   constructor(props: CodeModelProps) {
      this.id = props.id
      this.name = props.name
      this.type = props.type
      this.code = props.code
      this.filePath = props.filePath
      this.relations = props.relations
      this.nameEmbeddings = props.nameEmbeddings || []
      this.codeEmbeddings = props.codeEmbeddings || []
      this.isFile = props.isFile || false
      this.descriptor = props.descriptor
   }

   static fromTreeNode(node: TreeNode): CodeModel {
      return new CodeModel({
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
