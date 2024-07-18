import {
    IHttp,
    IModify,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import { UIKitViewSubmitInteractionContext } from "@rocket.chat/apps-engine/definition/uikit";
import {
    FIND_SIMILAR_COMMAND_MODAL,
    findSimilarModalSubmitHandler,
} from "../modals/findSimilarModal";
import {
    STYLEGUIDE_COMMAND_MODAL,
    styleguideModalSubmitHandler,
} from "../modals/styleguideModal";
import {
    SUGGEST_COMMAND_MODAL,
    suggestModalSubmitHandler,
} from "../modals/suggestModal";
import { getUIData } from "./persistenceHandlers";

const MODALS: Record<string, any> = {
    [SUGGEST_COMMAND_MODAL]: suggestModalSubmitHandler,
    [FIND_SIMILAR_COMMAND_MODAL]: findSimilarModalSubmitHandler,
    [STYLEGUIDE_COMMAND_MODAL]: styleguideModalSubmitHandler,
};

export async function handleModalViewSubmit(
    context: UIKitViewSubmitInteractionContext,
    read: IRead,
    http: IHttp,
    modify: IModify
) {
    const { user, view } = context.getInteractionData();
    const slashCommandContext = await getUIData<SlashCommandContext>(
        read.getPersistenceReader(),
        user.id
    );

    if (!slashCommandContext) {
        context.getInteractionResponder().viewErrorResponse({
            viewId: view.id,
            errors: {
                error: "No data found",
            },
        });
        return;
    }

    const room = JSON.parse(JSON.stringify(slashCommandContext)).room as IRoom;

    let handler = MODALS[view.id];
    await handler(view, user, room, read, modify, http);

    return context.getInteractionResponder().successResponse();
}
