import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    ISlashCommand,
    SlashCommandContext,
} from "@rocket.chat/apps-engine/definition/slashcommands";
import { findSimilarModal } from "../modals/findSimilarModal";
import { persistUIData } from "../utils/persistenceHandlers";

export class FindSimilarCommand implements ISlashCommand {
    public command = "rcc-findsimilar";
    public i18nParamsExample = "";
    public i18nDescription = "";
    public providesPreview = false;

    public async executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persistence: IPersistence
    ): Promise<void> {
        const userID = context.getSender().id;
        await persistUIData(persistence, userID, context);

        const triggerId = context.getTriggerId();
        if (!triggerId) {
            throw new Error("No trigger ID provided");
        }

        await modify
            .getUiController()
            .openSurfaceView(
                await findSimilarModal(),
                { triggerId },
                context.getSender()
            );
    }
}
