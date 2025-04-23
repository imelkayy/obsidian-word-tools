import { App, debounce, Debouncer, Modal, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';
import { wordCount, WordTrackerHistory, totalWordsToday, stripWordHistory } from './wordTracker';
import { today } from './today';

interface WordToolSettings {
	[key: string]: any,
	dailyWordGoal: number,
	showGoal: boolean,
	displayUpdateDelay: number,
	saveDelay: number,
	history: WordTrackerHistory,
}

const DEFAULT_SETTINGS: WordToolSettings = {
	dailyWordGoal: 500,
	showGoal: true,
	displayUpdateDelay: 250,
	saveDelay: 1000,
	history: {},
}

export default class WordToolsPlugin extends Plugin {
	settings: WordToolSettings;
	statusBarItemEl: HTMLElement;
	todayCount: number;
	updateCount: Debouncer<[count: number], void>;
	debouncedSave: Debouncer<[], void>;

	PREFIX = "Word Tools";

	async onload() {
		// Create status bar element
		this.statusBarItemEl = this.addStatusBarItem();

		await this.loadSettings();

		// Create debouncers for updating.
		this.updateCount = debounce(this.handleCountUpdate, this.settings.displayUpdateDelay, false);
		this.debouncedSave = debounce(this.handleDebouncedSave, this.settings.saveDelay, true);

		// Initialize today's word count if it doesn't exist
		if(!this.settings.history.hasOwnProperty(today())) {
			this.settings.history[today()] = {total: 0, files: {}};
			stripWordHistory(this.settings.history);
		}
		// Update the current stored word count to today's saved value
		this.updateCount(this.settings.history[today()].total);
		
		// Add settigns tab
		this.addSettingTab(new WordToolsSettingTab(this.app, this));

		// Bind to events to handle word counting
		this.registerEvent(this.app.workspace.on("quick-preview", this.onQuickPreview.bind(this)));
		this.registerEvent(this.app.vault.on("rename", this.onFileRenamed.bind(this)))
		this.registerEvent(this.app.workspace.on("file-open", this.onFileOpen.bind(this)));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		this.updateStatusBarCount();
		await this.saveData(this.settings);
	}

	initFileHistory(filePath: string, wordCount: number, forDay?: string) {
		const TODAY = forDay ? forDay : today();
		if(!this.settings.history[TODAY].files)
			this.settings.history[TODAY].files = {};
		if(!this.settings.history[TODAY].files.hasOwnProperty(filePath)) {
			this.settings.history[TODAY].files[filePath] = { initialCount: wordCount, currentCount: wordCount };
			this.debouncedSave();
		}
		this.settings.history[TODAY].goal = this.settings.dailyWordGoal;
	}

	updateStatusBarCount() {
		const text = `${this.todayCount}${this.settings.showGoal ? `/${this.settings.dailyWordGoal}` : ""} words today `
		this.statusBarItemEl.setText(text);
	}

	handleCountUpdate(count: number) {
		this.todayCount = count;

		if(this.statusBarItemEl)
			this.updateStatusBarCount();
		
		if(this.debouncedSave)
			this.debouncedSave();
	}

	onQuickPreview(file: TFile, contents: string) {
		const PATH = file.path;
		const COUNT = wordCount(contents);
		const TODAY = today();

		this.initFileHistory(PATH, COUNT, TODAY);
		if(!this.settings.history[TODAY].files)
			return;
		this.settings.history[TODAY].files[PATH].currentCount = COUNT;

		const TOTAL = totalWordsToday(this.settings.history);
		this.settings.history[TODAY].total = TOTAL;

		this.updateCount(TOTAL);
	}

	onFileRenamed(file: TFile, oldPath: string) {
		const TODAY = today();

		if(!this.settings.history[TODAY].files)
			return;
		if(this.settings.history[TODAY].files.hasOwnProperty(oldPath)) {
			const NEW_PATH = file.path;
			console.log(`${this.PREFIX}: Handling rename of ${oldPath} to ${NEW_PATH}`);
			this.settings.history[TODAY].files[NEW_PATH] = this.settings.history[TODAY].files[oldPath];
			delete this.settings.history[TODAY].files[oldPath];
		}
	}

	async onFileOpen(file: TFile) {
		if(!file)
			return;
		const PATH = file.path;
		const TODAY = today();
		if(!this.settings.history[TODAY].files)
			return;

		if(!this.settings.history[TODAY].files.hasOwnProperty(PATH)) {
			const DOC_COUNT = wordCount(await this.app.vault.cachedRead(file));
			this.initFileHistory(PATH, DOC_COUNT, TODAY);
		}
			
	}

	async handleDebouncedSave() {
		await this.saveSettings();
		console.log(`${this.PREFIX}: Saved Word Count`);
	}

}

class WordToolsSettingTab extends PluginSettingTab {
	plugin: WordToolsPlugin;

	constructor(app: App, plugin: WordToolsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

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
	}
}
