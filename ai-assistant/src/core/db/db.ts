import { IEmbeddingModel } from "../embeddings/embeddings.types";

export type DBNodeRelationType = "CONTAINS" | "USES";
export type DBNodeRelation = { target: string; relation: DBNodeRelationType };

export class DBNode {
    id: string;
    name: string;
    type: string;

    code: string;

    filePath: string;
    relations: DBNodeRelation[];

    nameEmbeddings: number[];
    codeEmbeddings: number[];

    isFile: boolean;
    descriptor: "Node" | string;

    constructor(node: {
        id: string;
        name: string;
        type: string;
        code: string;
        filePath: string;
        relations: DBNodeRelation[];
        nameEmbeddings: number[];
        codeEmbeddings: number[];
        descriptor: "Node" | string;

        isFile?: boolean;
    }) {
        this.id = node.id;
        this.name = node.name;
        this.type = node.type;

        this.code = node.code;

        this.filePath = node.filePath;
        this.relations = node.relations;

        this.nameEmbeddings = node.nameEmbeddings;
        this.codeEmbeddings = node.codeEmbeddings;

        this.isFile = node.isFile || false;
        this.descriptor = node.descriptor;
    }

    async fillEmbeddings(embeddingModel: IEmbeddingModel): Promise<void> {
        this.nameEmbeddings = (await embeddingModel.generate(this.name)) ?? [];
        this.codeEmbeddings = (await embeddingModel.generate(this.code)) ?? [];
    }

    getDBInsertQuery(): string {
        let query = "";
        query += `
            CREATE (n:${this.descriptor} {
                id: $id,
                name: $name,
                type: $type,

                code: $code,
                filePath: $filePath,

                nameEmbeddings: $nameEmbeddings,
                codeEmbeddings: $codeEmbeddings
            })
        `;

        return query;
    }
}
