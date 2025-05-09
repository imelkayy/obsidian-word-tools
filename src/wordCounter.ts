
function replaceAliasedLinks(contents: string): string {
    const LINK_REGEX = /\[\[.*?\|(.*)\]\]/
   
    let match;
    while((match = LINK_REGEX.exec(contents)) != null) {
        // Replace all occurances of the aliased link with its alias
        contents = contents.replace(LINK_REGEX, match[1]);
    }

    return contents;
}

function replaceComments(contents: string): string {
    const COMMENT_REGEX = /\%\%.*\%\%/g
    return contents.replace(COMMENT_REGEX, "");
}