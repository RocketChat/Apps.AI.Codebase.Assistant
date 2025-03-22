import { BaseNode, BaseRelation, EmbeddingsContainer, NodeDescriptor } from "."

export type Styleguides = Record<string, string>
export type StyleguideModelRelation = BaseRelation

export interface StyleguideModelProps extends BaseNode, EmbeddingsContainer {
   name: string
   filePath: string
   content: string
   descriptor: NodeDescriptor
}

export class StyleguideModel implements StyleguideModelProps {
   id: string
   name: string
   filePath: string
   content: string
   relations: StyleguideModelRelation[]
   nameEmbeddings: number[]
   codeEmbeddings: number[]
   contentEmbeddings: number[]
   descriptor: NodeDescriptor

   constructor(props: StyleguideModelProps) {
      this.id = props.id
      this.name = props.name
      this.filePath = props.filePath
      this.content = props.content
      this.relations = props.relations
      this.nameEmbeddings = props.nameEmbeddings || []
      this.codeEmbeddings = props.codeEmbeddings || []
      this.contentEmbeddings = props.contentEmbeddings || []
      this.descriptor = props.descriptor
   }

   getDBInsertQuery(): string {
      return `
         CREATE (n:Styleguide {
            id: $id,
            name: $name,
            filePath: $filePath,
            content: $content,
            nameEmbeddings: $nameEmbeddings,
            codeEmbeddings: $codeEmbeddings,
            contentEmbeddings: $contentEmbeddings,
            descriptor: $descriptor
         })
      `
   }

   getNodeName(): string {
      return this.name
   }
} 