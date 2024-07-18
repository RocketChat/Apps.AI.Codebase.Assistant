import { DBNode } from "../core/db/db";

export type IngestEndpointRequestBody = {
    batchID: string;
    nodes: DBNode[];
};

export type IngestEndpointResponseBody = {
    batchID: string;
    status: 200 | 500;
};
