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

export class TranslateCommand implements ISlashCommand {
    public command = "rcc-translate";
    public i18nParamsExample = "";
    public i18nDescription = "";
    public providesPreview = false;

    private async process(
        http: IHttp,
        targetLanguage: string,
        targetEntity: string
    ): Promise<string | null> {
        const db = new Neo4j(http);
        const llm = new Llama3_70B(http);
        const embeddingModel = new MiniLML6(http);

        /**
         * ---------------------------------------------------------------------------------------------
         * STEP 1:
         * Query the database to find the nodes names of which are similar to what user has requested
         * ---------------------------------------------------------------------------------------------
         */
        const codeNodes = await Query.getCodeNodesFromKeywords(
            db,
            embeddingModel,
            [targetEntity]
        );
        if (!codeNodes.length) return null;

        /**
         * ---------------------------------------------------------------------------------------------
         * STEP 2:
         * Generate the documentation based on the code nodes and user's query
         * ---------------------------------------------------------------------------------------------
         */
        const res = await llm.ask(
            PromptFactory.makeTranslatePrompt(
                codeNodes.map((x) => x.code).join("\n\n"),
                targetEntity,
                targetLanguage
            )
        );
        if (!res) return null;

        return res;
    }

    public async executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp
    ): Promise<void> {
        const [targetEntity, targetLanguage] = context.getArguments();
        if (!targetEntity || !targetLanguage) {
            const errorMessage = modify.getCreator().startMessage();
            errorMessage
                .setSender(context.getSender())
                .setRoom(context.getRoom())
                .setText("Invalid arguments!");
            await modify.getCreator().finish(errorMessage);
            return;
        }

        const sendEditedMessage = await handleCommandResponse(
            `${targetEntity} ${targetLanguage}`,
            context.getSender(),
            context.getRoom(),
            modify,
            this.command
        );

        const res = await this.process(http, targetEntity, targetLanguage);
        if (res) {
            await sendEditedMessage(res);
        } else {
            await sendEditedMessage("❌ Translation failed");
        }
    }
}
