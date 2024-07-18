import { ButtonStyle } from "@rocket.chat/apps-engine/definition/uikit";
import { ToggleSwitchElement } from "@rocket.chat/ui-kit";

import {
    ActionsBlock,
    ButtonElement,
    CheckboxElement,
    ContextBlock,
    DividerBlock,
    InputBlock,
    MultiStaticSelectElement,
    Option,
    SectionBlock,
    StaticSelectElement,
} from "@rocket.chat/ui-kit";
import { APP_ID } from "../constants";

export async function getInputBox(
    labelText: string,
    placeholderText: string,
    blockId: string,
    actionId: string,
    initialValue?: string,
    multiline?: boolean
): Promise<InputBlock> {
    const block: InputBlock = {
        type: "input",
        label: {
            type: "plain_text",
            text: labelText,
        },
        element: {
            type: "plain_text_input",
            placeholder: {
                type: "plain_text",
                text: placeholderText,
            },
            appId: APP_ID,
            blockId,
            actionId,
            initialValue,
            multiline,
        },
    };
    return block;
}

export async function getInputBoxDate(
    labelText: string,
    placeholderText: string,
    blockId: string,
    actionId: string,
    initialDate?: string
): Promise<InputBlock> {
    const block: InputBlock = {
        type: "input",
        label: {
            type: "plain_text",
            text: labelText,
        },
        element: {
            type: "datepicker",
            placeholder: {
                type: "plain_text",
                text: placeholderText,
            },
            appId: APP_ID,
            blockId,
            actionId,
            initialDate,
        },
    };
    return block;
}

export async function getButton(
    labelText: string,
    blockId: string,
    actionId: string,
    value?: string,
    style?: ButtonStyle.PRIMARY | ButtonStyle.DANGER,
    url?: string
): Promise<ButtonElement> {
    const button: ButtonElement = {
        type: "button",
        text: {
            type: "plain_text",
            text: labelText,
        },
        appId: APP_ID,
        blockId,
        actionId,
        url,
        value,
        style,
    };
    return button;
}

export async function getSectionBlock(
    labelText: string,
    accessory?: any
): Promise<SectionBlock> {
    const block: SectionBlock = {
        type: "section",
        text: {
            type: "plain_text",
            text: labelText,
        },
        accessory,
    };
    return block;
}

export async function getDividerBlock(): Promise<DividerBlock> {
    const block: DividerBlock = {
        type: "divider",
    };
    return block;
}

export async function getContextBlock(
    elementText: string
): Promise<ContextBlock> {
    const block: ContextBlock = {
        type: "context",
        elements: [
            {
                type: "plain_text",
                text: elementText,
            },
        ],
    };
    return block;
}

export async function getStaticSelectElement(
    placeholderText: string,
    options: Array<Option>,
    blockId: string,
    actionId: string,
    initialValue?: Option["value"]
): Promise<StaticSelectElement> {
    const block: StaticSelectElement = {
        type: "static_select",
        placeholder: {
            type: "plain_text",
            text: placeholderText,
        },
        options,
        appId: APP_ID,
        blockId,
        actionId,
        initialValue,
    };
    return block;
}

export async function getOptions(text: string, value: string): Promise<Option> {
    const block: Option = {
        text: { type: "plain_text", text },
        value,
    };
    return block;
}

export async function getActionsBlock(
    blockId: string,
    elements:
        | Array<ButtonElement>
        | Array<StaticSelectElement>
        | Array<MultiStaticSelectElement>
): Promise<ActionsBlock> {
    const block: ActionsBlock = {
        type: "actions",
        blockId,
        elements,
    };
    return block;
}

export async function getMultiStaticElement(
    placeholderText: string,
    options: Array<Option>,
    blockId: string,
    actionId: string
): Promise<MultiStaticSelectElement> {
    const block: MultiStaticSelectElement = {
        type: "multi_static_select",
        placeholder: {
            type: "plain_text",
            text: placeholderText,
        },
        options,
        appId: APP_ID,
        blockId,
        actionId,
    };
    return block;
}

export async function getCheckBoxElement(
    options: Array<Option>,
    initialOptions: Array<Option>,
    blockId: string,
    actionId: string
): Promise<CheckboxElement> {
    const block: CheckboxElement = {
        type: "checkbox",
        options,
        initialOptions,
        appId: APP_ID,
        blockId,
        actionId,
    };
    return block;
}

export async function getToggleSwitchElement(
    options: Array<Option>,
    initialOptions: Array<Option>,
    blockId: string,
    actionId: string
): Promise<ToggleSwitchElement> {
    const block: ToggleSwitchElement = {
        type: "toggle_switch",
        options,
        initialOptions,
        appId: APP_ID,
        blockId,
        actionId,
    };
    return block;
}
