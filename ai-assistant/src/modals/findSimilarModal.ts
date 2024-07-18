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
import { DBNode } from "../core/db/db";
import { Neo4j } from "../core/db/neo4j";
import { MiniLML6 } from "../core/embeddings/minilml6";
import { Query } from "../core/query";
import { getButton, getInputBox } from "../utils/blockBuilders";
import { handleCommandResponse } from "../utils/handleCommandResponse";

export const COMMAND = "rcc-findsimilar";
export const FIND_SIMILAR_COMMAND_MODAL = "findsimilar-command";

export async function findSimilarModal(): Promise<IUIKitSurfaceViewParam> {
    return {
        id: FIND_SIMILAR_COMMAND_MODAL,
        type: UIKitSurfaceType.MODAL,
        title: {
            type: "plain_text",
            text: "Find similar chunks",
        },
        close: await getButton("Close", "", ""),
        clearOnClose: true,
        submit: await getButton("Submit", "submit", "submit", "Submit"),
        blocks: [
            await getInputBox(
                "",
                "Insert the code for which you want to find similar chunks here",
                "findsimilar",
                "findsimilar",
                "",
                true
            ),
        ],
    };
}

async function process(http: IHttp, query: string): Promise<DBNode[] | null> {
    const db = new Neo4j(http);
    const embeddingModel = new MiniLML6(http);

    const queryVector = await embeddingModel.generate(query);
    if (!queryVector) return null;

    const similarNodes = await Query.getDBNodesFromVectorQuery(
        db,
        "codeEmbeddings",
        queryVector,
        0.5
    );

    return similarNodes;
}

export async function findSimilarModalSubmitHandler(
    view: IUIKitSurface,
    sender: IUser,
    room: IRoom,
    read: IRead,
    modify: IModify,
    http: IHttp
) {
    const state = view.state as Record<string, any> | undefined;
    if (!state) return;

    const query = state.findsimilar.findsimilar;
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
            "❌ Failed to find similar chunks. Please try again later."
        );
        return;
    }
    if (!res.length) {
        await sendMessage("No similar chunks found.");
        return;
    }

    let message = "**Similar chunks found:**\n";
    for (let i = 0; i < res.length; i++) {
        const node = res[i];

        let codeNodeSegment = "";
        codeNodeSegment += `\n${i + 1}. ${node["filePath"]}\n`;
        codeNodeSegment += "```typescript\n";
        codeNodeSegment += node["code"];
        codeNodeSegment += "\n```";

        message += codeNodeSegment;
    }

    await sendMessage(message);
}
