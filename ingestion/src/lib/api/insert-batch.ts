import { RC_APP_URI } from "../../../constants"
import { DBNode } from "../../../core/dbNode"

export async function insertBatch(batchID: string, nodes: DBNode[]): Promise<boolean> {
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