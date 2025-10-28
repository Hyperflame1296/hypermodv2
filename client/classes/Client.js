/** @format */

WebSocket.prototype.send = new Proxy(WebSocket.prototype.send, {
    apply: (target, thisArg, args) => {
        if (typeof args[0] !== 'string') return target.apply(thisArg, args)
        if (localStorage.token && !args[0].startsWith(`[{"m":"hi"`)) args[0] = args[0].replace(localStorage.token, '[REDACTED]')
        return target.apply(thisArg, args)
    }
})
let hiDB = [
    new URL('wss://mpp.lapishusky.dev')
]
let binDB = [
    new URL('wss://mpp.lapishusky.dev')
]
class Client extends EventEmitter {
    constructor(uri) {
        if (window.MPP && MPP.client) {
            throw new Error(
                'Running multiple clients in a single tab is not allowed due to abuse. Attempting to bypass this may result in an auto-ban!'
            )
        }
        super()
        this.translator = new BinaryTranslator()
        this.uri = uri
        this.ws = undefined
        this.serverTimeOffset = 0
        this.user = undefined
        this.participantId = undefined
        this.channel = undefined
        this.ppl = {}
        this.connectionTime = undefined
        this.connectionAttempts = 0
        this.desiredChannelId = undefined
        this.desiredChannelSettings = undefined
        this.pingInterval = undefined
        this.canConnect = false
        this.noteBuffer = []
        this.noteBufferTime = 0
        this.noteFlushInterval = undefined
        this.permissions = {}
        this['🐈'] = 0
        this.loginInfo = undefined

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
        if (typeof module !== 'undefined') {
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
            setTimeout(this.connect.bind(this), ms)
        })
        this.ws.addEventListener('error', e => {
            this.emit('wserror', e)
            this.ws.close() // this.ws.emit("close");
        })
        this.ws.addEventListener('open', e => {
            this.connectionTime = Date.now()
            if (hiDB.find(u => u.host === uri.host)) {
                this.sendArray([
                    {
                        m: 'hi', 
                        '🐈': this['🐈']++ || undefined 
                    }
                ]);
            }
            this.pingInterval = setInterval(this.sendPing.bind(this), 20000)
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
                var msg = transmission[i]
                this.emit(msg.m, msg)
            }
        })
    }
    bindEventListeners() {
        let uri = new URL(this.uri)
        this.on('hi', msg => {
            if (hiDB.find(u => u.host === uri.host)) {
                this.connectionTime = Date.now()
                this.user = msg.u;
                this.receiveServerTime(msg.t, msg.e || undefined);
                if (this.desiredChannelId) {
                    this.setChannel();
                }
                if (msg.token) localStorage.token = msg.token
            } else {
                this.connectionTime = Date.now()
                this.user = msg.u
                this.receiveServerTime(msg.t, msg.e || undefined)
                if (this.desiredChannelId) {
                    this.setChannel()
                }
                if (msg.token) localStorage.token = msg.token
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
            var hiMsg = { m: 'hi' }
            hiMsg['🐈'] = self['🐈']++ || undefined
            if (this.loginInfo) hiMsg.login = this.loginInfo
            this.loginInfo = undefined
            // adding commit: "fix: support Async antibots"                          
            try {
                if (msg.code.startsWith('~')) {
                    hiMsg.code = await AsyncFunction(msg.code.substring(1))()
                } else {
                    hiMsg.code = await AsyncFunction(msg.code)()
                }
            } catch (err) {
                // adding commit: "don't send broken, send the actual error instead"
                hiMsg.code = 'broken';
                let errStr = '';
                if (err && typeof err === 'object') {
                    errStr = (err.stack || err.message || JSON.stringify(err));
                } else {
                    errStr = String(err);
                }
                hiMsg.code = errStr;
            }
            if (localStorage.token) {
                hiMsg.token = localStorage.token
            }
            this.sendArray([hiMsg])
        })
    }
    send(raw) {
        if (this.isConnected()) this.ws.send(raw)
    }
    sendArray(arr) {
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
}
if (typeof module !== 'undefined') {
    module.exports = Client
} else {
    globalThis.Client = Client
}
