const GeneratorFunction = Object.getPrototypeOf(function*(){}).constructor
const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor
const AsyncGeneratorFunction = Object.getPrototypeOf(async function*(){}).constructor
var parseContent = (text) =>
    text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')

var markdownRegex =
    /((?:\\|)(?:\|\|.+?\|\||```.+?```|``.+?``|`.+?`|\*\*\*.+?\*\*\*|\*\*.+?\*\*|\*.+?\*|___.+?___|__.+?__|_.+?_(?:\s|$)|~~.+?~~))/g

var getTextContent = (text) => {
    return text.indexOf('>') > -1 && text.indexOf('</') > -1
        ? text.slice(text.indexOf('>') + 1, text.lastIndexOf('</')) || text
        : text
}

var getLinkTextContent = (text) => {
    var rightArrowIndex = text.indexOf('>')
    var leftArrowSlashIndex = text.lastIndexOf('</')
    var properRightArrowIndex = rightArrowIndex > leftArrowSlashIndex ? -1 : rightArrowIndex
    return properRightArrowIndex > -1 || leftArrowSlashIndex > -1
        ? text.slice(
              properRightArrowIndex > -1 ? properRightArrowIndex + 1 : 0,
              leftArrowSlashIndex > -1 ? leftArrowSlashIndex : text.length
          ) || text
        : text
}

var parseUrl = (text) => {
    return text.replace(url_regex, (match) => {
        var url = getLinkTextContent(match)
        return `<a rel="noreferer noopener" target="_blank" class="chatLink" href="${url}">${url}</a>`
    })
}

var parseMarkdown = (text, parseFunction = (t) => t) => {
    return text
        .split(markdownRegex)
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
                var content = parseMarkdown(getTextContent(match.slice(2, match.length - 2)), parseFunction)
                return content.trim().length < 1 ? match : `<del class="markdown">${content}</del>`
            } else if (match.startsWith('___') && endsWithThreeUnderscores) {
                var content = parseMarkdown(getTextContent(match.slice(3, match.length - 3)), parseFunction)
                return content.trim().length < 1 ? match : `<em class="markdown"><u class="markdown">${content}</u></em>`
            } else if (match.startsWith('__') && endsWithTwoUnderscores) {
                var content = parseMarkdown(getTextContent(match.slice(2, match.length - 2)), parseFunction)
                return content.trim().length < 1 ? match : `<u class="markdown">${content}</u>`
            } else if (match.startsWith('***') && endsWithThreeAsterisks) {
                var content = parseMarkdown(getTextContent(match.slice(3, match.length - 3)), parseFunction)
                return content.trim().length < 1
                    ? match
                    : `<em class="markdown"><strong class="markdown">${content}</strong></em>`
            } else if (match.startsWith('**') && endsWithTwoAsterisks) {
                var content = parseMarkdown(getTextContent(match.slice(2, match.length - 2)), parseFunction)
                return content.trim().length < 1 ? match : `<strong class="markdown">${content}</strong>`
            } else if ((match.startsWith('*') && endsWithAsterisk) || (match.startsWith('_') && endsWithUnderscore)) {
                var content = parseMarkdown(getTextContent(match.slice(1, match.length - 1)), parseFunction)
                return content.trim().length < 1 ? match : `<em class="markdown">${content}</em>`
            } else if (match.startsWith('`') && endsWithBacktick) {
                var slice =
                    match.startsWith('```') && endsWithThreeBackticks
                        ? 3
                        : match.startsWith('``') && endsWithTwoBackticks
                          ? 2
                          : 1
                var content = getTextContent(match.slice(slice, match.length - slice))
                return content.trim().length < 1 ? match : `<code class="markdown">${content}</code>`
            } else if (match.startsWith('||') && endsWithVerticalBars) {
                var content = parseMarkdown(getTextContent(match.slice(2, match.length - 2)), parseFunction)
                return content.trim().length < 1 ? match : `<span class="markdown spoiler">${content}</span>`
            }
            return parseFunction(match)
        })
        .join('')
}
function hashFnv32a(str, asString, seed) {
    /*jshint bitwise:false */
    var i,
        l,
        hval = seed === undefined ? 0x811c9dc5 : seed

    for (i = 0, l = str.length; i < l; i++) {
        hval ^= str.charCodeAt(i)
        hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24)
    }
    if (asString) {
        // Convert to 8 digit hex string
        return ('0000000' + (hval >>> 0).toString(16)).substr(-8)
    }
    return hval >>> 0
}

function round(number, increment, offset) {
    return Math.round((number - offset) / increment) * increment + offset
}
var url_regex = new RegExp(
    // protocol identifier (optional)
    // short syntax // still required
    '(?:(?:(?:https?|ftp):)?\\/\\/)' +
        // user:pass BasicAuth (optional)
        '(?:\\S+(?::\\S*)?@)?' +
        '(?:' +
        // IP address exclusion
        // private & local networks
        '(?!(?:10|127)(?:\\.\\d{1,3}){3})' +
        '(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})' +
        '(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})' +
        // IP address dotted notation octets
        // excludes loopback network 0.0.0.0
        // excludes reserved space >= 224.0.0.0
        // excludes network & broadcast addresses
        // (first & last IP address of each class)
        '(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])' +
        '(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}' +
        '(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))' +
        '|' +
        // host & domain names, may end with dot
        // can be replaced by a shortest alternative
        // (?![-_])(?:[-\\w\\u00a1-\\uffff]{0,63}[^-_]\\.)+
        '(?:' +
        '(?:' +
        '[a-z0-9\\u00a1-\\uffff]' +
        '[a-z0-9\\u00a1-\\uffff_-]{0,62}' +
        ')?' +
        '[a-z0-9\\u00a1-\\uffff]\\.' +
        ')+' +
        // TLD identifier name, may end with dot
        '(?:[a-z\\u00a1-\\uffff]{2,}\\.?)' +
        ')' +
        // port number (optional)
        '(?::\\d{2,5})?' +
        // resource path (optional)
        '(?:[/?#]\\S*)?',
    'ig'
)
export {
    GeneratorFunction,
    AsyncFunction,
    AsyncGeneratorFunction,
    parseMarkdown,
    parseContent,
    parseUrl
}