import { readFileSync, readdirSync } from "fs"
import path from "path"
import { v4 as uuid } from "uuid"

import { CodeModel, CodeModelRelation } from "@/models/code"
import { DocumentationModel, DocumentationModelRelation } from "@/models/devdoc"
import { purgeDB, insertBatch, establishRelations } from "@/api"

export async function insertDataIntoDB(batchesDirPath: string) {
   console.log("🕒 Inserting")

   const files = readdirSync(batchesDirPath).map((file) => path.resolve(batchesDirPath, file))

   // /* Step 1: Empty DB */
   {
      const success = await purgeDB()
      if (!success) {
         console.log("❌ Error emptying db")
         return
      }

      console.log("🕒 Purged DB")
   }

   /* Step 2: Insert batch */
   {
      const errorBatches: Set<string> = new Set()

      const relations: (CodeModelRelation | DocumentationModelRelation)[] = []

      // Insert each batch
      let batches: string[][] = []
      for (let i = 0; i < files.length; i += 10) {
         batches.push(files.slice(i, i + 10))
      }

      console.log("🕒 Waiting for batches")
      for (const group of batches) {
         const batchID = uuid()
         const nodes: (CodeModel | DocumentationModel)[] = []

         for (const file of group) {
            const data = readFileSync(file, "utf-8")
            nodes.push(...(Object.values(JSON.parse(data)) as (CodeModel | DocumentationModel)[]))

            for (const node of nodes) {
               relations.push(
                  ...node.relations.map((relation) => ({
                     source: node.id,
                     target: relation.target,
                     relation: relation.relation,
                  }))
               )
            }
         }

         const success = await insertBatch(batchID, nodes)
         if (success) {
            console.log(`📦 ${batchID} inserted`)
         } else {
            console.log(`❌ Error inserting ${batchID}`)
            errorBatches.add(batchID)
         }

         await new Promise((resolve) => setTimeout(resolve, 3_000))
      }

      console.log("📦 All batches inserted")

      if (errorBatches.size > 0) console.log("❌ Error batches", errorBatches)

      // Establish relations
      const batchSize = 1000
      for (let i = 0; i < relations.length; i += batchSize) {
         const success = await establishRelations(relations.slice(i, i + batchSize))
         if (success) {
            console.log(`🔗 Relations established ${i + 1000}/${relations.length}`)
         } else {
            console.log(`❌ Error establishing relations ${i + 1000}/${relations.length}`)
         }
      }

      console.log("🔗 All Relations established")
   }

   console.log("✅ Inserted")
}
