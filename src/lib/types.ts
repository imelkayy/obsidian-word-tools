export interface CountSettings {
    /**
     * Should text inside comments be counted towards the word count?
     */
    countComments: boolean,
    /**
     * Should the full text of links be counted, or just the alias (if provided)?
     */
    countFullLink: boolean,
    /**
     * Should frontmatter be removed before counting?
     */
    removeFrontmatter: boolean
}