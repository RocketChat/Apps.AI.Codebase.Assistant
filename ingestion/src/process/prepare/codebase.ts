import { existsSync, mkdirSync, rmSync, writeFileSync } from "fs"
import { glob } from "glob"
import path from "path"
import { v4 as uuid } from "uuid"

import { CodeModel } from "@/models/code"
import { DocumentationModel } from "@/models/devdoc"
import { IFileProcessor } from "./processor/file.types"
import { SourceFile } from "./sourceFile"
import { ISourceFile } from "./sourceFile.types"

export class Codebase {
   private _path: string
   private _dataDirPath: string
   private _dataDirName: string

   private _batchSize: number
   private _fileProcessor: IFileProcessor

   private _files: ISourceFile[] = []
   private _batches: number[][] = []

   constructor(path: string, fileProcessor: IFileProcessor, batchSize = 50) {
      // If path ends with any number of /, remove them
      if (path.endsWith("/")) path = path.replace(/\/+$/, "")

      this._path = path
      this._dataDirName = ""
      this._dataDirPath = ""

      this._batchSize = batchSize
      this._fileProcessor = fileProcessor

      this.initializeDataDirectory()
      this.prepareFilesMetadata()
      this.makeFilesBatches()
   }

   get dataDirPath(): string {
      return this._dataDirPath
   }

   private initializeDataDirectory(removeExisting = false): void {
      this._dataDirName = "data" // uuid()
      this._dataDirPath = path.resolve(this._path, this._dataDirName)

      /* Handle data directory */
      if (removeExisting && existsSync(this._dataDirPath)) rmSync(this._dataDirPath, { recursive: true })
      mkdirSync(this._dataDirPath)
   }

   private prepareFilesMetadata() {
      const extensions = ["ts", "js"]

      console.log(`🕒 Preparing metadata for files: *.${extensions.join(", *.")}`)
      {
         const globPatterns = extensions.map((x) => `**/*.${x}`)
         for (const pattern of globPatterns) {
            const files = glob.sync(`${this._path}/${pattern}`).map((x) => new SourceFile(x))
            this._files.push(...files)
         }
      }
      console.log(`✅ Prepared metadata for ${this._files.length} files\n`)
   }

   private makeFilesBatches() {
      const batches: number[][] = []
      for (let i = 0; i < this._files.length; i += this._batchSize) batches.push([i, i + this._batchSize])

      this._batches = batches
   }

   private writeNodesToFile(nodes: Record<string, CodeModel | DocumentationModel>, fileName: string) {
      const entries = Object.entries(nodes)
      if (entries.length === 0) return 0
      const batch = Object.fromEntries(entries)
      writeFileSync(path.resolve(this._dataDirPath, fileName), JSON.stringify(batch, null, 2))

      return entries.length
   }

   private async processFilesBatch(batchNumber: number, start: number, end: number): Promise<number> {
      let nNodesProcessed = 0

      console.log(`🕒 Processing ${start}-${end} files`)
      {
         let nodes: Record<string, CodeModel | DocumentationModel> = {}

         /* Step 1 */
         try {
            const files = this._files.slice(start, end)
            const jobs = files.map((x) => this._fileProcessor.process(x, nodes))
            await Promise.all(jobs)
         } catch (e) {
            console.log(e)
            console.error(`Error in processing ${start}-${end} files`)
         }

         /* Step 2 */
         this.writeNodesToFile(nodes, `batch-${batchNumber}.json`)

         nNodesProcessed = Object.keys(nodes).length
      }
      console.log(`✅ Processed ${start}-${end} files (${nNodesProcessed} nodes)\n`)

      return nNodesProcessed
   }

   /**
    * The main function to process the files in the codebase. The function works in the following
    * steps:
    *
    * 1. Process the files in parallel of size `batchSize` and gather all the nodes in the `nodes` object.
    * 2. After gathering all the nodes from the files, it's not guranteed that they can't be more than
    *    `batchSize` nodes. So, we need to split the nodes into batches of `batchSize` nodes separately.
    * 3. Repeat Step 1 and Step 2 for all the files.
    *
    * @returns Promise<void>
    */
   async process(): Promise<void> {
      console.log("🕒 Preparing Nodes\n")

      let nodesProcessed = 0
      for (const [index, batch] of this._batches.entries()) {
         const [start, end] = batch
         nodesProcessed += await this.processFilesBatch(index, start, end)
      }

      console.log(`✅ Prepared ${nodesProcessed} nodes`)
   }
}
