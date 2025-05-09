const SPLIT_REGEX = /(?<!-)\b\w+('\w+)?\b|\b\d+(,\d+)*\b/g 
const COMMENT_REGEX = /\%\%.*\%\%/g
const LINK_REGEX = /\[\[.*?\|(.*)\]\]/

export function getWordCount(content: string): number {
    content.replace("_", " ");
    content = replaceAliasedLinks(content);
    content = replaceComments(content);

    const matching = [...content.replace(/_/g, " ").matchAll(SPLIT_REGEX)]
    const count = matching.length

    return count;
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