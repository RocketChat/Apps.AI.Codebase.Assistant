import {
    IHttp,
    IModify,
    IRead,
    IUIKitSurfaceViewParam,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import {
    IUIKitSurface,
    UIKitSurfaceType,
} from "@rocket.chat/apps-engine/definition/uikit";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { Neo4j } from "../core/db/neo4j";
import { Llama3_70B } from "../core/llm/llama3_70B";
import { PromptFactory } from "../core/prompt/prompt.factory";
import { getButton, getInputBox } from "../utils/blockBuilders";
import { handleCommandResponse } from "../utils/handleCommandResponse";

export const COMMAND = "rcc-styleguide";
export const STYLEGUIDE_COMMAND_MODAL = "styleguide-command";

export async function styleguideModal(): Promise<IUIKitSurfaceViewParam> {
    return {
        id: STYLEGUIDE_COMMAND_MODAL,
        type: UIKitSurfaceType.MODAL,
        title: {
            type: "plain_text",
            text: "Use the styleguide",
        },
        close: await getButton("Close", "", ""),
        clearOnClose: true,
        submit: await getButton("Submit", "submit", "submit", "Submit"),
        blocks: [
            await getInputBox(
                "",
                "What code you want to follow the styleguide?",
                "styleguide",
                "styleguide",
                "",
                true
            ),
        ],
    };
}

async function process(http: IHttp, query: string): Promise<string | null> {
    const db = new Neo4j(http);
    const llm = new Llama3_70B(http);

    /**
     * ---------------------------------------------------------------------------------------------
     * STEP 1:
     * Query the database to find the nodes which contains the styleguide rules
     * ---------------------------------------------------------------------------------------------
     */
    const dbResults = await db.run(`MATCH (n:Styleguide) RETURN n`);
    if (!dbResults.length) return null;

    const styleGuides = dbResults.map((record) => record.get("n").properties);
    if (!styleGuides.length) return null;

    /**
     * ---------------------------------------------------------------------------------------------
     * STEP 2:
     * Generate the new code based on the styleguide nodes and user's query
     * ---------------------------------------------------------------------------------------------
     */
    const result = await llm.ask(
        PromptFactory.makeStyleguidePrompt(query, JSON.stringify(styleGuides))
    );
    if (!result) return null;

    const answer = result.split("<ANSWER>")[1].split("</ANSWER>")[0].trim();

    return answer;
}

export async function styleguideModalSubmitHandler(
    view: IUIKitSurface,
    sender: IUser,
    room: IRoom,
    read: IRead,
    modify: IModify,
    http: IHttp
) {
    const state = view.state as Record<string, any> | undefined;
    if (!state) return;

    const query = state.styleguide.styleguide;
    const sendMessage = await handleCommandResponse(
        "\n```typescript\n" + query + "\n```",
        sender,
        room,
        modify,
        COMMAND
    );

    const res = await process(http, query);
    if (!res) {
        await sendMessage(
            "❌ Failed to match the styleguide. Please try again later."
        );
        return;
    }

    console.log(res);

    await sendMessage(res as string);
}
