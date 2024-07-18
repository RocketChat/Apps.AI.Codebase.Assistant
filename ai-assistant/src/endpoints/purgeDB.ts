import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    ApiEndpoint,
    IApiEndpointInfo,
    IApiRequest,
    IApiResponse,
} from "@rocket.chat/apps-engine/definition/api";
import { IDB } from "../core/db/db.types";
import { Neo4j } from "../core/db/neo4j";

export class PurgeDBEndpoint extends ApiEndpoint {
    public path = "purgeDB";

    async emptyDB(db: IDB) {
        const query = `MATCH (n) DETACH DELETE n`;
        await db.run(query);
    }

    async setupIndices(db: IDB) {
        const query = [
            // Drop existing indices
            ["DROP INDEX `nameEmbeddings`;"],
            ["DROP INDEX `codeEmbeddings`;"],

            // Create indices for name embeddings
            [
                "CREATE VECTOR INDEX `nameEmbeddings`",
                "FOR (n: Node) ON (n.nameEmbeddings)",
                "OPTIONS {indexConfig: {",
                "   `vector.dimensions`: 384,",
                "   `vector.similarity_function`: 'COSINE'",
                "}};",
            ],

            // Create indices for code embeddings
            [
                "CREATE VECTOR INDEX `codeEmbeddings`",
                "FOR (n: Node) ON (n.codeEmbeddings)",
                "OPTIONS {indexConfig: {",
                "   `vector.dimensions`: 384,",
                "   `vector.similarity_function`: 'COSINE'",
                "}};",
            ],
        ].map((q) => q.join("\n"));

        for (const q of query) await db.run(q);
    }

    public async post(
        request: IApiRequest,
        endpoint: IApiEndpointInfo,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence
    ): Promise<IApiResponse> {
        const db = new Neo4j(http);

        await this.emptyDB(db);
        await this.setupIndices(db);

        return this.success();
    }
}
