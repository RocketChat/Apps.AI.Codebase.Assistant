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

export class DocumentCommand implements ISlashCommand {
    public command = "rcc-document";
    public i18nParamsExample = "";
    public i18nDescription = "";
    public providesPreview = false;

    private async process(
        http: IHttp,
        query: string
    ): Promise<Record<string, string> | null> {
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
        const codeNodes = await Query.getCodeNodesFromKeywords(
            db,
            embeddingModel,
            keywords
        );
        if (!codeNodes.length) return null;

        /**
         * ---------------------------------------------------------------------------------------------
         * STEP 3:
         * Generate the documentation based on the code nodes and user's query
         * ---------------------------------------------------------------------------------------------
         */
        const result = await llm.ask(
            PromptFactory.makeDocumentPrompt(JSON.stringify(codeNodes), query)
        );
        if (!result) return null;

        //@ts-ignore
        const jsDoc = result
            .split("<JSDOC_START>")[1]
            .split("<JSDOC_END>")[0]
            .trim();
        //@ts-ignore
        const explanation = result
            .split("<EXPLANATION_START>")[1]
            .split("<EXPLANATION_END>")[0]
            .trim();

        console.log(jsDoc);
        console.log(explanation);

        return { jsDoc: jsDoc, explanation: explanation };
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

        let res = await this.process(http, query);
        if (res) {
            await sendEditedMessage(`${res["jsDoc"]}\n\n${res["explanation"]}`);
        } else {
            await sendEditedMessage("❌ No references found!");
        }
    }
}
