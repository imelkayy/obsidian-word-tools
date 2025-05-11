import { debounce, Debouncer, WorkspaceLeaf, Plugin, TFile } from 'obsidian';
import { totalWordsToday, stripWordHistory } from './lib/wordTracker';
import { today } from './lib/today';
import getWordAndCharCounts from './lib/wordCounter';
import { DEFAULT_SETTINGS, WordToolSettings, WordToolsSettingTab } from './settings';

export default class WordToolsPlugin extends Plugin {
	settings: WordToolSettings;
	dailyCountBarEl: HTMLElement;
	docCurrentWordsBarEl: HTMLElement;
	docCurrentCharsBarEl: HTMLElement;
	globalWordCountEl: HTMLElement;
	todayCount: number;
	updateCount: Debouncer<[count: number], void>;
	debouncedSave: Debouncer<[], void>;
	debouncedGlobalUpdate: Debouncer<[], void>;
	globalCountCache: {
		[filepath: string]: {
			cacheTime: number,
			wc: number,
			cc: number
		}
	} = {};
	hasSel: boolean;

	PREFIX = "Word Tools";

	async onload() {
		// Create status bar elements
		this.docCurrentWordsBarEl = this.addStatusBarItem();
		this.docCurrentCharsBarEl = this.addStatusBarItem();
		this.dailyCountBarEl = this.addStatusBarItem();

		await this.loadSettings();

		// Create debouncers for updating.
		this.updateCount = debounce(this.handleCountUpdate, this.settings.displayUpdateDelay, false);
		this.debouncedSave = debounce(this.handleDebouncedSave, this.settings.saveDelay, true);
		this.debouncedGlobalUpdate = debounce(this.updateGlobalWordCount, this.settings.globalUpdateDelay, false);

		this.registerInterval(
			window.setInterval(() => this.updateCurrentDocCounts(), 250)
		)

		// Initialize today's word count if it doesn't exist
		this.initDay(today());

		// Update the current stored word count to today's saved value
		this.updateCount(this.settings.history[today()].total);
		
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
		this.updateStatusBarCount();
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

	async updateCurrentDocCounts(words?: number, chars?: number) {
		const sel = this.app.workspace.activeEditor?.editor?.getSelection();

		if(sel) {
			this.hasSel = true;
			const count = getWordAndCharCounts(sel, this.settings.countSettings);
			words = count.wc;
			chars = count.cc;
		} else if (this.hasSel && !words && !chars && this.app.workspace.activeEditor?.file) {
			this.hasSel = false;
			const read = await this.app.vault.cachedRead(this.app.workspace.activeEditor?.file!);
			const count = getWordAndCharCounts(read, this.settings.countSettings);
			words = count.wc;
			chars = count.cc;
		}

		if(words)
			this.docCurrentWordsBarEl.setText(`${words.toLocaleString()} words`)
		if(chars)
			this.docCurrentCharsBarEl.setText(`${chars.toLocaleString()} characters`);
	}

	updateStatusBarCount() {
		const text = `${this.todayCount}${this.settings.showGoal ? `/${this.settings.dailyWordGoal}` : ""} words today `
		this.dailyCountBarEl.setText(text);
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

	handleCountUpdate(count: number) {
		this.todayCount = count;

		if(this.dailyCountBarEl)
			this.updateStatusBarCount();
		
		if(this.debouncedSave)
			this.debouncedSave();
	}

	onQuickPreview(file: TFile, contents: string) {
		const PATH = file.path;
		const COUNTS = getWordAndCharCounts(contents, this.settings.countSettings);
		const TODAY = today();
		
		this.updateCurrentDocCounts(COUNTS.wc, COUNTS.cc)

		this.initFileHistory(PATH, COUNTS.wc, TODAY);
		if(!this.settings.history[TODAY].files)
			return;
		this.settings.history[TODAY].files![PATH].currentCount = COUNTS.wc;

		const TOTAL = totalWordsToday(this.settings.history);
		this.settings.history[TODAY].total = TOTAL;

		this.updateCount(TOTAL);
		this.debouncedGlobalUpdate();
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

		this.updateCurrentDocCounts(DOC_COUNTS.wc, DOC_COUNTS.cc)

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