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
import { EstablishRelationsEndpointRelations, EstablishRelationsEndpointRequestBody, EstablishRelationsEndpointResponseBody } from "./establishRelations.types";

namespace Helpers {
    async function establishRelation(
        db: IDB,
        sourceID: string,
        targetID: string,
        relation: string
    ) {
        const query = [
            `MATCH (n { id: $sourceID })`,
            `MATCH (m { id: $targetID })`,
            `CREATE (n)-[:${relation}]->(m)\n`,
        ].join("\n");
        try {
            await db.run(query, { sourceID, targetID });
        } catch (e) {
            console.error(e);
        }
    }

    export async function establishRelations(db: IDB, relations: EstablishRelationsEndpointRelations[]) {
        const jobs: Promise<any>[] = [];
        for (const relation of relations) {
            const job = establishRelation(
                db,
                relation.source,
                relation.target,
                relation.relation
            );
            jobs.push(job);
        }
        await Promise.all(jobs);
    }
}

export class EstablishRelationsEndpoint extends ApiEndpoint {
    public path = "establishRelations";

    makeBodies(
        content: any
    ): [EstablishRelationsEndpointRequestBody, EstablishRelationsEndpointResponseBody] {
        const requestBody = content as EstablishRelationsEndpointRequestBody;
        const responseBody: EstablishRelationsEndpointResponseBody = {
            status: 200,
        };

        return [requestBody, responseBody];
    }

    async commitProgress(
        db: IDB
    ): Promise<EstablishRelationsEndpointResponseBody["status"]> {
        try {
            try {
                await db.commitTransaction();
            } catch (e) {
                console.error(e);
                await db.rollbackTransaction();

                return 500;
            }
        } catch (e) {
            console.error(e);
            return 500;
        }

        return 200;
    }

    public async post(
        request: IApiRequest,
        endpoint: IApiEndpointInfo,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence
    ): Promise<IApiResponse> {
        let [{ relations }, responseBody] = this.makeBodies(request.content);

        const db = new Neo4j(http);
        await db.verifyConnectivity();
        // -----------------------------------------------------------------------------------
        await db.beginTransaction();
        await Helpers.establishRelations(db, relations);
        responseBody.status = await this.commitProgress(db);
        // -----------------------------------------------------------------------------------

        return this.success(JSON.stringify(responseBody));
    }
}
