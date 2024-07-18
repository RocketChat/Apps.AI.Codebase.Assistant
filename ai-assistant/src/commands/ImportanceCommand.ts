import {
    IHttp,
    IModify,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    ISlashCommand,
    SlashCommandContext,
} from "@rocket.chat/apps-engine/definition/slashcommands";
import { DBNode } from "../core/db/db";
import { IDB } from "../core/db/db.types";
import { Neo4j } from "../core/db/neo4j";
import { MiniLML6 } from "../core/embeddings/minilml6";
import { Llama3_70B } from "../core/llm/llama3_70B";
import { Query } from "../core/query";
import { handleCommandResponse } from "../utils/handleCommandResponse";

export class ImportanceCommand implements ISlashCommand {
    public command = "rcc-importance";
    public i18nParamsExample = "";
    public i18nDescription = "";
    public providesPreview = false;

    async calculateCentrality(db: IDB, node: DBNode): Promise<number> {
        const maxOutDegreeQuery = await db.run(
            `
				MATCH (n)
				WITH n, [(n)-[]->() | 1] AS outgoingRelationships
				RETURN size(outgoingRelationships) AS outDegree
				ORDER BY outDegree DESC
				LIMIT 1
			`
        );
        if (!maxOutDegreeQuery.length) return 0;
        const maxOutDegree = maxOutDegreeQuery[0].get("outDegree").toNumber();

        const outDegree = await db.run(
            `
				MATCH (n:Node { id: $id })<-[]-(x) 
				RETURN count(x) AS outDegree
			`,
            { id: node.id }
        );
        if (!outDegree.length) return 0;
        const centrality = outDegree[0].get("outDegree").toNumber();

        const relativeCentrality = centrality / maxOutDegree;
        return relativeCentrality;
    }

    async calculateCriticality(db: IDB, node: DBNode): Promise<number> {
        const maxInDegreeQuery = await db.run(
            `
				MATCH (n)
				WITH n, [(n)<-[]-() | 1] AS incomingRelationships
				RETURN size(incomingRelationships) AS inDegree
				ORDER BY inDegree DESC
				LIMIT 1
			`
        );
        if (!maxInDegreeQuery.length) return 0;
        const maxInDegree = maxInDegreeQuery[0].get("inDegree").toNumber();

        const inDegree = await db.run(
            `
				MATCH (n:Node { id: $id })-[]->(x) 
				RETURN count(x) AS inDegree
			`,
            { id: node.id }
        );
        if (!inDegree.length) return 0;
        const criticality = inDegree[0].get("inDegree").toNumber();

        const relativeCriticality = criticality / maxInDegree;
        return relativeCriticality;
    }

    calculateLinesOfCode(node: DBNode): number {
        const loc = node.code.split("\n").length;
        return loc;
    }

    private async process(
        http: IHttp,
        query: string
    ): Promise<Record<string, number> | null> {
        const db = new Neo4j(http);
        const llm = new Llama3_70B(http);
        const embeddingModel = new MiniLML6(http);

        /**
         * ---------------------------------------------------------------------------------------------
         * STEP 1:
         * Extract the possible keywords from the user's query
         * ---------------------------------------------------------------------------------------------
         */
        const keywords = [query];

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
        const targetNode = codeNodes[0];

        /**
         * ---------------------------------------------------------------------------------------------
         * STEP 3:
         * Generate the final score based on various factors
         * ---------------------------------------------------------------------------------------------
         */
        const loc = this.calculateLinesOfCode(targetNode);
        const centrality = await this.calculateCentrality(db, targetNode);
        const criticality = await this.calculateCriticality(db, targetNode);
        const importance = (centrality + criticality) / 2;

        return { loc, centrality, criticality, importance };
    }

    public async executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp
    ): Promise<void> {
        const [query] = context.getArguments();
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
        if (!res) {
            await sendEditedMessage("❌ Cannot calculate the importance!");
            return;
        }

        let message = "";
        message += `1. Criticality: ${Math.round(res.criticality * 100)}%\n`;
        message += `2. Centrality: ${Math.round(res.centrality * 100)}%\n`;
        message += `3. Importance: ${Math.round(res.importance * 100)}%\n`;
        message += `4. LOC: ${res.loc}\n`;

        await sendEditedMessage(message);
    }
}
