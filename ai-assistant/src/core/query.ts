import { DBNode } from "./db/db";
import { IDB } from "./db/db.types";
import { IEmbeddingModel } from "./embeddings/embeddings.types";
import { ILLMModel } from "./llm/llm.types";
import { PromptFactory } from "./prompt/prompt.factory";

export namespace Query {
    export async function getDBNodesFromVectorQuery(
        db: IDB,
        indexName: string,
        vector: number[],
        threshold: number
    ): Promise<DBNode[]> {
        const result = await db.run(
            `
				CALL db.index.vector.queryNodes("${indexName}", 2, $vector)
				YIELD node, score 
                WHERE score >= ${threshold}
                WITH node, score
                OPTIONAL MATCH (node)-[r]->(relatedNode)
                RETURN node, COLLECT(relatedNode) AS relatedNodes, score
                ORDER BY score DESC
			`,
            { vector }
        );
        if (!result.length) return [];

        const nodes: DBNode[] = [];
        for (const record of result) {
            nodes.push(record as DBNode);
        }

        return nodes;
    }

    export async function getCodeNodesFromKeywords(
        db: IDB,
        embeddingModel: IEmbeddingModel,
        keywords: string[]
    ): Promise<DBNode[]> {
        const results: DBNode[] = [];
        for (const keyword of keywords) {
            const queryVector = await embeddingModel.generate(keyword);
            if (!queryVector) continue;

            const result = await getDBNodesFromVectorQuery(
                db,
                "nameEmbeddings",
                queryVector,
                0.85
            );
            results.push(...result);
        }

        return results;
    }

    export async function getDBKeywordsFromQuery(
        llm: ILLMModel,
        query: string
    ): Promise<string[]> {
        const content = await llm.ask(
            PromptFactory.makeDBKeywordQueryPrompt(query)
        );
        if (!content) return [];

        // @ts-ignore
        const keywords = content
            .split("<ANSWER_START>")[1]
            .split("<ANSWER_END>")[0]
            .split(",")
            .map((x) => x.trim())
            .map((x) => {
                if (x.startsWith('"') && x.endsWith('"')) {
                    return x.slice(1, -1);
                }
                return x;
            });
        console.log(keywords);

        return keywords;
    }
}
