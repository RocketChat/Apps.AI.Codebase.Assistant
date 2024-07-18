import { DBNodeRelationType } from "../core/db/db";

export type EstablishRelationsEndpointRelations = {
    source: string;
    target: string;
    relation: DBNodeRelationType;
}

export type EstablishRelationsEndpointRequestBody = {
    relations: EstablishRelationsEndpointRelations[];
};

export type EstablishRelationsEndpointResponseBody = {
    status: 200 | 500;
};
