import { App, PluginSettingTab, Setting } from "obsidian";
import { CountSettings } from "./lib/types"
import { WordTrackerHistory } from "./lib/wordTracker"
import WordToolsPlugin from "./main";

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
			
		new Setting(containerEl)
			.setName("Enable Daily Word Count")
			.setDesc("Enables the daily word counting system.")
			.addToggle(
				text => text
				.setValue(this.plugin.settings.enableDailyCount)
				.onChange(async (val) => {
					this.plugin.settings.enableDailyCount = val;
					await this.plugin.saveSettings();
				})
			)

		new Setting(containerEl)
			.setName("Enable Document Word Count")
			.setDesc("Enables the custom document word and character counter. Disabling the core word count plugin while this is active is recommended.")
			.addToggle(
				text => text
				.setValue(this.plugin.settings.enableFileCount)
				.onChange(async (val) => {
					this.plugin.settings.enableFileCount = val;
					await this.plugin.saveSettings();
				})
			)
		
		new Setting(containerEl)
			.setName("Enable Global Word Count")
			.setDesc("Enables the global word counting system.")
			.addToggle(
				text => text
				.setValue(this.plugin.settings.enableGlobalCount)
				.onChange(async (val) => {
					this.plugin.settings.enableGlobalCount = val;
					await this.plugin.saveSettings();
				})
			)


		// Show Daily Goal
		new Setting(containerEl)
			.setName("Show Daily Goal")
			.setDesc("Show the daily word goal next to the current day's count")
			.addToggle(
				text => text
				.setValue(this.plugin.settings.showGoal)
				.onChange(async (val) => {
					this.plugin.settings.showGoal = val;
					await this.plugin.saveSettings();
				})
			)
		
		new Setting(containerEl)
			.setName("Daily Word Goal")
			.setDesc("Your daily word goal")
			.addText(
				text => text
				.setValue(String(this.plugin.settings.dailyWordGoal))
				.onChange(async (val) => {
					const num = Number(val)
					if(num >= 0) {
						// Actual number given
						this.plugin.settings.dailyWordGoal = num;
						await this.plugin.saveSettings();
					} else if(val === "") {
						// Implicitly 0 if string is empty
						this.plugin.settings.dailyWordGoal = 0;
						await this.plugin.saveSettings();
					} else {
						// NaN given, reset to last stored value
						text.setValue(String(this.plugin.settings.dailyWordGoal));
					}
				})
			)

		// Save Delay
		new Setting(containerEl)
			.setName("Save Delay")
			.setDesc("The delay, in milliseconds, between a file being written to and the word count being saved.")
			.setHeading()
			.addSlider(
				text => text
				.setLimits(50, 5000, 50)
				.setValue(this.plugin.settings.saveDelay)
				.onChange(async (val) => {
					this.plugin.settings.saveDelay = val;
					await this.plugin.saveSettings();
				})
			)
		
		// Display Update Delay
		new Setting(containerEl)
			.setName("Display Update Delay")
			.setDesc("The delay, in milliseconds, between a file being written to and the word count visually updating.")
			.setHeading()
			.addSlider(
				text => text
				.setLimits(50, 5000, 50)
				.setValue(this.plugin.settings.displayUpdateDelay)
				.onChange(async (val) => {
					this.plugin.settings.displayUpdateDelay = val;
					await this.plugin.saveSettings();
				})
			)

		new Setting(containerEl)
			.setName("Count Comments")
			.setDesc("Count text inside comments towards a document's word count.")
			.addToggle(
				text => text
				.setValue(this.plugin.settings.countSettings.countComments)
				.onChange(async (val) => {
					this.plugin.settings.countSettings.countComments = val;
					await this.plugin.saveSettings();
				})
			)

		new Setting(containerEl)
			.setName("Count Whole Links")
			.setDesc("True enables counting the text of a whole link, while False only counts the link's visible text.")
			.addToggle(
				text => text
				.setValue(this.plugin.settings.countSettings.countFullLink)
				.onChange(async (val) => {
					this.plugin.settings.countSettings.countFullLink = val;
					await this.plugin.saveSettings();
				})
			)

		new Setting(containerEl)
			.setName("Remove Frontmatter")
			.setDesc("If true, remove frontmatter from the word and character count.")
			.addToggle(
				text => text
				.setValue(this.plugin.settings.countSettings.removeFrontmatter)
				.onChange(async (val) => {
					this.plugin.settings.countSettings.removeFrontmatter = val;
					await this.plugin.saveSettings();
				})
			)
		
	}
}
