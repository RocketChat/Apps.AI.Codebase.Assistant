import { BaseNode, BaseRelation, EmbeddingsContainer } from "./types"

export type DocumentationModelRelation = BaseRelation

export interface DocumentationModelProps extends BaseNode, EmbeddingsContainer {
   url: string
   element: string
   content: string
}

export class DocumentationModel implements DocumentationModelProps {
   id: string
   relations: DocumentationModelRelation[]
   nameEmbeddings: number[]
   codeEmbeddings: number[]
   contentEmbeddings: number[]

   url: string
   element: string
   content: string

   constructor(props: DocumentationModelProps) {
      this.id = props.id
      this.relations = props.relations
      this.nameEmbeddings = props.nameEmbeddings || []
      this.codeEmbeddings = props.codeEmbeddings || []
      this.contentEmbeddings = props.contentEmbeddings || []
      this.url = props.url
      this.element = props.element
      this.content = props.content
   }
}