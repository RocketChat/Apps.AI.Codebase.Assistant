export type BaseRelationType = "CONTAINS" | "USES"

export interface BaseRelation {
   target: string
   relation: BaseRelationType
}

export interface BaseNode {
   id: string
   relations: BaseRelation[]
}

export interface EmbeddingsContainer {
   nameEmbeddings?: number[]
   codeEmbeddings?: number[]
   contentEmbeddings?: number[]
}

export type NodeDescriptor = "Node" | "Documentation" | "Code" | "Styleguide"

export * from "./code"
export * from "./devdoc"
export * from "./styleguide"
