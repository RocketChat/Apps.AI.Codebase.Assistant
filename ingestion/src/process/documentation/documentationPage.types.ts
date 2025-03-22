import { DevDocModel } from "@/lib/models/devdoc"

export type DocumentPageElement_t = {
   id: string
   element: string
   content: string
   children: DocumentPageElement_t[]
}

export interface IDocumentationPage {
   fetchNodes(): Promise<DevDocModel[]>
}
