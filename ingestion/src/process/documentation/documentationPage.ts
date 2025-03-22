import { JSDOM } from "jsdom"

import { customAlphabet } from "nanoid"
import { DevDocModel } from "@/lib/models/devdoc"
import { DocumentPageElement_t, IDocumentationPage } from "./documentationPage.types"

export class DocumentationPage implements IDocumentationPage {
   private readonly _url: string
   get url() {
      return this._url
   }

   constructor(url: string) {
      this._url = url
   }

   private parseHtmlToHierarchy(root: HTMLDivElement): DocumentPageElement_t[] {
      const elements = Array.from(root.querySelectorAll("h1, h2, h3, h4, h5, h6, p, pre"))

      function parseElements(elements: Element[]): DocumentPageElement_t[] {
         const hierarchy: DocumentPageElement_t[] = []
         const stack: DocumentPageElement_t[] = []

         elements.forEach((el) => {
            const tagName = el.tagName.toLowerCase()
            const content = el.textContent?.trim() || ""

            const newElement: DocumentPageElement_t = {
               id: customAlphabet("1234567890abcdef", 10)(),
               element: tagName,
               content: "",
               children: [],
            }

            if (!tagName.startsWith("h")) {
               newElement.content = content
               if (stack.length > 0) {
                  stack[stack.length - 1].children!.push(newElement)
               }
            } else {
               // Extract the heading level from tagName ('h1' -> 1, 'h2' -> 2, etc.)
               const headingLevel = parseInt(tagName[1])

               newElement.content = content

               // Adjust the stack based on heading level
               while (stack.length > 0 && getHeadingLevel(stack[stack.length - 1].element) >= headingLevel) {
                  stack.pop()
               }

               if (stack.length === 0) {
                  // Top-level heading
                  hierarchy.push(newElement)
               } else {
                  // Add as a child of the last heading in the stack
                  stack[stack.length - 1].children.push(newElement)
               }

               stack.push(newElement)
            }
         })

         return hierarchy
      }

      // Helper function to extract heading level from 'h1', 'h2', ..., 'h6'
      function getHeadingLevel(tagName: string): number {
         return parseInt(tagName[1], 10)
      }

      return parseElements(elements)
   }

   private traverseHierarchy(node: DocumentPageElement_t, devDocsDBNodes: DevDocModel[]): DevDocModel {
      const devdocNode = new DevDocModel({
         id: node.id,
         relations: [],
         nameEmbeddings: [],
         codeEmbeddings: [],

         url: this._url,
         element: node.element,

         content: node.content || "",
         contentEmbeddings: [],
      })

      if (node.children) {
         node.children.forEach((child) => {
            const childNode = this.traverseHierarchy(child, devDocsDBNodes)
            devdocNode.relations.push({
               target: childNode.id,
               relation: "CONTAINS",
            })
            devDocsDBNodes.push(childNode)
         })
      }

      return devdocNode
   }

   private convertHeirarchyToDevDocsDBNodes(hierarchy: DocumentPageElement_t[]): DevDocModel[] {
      const devDocsDBNodes: DevDocModel[] = []
      for (const node of hierarchy) {
         const devDocDBNode = this.traverseHierarchy(node, devDocsDBNodes)
         devDocsDBNodes.push(devDocDBNode)
      }

      return devDocsDBNodes
   }

   async fetchNodes() {
      const res = await fetch(this.url)
      const body = await res.text()
      const { window, document } = new JSDOM(body).window

      const content = document.evaluate(
         `//*[@id="doc_content_block"]`,
         document,
         null,
         window.XPathResult.FIRST_ORDERED_NODE_TYPE,
         null
      ).singleNodeValue as HTMLDivElement
      if (!content) throw new Error("Content not found")

      const hierarchy = this.parseHtmlToHierarchy(content)
      const nodes = this.convertHeirarchyToDevDocsDBNodes(hierarchy)

      return nodes
   }
}
