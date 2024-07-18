import {
    ISetting,
    SettingType,
} from "@rocket.chat/apps-engine/definition/settings";

export enum AppSetting {
    NEO4J_USERNAME = "NEO4J_USERNAME",
    NEO4J_PASSWORD = "NEO4J_PASSWORD",
    NEO4J_DATABASE = "NEO4J_DATABASE",
}

export const settings: Array<ISetting> = [
    {
        id: AppSetting.NEO4J_USERNAME,
        type: SettingType.STRING,
        packageValue: "",
        required: true,
        public: true,
        i18nLabel: AppSetting.NEO4J_USERNAME,
        i18nDescription: `${AppSetting.NEO4J_USERNAME}_description`,
    },
    {
        id: AppSetting.NEO4J_PASSWORD,
        type: SettingType.STRING,
        packageValue: "",
        required: false,
        public: true,
        i18nLabel: AppSetting.NEO4J_PASSWORD,
        i18nDescription: `${AppSetting.NEO4J_PASSWORD}_description`,
    },
    {
        id: AppSetting.NEO4J_DATABASE,
        type: SettingType.STRING,
        packageValue: "neo4j",
        required: false,
        public: true,
        i18nLabel: AppSetting.NEO4J_DATABASE,
        i18nDescription: `${AppSetting.NEO4J_DATABASE}_description`,
    },
];
