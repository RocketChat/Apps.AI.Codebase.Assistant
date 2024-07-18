import { IHttp } from "@rocket.chat/apps-engine/definition/accessors";

import { Prompt } from "../prompt/prompt";
import { ILLMModel } from "./llm.types";

export class Mistral_7B implements ILLMModel {
    private http: IHttp;
    private readonly model: string = "mistral-7b";
    private readonly baseURL: string = "http://mistral-7b/v1";

    constructor(http: IHttp) {
        this.http = http;
    }

    async ask(prompt: Prompt): Promise<string | null> {
        const url = `${this.baseURL}/chat/completions`;
        const res = await this.http.post(url, {
            headers: {
                "Content-Type": "application/json",
            },
            data: {
                model: this.model,
                temprature: 0,
                messages: prompt.messages,
            },
        });
        if (!res.content) return null;

        const message = JSON.parse(res.content).choices[0].message.content;
        return message;
    }
}
