import { Prompt } from "../prompt/prompt";

export interface ILLMModel {
    ask(prompt: Prompt): Promise<string | null>;
}
