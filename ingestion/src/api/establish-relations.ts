import { RC_APP_URI } from "@/core/constants"
import { CodeModelRelation } from "@/models/code"

export async function establishRelations(relations: CodeModelRelation[]): Promise<boolean> {
   try {
      const res = await fetch(`${RC_APP_URI}/establishRelations`, {
         method: "POST",
         headers: {
            "Content-Type": "application/json",
         },
         body: JSON.stringify({ relations }),
      })

      return res.status === 200
   } catch (e) {
      console.log(e)
      return false
   }
}
