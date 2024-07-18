import { readdirSync } from "fs"
import { readFile } from "fs/promises"
import path from "path"
import { v4 as uuid } from "uuid"

import { RC_APP_URI } from "../../constants"
import { DBNode, DBNodeRelation } from "../../core/dbNode"

namespace Algorithms {
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

	export async function insertBatch(
		batchID: string,
		nodes: DBNode[]
	): Promise<boolean> {
		try {
			const res = await fetch(`${RC_APP_URI}/ingest`, {
				method: "POST",
				headers: {
					accept: "application/json",
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ nodes, batchID }),
			})

			return res.status === 200
		} catch (e) {
			console.log(e)
			return false
		}
	}

	export async function establishRelations(
		relations: DBNodeRelation[]
	): Promise<boolean> {
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
}

export async function insertDataIntoDB(batchesDirPath: string) {
	console.log("🕒 Inserting")

	const files = readdirSync(batchesDirPath).map((file) =>
		path.resolve(batchesDirPath, file)
	)

	/* Step 1: Empty DB */
	{
		const success = await Algorithms.purgeDB()
		if (!success) {
			console.log("❌ Error emptying db")
			return
		}
	}

	/* Step 2: Insert batch */
	{
		const errorBatches: Set<string> = new Set()

		const relations: DBNodeRelation[] = []

		// Insert each batch
		for (const file of files) {
			const batchID = uuid()
			const data = await readFile(file, "utf-8")
			const nodes = Object.values(JSON.parse(data)) as DBNode[]

			for (const node of nodes)
				relations.push(
					...node.relations.map((relation) => ({
						source: node.id,
						target: relation.target,
						relation: relation.relation,
					}))
				)

			const success = await Algorithms.insertBatch(batchID, nodes)
			if (success) {
				console.log(`📦 ${batchID} inserted`)
			} else {
				errorBatches.add(batchID)
			}
		}
		if (errorBatches.size > 0) console.log("❌ Error batches", errorBatches)

		// Establish relations
		const batchSize = 1000
		for (let i = 0; i < relations.length; i += batchSize) {
			const success = await Algorithms.establishRelations(
				relations.slice(i, i + batchSize)
			)
			if (success) {
				console.log(`🔗 Relations established ${i + 1000}/${relations.length}`)
			} else {
				console.log(
					`❌ Error establishing relations ${i + 1000}/${relations.length}`
				)
			}
		}

		console.log("🔗 All Relations established")
	}

	console.log("✅ Inserted")
}
