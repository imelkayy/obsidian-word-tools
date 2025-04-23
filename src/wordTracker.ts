import { today } from "./today"

const SPLIT_REGEX = /[\s|.?,\/=()<>`~+_!@#$%^&*";:]+/

export type WordTracker = {
	initialCount: number,
	currentCount: number,
}

export type WordTrackerDay = {
    total: number,
    files?: {
        [fileName: string]: WordTracker
    }
}

export type WordTrackerHistory = {
	[key: string]: WordTrackerDay
}

export function wordCount(content: string): number {
    return content.split(SPLIT_REGEX).filter( w => w ).length;
}

export function totalWordsForDay(day: WordTrackerDay): number {
    if(!day.files)
        return 0;
    
    const FILES = Object.keys(day.files);
    let count = 0;

    FILES.forEach((file) => {
        if(day.files)
            count += day.files[file].currentCount - day.files[file].initialCount;
    });

    return count;
}

export function totalWordsForDayKey(dayKey: string, history: WordTrackerHistory): number {
    if(!history.hasOwnProperty(dayKey))
        return 0;

    return totalWordsForDay(history[dayKey]);
}

export function totalWordsToday(history: WordTrackerHistory): number {
    return totalWordsForDayKey(today(), history);
}

export function stripDayHistory(day: WordTrackerDay): WordTrackerDay {
    day.total = totalWordsForDay(day);
    delete day.files;
    return day;
}

export function stripWordHistory(history: WordTrackerHistory): WordTrackerHistory {
    const TODAY = today();
    const DAYS = Object.keys(history).filter(v => v != TODAY);
    
    DAYS.forEach((day) => {
        stripDayHistory(history[day])
    })
    return history;
}

/*
"2025/3/1": {
    "total": 36,
    "files": {
    "reload/Testing 123.md": {
        "initialCount": 18,
        "currentCount": 25
    },
    "Word Delimiter Testing.md": {
        "initialCount": 105,
        "currentCount": 134
    }
    }
},
 */