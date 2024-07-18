import { PROMPT_ASK_COMMAND } from "./contents/ask";
import { PROMPT_DIAGRAM_COMMAND } from "./contents/diagram";
import { PROMPT_DOCUMENT_COMMAND } from "./contents/document";
import { PROMPT_EXTRACT_DB_KEYWORDS } from "./contents/extractDBKeywords";
import { PROMPT_STYLEGUIDE_COMMAND } from "./contents/styleguide";
import { PROMPT_SUGGEST_COMMAND } from "./contents/suggest";
import { PROMPT_TRANSLATE_COMMAND } from "./contents/translate";
import { PROMPT_WHY_USED_COMMAND } from "./contents/whyUsed";
import { Prompt } from "./prompt";

export namespace PromptFactory {
    export function makeDBKeywordQueryPrompt(query: string): Prompt {
        const prompt = new Prompt();
        prompt.pushSystem(PROMPT_EXTRACT_DB_KEYWORDS);
        prompt.pushAssistant(
            "Sure, I will strictly follow my instructions. I will provide the answer the above specified format only."
        );
        prompt.pushUser(`
            Here's the user query:
            <QUERY_START>
                ${query}
            <QUERY_END>
        `);
        prompt.pushAssistant(
            "Yeah sure. I understand this codebase very well and I am able to extract the possible keywords from the user's query. If I can't find the keywords, I'll return an empty array."
        );
        prompt.pushUser(query);

        return prompt;
    }

    export function makeAskPrompt(codebase: string, query: string): Prompt {
        const prompt = new Prompt();

        prompt.pushSystem(PROMPT_ASK_COMMAND);
        prompt.pushAssistant(
            "Sure, I will strictly follow my instructions. I will only provide the answer in text GitHub Markdown format. I will ignore any request for diagrams or visualizations."
        );
        prompt.pushSystem(`
            HERE'RE THE NODES OF THE CODEBASE TO USE AS CONTEXT:
            <CODEBASE_START>
                ${codebase}
            </CODEBASE_END>
        `);
        prompt.pushAssistant(
            "Yeah sure. I understand this codebase very well and I am able to answer questions only from the above codebase. If I don't know the answer, I'll tell it to you."
        );
        prompt.pushUser(query);

        return prompt;
    }

    export function makeDiagramPrompt(codebase: string, query: string): Prompt {
        const prompt = new Prompt();

        prompt.pushSystem(PROMPT_DIAGRAM_COMMAND);
        prompt.pushAssistant(
            "Sure, I will strictly follow my instructions. I will provide the answer in a valid PLAIN TEXT only. I won't use parentheses at all even if they are required."
        );
        prompt.pushSystem(`
            HERE'RE THE NODES OF THE CODEBASE TO USE AS CONTEXT:
            <CODEBASE_START>
                ${codebase}
            </CODEBASE_END>
        `);
        prompt.pushAssistant(
            "Yeah sure. I'll start my response with <DIAGRAM_START> and end with <DIAGRAM_END>."
        );
        prompt.pushUser(query);
        prompt.pushSystem("<DIAGRAM_START>```mermaid\n");

        return prompt;
    }

    export function makeDocumentPrompt(
        codebase: string,
        query: string
    ): Prompt {
        const prompt = new Prompt();

        prompt.pushSystem(PROMPT_DOCUMENT_COMMAND);
        prompt.pushAssistant(
            "Sure, I will strictly follow my instructions. The output will be in the above format only."
        );
        prompt.pushSystem(`
            HERE'RE THE NODES OF THE CODEBASE TO USE AS CONTEXT:
            <CODEBASE_START>
                ${codebase}
            </CODEBASE_END>
        `);
        prompt.pushAssistant(
            "Yeah sure. I understand this codebase very well and I am able to generate JSDoc & documentation for the target entity."
        );
        prompt.pushUser(query);

        return prompt;
    }

    export function makeWhyUsedPrompt(codebase: string, query: string): Prompt {
        const prompt = new Prompt();

        prompt.pushSystem(PROMPT_WHY_USED_COMMAND);
        prompt.pushAssistant(
            "Sure, I will strictly follow my instructions. I will only provide the answer in the above specified format only."
        );
        prompt.pushSystem(`
            HERE'RE THE NODES OF THE CODEBASE TO USE AS CONTEXT:
            <CODEBASE_START>
                ${codebase}
            </CODEBASE_END>
        `);
        prompt.pushAssistant(
            "Yeah sure. If I don't know the answer, I'll tell it to you."
        );
        prompt.pushUser(query);
        prompt.pushSystem("<ANSWER>");

        return prompt;
    }

    export function makeStyleguidePrompt(
        codebase: string,
        styleguides: string
    ): Prompt {
        const prompt = new Prompt();

        prompt.pushSystem(PROMPT_STYLEGUIDE_COMMAND);
        prompt.pushAssistant(
            "Sure, I will strictly follow my instructions. I will only provide the answer in text format."
        );
        prompt.pushSystem(`
            <STYLEGUIDES_START>
                ${styleguides}
            <STYLEGUIDES_END>
        `);
        prompt.pushSystem(`
            <CODEBASE_START>
                ${codebase}
            <CODEBASE_END>
        `);
        prompt.pushAssistant(
            "Yeah sure. I understand this codebase very well and I am able to enforce the styleguide rules on the codebase. If I don't know the answer, I'll tell it to you."
        );
        prompt.pushUser(
            "Enforce the styleguide rules on the provided codebase."
        );
        prompt.pushSystem("<ANSWER>");

        return prompt;
    }

    export function makeSuggestPrompt(
        codebase: string,
        targetEntity: string
    ): Prompt {
        const prompt = new Prompt();

        prompt.pushSystem(PROMPT_SUGGEST_COMMAND);
        prompt.pushAssistant(
            "Sure, I will strictly follow my instructions. I will only provide the answer in text format."
        );
        prompt.pushSystem(`
            <CODEBASE_START>
                ${codebase}
            <CODEBASE_END>
            <TARGET_ENTITY_START>
                ${targetEntity}
            <TARGET_ENTITY_END>
        `);
        prompt.pushAssistant(
            "Yeah sure. I understand this codebase very well and I am able to suggest multiple fixes for the target entity. If I don't know the answer, I'll tell it to you."
        );
        prompt.pushUser(
            "Suggest multiple (only if possible) fixes for the target entity."
        );
        prompt.pushSystem("<ANSWER>");

        return prompt;
    }

    export function makeTranslatePrompt(
        codebase: string,
        targetEntity: string,
        targetLanguage: string
    ): Prompt {
        const prompt = new Prompt();

        prompt.pushSystem(PROMPT_TRANSLATE_COMMAND);
        prompt.pushAssistant(
            "Sure, I will strictly follow my instructions. I will only provide the answer in text format."
        );
        prompt.pushSystem(`
            <CODEBASE_START>
                ${codebase}
            <CODEBASE_END>
            <TARGET_ENTITY_START>
                ${targetEntity}
            <TARGET_ENTITY_END>
        `);
        prompt.pushAssistant(
            "Yeah sure. I understand this codebase very well and I am able to translate the target entity to the target language. If I don't know the answer, I'll tell it to you."
        );
        prompt.pushUser(`Translate the target entity to ${targetLanguage}`);
        prompt.pushSystem("<ANSWER>");

        return prompt;
    }
}
