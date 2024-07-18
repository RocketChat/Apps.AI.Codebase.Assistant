import {
    IPersistence,
    IPersistenceRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    RocketChatAssociationModel,
    RocketChatAssociationRecord,
} from "@rocket.chat/apps-engine/definition/metadata";

export const persistUIData = async <T>(
    persistence: IPersistence,
    id: string,
    data: T
): Promise<void> => {
    const association = new RocketChatAssociationRecord(
        RocketChatAssociationModel.USER,
        `${id}#UI`
    );
    await persistence.updateByAssociation(association, data as any, true);
};

export const getUIData = async <T>(
    persistenceRead: IPersistenceRead,
    id: string
): Promise<T | null> => {
    const association = new RocketChatAssociationRecord(
        RocketChatAssociationModel.USER,
        `${id}#UI`
    );
    const result = (await persistenceRead.readByAssociation(
        association
    )) as Array<any>;
    return result && result.length ? (result[0] as any) : null;
};

export const clearUIData = async (
    persistence: IPersistence,
    id: string
): Promise<void> => {
    const association = new RocketChatAssociationRecord(
        RocketChatAssociationModel.USER,
        `${id}#UI`
    );
    await persistence.removeByAssociation(association);
};
