// import: local classes
import { EventEmitter } from './EventEmitter.js'
import { BinaryTranslator } from './BinaryTranslator.js'
import { AsyncFunction } from '../modules/util.js'

// import: local interfaces
import type { Login } from '../interfaces/Login.js'
import type { IncomingMessageMap } from '../interfaces/IncomingMessageMap.js'
import type { OutgoingMessageMap } from '../interfaces/OutgoingMessageMap.js'
import type { AccountInfo } from '../interfaces/AccountInfo.js'
import type { UserPermissions } from '../interfaces/UserPermissions.js'

// code
WebSocket.prototype.send = new Proxy(WebSocket.prototype.send, {
    apply: (target, thisArg, args) => {
        if (typeof args[0] !== 'string') return target.apply(thisArg, args)
        if (localStorage.token && !args[0].startsWith(`[{"m":"hi"`)) args[0] = args[0].replaceAll(localStorage.token, '[REDACTED]')
        return target.apply(thisArg, args)
    }
})
let hiDB = [ // for servers that dont use the `b` event for antibot
    new URL('wss://mpp.lapishusky.dev'),
    new URL('wss://game.multiplayerpiano.com'),
    new URL('wss://piano.ourworldofpixels.com'),
    new URL('wss://multiplayerpianoserver.testaagml69.repl.co'),
    new URL('wss://mppfork.glitch.me'),
    new URL('wss://mpp.hri7566.info:8443')
]
let binDB = [
    new URL('wss://mpp.lapishusky.dev')
]
function validateJSON(str) {
    try {
        JSON.parse(str)
        return true
    } catch (e) {
        return false
    }
}
export class Client extends EventEmitter {
    translator: BinaryTranslator
    uri: string
    ws: WebSocket
    serverTimeOffset: number = 0
    user: any
    participantId: string
    channel: any
    ppl: Record<string, any> = {}
    connectionTime: number
    connectionAttempts: number = 0
    desiredChannelId: string
    desiredChannelSettings: any
    pingInterval: number
    canConnect: boolean = false
    noteBuffer: any[] = []
    noteBufferTime: number = 0
    noteFlushInterval: number
    permissions: any = {}
    '🐈': number = 0
    loginInfo: Login
    accountInfo: AccountInfo
    permissions: UserPermissions
    constructor(uri) {
        if (window.MPP && MPP.client) {
            throw new Error(
                'Running multiple clients in a single tab is not allowed due to abuse. Attempting to bypass this may result in an auto-ban!'
            )
        }
        super()
        this.translator = new BinaryTranslator()
        this.uri = uri
        this.bindEventListeners()

        this.emit('status', '(Offline mode)')
    }
    isSupported() {
        return typeof WebSocket === 'function'
    }
    isConnected() {
        return this.isSupported() && this.ws && this.ws.readyState === WebSocket.OPEN
    }
    isConnecting() {
        return this.isSupported() && this.ws && this.ws.readyState === WebSocket.CONNECTING
    }
    start() {
        this.canConnect = true
        if (!this.connectionTime) {
            this.connect()
        }
    }
    stop() {
        this.canConnect = false
        this.ws.close()
    }
    connect() {
        if (!this.canConnect || !this.isSupported() || this.isConnected() || this.isConnecting()) return
        let uri = new URL(this.uri)
        this.emit('status', 'Connecting...')
        if (typeof process !== 'undefined') {
            // nodejsicle
            this.ws = new WebSocket(this.uri, {
                origin: 'https://www.multiplayerpiano.com'
            })
        } else {
            // browseroni
            this.ws = new WebSocket(this.uri)
        }
        if (binDB.find(u => u.host === uri.host)) {
            this.ws.binaryType = 'arraybuffer'
        }
        this.ws.addEventListener('close', e => {
            this.translator.reset()
            this.user = undefined
            this.participantId = undefined
            this.channel = undefined
            this.setParticipants([])
            clearInterval(this.pingInterval)
            clearInterval(this.noteFlushInterval)
            this.emit('disconnect', e)
            this.emit('status', 'Offline mode')

            // reconnect!
            if (this.connectionTime) {
                this.connectionTime = undefined
                this.connectionAttempts = 0
            } else {
                ++this.connectionAttempts
            }
            var ms_lut = [50, 2500, 10000]
            var idx = this.connectionAttempts
            if (idx >= ms_lut.length) idx = ms_lut.length - 1
            var ms = ms_lut[idx]
            setTimeout(::this.connect, ms)
        })
        this.ws.addEventListener('error', e => {
            this.emit('wserror', e)
            this.ws.close() // this.ws.emit("close");
        })
        this.ws.addEventListener('open', e => {
            if (hiDB.find(u => u.href === uri.href)) {
                this.connectionTime = Date.now()
                this.sendArray([
                    {
                        m: 'hi', 
                        '🐈': this['🐈']++ || undefined 
                    }
                ]);
            }
            this.pingInterval = setInterval(::this.sendPing, 20000)
            this.noteBuffer = []
            this.noteBufferTime = 0
            this.noteFlushInterval = setInterval((() => {
                if (this.noteBufferTime && this.noteBuffer.length > 0) {
                    this.sendArray([
                        {
                            m: 'n',
                            t: this.noteBufferTime + this.serverTimeOffset,
                            n: this.noteBuffer
                        }
                    ])
                    this.noteBufferTime = 0
                    this.noteBuffer = []
                }
            }).bind(this), 200)

            this.emit('connect')
            this.emit('status', 'Joining channel...')
        })
        this.ws.addEventListener('message', async e => {
            var transmission = this.ws.binaryType === 'arraybuffer' ? this.translator.receive(e.data) : JSON.parse(e.data)
            for (var i = 0; i < transmission.length; i++) {
                var msg: IncomingMessageMap[keyof IncomingMessageMap] = transmission[i]
                this.emit(msg.m, msg)
            }
        })
    }
    setToken(token) {
        let uri = new URL(this.uri)
        if (localStorage.token && !validateJSON(localStorage.token)) {
            localStorage.token = JSON.stringify({
                [uri.href]: { default: token, current: token }
            })
        } else {
            let tokenObj = JSON.parse(localStorage.token)
            tokenObj[uri.href] = { default: tokenObj[uri.href]?.default ?? token, current: token }
            localStorage.token = JSON.stringify(tokenObj)
        }
    }
    bindEventListeners() {
        this.on('hi', msg => {
            let uri = new URL(this.uri)
            if (hiDB.find(u => u.href === uri.href)) {
                this.connectionTime = Date.now()
                this.user = msg.u;
                this.receiveServerTime(msg.t, msg.e || undefined);
                if (this.desiredChannelId) {
                    this.setChannel();
                }
                if (msg.token) {
                    if (localStorage.token && !validateJSON(localStorage.token)) {
                        localStorage.token = JSON.stringify({
                            [uri.href]: { default: msg.token, current: localStorage.token }
                        })
                    } else {
                        let tokenObj = JSON.parse(localStorage.token ?? '{}')
                        tokenObj[uri.href] = { default: msg.token }
                        localStorage.token = JSON.stringify(tokenObj)
                    }
                }
                if (msg.permissions) {
                    this.permissions = msg.permissions
                } else {
                    this.permissions = {}
                }
                if (msg.accountInfo) {
                    this.accountInfo = msg.accountInfo
                } else {
                    this.accountInfo = undefined
                }
            } else {
                this.connectionTime = Date.now()
                this.user = msg.u
                this.receiveServerTime(msg.t, msg.e || undefined)
                if (this.desiredChannelId) {
                    this.setChannel()
                }
                if (msg.token) {
                    if (localStorage.token && !validateJSON(localStorage.token)) {
                        localStorage.token = JSON.stringify({
                            [uri.href]: { default: msg.token, current: localStorage.token }
                        })
                    } else {
                        let tokenObj = JSON.parse(localStorage.token ?? '{}')
                        tokenObj[uri.href] = { default: msg.token }
                        localStorage.token = JSON.stringify(tokenObj)
                    }
                }
                if (msg.permissions) {
                    this.permissions = msg.permissions
                } else {
                    this.permissions = {}
                }
                if (msg.accountInfo) {
                    this.accountInfo = msg.accountInfo
                } else {
                    this.accountInfo = undefined
                }
            }   
        })
        this.on('t', msg => {
            this.receiveServerTime(msg.t, msg.e || undefined)
        })
        this.on('ch', msg => {
            this.desiredChannelId = msg.ch._id
            this.desiredChannelSettings = msg.ch.settings
            this.channel = msg.ch
            if (msg.p) this.participantId = msg.p
            this.setParticipants(msg.ppl)
        })
        this.on('p', msg => {
            this.participantUpdate(msg)
            this.emit('participant update', this.findParticipantById(msg.id))
        })
        this.on('m', msg => {
            if (this.ppl.hasOwnProperty(msg.id)) {
                this.participantMoveMouse(msg)
            }
        })
        this.on('bye', msg => {
            this.removeParticipant(msg.p)
        })
        this.on('b', async msg => {
            let uri = new URL(this.uri)
            var hiMsg = { m: 'hi' }
            hiMsg['🐈'] = this['🐈']++ || undefined
            if (this.loginInfo) hiMsg.login = this.loginInfo
            this.loginInfo = undefined
            // adding commit: "fix: support Async antibots"                          
            try {
                if (!msg.code)
                    return
                if (msg.code.startsWith('~')) {
                    hiMsg.code = await AsyncFunction(msg.code.substring(1))()
                } else {
                    hiMsg.code = await AsyncFunction(msg.code)()
                }
                console.log(`Check hash succesfully generated! - %c${hiMsg.code}`, `
                    color: #00ffff;   
                    font-style: italic 
                `)
            } catch (err) {
                // adding commit: "don't send broken, send the actual error instead"
                let errStr = '';
                if (err && typeof err === 'object') {
                    errStr = (err.stack || err.message || JSON.stringify(err));
                } else {
                    errStr = String(err);
                }
                hiMsg.code = errStr;
                console.log(`An error has occured in the code that generates the check hash! - %c${errStr}\nThe websocket will now close.`, `
                    color: #ff4848;
                    font-style: italic
                `)
                this.ws.close()
            }
            if (localStorage.token && validateJSON(localStorage.token)) {
                let tokenObj = JSON.parse(localStorage.token)
                hiMsg.token = tokenObj[uri.href]?.current ?? tokenObj[uri.href]?.default
            }
            this.sendArray([hiMsg])
        })
    }
    send(raw) {
        if (this.isConnected()) this.ws.send(raw)
    }
    sendArray(arr: OutgoingMessageMap[keyof OutgoingMessageMap][]) {
        this.isConnected() && this.ws.binaryType === 'arraybuffer' ? this.send(this.translator.send(arr)) : this.send(JSON.stringify(arr))
    }
    setChannel(id, set) {
        this.desiredChannelId = id || this.desiredChannelId || 'lobby'
        this.desiredChannelSettings = set || this.desiredChannelSettings || undefined
        this.sendArray([{ m: 'ch', _id: this.desiredChannelId, set: this.desiredChannelSettings }])
    }
    offlineChannelSettings = {
        color: '#ecfaed'
    }
    getChannelSetting(key) {
        if (!this.isConnected() || !this.channel || !this.channel.settings) {
            return this.offlineChannelSettings[key]
        }
        return this.channel.settings[key]
    }
    setChannelSettings(settings) {
        if (!this.isConnected() || !this.channel || !this.channel.settings) {
            return
        }
        if (this.desiredChannelSettings) {
            for (var key in settings) {
                this.desiredChannelSettings[key] = settings[key]
            }
            this.sendArray([{ m: 'chset', set: this.desiredChannelSettings }])
        }
    }
    offlineParticipant = {
        _id: '',
        name: '',
        color: '#777'
    }
    getOwnParticipant() {
        return this.findParticipantById(this.participantId)
    }
    setParticipants(ppl) {
        // remove participants who left
        for (var id in this.ppl) {
            if (!this.ppl.hasOwnProperty(id)) continue
            var found = false
            for (var j = 0; j < ppl.length; j++) {
                if (ppl[j].id === id) {
                    found = true
                    break
                }
            }
            if (!found) {
                this.removeParticipant(id)
            }
        }
        // update all
        for (var i = 0; i < ppl.length; i++) {
            this.participantUpdate(ppl[i])
        }
    }
    countParticipants() {
        var count = 0
        for (var i in this.ppl) {
            if (this.ppl.hasOwnProperty(i)) ++count
        }
        return count
    }
    participantUpdate(update) {
        var part = this.ppl[update.id] || null
        if (part === null) {
            part = update
            this.ppl[part.id] = part
            this.emit('participant added', part)
            this.emit('count', this.countParticipants())
        } else {
            Object.keys(update).forEach((key) => {
                part[key] = update[key]
            })
            if (!update.tag) delete part.tag
            if (!update.vanished) delete part.vanished
        }
    }
    participantMoveMouse(update) {
        var part = this.ppl[update.id] || null
        if (part !== null) {
            part.x = update.x
            part.y = update.y
        }
    }
    removeParticipant(id) {
        if (this.ppl.hasOwnProperty(id)) {
            var part = this.ppl[id]
            delete this.ppl[id]
            this.emit('participant removed', part)
            this.emit('count', this.countParticipants())
        }
    }
    findParticipantById(id) {
        return this.ppl[id] || this.offlineParticipant
    }
    isOwner() {
        return this.channel && this.channel.crown && this.channel.crown.participantId === this.participantId
    }
    preventsPlaying() {
        return (
            this.isConnected() &&
            !this.isOwner() &&
            this.getChannelSetting('crownsolo') === true &&
            !this.permissions.playNotesAnywhere
        )
    }
    receiveServerTime(time, echo) {
        var now = Date.now()
        var target = time - now
        // console.log("Target serverTimeOffset: " + target);
        var duration = 1000
        var step = 0
        var steps = 50
        var step_ms = duration / steps
        var difference = target - this.serverTimeOffset
        var inc = difference / steps
        var iv
        iv = setInterval((() => {
            this.serverTimeOffset += inc
            if (++step >= steps) {
                clearInterval(iv)
                // console.log("serverTimeOffset reached: " + this.serverTimeOffset);
                this.serverTimeOffset = target
            }
        }).bind(this), step_ms)
        // smoothen

        // this.serverTimeOffset = time - now;            // mostly time zone offset ... also the lags so todo smoothen this
        // not smooth:
        // if(echo) this.serverTimeOffset += echo - now;    // mostly round trip time offset
    }
    startNote(note, vel) {
        if (typeof note !== 'string') return
        if (this.isConnected()) {
            var vel = typeof vel === 'undefined' ? undefined : +vel.toFixed(3)
            if (!this.noteBufferTime) {
                this.noteBufferTime = Date.now()
                this.noteBuffer.push({ n: note, v: vel })
            } else {
                this.noteBuffer.push({
                    d: Date.now() - this.noteBufferTime,
                    n: note,
                    v: vel
                })
            }
        }
    }
    stopNote(note) {
        if (typeof note !== 'string') return
        if (this.isConnected()) {
            if (!this.noteBufferTime) {
                this.noteBufferTime = Date.now()
                this.noteBuffer.push({ n: note, s: 1 })
            } else {
                this.noteBuffer.push({
                    d: Date.now() - this.noteBufferTime,
                    n: note,
                    s: 1
                })
            }
        }
    }
    sendPing() {
        var msg = { m: 't', e: Date.now() }
        this.sendArray([msg])
    }
    setLoginInfo(loginInfo) {
        this.loginInfo = loginInfo
    }
    on<K extends keyof IncomingMessageMap>(
        en: K,
        fn: (msg: IncomingMessageMap[K]) => any
    ): this {
        super.on(en, fn)
        return this
    }
    emit(en: string, data: any): boolean {
        try {
            super.emit(en, data)
            return true
        } catch (err) {
            return false
        }
    }
    off<K extends keyof IncomingMessageMap>(
        en: K,
        fn: (msg: IncomingMessageMap[K]) => any
    ): this {
        super.off(en, fn)
        return this
    }
}