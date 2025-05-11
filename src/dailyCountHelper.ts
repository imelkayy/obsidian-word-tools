import { debounce, Debouncer } from "obsidian";
import WordToolsPlugin from "./main";
import { WordToolSettings } from "./settings";

export class DailyCountHelper {
    plugin: WordToolsPlugin;
    settings: WordToolSettings;
    updateTodayCount: Debouncer<[count: number], void>;

    dailyWordCountBarEl: HTMLElement;

    constructor(plugin: WordToolsPlugin) {
        this.settings = plugin.settings
        
        this.dailyWordCountBarEl = plugin.addStatusBarItem();

        this.updateTodayCount = debounce(this.handleUpdateTodayCount, plugin.settings.displayUpdateDelay, false);
    }

    private handleUpdateTodayCount(count: number) {
        if(this.dailyWordCountBarEl) {
            const text = `${count}${this.settings.showGoal ? `/${this.settings.dailyWordGoal}` : ""} words today `
            this.dailyWordCountBarEl.setText(text);
        }
    }
}