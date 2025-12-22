export const util = {
    math: {
        round: (number, increment, offset) => {
            return Math.round((number - offset) / increment) * increment + offset
        }
    },
    lang: {
        listFormat: (list: string[]) => {
            if (!Array.isArray(list) && typeof list[Symbol.iterator] === 'function') {
                list = Array.from(list)
            }
            if (list.length == 0) return ''
            else if (list.length == 1) return list[0]
            else if (list.length == 2) return list[0] + ' and ' + list[1]
            else return list.slice(0, -1).join(', ') + ', and ' + list[list.length - 1]
        }
    },
    html: {
        markdownRegex: /((?:\\|)(?:\|\|.+?\|\||```.+?```|``.+?``|`.+?`|\*\*\*.+?\*\*\*|\*\*.+?\*\*|\*.+?\*|___.+?___|__.+?__|_.+?_(?:\s|$)|~~.+?~~))/g,
        urlRegex: new RegExp(
            // protocol identifier (optional)
            // short syntax // still required
            "(?:(?:(?:https?|ftp):)?\\/\\/)" +
                // user:pass BasicAuth (optional)
                "(?:\\S+(?::\\S*)?@)?" +
                "(?:" +
                // IP address exclusion
                // private & local networks
                "(?!(?:10|127)(?:\\.\\d{1,3}){3})" +
                "(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})" +
                "(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})" +
                // IP address dotted notation octets
                // excludes loopback network 0.0.0.0
                // excludes reserved space >= 224.0.0.0
                // excludes network & broadcast addresses
                // (first & last IP address of each class)
                "(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])" +
                "(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}" +
                "(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))" +
                "|" +
                // host & domain names, may end with dot
                // can be replaced by a shortest alternative
                // (?![-_])(?:[-\\w\\u00a1-\\uffff]{0,63}[^-_]\\.)+
                "(?:" +
                "(?:" +
                "[a-z0-9\\u00a1-\\uffff]" +
                "[a-z0-9\\u00a1-\\uffff_-]{0,62}" +
                ")?" +
                "[a-z0-9\\u00a1-\\uffff]\\." +
                ")+" +
                // TLD identifier name, may end with dot
                "(?:[a-z\\u00a1-\\uffff]{2,}\\.?)" +
                ")" +
                // port number (optional)
                "(?::\\d{2,5})?" +
                // resource path (optional)
                "(?:[/?#]\\S*)?",
            "ig",
        ),
        parseContent: text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'),
        getTextContent: text => {
            return text.indexOf('>') > -1 && text.indexOf('</') > -1
                ? text.slice(text.indexOf('>') + 1, text.lastIndexOf('</')) || text
                : text
        },
        getLinkTextContent: text => {
            let rightArrowIndex = text.indexOf('>')
            let leftArrowSlashIndex = text.lastIndexOf('</')
            let properRightArrowIndex = rightArrowIndex > leftArrowSlashIndex ? -1 : rightArrowIndex
            return properRightArrowIndex > -1 || leftArrowSlashIndex > -1
                ? text.slice(
                    properRightArrowIndex > -1 ? properRightArrowIndex + 1 : 0,
                    leftArrowSlashIndex > -1 ? leftArrowSlashIndex : text.length
                ) || text
                : text
        },
        parseUrl: text => {
            return text.replace(util.html.urlRegex, (match) => {
                var url = util.html.getLinkTextContent(match)
                return `<a rel="noreferer noopener" target="_blank" class="chatLink" href="${url}">${url}</a>`
            })
        },
        parseMarkdown: (text, parseFunction = (t) => t) => {
            return text
                .split(util.html.markdownRegex)
                .map((match) => {
                    var endsWithTildes = match.endsWith('~~')
                    var endsWithThreeUnderscores = match.endsWith('___')
                    var endsWithTwoUnderscores = match.endsWith('__')
                    var endsWithUnderscore = match.endsWith('_')
                    var endsWithThreeAsterisks = match.endsWith('***')
                    var endsWithTwoAsterisks = match.endsWith('**')
                    var endsWithAsterisk = match.endsWith('*')
                    var endsWithThreeBackticks = match.endsWith('```')
                    var endsWithTwoBackticks = match.endsWith('``')
                    var endsWithBacktick = match.endsWith('`')
                    var endsWithVerticalBars = match.endsWith('||')
                    if (
                        (match.startsWith('\\~~') && endsWithTildes) ||
                        (match.startsWith('\\___') && endsWithThreeUnderscores) ||
                        (match.startsWith('\\__') && endsWithTwoUnderscores) ||
                        (match.startsWith('\\_') && endsWithUnderscore) ||
                        (match.startsWith('\\***') && endsWithThreeAsterisks) ||
                        (match.startsWith('\\**') && endsWithTwoAsterisks) ||
                        (match.startsWith('\\*') && endsWithAsterisk) ||
                        (match.startsWith('\\```') && endsWithThreeBackticks) ||
                        (match.startsWith('\\``') && endsWithTwoBackticks) ||
                        (match.startsWith('\\`') && endsWithBacktick) ||
                        (match.startsWith('\\||') && endsWithVerticalBars)
                    ) {
                        return parseFunction(match.slice(1))
                    } else if (match.startsWith('~~') && endsWithTildes) {
                        var content = util.html.parseMarkdown(util.html.getTextContent(match.slice(2, match.length - 2)), parseFunction)
                        return content.trim().length < 1 ? match : `<del class="markdown">${content}</del>`
                    } else if (match.startsWith('___') && endsWithThreeUnderscores) {
                        var content = util.html.parseMarkdown(util.html.getTextContent(match.slice(3, match.length - 3)), parseFunction)
                        return content.trim().length < 1 ? match : `<em class="markdown"><u class="markdown">${content}</u></em>`
                    } else if (match.startsWith('__') && endsWithTwoUnderscores) {
                        var content = util.html.parseMarkdown(util.html.getTextContent(match.slice(2, match.length - 2)), parseFunction)
                        return content.trim().length < 1 ? match : `<u class="markdown">${content}</u>`
                    } else if (match.startsWith('***') && endsWithThreeAsterisks) {
                        var content = util.html.parseMarkdown(util.html.getTextContent(match.slice(3, match.length - 3)), parseFunction)
                        return content.trim().length < 1
                            ? match
                            : `<em class="markdown"><strong class="markdown">${content}</strong></em>`
                    } else if (match.startsWith('**') && endsWithTwoAsterisks) {
                        var content = util.html.parseMarkdown(util.html.getTextContent(match.slice(2, match.length - 2)), parseFunction)
                        return content.trim().length < 1 ? match : `<strong class="markdown">${content}</strong>`
                    } else if ((match.startsWith('*') && endsWithAsterisk) || (match.startsWith('_') && endsWithUnderscore)) {
                        var content = util.html.parseMarkdown(util.html.getTextContent(match.slice(1, match.length - 1)), parseFunction)
                        return content.trim().length < 1 ? match : `<em class="markdown">${content}</em>`
                    } else if (match.startsWith('`') && endsWithBacktick) {
                        var slice =
                            match.startsWith('```') && endsWithThreeBackticks
                                ? 3
                                : match.startsWith('``') && endsWithTwoBackticks
                                ? 2
                                : 1
                        var content = util.html.getTextContent(match.slice(slice, match.length - slice))
                        return content.trim().length < 1 ? match : `<code class="markdown">${content}</code>`
                    } else if (match.startsWith('||') && endsWithVerticalBars) {
                        var content = util.html.parseMarkdown(util.html.getTextContent(match.slice(2, match.length - 2)), parseFunction)
                        return content.trim().length < 1 ? match : `<span class="markdown spoiler">${content}</span>`
                    }
                    return parseFunction(match)
                })
                .join('')
        }
    }
}