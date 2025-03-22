import { exec } from "child_process"
import { v4 as uuid } from "uuid"

import { REPO_URI } from "./core/constants"
import { Documentation } from "./process/documentation/documentation"
import { insertDataIntoDB } from "./process/ingest/ingest"
import { Codebase } from "./process/prepare/codebase"
import { FileProcessor } from "./process/prepare/processor/file"

namespace Algorithms {
   export async function execCommand(command: string) {
      await new Promise((resolve, reject) => {
         console.log(`🕒 ${command}`)

         exec(command, (error, stdout, stderr) => {
            if (error) {
               reject(`Error: ${error.message}`)
               return
            }
            resolve(stdout)
         })
      })
   }
}

async function main() {
   await new Promise((resolve) => setTimeout(resolve, 1000))
   console.clear()

   let tries = 5
   while (tries--) {
      try {
         const sessionID = "Rocket.Chat" // uuid()

         await Algorithms.execCommand(`git clone ${REPO_URI} ${sessionID}`)
         {
            const codebase = new Codebase(sessionID, new FileProcessor(), 1)
            await codebase.process()

            const docs = new Documentation()
            await docs.prepare(codebase.dataDirPath)

            await insertDataIntoDB(codebase.dataDirPath)
         }
         await Algorithms.execCommand(`rm -rf ${sessionID}`)

         break
      } catch {
         console.error("Retrying", tries)
      }
   }
}

main()
