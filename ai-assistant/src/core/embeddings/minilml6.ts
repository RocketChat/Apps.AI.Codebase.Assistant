import { IHttp } from "@rocket.chat/apps-engine/definition/accessors";
import { IEmbeddingModel } from "./embeddings.types";

export class MiniLML6 implements IEmbeddingModel {
    private http: IHttp;
    private readonly baseURL: string =
        "http://text-embedding-api:8020/embed_multiple";

    constructor(http: IHttp) {
        this.http = http;
    }

    async generate(text: string): Promise<number[] | null> {
        const res = await this.http.post(this.baseURL, {
            headers: {
                accept: "application/json",
                "Content-Type": "application/json",
            },
            data: [text],
        });
        if (!res || res.statusCode !== 200) return null;

        const data = res.data["embeddings"][0] as number[];
        return data;
    }
}
