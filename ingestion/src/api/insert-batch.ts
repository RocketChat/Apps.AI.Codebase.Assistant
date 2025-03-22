import { RC_APP_URI } from "@/core/constants"
import { CodeModel } from "@/models/code"
import { DocumentationModel } from "@/models/devdoc"

export async function insertBatch(batchID: string, nodes: (CodeModel | DocumentationModel)[]): Promise<boolean> {
   let tries = 5
   while (tries--) {
      try {
         const res = await fetch(`${RC_APP_URI}/ingest`, {
            method: "POST",
            headers: {
               accept: "application/json",
               "Content-Type": "application/json",
            },
            body: JSON.stringify({ nodes, batchID }),
         })

         if (res.status !== 200) {
            console.log(res)
            return false
         }

         return true
      } catch (e) {
         console.log(e)
      }
   }
   return false
}
