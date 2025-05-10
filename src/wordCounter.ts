import { getFrontMatterInfo } from "obsidian";
import { CountSettings } from "./types";

const SPLIT_REGEX = /(?<!-)\b\w+('\w+)?\b|\b\d+(,\d+)*\b/g 
const COMMENT_REGEX = /\%\%.*\%\%/g
const LINK_REGEX = /\[\[.*?\|(.*)\]\]/

export default function getWordAndCharCounts(content: string, settings: CountSettings): { wc: number, cc: number } {
    content = content.replace("_", " ");
    content = parseContentBySettings(content, settings);
    return {
        wc: getWordCount(content),
        cc: getCharacterCount(content)
    }
}

export function getWordCount(content: string): number {
    const matching = [...content.replace(/_/g, " ").matchAll(SPLIT_REGEX)]
    const count = matching.length

    return count;
}

export function getCharacterCount(content: string): number {
   return content.length;
}

function parseContentBySettings(content: string, settings: CountSettings): string {
    if(settings.removeFrontmatter)
        content = removeFrontmatter(content);
    if(!settings.countComments)
        content = replaceComments(content);
    if(!settings.countFullLink)
        content = replaceAliasedLinks(content);

    return content;
}

function replaceAliasedLinks(contents: string): string {   
    let match;
    while((match = LINK_REGEX.exec(contents)) != null) {
        // Replace all occurances of the aliased link with its alias
        contents = contents.replace(LINK_REGEX, match[1]);
    }

    return contents;
}

function replaceComments(contents: string): string {
    return contents.replace(COMMENT_REGEX, "");
}

function removeFrontmatter(contents: string): string {
    const info = getFrontMatterInfo(contents);
    const start = info.contentStart;

    console.log(info)
    console.log(start)

    return contents.substring(start);
}