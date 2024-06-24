import { insertStyleguides } from "./core/styleguides"
import { notFoundKindNames } from "./core/treeNode"
import { insertDataIntoDB } from "./ingestion/ingest"
import { prepareCodebase, prepareNodesEmbeddings } from "./ingestion/prepare"

const DIR = [
	//
	// "./project",
	"./florence-backend",
	"long",
	"rippledb",
	"./Rocket.Chat", // clone the repo first
]

async function main() {
	const startTime = Date.now()
	{
		/**
		 * Keep it 1 for low memory usage and hence no crashes.
		 * Higher batch size might cause the program to get stuck and eventually crash.
		 */
		const batchSize = 1
		await prepareCodebase(DIR.at(-1)!, batchSize)
		for (const t of notFoundKindNames) {
			console.log(t)
		}
		// await prepareNodesEmbeddings("data", batchSize)

		// await insertDataIntoDB(batchSize)
		// await insertStyleguides()
	}
	const endTime = Date.now()

	console.log("🕒 Done in", (endTime - startTime) / 1000, "seconds")
}

main()
