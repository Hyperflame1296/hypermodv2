// import: local modules
import { util } from '../modules/util.js'

// import: local interfaces
import { Note } from '../interfaces/Note.js'

// import: local classes
import { Client } from './Client.js'
import { IncomingMessage } from '../interfaces/IncomingMessage.js'
import { EventEmitter } from './EventEmitter.js'

// code
export class Draw extends EventEmitter {
    lineLife: number = 10
    #enabled: boolean = true
    customColor: string = null
    canvas: HTMLCanvasElement = null
    ctx: CanvasRenderingContext2D = null
    brushSize: number = 2
    mutes: string[] = []
    lines: any[] = []
    buf: Note[] = [{ n: 'ldraw', v: 0 }]
    shifted: boolean = false
    clicking: boolean = false
    client: Client = null
	constructor(client: Client) {
		super()
		if (window.MPP && window.MPP.addons.draw) 
            throw new Error('no')

        if ((!client && !window.MPP.client) || !(client instanceof Client))
            throw new Error('the client does not exist, apparently')

        this.client = client
        
		this.canvas = document.createElement('canvas')
		this.canvas.id = 'drawboard'
		this.canvas.style = 'position: fixed; top: 0; left: 0; z-index: 400; pointer-events: none;'
		this.canvas.width = window.innerWidth
		this.canvas.height = window.innerHeight
		this.ctx = this.canvas.getContext('2d')
		
		$(document.body).append(this.canvas)

		this.loop = this.loop.bind(this)
	}
	get enabled() {
		return this.#enabled
	}
	set enabled(enabled) {
		if (enabled)
			$(this.canvas).show()
		else
			$(this.canvas).hide()
		this.#enabled = enabled
	}
	init() {
		$(document).on('mousedown', e => {
			if (e.shiftKey) {
				this.clicking = true
				this.draw()
				e.preventDefault()
			}
		})
		$(document).on('mouseup', e => {
			this.clicking = false
		})
		$(document).on('keyup keydown', e => {
			this.shifted = e.shiftKey
		})
		$(window).on('resize', this.resize.bind(this), false)
		this.on('refresh', t => {
			this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
			if (!this.#enabled)
				return
			if (this.lines.length > 0) {
				for (var l = 0; l < this.lines.length; l++) {
					this.ctx.globalAlpha = 1
					var c = this.lines[l]
					this.ctx.strokeStyle = c[6]
					this.ctx.lineWidth = c[5]
					var d = this.lineLife - (t - c[4]) / 1000
					if (d <= 0) {
						this.lines.splice(l--, 1)
						continue
					}
					this.ctx.globalAlpha = 0.3 * d
					this.ctx.beginPath()
					this.ctx.moveTo(c[0], c[1])
					this.ctx.lineTo(c[2], c[3])
					this.ctx.stroke()
				}
			}
		})
		this.client.on('n', msg => {
			this.input(msg)
		})
		this.client.on('custom', c => {
			let msg = c.data
			if (msg.m !== 'draw')
				return
			this.input(msg)
		})
		this.client.on('c', () => {
			this.lines = [[0, 0, 0, 0, 0, 0, '#0']]
		})

		requestAnimationFrame(this.loop)
	}
	loop() {
		this.flushBuffer()
	    this.redraw()
        requestAnimationFrame(this.loop)
    }
	input(msg: IncomingMessage['n']) {
		if (this.mutes.includes(this.client.findParticipantById(msg.p)._id))
			return
		if (msg.n[0]?.n !== 'ldraw')
			return
		for (let b of msg.n) {
			if (b.n.length == 4) {
				var clr = (b.d !== undefined && this.toHtml(b.d)) || this.client.findParticipantById(msg.p).color
				this.parseLine(b.n, clr, Math.min(b.v, 5))
			}
		}
	}
	flushBuffer() {
		var t = Date.now()
		if (this.buf.length > 1) {
			this.client.sendArray([{ 
				m: 'n', 
				t, 
				n: this.buf 
			}])
			this.client.sendArray([{ 
				m: 'custom',
				target: {
					mode: 'subscribed'
				},
				data: {
					m: 'draw', 
					t, 
					n: this.buf
				}
			}])
		}
		this.buf = [{ n: 'ldraw', v: 0 }]
	}
    resize() {
		this.canvas.width = innerWidth
		this.canvas.height = innerHeight
	}
    draw() {
		if (!this.#enabled)
			return
		var u = this.client.getOwnParticipant()
		u.y = Math.max(Math.min(100, u.y as number), 0)
		u.x = Math.max(Math.min(100, u.x as number), 0)
		var lastpos = [u.x, u.y]
		var b = new ArrayBuffer(4)
		var dv = new DataView(b)
		dv.setUint8(0, Math.round((u.x / 100) * 255))
		dv.setUint8(1, Math.round((u.y / 100) * 255))
		let poll = () => {
			if (!this.#enabled)
				return
			if (lastpos[0] != u.x || lastpos[1] != u.y) {
				u.y = Math.max(Math.min(100, u.y as number), 0)
				u.x = Math.max(Math.min(100, u.x as number), 0)
				dv.setUint8(2, Math.round((u.x / 100) * 255))
				dv.setUint8(3, Math.round((u.y / 100) * 255))
				var s = String.fromCharCode.apply(null, new Uint8Array(b))
				var clr = this.customColor || this.client.getOwnParticipant().color
				this.buf.push({ n: s, v: Math.min(this.brushSize, 5), d: parseInt(clr.slice(1), 16) })
				dv.setUint8(0, Math.round((u.x / 100) * 255))
				dv.setUint8(1, Math.round((u.y / 100) * 255))
				lastpos = [u.x, u.y]
				this.parseLine(s, clr, Math.min(this.brushSize, 5))
			}
			if (this.clicking) 
				requestAnimationFrame(poll)
		}
		requestAnimationFrame(poll)
	}
    parseLine(str: string, color: string, size: number) {
		if (!this.#enabled)
			return
		var vector = [0, 0, 0, 0, Date.now(), 1, color]
		var bytes = util.byte.stringToBytes(str)
		vector[0] = Math.round((((100 / 255) * bytes[0]) / 100) * innerWidth)
		vector[1] = Math.round((((100 / 255) * bytes[1]) / 100) * innerHeight)
		vector[2] = Math.round((((100 / 255) * bytes[2]) / 100) * innerWidth)
		vector[3] = Math.round((((100 / 255) * bytes[3]) / 100) * innerHeight)
		vector[5] = size
		this.lines.push(vector)
	}
    mkline(x: number, y: number, x2: number, y2: number, s: number, color: string) {
		if (!this.#enabled)
			return
		if (x < 0 || y < 0 || x2 < 0 || y2 < 0 || x > 255 || y > 255 || x2 > 255 || y2 > 255) return
		var b = new ArrayBuffer(4)
		var dv = new DataView(b)
		dv.setUint8(0, x)
		dv.setUint8(1, y)
		dv.setUint8(2, x2)
		dv.setUint8(3, y2)
		var str = String.fromCharCode.apply(null, new Uint8Array(b))
		var clr = color || this.customColor || this.client.getOwnParticipant().color
		this.buf.push({ n: str, v: Math.min(s || 1, 5), d: parseInt(clr.slice(1), 16) })
		this.parseLine(str, clr, Math.min(s || 1, 5))
	}
	toHtml(c: number) {
		let d = c.toString(16)
		return '#' + ('000000' + d).substring(d.length)
	}
    redraw() {
		if (!this.#enabled)
			return

		this.emit('refresh', Date.now())
	}
}
