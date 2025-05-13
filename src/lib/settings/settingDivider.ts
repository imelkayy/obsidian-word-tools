
export class SettingDivider {
    constructor(containerEl: HTMLElement, text: string) {
        containerEl.createEl("h1", { text: text });
    }
}