import { PROMPT_DIAGRAM_COMMAND } from "./contents/diagram";
import { PROMPT_DOCUMENT_COMMAND } from "./contents/document";
import { PROMPT_EXTRACT_DB_KEYWORDS } from "./contents/extractDBKeywords";
import { PROMPT_STYLEGUIDE_COMMAND } from "./contents/styleguide";
import { PROMPT_TRANSLATE_COMMAND } from "./contents/translate";
import { PROMPT_WHY_USED_COMMAND } from "./contents/whyUsed";
import { Prompt } from "./prompt";

export namespace PromptFactory {
    export function makeDBKeywordQueryPrompt(query: string): Prompt {
        const prompt = new Prompt();
        prompt.pushSystem(PROMPT_EXTRACT_DB_KEYWORDS);
        prompt.pushUser(
            `Hey I have this query, can you please extract the possible keywords from it? Please answer in <ANSWER_START>keyword1, keyword2<ANSWER_END> format only and don't say literally anything else.\n\nHere's my query:\n${query}`
        );

        return prompt;
    }

    export function makeAskCodePrompt(codebase: string, query: string): Prompt {
        const prompt = new Prompt();
        prompt.pushSystem(`
            You are an expert in understanding and answering questions of user when given a proper context of the codebase. Here're the rules:
            1. Even if user asks for any kind of diagram or visualization, you must ignore that.
            2. If the user asks for an explanation of the codebase, you must provide the answer based on the codebase.
            3. You must provide the answer in text GitHub Markdown format only.
            4. In case of any request for diagrams or visualizations, tell user to use the "/rcc-diagram" command.
            5. If you are unable to answer the question, you must tell the user that you are unable to answer the question.
        `);
        prompt.pushUser(
            `Hey I have a the following codebase in between the tags <CODEBASE_START> and <CODEBASE_END>. Can you please answer the following query?\n\n${query} \n\nHere's the codebase:\n<CODEBASE_START>\n${codebase}\n<CODEBASE_END>`
        );

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
        prompt.pushUser(
            `<CODEBASE_START>\n${codebase}\n<CODEBASE_END>\n\nTarget Entity: ${query}`
        );

        return prompt;
    }

    export function makeWhyUsedPrompt(codebase: string, query: string): Prompt {
        const prompt = new Prompt();
        prompt.pushSystem(PROMPT_WHY_USED_COMMAND);
        prompt.pushUser(
            `Hey can you explain why this \`${query}\` entity is used in the following codebase? Here's the codebase:\n\n<CODEBASE_START>\n${codebase}\n<CODEBASE_END>`
        );

        return prompt;
    }

    export function makeStyleguidePrompt(
        codebase: string,
        styleguides: string
    ): Prompt {
        const prompt = new Prompt();
        prompt.pushSystem(PROMPT_STYLEGUIDE_COMMAND);
        prompt.pushUser(
            `<STYLEGUIDES_START>${styleguides}<STYLEGUIDES_END>\n<CODEBASE_START>${codebase}<CODEBASE_END>`
        );

        return prompt;
    }

    export function makeImprovePrompt(
        codebase: string,
        targetEntity: string
    ): Prompt {
        const prompt = new Prompt();

        prompt.pushSystem(`
            You are an expert in understanding typescript and javascript codebases and fixing it provided the context of the codebase.

            INPUT: Other entities the target entity might be using. The target entity to refactor.

            TASKS:
            - Refactoring might include:
            - Renaming
            - Extracting different parts into separate functions
            - Making code concise to make it more readable, maintainable
            - Removing dead code
            - Performance improvements
            - Better alternatives
            - Syntax improvements
            - Code style improvements
            - Best practices
            - Suggest multiple (only if relevant) fixes for the target entity.
            - If the target entity is already correct then tell that it is already correct.
            - If the provided codebase contains entities that are functionally similar to what's used in the target entity, suggest using entities from the codebase.

            EXPECTED OUTPUT: Suggestions for the target entity in form of MARKDOWN and CODE SNIPPET with the fix and explanation.

            RULES:
            - STRICTLY, do not make anything other than the answer to the user's query.
            - Do not provide any kind of diagram or visualization in the output.
            - The output MUST BE IN ONLY AND ONLY MARKDOWN.
        `);
        prompt.pushUser(
            `Hey, can you suggest multiple fixes for the target entity? To help you with the context I have provided the codebase of the entities it uses and the target entity. You don't need to worry about the codebase, just focus on the target entity.\n\n<CODEBASE_START>\n${codebase}\n<CODEBASE_END>\n<TARGET_ENTITY_START>${targetEntity}\n<TARGET_ENTITY_END>.`
        );

        return prompt;
    }

    export function makeTranslatePrompt(
        codebase: string,
        targetEntity: string,
        targetLanguage: string
    ): Prompt {
        const prompt = new Prompt();

        prompt.pushSystem(PROMPT_TRANSLATE_COMMAND);
        prompt.pushUser(
            `Hey, can you translate the following codebase in TypeScript to the ${targetLanguage}? I have provided you with other entities as well on which my target entity depends. Here you go:\n\n<CODEBASE_START>\n${codebase}\n<CODEBASE_END>\n<TARGET_ENTITY_START>${targetEntity}\n<TARGET_ENTITY_END>`
        );

        return prompt;
    }
}
