import { DevDocDBNode } from "../../core/devDocDBNode"

export type DocumentPageElement_t = {
   id: string
   element: string
   content: string
   children: DocumentPageElement_t[]
}

export interface IDocumentationPage {
   fetchNodes(): Promise<DevDocDBNode[]>
}
