import { IHttp } from "@rocket.chat/apps-engine/definition/accessors";
import { IDB } from "./db.types";

export type Neo4jResponse = {
    transactionUrl?: string;
    results: {
        columns: string[];
        data: {
            row: Record<string, any>[];
            meta: {
                id: number;
                elementId: string;
                type: string;
                deleted: boolean;
            }[];
        }[];
    }[];
    errors: any[];
    lastBookmarks: string[];
};

export class Neo4j implements IDB {
    private http: IHttp;
    private readonly baseUrl: string;
    private readonly username: string;
    private readonly password: string;
    private transactionUrl?: string;

    constructor(
        http: IHttp
        // baseUrl: string,
        // username: string,
        // password: string
    ) {
        this.http = http;
        // this.baseUrl = "http://neo4j:7474";
        // this.username = "neo4j";
        // this.password = "strongpasswordsafe123";
        this.baseUrl = "http://3.89.86.217:7474";
        this.username = "neo4j";
        this.password = "errors-fourths-seeds";
    }

    private async sendRequest(
        endpoint: string,
        method: string,
        data?: any
    ): Promise<Neo4jResponse | null> {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            "Content-Type": "application/json",
            Authorization: `Basic ${Buffer.from(
                `${this.username}:${this.password}`
            ).toString("base64")}`,
        };

        const res = await this.http.post(url, {
            headers,
            data: data,
        });
        if (!res || ![200, 201].includes(res.statusCode) || !res.content) {
            console.log(res);
            return null;
        }

        return JSON.parse(res.content);
    }

    async verifyConnectivity(): Promise<void> {
        const response = await this.sendRequest("/db/neo4j/tx/commit", "POST", {
            statements: [],
        });
        if (!response) {
            throw new Error("Failed to connect to Neo4j");
        }
    }

    async closeDBConnection(): Promise<void> {
        // No explicit close connection needed for HTTP connections
        return Promise.resolve();
    }

    async beginTransaction(): Promise<void> {
        if (this.transactionUrl) {
            throw new Error("Transaction already exists");
        }

        const response = await this.sendRequest("/db/neo4j/tx", "POST", {
            statements: [],
        });
        if (!response) {
            throw new Error(`Failed to begin transaction`);
        }
        this.transactionUrl = response.transactionUrl;
    }

    async commitTransaction(): Promise<void> {
        if (!this.transactionUrl) {
            throw new Error("No transaction to commit");
        }
        const response = await this.sendRequest(
            `${this.transactionUrl}/commit`,
            "POST"
        );
        if (!response) {
            throw new Error("Failed to commit transaction");
        }
        this.transactionUrl = undefined;
    }

    async rollbackTransaction(): Promise<void> {
        if (!this.transactionUrl) {
            throw new Error("No transaction to rollback");
        }
        const response = await this.sendRequest(this.transactionUrl, "DELETE");
        if (!response) {
            throw new Error("Failed to rollback transaction");
        }
        this.transactionUrl = undefined;
    }

    async run(query: string, params?: any): Promise<Record<string, any>[]> {
        const data = {
            statements: [
                {
                    statement: query,
                    parameters: params || {},
                },
            ],
        };

        let response: Neo4jResponse | null = null;
        if (this.transactionUrl) {
            response = await this.sendRequest(
                this.transactionUrl,
                "POST",
                data
            );
        } else {
            response = await this.sendRequest(
                "/db/neo4j/tx/commit",
                "POST",
                data
            );
        }

        if (!response) {
            throw new Error("Failed to run query");
        }

        if (response.errors.length) {
            throw new Error(
                response.errors.map((x) => JSON.stringify(x)).join("\n\n")
            );
        }

        const nodes: Record<string, any>[] = [];
        for (const result of response.results) {
            for (const data of result.data) {
                for (const row of data.row) {
                    nodes.push(row);
                }
            }
        }

        return nodes;
    }
}
