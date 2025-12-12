// import: local classes
import { EventEmitter } from './EventEmitter.js'

// code
export class Knob extends EventEmitter {
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