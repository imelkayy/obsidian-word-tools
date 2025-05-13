import { Setting } from "obsidian";
import WordToolsPlugin from "src/main";

type AllowedTypes = string | boolean | number


export abstract class BaseSetting {
    key: string;
    plugin: WordToolsPlugin;
    settings: any;
    settingEl: Setting;

    constructor(title: string, description: string, containerEl: HTMLElement, key: string, plugin: WordToolsPlugin, settingsObj?: any) {
        this.key = key;
        this.plugin = plugin;
        this.settings = settingsObj ?? this.plugin.settings;

        this.settingEl = new Setting(containerEl)
                            .setName(title)
                            .setDesc(description)
    }
        
}