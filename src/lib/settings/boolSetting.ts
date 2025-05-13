import { Setting } from "obsidian";
import { BaseSetting } from "./baseSetting";
import WordToolsPlugin from "src/main";

export class BoolSetting extends BaseSetting {
    constructor(title: string, description: string, containerEl: HTMLElement, key: string, plugin: WordToolsPlugin, settings?: any){
        super(title, description, containerEl, key, plugin, settings);

		this.settingEl.addToggle(
            text => text
            .setValue(this.settings[this.key] as boolean)
            .onChange(async (val) => {
                this.settings[this.key] = val;
                await this.plugin.saveSettings();
            })
        )

    }
}