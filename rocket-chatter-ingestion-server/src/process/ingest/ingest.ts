import cliProgress from "cli-progress"
import { readdirSync } from "fs"
import { readFile } from "fs/promises"
import { Transaction } from "neo4j-driver"
import path from "path"

import { DBNode } from "../../core/dbNode"
import { db, verifyConnectivity } from "../../core/neo4j"

namespace Helpers {
	export function prepareProgressBar(total: number) {
		const bar = new cliProgress.Bar(
			{
				etaBuffer: 1,
				forceRedraw: true,
				fps: 60,
				format:
					"Inserting nodes [{bar}] {percentage}% | {value}/{total} | {duration}s",
			},
			cliProgress.Presets.legacy
		)
		bar.start(total, 0)
		return bar
	}

	export async function insertNode(tx: Transaction, node: DBNode) {
		const query = new DBNode(node).getDBInsertQuery()
		try {
			await tx.run(query, node)
		} catch (e) {
			console.error(e, query, node)
		}
	}

	export async function establishRelation(
		tx: Transaction,
		sourceID: string,
		targetID: string,
		relation: string
	) {
		const query = [
			`MATCH (n { id: $sourceID })`,
			`MATCH (m { id: $targetID })`,
			`CREATE (n)-[:${relation}]->(m)\n`,
		].join("\n")
		try {
			await tx.run(query, { sourceID, targetID })
		} catch (e) {
			console.error(e)
		}
	}
}

namespace Algorithms {
	export async function emptyDB(progressBar: cliProgress.Bar) {
		const query = `MATCH (n) DETACH DELETE n`
		try {
			await db.run(query)
		} catch {
			console.error("Failed to empty DB")
		}

		progressBar.increment()
	}

	export async function insertNodes(
		tx: Transaction,
		nodes: DBNode[],
		progressBar: cliProgress.Bar
	) {
		await Promise.all(
			nodes.map(async (node) => {
				await Helpers.insertNode(tx, node)
				progressBar.increment()
			})
		)
	}

	export async function establishRelations(
		tx: Transaction,
		nodes: DBNode[],
		progressBar: cliProgress.Bar
	) {
		const jobs: Promise<any>[] = []
		for (const node of nodes) {
			for (const relation of node.relations) {
				const job = Helpers.establishRelation(
					tx,
					node.id,
					relation.target,
					relation.relation
				).then(() => {
					progressBar.increment()
				})
				jobs.push(job)
			}
		}
		await Promise.all(jobs)
	}
}

export async function insertDataIntoDB(
	embeddingsPath: string,
	batchSize: number = 50
) {
	console.log(await verifyConnectivity())

	console.log("🕒 Inserting")

	const files = readdirSync(embeddingsPath).map((file) =>
		path.resolve(embeddingsPath, file)
	)
	const totalNodes = files.length * batchSize

	const totalOperations = 1 + totalNodes * 2 // empty db operation + no. of nodes * (insert nodes + establish relations)
	const progressBar = Helpers.prepareProgressBar(totalOperations)

	await Algorithms.emptyDB(progressBar)

	for (const file of files) {
		const data = await readFile(file, "utf-8")
		const nodes = Object.values(JSON.parse(data)) as DBNode[]

		const tx = db.beginTransaction()

		// -----------------------------------------------------------------------------------

		await Algorithms.insertNodes(tx, nodes, progressBar)
		await Algorithms.establishRelations(tx, nodes, progressBar)

		// -----------------------------------------------------------------------------------

		try {
			await tx.commit()
		} catch (e) {
			console.error(e)
			await tx.rollback()
		}
	}

	progressBar.stop()

	console.log("✅ Inserted")
}
