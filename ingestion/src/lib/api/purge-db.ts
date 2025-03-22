import { RC_APP_URI } from "../../../constants"

export async function purgeDB(): Promise<boolean> {
   try {
      const res = await fetch(`${RC_APP_URI}/purgeDB`, {
         method: "POST",
         headers: {
            accept: "application/json",
            "Content-Type": "application/json",
         },
      })

      return res.status === 200
   } catch (e) {
      console.log(e)
      return false
   }
} 