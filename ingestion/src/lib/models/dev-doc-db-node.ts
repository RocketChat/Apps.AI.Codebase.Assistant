export type DevDocDBNodeRelationType = "CONTAINS"
export type DevDocDBNodeRelation = {
   target: string
   relation: DevDocDBNodeRelationType
}

export type DevDocDBNode = {
   id: string
   relations: DevDocDBNodeRelation[]

   url: string
   element: string

   content: string
   contentEmbeddings: number[]
}
