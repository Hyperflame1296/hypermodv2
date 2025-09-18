/** @format */

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
class EventEmitter {
    constructor() {
        this._events = {}
    }
    on(en, fn) {
        if (!this._events.hasOwnProperty(en)) this._events[en] = []
        this._events[en].push(fn)
    }
    off(en, fn) {
        if (!this._events.hasOwnProperty(en)) return
        var idx = this._events[en].indexOf(fn)
        if (idx < 0) return
        this._events[en].splice(idx, 1)
    }
    emit(en) {
        if (!this._events.hasOwnProperty(en)) return
        var fns = this._events[en].slice(0)
        if (fns.length < 1) return
        var args = Array.prototype.slice.call(arguments, 1)
        for (var i = 0; i < fns.length; i++) fns[i].apply(this, args)
    }
}

// knob
class Knob extends EventEmitter {
    constructor(canvas, min, max, step, value, name, unit) {
        super()

        this.min = min || 0
        this.max = max || 10
        this.step = step || 0.01
        this.value = value || this.min
        this.knobValue = (this.value - this.min) / (this.max - this.min)
        this.name = name || ''
        this.unit = unit || ''

        var ind = step.toString().indexOf('.')
        if (ind == -1) ind = step.toString().length - 1
        this.fixedPoint = step.toString().substr(ind).length - 1

        this.dragY = 0
        this.mouse_over = false

        this.canvas = canvas
        this.ctx = canvas.getContext('2d')

        // knob image
        this.radius = this.canvas.width * 0.3333
        this.baseImage = document.createElement('canvas')
        this.baseImage.width = canvas.width
        this.baseImage.height = canvas.height
        var ctx = this.baseImage.getContext('2d')
        ctx.fillStyle = '#444'
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
        ctx.shadowBlur = 5
        ctx.shadowOffsetX = this.canvas.width * 0.02
        ctx.shadowOffsetY = this.canvas.width * 0.02
        ctx.beginPath()
        ctx.arc(this.canvas.width / 2, this.canvas.height / 2, this.radius, 0, Math.PI * 2)
        ctx.fill()

        // events
        var dragging = false
        // dragging
        ;(() => {
            let mousemove = e => {
                if (e.screenY !== this.dragY) {
                    var delta = -(e.screenY - this.dragY)
                    var scale = 0.0075
                    if (e.ctrlKey) scale *= 0.05
                    this.setKnobValue(this.knobValue + delta * scale)
                    this.dragY = e.screenY
                    this.redraw()
                }
                e.preventDefault()
                showTip()
            }
            let mouseout = e => {
                if (e.toElement === null && e.relatedTarget === null) {
                    mouseup()
                }
            }
            let mouseup = () => {
                document.removeEventListener('mousemove', mousemove)
                document.removeEventListener('mouseout', mouseout)
                document.removeEventListener('mouseup', mouseup)
                this.emit('release', this)
                dragging = false
                if (!this.mouse_over) removeTip()
            }
            canvas.addEventListener('mousedown', e => {
                var pos = this.translateMouseEvent(e)
                if (this.contains(pos.x, pos.y)) {
                    dragging = true
                    this.dragY = e.screenY
                    showTip()
                    document.addEventListener('mousemove', mousemove)
                    document.addEventListener('mouseout', mouseout)
                    document.addEventListener('mouseup', mouseup)
                }
            })
            canvas.addEventListener('keydown', e => {
                if (e.keyCode == 38) {
                    this.setValue(this.value + this.step)
                    showTip()
                } else if (e.keyCode == 40) {
                    this.setValue(this.value - this.step)
                    showTip()
                }
            })
        })()
        // tooltip
        let showTip = () => {
            var div = document.getElementById('tooltip')
            if (!div) {
                div = document.createElement('div')
                document.body.appendChild(div)
                div.id = 'tooltip'
                var rect = this.canvas.getBoundingClientRect()
                div.style.left = rect.left + 'px'
                div.style.top = rect.bottom + 'px'
            }
            div.textContent = this.name
            if (this.name) div.textContent += ': '
            div.textContent += this.valueString() + this.unit
        }
        let removeTip = () => {
            var div = document.getElementById('tooltip')
            if (div) {
                div.parentElement.removeChild(div)
            }
        }
        let ttmousemove = e => {
            var pos = this.translateMouseEvent(e)
            if (this.contains(pos.x, pos.y)) {
                this.mouse_over = true
                showTip()
            } else {
                this.mouse_over = false
                if (!dragging) removeTip()
            }
        }
        let ttmouseout = e => {
            this.mouse_over = false
            if (!dragging) removeTip()
        }
        this.canvas.addEventListener('mousemove', ttmousemove)
        this.canvas.addEventListener('mouseout', ttmouseout)

        this.redraw()
    }
    redraw() {
        var dot_distance = 0.28 * this.canvas.width
        var dot_radius = 0.03 * this.canvas.width
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.ctx.drawImage(this.baseImage, 0, 0)

        var a = this.knobValue
        a *= Math.PI * 2 * 0.8
        a += Math.PI / 2
        a += Math.PI * 2 * 0.1
        var half_width = this.canvas.width / 2
        var x = Math.cos(a) * dot_distance + half_width
        var y = Math.sin(a) * dot_distance + half_width
        this.ctx.fillStyle = '#fff'
        this.ctx.beginPath()
        this.ctx.arc(x, y, dot_radius, 0, Math.PI * 2)
        this.ctx.fill()
    }
    setKnobValue(value) {
        if (value < 0) value = 0
        else if (value > 1) value = 1
        this.knobValue = value
        this.setValue(value * (this.max - this.min) + this.min)
    }
    setValue(value) {
        var old = value
        value = round(value, this.step, this.min)
        if (value < this.min) value = this.min
        else if (value > this.max) value = this.max
        if (this.value !== value) {
            this.value = value
            this.knobValue = (value - this.min) / (this.max - this.min)
            this.redraw()
            this.emit('change', this)
        }
    }
    valueString() {
        return this.value.toFixed(this.fixedPoint)
    }
    contains(x, y) {
        x -= this.canvas.width / 2
        y -= this.canvas.height / 2
        return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)) < this.radius
    }
    translateMouseEvent(e) {
        var element = e.target
        return {
            x: e.clientX - element.getBoundingClientRect().left - element.clientLeft + element.scrollLeft,
            y: e.clientY - (element.getBoundingClientRect().top - element.clientTop + element.scrollTop)
        }
    }
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
Object.assign(globalThis, {
    EventEmitter,
    Knob,
    parseMarkdown,
    parseContent,
    parseUrl
})