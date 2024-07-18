export type PromptRole = "user" | "assistant" | "system";
export type PromptMessage = { role: PromptRole; content: string };
export type PromptMessages = PromptMessage[];

export class Prompt {
    private _messages: PromptMessages = [];
    get messages() {
        return this._messages;
    }
    set messages(messages: PromptMessages) {
        this._messages = messages;
    }

    pushSystem(content: string) {
        this._messages.push({ role: "system", content });
    }

    pushAssistant(content: string) {
        this._messages.push({ role: "assistant", content });
    }

    pushUser(content: string) {
        this._messages.push({ role: "user", content });
    }
}
