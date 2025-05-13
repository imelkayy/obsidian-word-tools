import { Setting } from "obsidian";
import { BaseSetting } from "./baseSetting";
import WordToolsPlugin from "src/main";

export class NumberSetting extends BaseSetting {
    constructor(title: string, description: string, containerEl: HTMLElement, key: string, plugin: WordToolsPlugin, settings?: any){
        super(title, description, containerEl, key, plugin, settings);

		this.settingEl.addText(
			text => text
			.setValue(String(this.settings[this.key]))
			.onChange(async (val) => {
				const num = Number(val)
				if(num >= 0) {
					// Actual number given
					this.settings[this.key] = num;
					await this.plugin.saveSettings();
				} else if(val === "") {
					// Implicitly 0 if string is empty
					this.settings[this.key] = 0;
					await this.plugin.saveSettings();
				} else {
					// NaN given, reset to last stored value
					text.setValue(String(this.settings[this.key]));
				}
			})
		)

    }
}