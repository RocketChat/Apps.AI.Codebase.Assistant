import { exec } from "child_process"
import { Request, Response } from "express"
import { existsSync, rmdirSync } from "fs"
import { promisify } from "util"
import { v4 as uuidv4 } from "uuid"

import { insertStyleguides } from "../core/styleguides"
import { insertDataIntoDB } from "../process/ingest/ingest"
import { Codebase } from "../process/prepare/codebase"
import { FileProcessor } from "../process/prepare/processor/file"

/**
 * This function fetches the codebase from the url given
 *
 * @param dirName The target folder name at which the codebase will be cloned. It should never be empty
 * @param remoteURL The url of directory which is to be colned using git clone
 * @returns true/false (boolean) representing the success or failure respectively
 */
async function fetchCodebaseFromRemote(
	dirName: string,
	remoteURL: string
): Promise<boolean> {
	console.log(`Fetching codebase from ${remoteURL} to ${dirName}`)

	try {
		if (existsSync(dirName)) rmdirSync(dirName, { recursive: true })

		const gitCloneCommand = `git clone ${remoteURL} ${dirName}`
		await promisify(exec)(gitCloneCommand)

		return true
	} catch (e) {
		console.error(e)
		return false
	}
}

/**
 * This function can never throw any exceptions. All of which is internally handled already.
 *
 * @param dirName The target folder name at which the codebase will be cloned. It should never be empty
 * @returns true/false (boolean) representing the success or failure respectively
 */
async function startProcessJob(dirName: string): Promise<boolean> {
	try {
		const batchSize = 1

		/* Step 1: Prepare the codebase */
		const codebase = new Codebase(dirName, new FileProcessor(), batchSize)
		await codebase.process()
		await codebase.embed()

		/* Step 2: Prepare the nodes embeddings */
		// await prepareNodesEmbeddings("data", batchSize)

		await insertDataIntoDB(batchSize)
		await insertStyleguides()

		return true
	} catch {
		return false
	}
}

/**
 * This function retries the given function until it returns true or the maximum number of retries is reached.
 *
 * @param maxRetries The maximum number of retries to be made before giving up. If set to -1, it will retry indefinitely
 * @param retryInterval The time interval between each retry in milliseconds
 * @param fn The function to be retried
 * @returns true/false (boolean) representing the success or failure respectively
 */
async function keepRetrying(
	maxRetries: number,
	retryInterval: number,
	fn: () => Promise<any>
): Promise<boolean> {
	if (maxRetries < 0) maxRetries = Number.MAX_SAFE_INTEGER

	let retries = 0
	while (retries < maxRetries) {
		if (await fn()) return true

		await new Promise((resolve) => setTimeout(resolve, retryInterval))
		retries++
	}

	return false
}

/**
 * This function sends the success response to the client
 *
 * @param successURL The URL where the success response is to be sent
 */
async function sendSuccessResponse(successURL: string, startTime: number) {
	const success = await keepRetrying(100, 1000, async () => {
		await fetch(successURL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				status: 200,
				message: "INGESTION_COMPLETED",
				timeTaken: `${(Date.now() - startTime) / 1000}s`,
			}),
		})
	})
	if (!success) {
		console.error("Failed to send success response")
	}
}

/**
 * This function sends the failure response to the client
 *
 * @param failureURL The URL where the failure response is to be sent
 */
async function sendFailureResponse(
	failureURL: string,
	reason: string,
	startTime: number
) {
	const success = await keepRetrying(100, 1000, async () => {
		await fetch(failureURL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				status: 400,
				message: "INGESTION_FAILED",
				reason: reason,
				timeTaken: `${(Date.now() - startTime) / 1000}s`,
			}),
		})
	})
	if (!success) {
		console.error("Failed to send failure response")
	}
}

/**
 *
 * @param _ request from the server to ingest code.
 * @param res response tells that ingestion is sucessfull or not
 *
 */
export async function ingestRoute(req: Request, res: Response) {
	const { successURL, failureURL } = req.body
	if (!successURL || !failureURL) {
		return res.status(400).send({
			status: 400,
			message: "BAD_REQUEST",
			reason: "URLS_MISSING",
		})
	}

	// Send the response back to the client so that request is not kept waiting & timeout eventually
	res.status(200).send({
		status: 200,
		message: "INGESTION INITIATED",
	})

	const startTime = Date.now()
	{
		let success = false

		const sessionID = uuidv4()

		/* Step 1: Fetch codebase to local storage */
		success = await fetchCodebaseFromRemote(
			sessionID,
			"https://github.com/RocketChat/Rocket.Chat"
		)

		if (!success)
			return await sendFailureResponse(failureURL, "FETCH_FAIL", startTime)

		/* Step 2: Start the process job */
		success = await startProcessJob(sessionID)
		if (!success)
			return await sendFailureResponse(failureURL, "PROCESS_FAIL", startTime)
	}

	await sendSuccessResponse(successURL, startTime)
}
