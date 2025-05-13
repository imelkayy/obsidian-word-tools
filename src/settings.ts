import { App, PluginSettingTab, Setting } from "obsidian";
import { CountSettings } from "./lib/types"
import { WordTrackerHistory } from "./lib/wordTracker"
import WordToolsPlugin from "./main";
import { BoolSetting } from "./lib/settings/boolSetting";
import { SettingDivider } from "./lib/settings/settingDivider";
import { NumberSetting } from "./lib/settings/numberSetting";

export interface WordToolSettings {
    [key: string]: any,
    dailyWordGoal: number,
    showGoal: boolean,
    displayUpdateDelay: number,
    globalUpdateDelay: number,
    globalUpdateInterval: number,
    saveDelay: number,
    history: WordTrackerHistory,
    countSettings: CountSettings
	enableFileCount: boolean,
	enableDailyCount: boolean,
	enableGlobalCount: boolean
}

export const DEFAULT_SETTINGS: WordToolSettings = {
    dailyWordGoal: 500,
    showGoal: true,
    displayUpdateDelay: 250,
    globalUpdateDelay: 1000,
    globalUpdateInterval: 5000,
    saveDelay: 1000,
    history: {},
    countSettings: {
        countComments: false,
        countFullLink: false,
        removeFrontmatter: true
    },
	enableFileCount: true,
	enableDailyCount: true,
	enableGlobalCount: true
}

export class WordToolsSettingTab extends PluginSettingTab {
	plugin: WordToolsPlugin;

	constructor(app: App, plugin: WordToolsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();


		/*
		 * Daily Word Counter Settings
		 */

		new SettingDivider(containerEl, "Daily Word Counter");
		new BoolSetting("Enable Daily Count", "Enables the daily word counting system", containerEl, "enableDailyCount", this.plugin);
		new BoolSetting("Show Daily Goal", "Show the daily word goal next to the current day's count", containerEl, "showGoal", this.plugin);
		new NumberSetting("Daily Word Goal", "Your daily word goal", containerEl, "dailyWordGoal", this.plugin);
		
		/*
		 * Document Word Counter Settings
		 */

		new SettingDivider(containerEl, "Document Word Counter");
		new BoolSetting(
			"Enable Document Word Count",
			"Enables the custom document word and character counter. Disabling the core word count plugin while this is active is recommended.",
			containerEl,
			"enableFileCount",
			this.plugin
		);

		/*
		 * Global Word Counter Settings
		 */

		new SettingDivider(containerEl, "Global Word Counter");
		new BoolSetting(
			"Enable Global Word Count",
			"Enables the global word counting system.",
			containerEl,
			"enableGlobalCount",
			this.plugin
		);
		
		/*
		 * Saving Settings
		 */

		new SettingDivider(containerEl, "Saving");
		new NumberSetting(
			"Save Delay",
			"The delay, in milliseconds, between changes and the word count being saved.",
			containerEl,
			"saveDelay",
			this.plugin
		);
		new NumberSetting(
			"Display Update Delay",
			"The delay, in milliseconds, between a file being written to and the word count visually updating.",
			containerEl,
			"displayUpdateDelay",
			this.plugin
		);
		
		/*
		 * Generic Counting
		 */
		
		new SettingDivider(containerEl, "All Counters");
		new BoolSetting(
			"Count Comments",
			"Count text inside comments towards a document's word count.",
			containerEl,
			"countComments",
			this.plugin,
			this.plugin.settings.countSettings
		);
		new BoolSetting(
			"Count Whole Links",
			"True enables counting the text of a whole link, while False only counts the link's visible text.",
			containerEl,
			"countFullLinks",
			this.plugin,
			this.plugin.settings.countSettings
		);
		new BoolSetting(
			"Remove Frontmatter",
			"If true, remove frontmatter from the word and character count.",
			containerEl,
			"removeFrontmatter",
			this.plugin,
			this.plugin.settings.countSettings
		)
		
	}
}
