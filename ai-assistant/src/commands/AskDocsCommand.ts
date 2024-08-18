import {
    IHttp,
    IModify,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    ISlashCommand,
    SlashCommandContext,
} from "@rocket.chat/apps-engine/definition/slashcommands";

import { Neo4j } from "../core/services/db/neo4j";
import { MiniLML6 } from "../core/services/embeddings/minilml6";
import { Llama3_70B } from "../core/services/llm/llama3_70B";
import { handleCommandResponse } from "../utils/handleCommandResponse";

export class AskDocsCommand implements ISlashCommand {
    public command = "rcc-askdocs";
    public i18nParamsExample = "";
    public i18nDescription = "";
    public providesPreview = false;

    private async process(http: IHttp, query: string): Promise<string | null> {
        const db = new Neo4j(http);
        const llm = new Llama3_70B(http);
        const embeddingModel = new MiniLML6(http);

        return "UNDER DEVELOPMENT";
    }

    public async executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp
    ): Promise<void> {
        const query = context.getArguments().join(" ");
        if (!query) return;

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
