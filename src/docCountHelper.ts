import { debounce, Debouncer } from "obsidian";
import getWordAndCharCounts from "./lib/wordCounter";
import WordToolsPlugin from "./main";

export class WordCountHelper {
    plugin: WordToolsPlugin;
    hasSelection: boolean;

    docCurrentWordsBarEl: HTMLElement;
    docCurrentCharsBarEl: HTMLElement;

    updateCurrentDocCounts: Debouncer<[words?: number, chars?: number], void>;

    constructor(plugin: WordToolsPlugin) {
        this.plugin = plugin;
        this.hasSelection = false;

        // Create status bar elements
        this.docCurrentWordsBarEl = this.plugin.addStatusBarItem();
        this.docCurrentCharsBarEl = this.plugin.addStatusBarItem();

        // Create debouncer
        this.updateCurrentDocCounts = debounce(this.handleUpdateCurrentDocCounts, this.plugin.settings.globalUpdateDelay, false);

        // Register interval for selection detection
        this.plugin.registerInterval(
			window.setInterval(() => this.handleUpdateCurrentDocCounts(), 250)
		);
    }

    private async handleUpdateCurrentDocCounts(words?: number, chars?: number) {
        // Handle no words or chars provided
        if(!words || !chars) {
            let file: string = "";
            // Handle hasSelection
            const sel = this.plugin.app.workspace.activeEditor?.editor?.somethingSelected();
            this.hasSelection = sel ?? false;

            // Determine where to get the word count from
            if(sel) {
                file = this.plugin.app.workspace.activeEditor?.editor?.getSelection() ?? "";
            } else if(this.plugin.app.workspace.activeEditor?.file) {
                file = await this.plugin.app.vault.cachedRead(this.plugin.app.workspace.activeEditor?.file!);
            }

            // Get words & characters from the source
            const count = getWordAndCharCounts(file, this.plugin.settings.countSettings);
            words = count.wc;
            chars = count.cc;
        }

        // Update bar elements
        this.docCurrentWordsBarEl.setText(`${words.toLocaleString()} words`);
        this.docCurrentCharsBarEl.setText(`${chars.toLocaleString()} characters`);
    }

}