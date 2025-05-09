function replaceComments(contents: string): string {
    const COMMENT_REGEX = /\%\%.*\%\%/g
    return contents.replace(COMMENT_REGEX, "");
}