import { BaseNode, BaseRelation, EmbeddingsContainer } from "./types"

export type DevDocModelRelation = BaseRelation

export interface DevDocModelProps extends BaseNode, EmbeddingsContainer {
   url: string
   element: string
   content: string
}

export class DevDocModel implements DevDocModelProps {
   id: string
   relations: DevDocModelRelation[]
   nameEmbeddings: number[]
   codeEmbeddings: number[]
   contentEmbeddings: number[]

   url: string
   element: string
   content: string

   constructor(props: DevDocModelProps) {
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