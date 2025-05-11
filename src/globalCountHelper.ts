import { debounce, Debouncer, TFile, WorkspaceLeaf } from "obsidian";
import getWordAndCharCounts from "./lib/wordCounter";
import WordToolsPlugin from "./main";

export class GlobalCountHelper {
    plugin: WordToolsPlugin;
    globalCountCache: {
		[filepath: string]: {
			cacheTime: number,
			wc: number,
			cc: number
		}
	};
    updateGlobalWordCount: Debouncer<[], void>;

    outerEl: HTMLElement;
    wordCountEl: HTMLElement;
    
    constructor(plugin: WordToolsPlugin) {
        this.plugin = plugin;
        this.globalCountCache = {};

        this.updateGlobalWordCount = debounce(this.handleUpdateGlobalWordCount, this.plugin.settings.globalUpdateDelay, false);
        this.createElements();
    }

    private async createElements() {
        this.plugin.app.workspace.iterateAllLeaves((leaf) => {
            // Find the file explorer leaf
            if(leaf.getViewState().type == "file-explorer") {
                const view = (leaf as WorkspaceLeaf).view as any
                const container = view.containerEl as HTMLElement
                // Create outer element
                this.outerEl = container.createDiv({ cls: "tree-item nav-folder word-tools-global-counts" });
                container.insertAfter(this.outerEl, container.firstChild);
                // Create inner element
                this.wordCountEl = this.outerEl.createEl("div", { text: "0 words", cls: "world-tools-no-pad nav-file-title" })
                
                this.handleUpdateGlobalWordCount();
            }
        });
        return null;
    }

    private async updateGlobalCountCacheForFile(file: TFile) {
		const count = getWordAndCharCounts(await this.plugin.app.vault.cachedRead(file), this.plugin.settings.countSettings);
		this.globalCountCache[file.path] = {
			cacheTime: (new Date()).getMilliseconds(),
			wc: count.wc,
			cc: count.cc
		}
	}

    private async handleUpdateGlobalWordCount() {
		if(this.wordCountEl) {
			let words = 0;
			const files = this.plugin.app.vault.getFiles();
			for(let i = 0; i < files.length; i++) {
				const file = files[i];
				
				if(!this.globalCountCache.hasOwnProperty(file.path) || file.stat.mtime > this.globalCountCache[file.path].cacheTime)
					await this.updateGlobalCountCacheForFile(file);

				words += this.globalCountCache[file.path].wc;
			}

			this.wordCountEl.setText(`${words.toLocaleString()} words`)
		}
	}
}