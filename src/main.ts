import { debounce, Debouncer, WorkspaceLeaf, Plugin, TFile } from 'obsidian';
import { totalWordsToday, stripWordHistory } from './lib/wordTracker';
import { today } from './lib/today';
import getWordAndCharCounts from './lib/wordCounter';
import { DEFAULT_SETTINGS, WordToolSettings, WordToolsSettingTab } from './settings';
import { WordCountHelper } from './docCountHelper';
import { DailyCountHelper } from './dailyCountHelper';

export default class WordToolsPlugin extends Plugin {
	settings: WordToolSettings;
	globalWordCountEl: HTMLElement;
	todayCount: number;

	debouncedSave: Debouncer<[], void>;

	globalCountCache: {
		[filepath: string]: {
			cacheTime: number,
			wc: number,
			cc: number
		}
	} = {};

	docCount: WordCountHelper;
	dailyCount: DailyCountHelper;

	PREFIX = "Word Tools";

	async onload() {
		await this.loadSettings();

		this.docCount = new WordCountHelper(this);
		this.dailyCount = new DailyCountHelper(this);

		// Create debouncers for updating.
		this.debouncedSave = debounce(this.handleDebouncedSave, this.settings.saveDelay, true);

		// Initialize today's word count if it doesn't exist
		this.initDay(today());

		// Update the current stored word count to today's saved value
		this.dailyCount.updateTodayCount(this.settings.history[today()].total);
		
		// Add settigns tab
		this.addSettingTab(new WordToolsSettingTab(this.app, this));

		// Bind to events to handle word counting
		this.registerEvent(this.app.workspace.on("quick-preview", this.onQuickPreview.bind(this)));
		this.registerEvent(this.app.vault.on("rename", this.onFileRenamed.bind(this)))
		this.registerEvent(this.app.workspace.on("file-open", this.onFileOpen.bind(this)));

		// On layout ready
		this.app.workspace.onLayoutReady(() => {
			this.app.workspace.iterateAllLeaves((leaf) => {
				// Find the file explorer leaf
				if(leaf.getViewState().type == "file-explorer") {
					try {
						const view = (leaf as WorkspaceLeaf).view as any
						const container = view.containerEl as HTMLElement
						// Create outer element
						const outer = container.createDiv({ cls: "tree-item nav-folder word-tools-global-counts" });
						container.insertAfter(outer, container.firstChild);

						this.globalWordCountEl = outer.createEl("div", { text: "0 words", cls: "world-tools-no-pad nav-file-title" })
						
						this.updateGlobalWordCount();
					} catch (e) {
						console.log(e)
					}
				}
			});
		})
		
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		this.dailyCount.updateTodayCount(this.settings.history[today()]!.total);
		await this.saveData(this.settings);
	}

	initDay(forDay: string) {
		// Initialize today's word count if it doesn't exist
		if(!this.settings.history.hasOwnProperty(forDay)) {
			this.settings.history[forDay] = {total: 0, files: {}};
			stripWordHistory(this.settings.history);
		}
	}

	initFileHistory(filePath: string, wordCount: number, forDay?: string) {
		const TODAY = forDay ? forDay : today();

		this.initDay(TODAY);

		if(!this.settings.history[TODAY].files)
			this.settings.history[TODAY].files = {};
		if(!this.settings.history[TODAY].files!.hasOwnProperty(filePath)) {
			this.settings.history[TODAY].files![filePath] = { initialCount: wordCount, currentCount: wordCount };
			this.debouncedSave();
		}
		this.settings.history[TODAY].goal = this.settings.dailyWordGoal;
	}

	async updateGlobalCountCacheForFile(file: TFile) {
		const count = getWordAndCharCounts(await this.app.vault.cachedRead(file), this.settings.countSettings);
		this.globalCountCache[file.path] = {
			cacheTime: (new Date()).getMilliseconds(),
			wc: count.wc,
			cc: count.cc
		}
	}

	async updateGlobalWordCount() {
		if(this.globalWordCountEl) {
			let words = 0;
			const files = this.app.vault.getFiles();
			for(let i = 0; i < files.length; i++) {
				const file = files[i];
				
				if(!this.globalCountCache.hasOwnProperty(file.path) || file.stat.mtime > this.globalCountCache[file.path].cacheTime)
					await this.updateGlobalCountCacheForFile(file);

				words += this.globalCountCache[file.path].wc;
			}

			this.globalWordCountEl.setText(`${words.toLocaleString()} words`)
		}
	}

	onQuickPreview(file: TFile, contents: string) {
		const PATH = file.path;
		const COUNTS = getWordAndCharCounts(contents, this.settings.countSettings);
		const TODAY = today();
		
		this.docCount.updateCurrentDocCounts(COUNTS.wc, COUNTS.cc)

		this.initFileHistory(PATH, COUNTS.wc, TODAY);
		if(!this.settings.history[TODAY].files)
			return;
		this.settings.history[TODAY].files![PATH].currentCount = COUNTS.wc;

		const TOTAL = totalWordsToday(this.settings.history);
		this.settings.history[TODAY].total = TOTAL;

		this.dailyCount.updateTodayCount(TOTAL);
		this.docCount.updateCurrentDocCounts();
	}

	onFileRenamed(file: TFile, oldPath: string) {
		const TODAY = today();

		if(!this.settings.history[TODAY].files)
			return;
		if(this.settings.history[TODAY].files!.hasOwnProperty(oldPath)) {
			const NEW_PATH = file.path;
			console.log(`${this.PREFIX}: Handling rename of ${oldPath} to ${NEW_PATH}`);
			this.settings.history[TODAY].files![NEW_PATH] = this.settings.history[TODAY].files![oldPath];
			delete this.settings.history[TODAY].files![oldPath];
		}
	}

	async onFileOpen(file: TFile) {
		if(!file)
			return;
		const PATH = file.path;
		const TODAY = today();
		const READ = await this.app.vault.cachedRead(file);
		const DOC_COUNTS = getWordAndCharCounts(READ, this.settings.countSettings);

		this.docCount.updateCurrentDocCounts(DOC_COUNTS.wc, DOC_COUNTS.cc)

		if(!this.settings.history[TODAY].files)
			return;

		if(!this.settings.history[TODAY].files!.hasOwnProperty(PATH)) {
			this.initFileHistory(PATH, DOC_COUNTS.wc, TODAY);
		}
	}

	async handleDebouncedSave() {
		await this.saveSettings();
		console.log(`${this.PREFIX}: Saved Word Count`);
	}

}