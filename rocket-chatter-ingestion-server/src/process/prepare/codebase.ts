import {
	existsSync,
	mkdirSync,
	readFileSync,
	readdirSync,
	rmSync,
	writeFileSync,
} from "fs"
import { glob } from "glob"
import path from "path"

import { DBNode } from "../../core/dbNode"
import { IFileProcessor } from "./processor/file.types"
import { SourceFile } from "./sourceFile"
import { ISourceFile } from "./sourceFile.types"

export class Codebase {
	private _path: string
	private _dataDirPath: string
	private _dataDirName: string
	private _embeddingsDirPath: string
	private _embeddingsDirName: string

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
		this._embeddingsDirName = ""
		this._embeddingsDirPath = ""

		this._batchSize = batchSize
		this._fileProcessor = fileProcessor

		this.initializeDataDirectory()
		this.prepareFilesMetadata()
		this.makeFilesBatches()
	}

	get embeddingsDirPath(): string {
		return this._embeddingsDirPath
	}

	private initializeDataDirectory(removeExisting = true): void {
		this._dataDirName = `data`
		this._dataDirPath = path.resolve(this._path, this._dataDirName)

		this._embeddingsDirName = `${this._dataDirName}/embeddings`
		this._embeddingsDirPath = path.resolve(this._path, this._embeddingsDirName)

		/* Handle data directory */
		if (removeExisting && existsSync(this._dataDirPath))
			rmSync(this._dataDirPath, { recursive: true })
		mkdirSync(this._dataDirPath)

		/* Handle embeddings directory */
		mkdirSync(this._embeddingsDirPath)
	}

	private prepareFilesMetadata() {
		const extensions = ["ts", "tsx", "js", "jsx"]

		console.log(`🕒 Preparing metadata for files: *.${extensions.join(", *.")}`)
		{
			const globPatterns = extensions.map((x) => `**/*.${x}`)
			for (const pattern of globPatterns) {
				const files = glob
					.sync(`${this._path}/${pattern}`)
					.map((x) => new SourceFile(x))
				this._files.push(...files)
			}
		}
		console.log(`✅ Prepared metadata for ${this._files.length} files\n`)
	}

	private makeFilesBatches() {
		const batches: number[][] = []
		for (let i = 0; i < this._files.length; i += this._batchSize)
			batches.push([i, i + this._batchSize])

		this._batches = batches
	}

	private writeNodesToFile(nodes: Record<string, DBNode>, fileName: string) {
		const entries = Object.entries(nodes)
		if (entries.length === 0) return 0
		const batch = Object.fromEntries(entries)
		writeFileSync(
			path.resolve(this._dataDirPath, fileName),
			JSON.stringify(batch, null, 2)
		)

		return entries.length
	}

	private async processFilesBatch(
		batchNumber: number,
		start: number,
		end: number
	): Promise<number> {
		let nNodesProcessed = 0

		console.log(`🕒 Processing ${start}-${end} files`)
		{
			let nodes: Record<string, DBNode> = {}

			/* Step 1 */
			try {
				const files = this._files.slice(start, end)
				const jobs = files.map((x) => this._fileProcessor.process(x, nodes))
				await Promise.all(jobs)
			} catch {
				console.error(`Error in processing ${start}-${end} files`)
			}

			/* Step 2 */
			this.writeNodesToFile(nodes, `batch-${batchNumber}.json`)

			nNodesProcessed = Object.keys(nodes).length
		}
		console.log(
			`✅ Processed ${start}-${end} files (${nNodesProcessed} nodes)\n`
		)

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

	async embed(): Promise<void> {
		console.log("🕒 Preparing Embeddings")

		if (existsSync(this._embeddingsDirPath))
			rmSync(this._embeddingsDirPath, { recursive: true })
		mkdirSync(this._embeddingsDirPath)

		const files = readdirSync(this._dataDirPath)
			.filter((x) => x.endsWith(".json"))
			.map((x) => path.resolve(this._dataDirPath, x)) // convert path like "batch-1.json" to "./data/batch-1.json"

		const embeddingsPerNode = 2
		const maxAllowedEmbeddingsPerMinute = 2800 // openai limitation for embeddings
		const nFilesPerBatch = Math.floor(
			maxAllowedEmbeddingsPerMinute / this._batchSize / embeddingsPerNode
		)

		let batch = 0
		for (let i = 0; i < files.length; i += nFilesPerBatch) {
			const start = i
			const end = Math.min(i + nFilesPerBatch, files.length)

			console.log(`\n🕒 Embedding ${start}-${end} files`)

			let nodes: Record<string, DBNode> = {}
			for (const file of files.slice(start, end)) {
				// to convert file content from a plain string to js object
				const data = JSON.parse(readFileSync(file, "utf-8"))
				Object.assign(nodes, data)
			}

			const jobs = Object.values(nodes).map(async (x) => {
				nodes[x.id] = await DBNode.fillEmbeddings(new DBNode(x))
			})
			await Promise.all(jobs)

			writeFileSync(
				`${this._embeddingsDirPath}/batch-${batch++}.json`,
				JSON.stringify(nodes, null, 2)
			)

			console.log(`✅ Embedded ${start}-${end} files\n`)

			if (i + nFilesPerBatch < files.length) {
				console.log(`🕒 Waiting for 60 seconds`)
				await new Promise((resolve) => setTimeout(resolve, 60 * 1000))
			}
		}

		console.log(`✅ Prepared embeddings for nodes`)
	}
}
