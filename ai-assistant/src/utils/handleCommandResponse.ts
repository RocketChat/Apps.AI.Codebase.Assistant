import { IModify } from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { IUser } from "@rocket.chat/apps-engine/definition/users";

export async function handleCommandResponse(
    args: string,
    sender: IUser,
    room: IRoom,
    modify: IModify,
    command: string
) {
    const user = modify
        .getCreator()
        .startBotUser({
            id: "rocket.chatter",
            username: "rocket.chatter",
            name: "Rocket Chatter",
        })
        .setDisplayName("Rocket Chatter")
        .setUsername("rocket.chatter")
        .getUser() as IUser;

    const greetMessage = modify.getCreator().startMessage();
    greetMessage
        .setSender(sender)
        .setRoom(room)
        .setGroupable(false)
        .setText(`\`/${command}\` ${args}`);
    await modify.getCreator().finish(greetMessage);

    const progressIndicators = [
        ":hammer:",
        ":hammer_pick:",
        ":tools:",
        ":pick:",
    ];

    const builder = modify.getCreator().startMessage();
    builder.setSender(user).setRoom(room).setText(":pick: Working");
    const message = await modify.getCreator().finish(builder);

    let progressCount = 0;
    const progressIndicatorInterval = setInterval(async () => {
        if (progressCount === progressIndicators.length) progressCount = 0;

        const updater = await modify.getUpdater().message(message, user);
        updater
            .setEditor(user)
            .setRoom(room)
            .setText(`${progressIndicators[progressCount++]} Working`);
        await modify.getUpdater().finish(updater);
    }, 500);

    return async (newMessage: string, imageAttachments: string[] = []) => {
        clearInterval(progressIndicatorInterval);

        const updater = await modify.getUpdater().message(message, user);
        updater
            .setEditor(user)
            .setRoom(room)
            .setText(newMessage)
            .setAttachments(imageAttachments.map((x) => ({ imageUrl: x })));
        await modify.getUpdater().finish(updater);
    };
}
