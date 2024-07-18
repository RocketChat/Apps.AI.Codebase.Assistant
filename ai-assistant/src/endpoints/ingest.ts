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
import { DBNode } from "../core/db/db";
import { IDB } from "../core/db/db.types";
import { Neo4j } from "../core/db/neo4j";
import { MiniLML6 } from "../core/embeddings/minilml6";
import {
    IngestEndpointRequestBody,
    IngestEndpointResponseBody,
} from "./ingest.types";

namespace Helpers {
    async function insertNode(db: IDB, node: DBNode) {
        const query = new DBNode(node).getDBInsertQuery();
        await db.run(query, node);
    }

    export async function insertNodes(db: IDB, nodes: DBNode[]) {
        await Promise.all(nodes.map((node) => insertNode(db, node)));
    }
}

export class IngestEndpoint extends ApiEndpoint {
    public path = "ingest";

    makeBodies(
        content: any
    ): [IngestEndpointRequestBody, IngestEndpointResponseBody] {
        const requestBody = content as IngestEndpointRequestBody;
        const responseBody: IngestEndpointResponseBody = {
            batchID: "hey",
            status: 200,
        };

        return [requestBody, responseBody];
    }

    public async post(
        request: IApiRequest,
        endpoint: IApiEndpointInfo,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence
    ): Promise<IApiResponse> {
        let [{ nodes }, responseBody] = this.makeBodies(request.content);

        // -----------------------------------------------------------------------------------
        const embeddingModel = new MiniLML6(http);
        nodes = nodes.map((node) => new DBNode(node));
        await Promise.all(nodes.map((x) => x.fillEmbeddings(embeddingModel)));
        // -----------------------------------------------------------------------------------
        const db = new Neo4j(http);
        await db.verifyConnectivity();
        // -----------------------------------------------------------------------------------
        const jobs = nodes.map((node) =>
            db.run(new DBNode(node).getDBInsertQuery(), node)
        );
        await Promise.all(jobs);
        // -----------------------------------------------------------------------------------

        return this.success(JSON.stringify(responseBody));
    }
}
