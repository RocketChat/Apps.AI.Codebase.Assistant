import {
    IAppAccessors,
    IConfigurationExtend,
    IHttp,
    ILogger,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { App } from "@rocket.chat/apps-engine/definition/App";
import { IAppInfo } from "@rocket.chat/apps-engine/definition/metadata";

import {
    ApiSecurity,
    ApiVisibility,
} from "@rocket.chat/apps-engine/definition/api";
import { UIKitViewSubmitInteractionContext } from "@rocket.chat/apps-engine/definition/uikit";
import { AskCommand } from "./commands/AskCommand";
import { DevDocsCommand } from "./commands/DevDocsCommand";
import { DiagramCommand } from "./commands/DiagramCommand";
import { DocumentCommand } from "./commands/DocumentCommand";
import { FindSimilarCommand } from "./commands/FindSimilar";
import { HelpCommand } from "./commands/HelpCommand";
import { ImportanceCommand } from "./commands/ImportanceCommand";
import { StyleguideCommand } from "./commands/Styleguide";
import { SuggestCommand } from "./commands/SuggestCommand";
import { TranslateCommand } from "./commands/TranslateCommand";
import { WhyUsedCommand } from "./commands/WhyUsedCommand";
import { EstablishRelationsEndpoint } from "./endpoints/establishRelations";
import { IngestEndpoint } from "./endpoints/ingest";
import { LLMEndpoint } from "./endpoints/llm";
import { PurgeDBEndpoint } from "./endpoints/purgeDB";
import { handleModalViewSubmit } from "./utils/handleModalViewSubmit";

export class RocketChatterApp extends App {
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    public async executeViewSubmitHandler(
        context: UIKitViewSubmitInteractionContext,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify
    ) {
        handleModalViewSubmit(context, read, http, modify);
    }

    public async extendConfiguration(configuration: IConfigurationExtend) {
        configuration.slashCommands.provideSlashCommand(new HelpCommand());

        configuration.slashCommands.provideSlashCommand(new AskCommand());
        configuration.slashCommands.provideSlashCommand(new DevDocsCommand());
        configuration.slashCommands.provideSlashCommand(new DiagramCommand());
        configuration.slashCommands.provideSlashCommand(new DocumentCommand());
        configuration.slashCommands.provideSlashCommand(
            new FindSimilarCommand()
        );
        configuration.slashCommands.provideSlashCommand(
            new ImportanceCommand()
        );
        configuration.slashCommands.provideSlashCommand(
            new StyleguideCommand()
        );
        configuration.slashCommands.provideSlashCommand(new SuggestCommand());
        configuration.slashCommands.provideSlashCommand(new TranslateCommand());
        configuration.slashCommands.provideSlashCommand(new WhyUsedCommand());

        await configuration.api.provideApi({
            visibility: ApiVisibility.PUBLIC,
            security: ApiSecurity.UNSECURE,
            endpoints: [
                new IngestEndpoint(this),
                new PurgeDBEndpoint(this),
                new EstablishRelationsEndpoint(this),
                new LLMEndpoint(this),
            ],
        });
    }
}
