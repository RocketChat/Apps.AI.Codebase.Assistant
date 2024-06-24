import { Request, Response } from "express";
import { existsSync, rmdirSync } from "fs";
import { exec } from "child_process";
import { insertStyleguides } from "../core/styleguides";
import { insertDataIntoDB } from "../ingestion/ingest";
import { prepareCodebase, prepareNodesEmbeddings } from "../ingestion/prepare";

const DIR = ["./project", "./Rocket-Chat"];

/**
 * This function fetches the codebase from the url given
 * 
 * @param dirName The target folder name at which the codebase will be cloned. It should never be empty
 * @param remoteURL The url of directory which is to be colned using git clone
 * @returns true/false (boolean) representing the success or failure respectively
 */
function fetchCodebaseFromRemote(dirName: string, remoteURL: string): boolean {
  let success = true;
  try {
    if (existsSync(dirName)) {
      rmdirSync(dirName, { recursive: true });
    }

    const gitCloneCommand = `git clone ${remoteURL} ${dirName}`;

    exec(gitCloneCommand, (error, stdout, stderr) => {
      success = false;

      if (error) {
        console.error(`Error executing command: ${error.message}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
    });
  } catch {
    success = false;
  }

  return success;
}

/**
 * This function can never throw any exceptions. All of which is internally handled already.
 * 
 * @param dirName The target folder name at which the codebase will be cloned. It should never be empty
 * @returns true/false (boolean) representing the success or failure respectively
 */
async function startProcessJob(dirName: string): Promise<boolean> {
  try {
    const batchSize = 250;
    await prepareCodebase(dirName, batchSize);
    await prepareNodesEmbeddings("data", batchSize);

    await insertDataIntoDB(batchSize);
    await insertStyleguides();

    return true;
  } catch {
    return false;
  }
}


/**
 * 
 * @param _ request from the server to ingest code.
 * @param res response tells that ingestion is sucessfull or not
 * 
 */
export async function ingestRoute(_: Request, res: Response) {
  const dirName: string = DIR.at(-1)!;

  const startTime = Date.now();
  {
    let success = false;

    success = fetchCodebaseFromRemote(
      dirName,
      "https://github.com/RocketChat/Rocket.Chat"
    );
    if (!success) {
      console.error("Error while fetching code.");
      return res.status(500).send({
        status: 500,
        message: "FETCH_FAIL",
        timeTaken: `0s`,
      });
    }

    success = await startProcessJob(dirName);
    if (!success) {
      console.error("Error in processing code.");
      return res.status(500).send({
        status: 500,
        message: "PROCESS_JOB_FAIL",
        timeTaken: `0s`,
      });
    }
  }
  const endTime = Date.now();

  res.status(200).send({
    status: 200,
    message: "INGESTION SUCCESSFUL",
    timeTaken: `${(endTime - startTime) / 1000}s`,
  });
}
