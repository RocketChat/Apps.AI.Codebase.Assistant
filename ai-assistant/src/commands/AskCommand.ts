import {
    IHttp,
    IModify,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    ISlashCommand,
    SlashCommandContext,
} from "@rocket.chat/apps-engine/definition/slashcommands";

import { Neo4j } from "../core/db/neo4j";
import { MiniLML6 } from "../core/embeddings/minilml6";
import { Llama3_70B } from "../core/llm/llama3_70B";
import { PromptFactory } from "../core/prompt/prompt.factory";
import { Query } from "../core/query";
import { handleCommandResponse } from "../utils/handleCommandResponse";

export class AskCommand implements ISlashCommand {
    public command = "rcc-ask";
    public i18nParamsExample = "";
    public i18nDescription = "";
    public providesPreview = false;

    private async process(http: IHttp, query: string): Promise<string | null> {
        const db = new Neo4j(http);
        const llm = new Llama3_70B(http);
        const embeddingModel = new MiniLML6(http);

        /**
         * ---------------------------------------------------------------------------------------------
         * STEP 1:
         * Extract the possible keywords from the user's query
         * ---------------------------------------------------------------------------------------------
         */
        const keywords = await Query.getDBKeywordsFromQuery(llm, query);
        console.log("KEYWORDS", keywords);
        if (!keywords.length) return null;

        /**
         * ---------------------------------------------------------------------------------------------
         * STEP 2:
         * Query the database to find the nodes names of which are similar to what user has requested
         * ---------------------------------------------------------------------------------------------
         */
        const results = await Query.getCodeNodesFromKeywords(
            db,
            embeddingModel,
            keywords
        );
        console.log("RESULTS", results);
        if (!results.length) return null;

        /**
         * ---------------------------------------------------------------------------------------------
         * STEP 3:
         * Generate the answer and diagram for the user's query given the nodes data
         * ---------------------------------------------------------------------------------------------
         */
        const answer = await llm.ask(
            PromptFactory.makeAskPrompt(
                results.map((x) => x.code).join("\n\n"),
                query
            )
        );
        console.log("ANSWER", answer);
        if (!answer) return null;

        return answer;
    }

    public async executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp
    ): Promise<void> {
        const query = context.getArguments().join(" ");
        if (!query) {
            throw new Error("Error!");
        }

        const sendEditedMessage = await handleCommandResponse(
            query,
            context.getSender(),
            context.getRoom(),
            modify,
            this.command
        );

        const res = await this.process(http, query);
        if (res) {
            await sendEditedMessage(res);
        } else {
            await sendEditedMessage("❌ Unable to process your query");
        }
    }
}
