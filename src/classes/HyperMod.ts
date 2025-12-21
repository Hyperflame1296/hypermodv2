// import: local classes
import { Player } from './Player.js'
import { NPSTracker } from './NPSTracker.js'

// code
declare let MPP: any
export class HyperMod {
    ui: Record<string, string> = {}
    locations: Record<string, string> = {}
    bindings: Object = {}
    styles: string = ''
    fileData: Map<string, ArrayBuffer> = new Map
    fpsHist: number[] = new Array
    player: Player = new Player
    npsTracker: NPSTracker = new NPSTracker
    currentFile: string
    version: string = 'v0.2.0.79'
    defaultSettings = {
        // MPP section
        forceInfNoteQuota: true,
        disableAudioEngine: false,
        trackNPS: false,
        sendNotifications: true,
        showUsersWhenTyping: true,
        connectUrl: 'wss://mppclone.com',
        autoCrown: true,
        showChatCommands: true,
        messageBlur: true,
        hyperModAudioEngine: false,
        enableRelease: false,
        // MIDI I/O section
        midiOutputVelocityThreshold: 0,
        // Player section
        enableClientSidePlayback: false,
        enableChannelColors: true,
        excludeDrumChannel: true,
        // Optimizations section
        removeWorkerTimer: true,
        removeNameBouncing: true,
        removeNoteBouncing: true,
        removeKeyShadows: true,
        removeKeyGradients: false,
        removeKeyFade: true,
        enableBufferedBlips: false,
        enableBlipLimit: true,
        blipLimit: 8,
        // Visuals section
        removeHyperModText: false,
        removeRainbowGraphics: false,
        canvasUiOpacity: 1,
        enableFpsGraph: true,
        fpsCalculationInterval: 125,
        enableNoteVisualizer: false,
        noteVisualizerInterval: 125,
        enableNoteColors: true,
        // Customization section
        customization: {
            chatBlurAmount: 3, // in pixels
            nameDivRoundness: 2, // in pixels
            cursorDivRoundness: 3, // in pixels
            buttonRoundness: 2, // in pixels
        }
    }
    settings = structuredClone(this.defaultSettings)
    lsSettings = structuredClone(this.defaultSettings)
    channelColors = [
        '#ff0000',
        '#ff8800',
        '#ffff00',
        '#88ff00',
        '#00ff00',
        '#00ff44',
        '#00ff88',
        '#00ffbb',
        '#00ffff',
        '#0088ff',
        '#0000ff',
        '#8800ff',
        '#ff00ff',
        '#ff00bb',
        '#ff0088',
        '#ff0044',
    ]
    canvas: HTMLCanvasElement = document.createElement('canvas')
    ctx: CanvasRenderingContext2D = this.canvas?.getContext('2d')
    now: number = performance.now()
    frames: number = 0
    fps: number = 0
    lastTime: number = performance.now()
    prefix: string = '$'
    messageLoop: number
    hasFileDialogOpen: boolean = false
    hasMenuOpen: boolean = false
    canvasBoxHeight: number = 150
    topOfPiano: number = null
    ping: number = 0
    hsvHex: string = '#000000'
    get tag_log() {
        if (this.lsSettings.showChatCommands ?? true)
            return `[HyperMod ${this.version}] - `
        else
            return ''
    }
    get tag_success() { 
        if (this.lsSettings.showChatCommands ?? true)
            return `[HyperMod ${this.version}] - [✅] - ` 
        else
            return '[✅] » '
    }
    get tag_warn() { 
        if (this.lsSettings.showChatCommands ?? true)
            return `[HyperMod ${this.version}] - [🟨] - ` 
        else
            return '[🟨] » '
    }
    get tag_error() { 
        if (this.lsSettings.showChatCommands ?? true)
            return `[HyperMod ${this.version}] - [❌] - ` 
        else
            return '[❌] » '
    }
    commands = [
        {
            name: 'help',
            description: 'Show all commands.',
            syntax: `${this.prefix}help [command]`,
            func: (a, msg) => {
                let b = a[0]?.trim() ?? '',
                    c = a[1]?.trim() ?? ''

                if (c === '') {
                    let initial = this.tag_success + 'Commands: '
                    for (let command of this.commands) {
                        initial += `\`${command.name}\`${this.commands.indexOf(command) + 1 === this.commands.length ? '' : ', '}`
                    }
                    this.sendMessage(initial)
                } else {
                    let command = this.commands.find(a => a.name === c.replace(this.prefix, ''))
                    if (!command)
                        return this.sendMessage(this.tag_error + `No such command \`${c}\``)
                    this.sendMessage(this.tag_success + `\`\`\`${command.name}\`\`\` - *${command.description}*`)
                    this.sendMessage(this.tag_success + `Syntax: \`\`\`${command.syntax}\`\`\``)
                }
            }
        },
        {
            name: 'js',
            description: 'Evaluates JavaScript code.',
            syntax: `${this.prefix}js [command]`,
            func: (a, msg) => {
                let input = a.slice(1).join(' ').trim()
                this.evalCode(input).then(res => {
                    let str = 'unknown type'
                    switch (typeof res) {
                        case 'number':
                        case 'function':
                        case 'symbol':
                            str = res.toString()
                            break
                        case 'bigint':
                            str = res.toString() + 'n'
                            break
                        case 'string':
                            str = res
                            break
                        case 'boolean':
                            str = res ? 'true' : 'false'
                            break
                        case 'object':
                            str = JSON.stringify(res)
                            break
                        case 'undefined':
                            str = 'undefined'
                            break
                        default:
                            str = 'unknown type'
                            break
                    }
                    this.sendMessage(`[✅] » \`${str}\``)
                }).catch(err => {
                    this.sendMessage(`[❌] » \`${err}\``)
                })
            }
        },
        {
            name: 'play',
            description: 'Play a MIDI from the MIDI list.',
            syntax: `${this.prefix}play [midi]`,
            func: async(a, msg) => {
                let input = a.slice(1).join(' ').trim()
                switch (input) {
                    case '':
                        if (this.player.tracksParsed !== 0) {
                            this.playMIDI()
                            return this.sendMessage(this.tag_success + `Resumed the current MIDI.`)
                        } else
                            return this.sendMessage(this.tag_error   + `Specify a MIDI to play.`)
                        break
                    case 'random':
                        if (this.fileData.size == 0)
                            return this.sendMessage(this.tag_error + `You need to add a MIDI first. Use the HyperMod UI for this.`)
                        let fn = Array.from(this.fileData.keys())[Math.floor(Math.random() * this.fileData.size)]
                        this.sendMessage(this.tag_success + `Loading MIDI \`\`\`${fn}\`\`\`...`)
                        await this.loadMIDI(fn)
                        this.updateFileList()
                        this.sendMessage(this.tag_success + `Now playing: \`\`\`${fn}\`\`\` | \`${this.player.totalEvents.toLocaleString()}\` event${this.player.totalEvents !== 1 ? 's' : ''} loaded!`)
                        if (this.lsSettings.enableClientSidePlayback)
                            this.sendMessage(this.tag_log + `Client-side playback is on. This MIDI will only be heard on your end.`)
                        this.playMIDI()
                        break
                    default:
                        if (!this.fileData.has(input) && !this.fileData.has(input + '.mid'))
                            return this.sendMessage(this.tag_error + `There\'s no MIDI in the file list named \`\`\`${input}\`\`\`!`)
                        this.sendMessage(this.tag_success + `Loading MIDI \`\`\`${input}\`\`\`...`)
                        await this.loadMIDI(this.fileData.has(input) ? input : input + '.mid')
                        this.updateFileList()
                        this.sendMessage(this.tag_success + `Now playing: \`\`\`${input}\`\`\` | \`${this.player.totalEvents.toLocaleString()}\` event${this.player.totalEvents !== 1 ? 's' : ''} loaded!`)
                        if (this.lsSettings.enableClientSidePlayback)
                            this.sendMessage(this.tag_log + `Client-side playback is on. This MIDI will only be heard on your end.`)
                        this.playMIDI()
                        break
                }
            }
        },
        {
            name: 'load',
            description: 'Load a MIDI from the MIDI list.',
            syntax: `${this.prefix}load [midi]`,
            func: async(a, msg) => {
                let input = a.slice(1).join(' ').trim()
                switch (input) {
                    case '':
                        return this.sendMessage(this.tag_error + `Specify a MIDI to load.`)
                        break
                    case 'random':
                        if (this.fileData.size == 0)
                            return this.sendMessage(this.tag_error + `You need to add a MIDI first. Use the HyperMod UI for this.`)
                        let fn = Array.from(this.fileData.keys())[Math.floor(Math.random() * this.fileData.size)]
                        this.sendMessage(this.tag_success + `Loading MIDI \`\`\`${fn}\`\`\`...`)
                        await this.loadMIDI(fn)
                        this.updateFileList()
                        this.sendMessage(this.tag_success + `Loaded MIDI: \`\`\`${fn}\`\`\` | \`${this.player.totalEvents.toLocaleString()}\` event${this.player.totalEvents !== 1 ? 's' : ''} loaded!`)
                        break
                    default:
                        if (!this.fileData.has(input) && !this.fileData.has(input + '.mid'))
                            return this.sendMessage(this.tag_error + `There\'s no MIDI in the file list named \`\`\`${input}\`\`\`!`)
                        this.sendMessage(this.tag_success + `Loading MIDI \`\`\`${input}\`\`\`...`)
                        await this.loadMIDI(this.fileData.has(input) ? input : input + '.mid')
                        this.updateFileList()
                        this.sendMessage(this.tag_success + `Loaded MIDI: \`\`\`${input}\`\`\` | \`${this.player.totalEvents.toLocaleString()}\` event${this.player.totalEvents !== 1 ? 's' : ''} loaded!`)
                        break
                }
            }
        },
        {
            name: 'pause',
            description: 'Pause the currently playing MIDI.',
            syntax: `${this.prefix}pause`,
            func: () => {
                if (!this.player.isPlaying)
                    return this.sendMessage(this.tag_error + `No MIDI is currently playing!`)
                this.pauseMIDI()
                this.sendMessage(this.tag_success + `Paused the current MIDI.`)
            }
        },
        {
            name: 'stop',
            description: 'Stop playing the current MIDI.',
            syntax: `${this.prefix}stop`,
            func: () => {
                this.stopMIDI()
                this.sendMessage(this.tag_success + `Stopped playing.`)
            }
        }
    ]
    visualizer = {
        visibleNotes: [],
        noteOn(note, participant, t = Date.now()) {
            this.visibleNotes.push({
                n: note,
                c: participant?.color ?? '#777777',
                t: performance.now() * 0.001
            })
        },
        noteOff(note, t = Date.now()) {
            let n = this.visibleNotes.findLast(n => n.n === note && n.l === undefined)
            if (!n)
                return
            n.l = (performance.now() * 0.001) - n.t
        }
    }
    constructor() {
        if (typeof MPP !== 'undefined' && MPP.addons?.hyperMod)
            throw Error(`no...`)

        this.loadUI()
        this.getSettings()
        this.updateSettings()
        this.updateFileList()
        this.messageLoop = setInterval(() => {
            if (typeof MPP === 'undefined')
                return
            if (
                this.lsSettings.autoCrown && 
                MPP.client.channel && 
                MPP.client.channel.crown &&
                !MPP.client.channel.crown.participantId && 
                Date.now() - MPP.client.channel.crown.time >= 14800
            ) {
                MPP.client.sendArray([{
                    m: 'chown',
                    id: MPP.client.participantId
                }])
            }
        }, 5)
        for (let setting in this.lsSettings.customization) {
            this.applyCustomizationSetting(setting)
        }
        $(this.canvas).addClass('hypermod')
        let keys = ['a-1', 'as-1', 'b-1', 'c0', 'cs0', 'd0', 'ds0', 'e0', 'f0', 'fs0', 'g0', 'gs0', 'a0', 'as0', 'b0', 'c1', 'cs1', 'd1', 'ds1', 'e1', 'f1', 'fs1', 'g1', 'gs1', 'a1', 'as1', 'b1', 'c2', 'cs2', 'd2', 'ds2', 'e2', 'f2', 'fs2', 'g2', 'gs2', 'a2', 'as2', 'b2', 'c3', 'cs3', 'd3', 'ds3', 'e3', 'f3', 'fs3', 'g3', 'gs3', 'a3', 'as3', 'b3', 'c4', 'cs4', 'd4', 'ds4', 'e4', 'f4', 'fs4', 'g4', 'gs4', 'a4', 'as4', 'b4', 'c5', 'cs5', 'd5', 'ds5', 'e5', 'f5', 'fs5', 'g5', 'gs5', 'a5', 'as5', 'b5', 'c6', 'cs6', 'd6', 'ds6', 'e6', 'f6', 'fs6', 'g6', 'gs6', 'a6', 'as6', 'b6', 'c7']
        let p = typeof MPP !== 'undefined' ? { ...MPP.client.getOwnParticipant() } : undefined
        this.player.on('midiEvent', e => {
            if (typeof MPP === 'undefined') 
                return
            let note
            let ch = (e.channel ?? 0) % 16
            if (!p) p = { ...MPP.client.getOwnParticipant() }
            if (this.lsSettings.enableChannelColors)
                p.color = this.channelColors[ch]
            if (e.channel == 9 && (this.lsSettings.excludeDrumChannel ?? true))
                return
            switch (e.type) {
                case 0x08:
                case 0x09: // note event
                    note = keys[e.note - 21]
                    if (!note)
                        return
                    if (e.velocity == 0 || e.type == 0x08) {
                        if (this.lsSettings.enableClientSidePlayback ?? false) {
                            MPP.piano.stop(note, p)
                        } else {
                            if (!MPP.noteQuota.spend(1)) return
                            MPP.piano.stop(note, p)
                            MPP.client.stopNote(note)
                        }
                    } else {
                        if (this.lsSettings.enableClientSidePlayback ?? false) {
                            MPP.piano.play(note, e.velocity / 127, p)
                        } else {
                            if (!MPP.noteQuota.spend(1)) return
                            MPP.piano.play(note, e.velocity / 127, p)
                            MPP.client.startNote(note, e.velocity / 127)
                        }
                    }
                    break
            }
        })
        let lastMargin = $('div#piano')[0].style.marginTop
        let observer = new MutationObserver((mutations) => {
            let newMargin = $('div#piano')[0].style.marginTop
            if (newMargin !== lastMargin)
                this.topOfPiano = parseInt($('div#piano')[0].style.marginTop.replace('px', '')) - (this.canvasBoxHeight + 50)
        })
        observer.observe($('div#piano')[0], { attributes: true, attributeFilter: ['style', 'class'] });
        let loop = () => {
            this.canvasUpdate()
            requestAnimationFrame(loop)
        }
        loop()
    }
    evalCode(a) {
        return new Promise((resolve, reject) => {
            try {
                let res = eval(a)
                resolve(res)
            } catch (err) {
                reject(err)
            }
        })
    }
    sendMessage(msg) {
        if (typeof MPP === 'undefined')
            return false
        if (!(this.lsSettings.showChatCommands ?? true) || !MPP.client.isConnected()) {
            let hue = (performance.now() / 8) % 1
            MPP.chat.receive({
                m: 'a',
                a: msg,
                p: {
                    _id: '000000000000000000000000',
                     id: '000000000000000000000000',
                    color: this.hsvHex,
                    name: `HyperMod ${this.version}`
                },
                t: Date.now()
            })
        } else
            MPP.chat.send(msg)
        return true
    }
    receiveMessage(msg) {
        if (typeof MPP === 'undefined')
            return
        if (msg.p._id !== MPP.client.getOwnParticipant()._id) // use `getOwnParticipant` to allow for offline commands
            return

        let a = msg.a?.trim().split(' ') ?? [],
            b = a[0]?.trim() ?? '',
            c = a[1]?.trim() ?? ''

        if (b.startsWith(this.prefix) && b !== this.prefix) {
            try {
                let command = this.commands.find(c => c.name === b.replace(this.prefix, ''))
                if (!command)
                    return this.sendMessage(this.tag_error + `No such command \`${b}\``)

                command.func(a, msg)
            } catch (err) {
                this.sendMessage(this.tag_error + `${err}`)
            }
        }
    }
    canvasUpdate() {
        this.canvas.width = innerWidth
        this.canvas.height = innerHeight
        //if (this.topOfPiano === null && performance.now() > 1000)
        //    this.topOfPiano = parseInt($('div#piano')[0].style.marginTop) - (this.canvasBoxHeight + 50)
        let hyperModButton = $('div.ugly-button#hypermod-btn')
        let buttonHue = (performance.now() / 8) % 360
        if (!(this.lsSettings.removeRainbowGraphics ?? false))
            hyperModButton.css({
                'border-color': `hsl(${buttonHue}, 100%, 90%)`
            })
        this.ctx.globalAlpha = this.lsSettings.canvasUiOpacity ?? 1.0
        this.ctx.font = '30px monospace'
        this.ctx.fillStyle = !(this.lsSettings.removeRainbowGraphics ?? false) ? `hsl(${buttonHue}, 100%, 90%)` : '#fff'
        this.hsvHex = this.ctx.fillStyle
        this.ctx.lineWidth = 2
        this.ctx.strokeStyle = '#fff'
        if (!(this.lsSettings.removeHyperModText ?? false)) {
            this.ctx.textAlign = 'center'
            this.ctx.fillText('HyperMod v2', this.canvas.width / 2, 130)
            this.ctx.fillStyle = '#ffffff6b'
            this.ctx.font = 'italic 20px monospace'
            this.ctx.fillText(`(${this.version})`, this.canvas.width / 2, 160)
            this.ctx.font = '30px monospace'
            this.ctx.fillStyle = !(this.lsSettings.removeRainbowGraphics ?? false) ? this.hsvHex : '#fff'
        }
        this.ctx.font = '20px monospace'
        this.ctx.textAlign = 'right'
        this.ctx.fillText(`${(this.fps ?? 0).toFixed(1)} FPS`, this.canvas.width - 20, this.canvas.height - 100)
        if (this.lsSettings.trackNPS ?? false)
            this.ctx.fillText(`${(this.npsTracker?.getNPS() ?? 0).toFixed(1)} NPS`, this.canvas.width - 20, this.canvas.height - 120)
        this.frames++;
        this.now = performance.now();
        if (this.lsSettings.enableFpsGraph ?? true) {
            let w = 300
            let h = this.canvasBoxHeight
            let sx = 100
            let sy = this.topOfPiano ?? 316
            for (let i = 0; i < this.fpsHist.length; i++) {
                let f = this.fpsHist[i]
                let h = (f / Math.max(...this.fpsHist)) * 150
                let x = sx + i
                let y = (sy + 150) - h
                this.ctx.fillRect(x, y, 1, h)
            }
            this.ctx.strokeRect(sx, sy, w, h)
        }
        if (this.lsSettings.enableNoteVisualizer ?? false) {
            this.ctx.save()
            let lastCol = null
            let w = 300
            let h = this.canvasBoxHeight
            let sx = this.canvas.width - w - 100
            let sy = this.topOfPiano ?? 316
            let t = performance.now() * 0.001
            this.ctx.beginPath()
            this.ctx.rect(sx, sy, w, h)
            this.ctx.clip()
            for (let i = this.visualizer.visibleNotes.length - 1; i >= 0; i--) {
                let note = this.visualizer.visibleNotes[i]
                let x = sx + w - ((t - note.t) * this.lsSettings.noteVisualizerInterval)
                let nh = h / 88
                let y = sy + (88 - note.n) * nh
                if (note.l === undefined && (t - note.t) > 3)
                    note.l = 3
                let nw = (note.l ?? (t - note.t)) * this.lsSettings.noteVisualizerInterval
                if (x + nw < sx) {
                    this.visualizer.visibleNotes.splice(i, 1)
                    continue
                }
                if (note.c !== lastCol) {
                    this.ctx.fillStyle = note.c
                    lastCol = note.c
                }
                this.ctx.fillRect(x, y, nw, nh)
            }
            this.ctx.closePath()
            this.ctx.restore()
            this.ctx.strokeRect(sx, sy, w, h)
        }
        let now = performance.now()
        if (now - this.lastTime >= (this.lsSettings.fpsCalculationInterval ?? 125)) {
            this.fps = (this.frames * 1000) / (now - this.lastTime);
            this.frames = 0;
            this.lastTime = now;
            if (this.fpsHist.length >= 300)
                this.fpsHist.shift()
            this.fpsHist.push(this.fps)
        }
    }
    async loadMIDI(fn) {
        let data = this.fileData.get(fn)
        if (!data)
            throw new Error(`There is no MIDI named \'${fn}\' loaded into HyperMod.`)
        if (this.currentFile === fn)
            return false
        this.currentFile = fn
        return await this.player.loadArrayBuffer(data)
    }
    async loadMIDIurl(uri) {
        let url = new URL(uri)
        let file = await fetch(url)
        let data = await file.arrayBuffer()
        return await this.player.loadArrayBuffer(data)
    }
    unloadMIDI() {
        this.player
        this.player.unload()
        this.currentFile = undefined
        this.updateFileList()
    }
    playMIDI() {
        if (this.player.isPlaying)
            return
        
        this.player.play()
    }
    pauseMIDI() {
        if (!this.player.isPlaying)
            return

        this.player.pause()
    }
    stopMIDI() {
        if (!this.player.isPlaying)
            return

        this.player.stop()
    }
    resetSettings() {
        localStorage['hm.settings'] = JSON.stringify(this.defaultSettings)
        this.lsSettings = structuredClone(this.defaultSettings)
    }
    updateSettings() {
        this.lsSettings = structuredClone(this.settings)
        localStorage['hm.settings'] = JSON.stringify(this.settings)
    }
    getSettings() {
        this.settings = localStorage['hm.settings'] ? JSON.parse(localStorage['hm.settings']) : this.defaultSettings
        this.lsSettings = structuredClone(this.settings)
    }
    applyCustomizationSetting(setting) {
        if (!(setting in this.lsSettings.customization))
            return
        let currentValue = getComputedStyle(document.documentElement)
            .getPropertyValue(`--${setting}`)
            .trim();
        let suffix = ''
        if (currentValue.endsWith('px')) suffix = 'px'
        if (currentValue.endsWith('pt')) suffix = 'pt'
        if (currentValue.endsWith('vw')) suffix = 'vw'
        if (currentValue.endsWith('vh')) suffix = 'vh'
        $('html').css(`--${setting}`, this.lsSettings.customization[setting] + suffix);
    }
    updateFileList() {
        let list = $('ul.hypermod#files')
        list.empty()
        if (!this.currentFile || this.fileData.size <= 0)
            $('.hypermod#midi-controls').addClass('inactive')
        else
            $('.hypermod#midi-controls').removeClass('inactive')
        if (this.fileData.size <= 0)
            return list.html(`<i class='hypermod' style='color: darkgray'>(none)</i>`)

        for (let key of this.fileData.keys()) {
            let li = document.createElement('li')
            let p = document.createElement('p')
            let load = key === this.currentFile ? document.createElement('p') : document.createElement('a')
            let del = document.createElement('a')
            $(li).addClass('hypermod hm-inline')
            $(p).addClass('hypermod')
            $(p).html(key)
            $(p).attr('title', 'File name.')
            key !== this.currentFile ? $(load).addClass('hypermod hm-link') : $(load).addClass('hypermod')
            $(load).html(key === this.currentFile ? '<i style=\'color: darkgray\'>Loaded</i>' : 'Load')
            $(load).attr('title', key === this.currentFile ? 'This MIDI is currently loaded.' : 'Load this MIDI.')
            $(load).attr('data-file', key)
            $(load).attr('id', 'load-file-link')
            key === this.currentFile ? $(del).css({ 'margin-left': '20px' }) : void 0
            $(del).addClass('hypermod hm-link')
            $(del).attr('title', 'Remove this MIDI from the list.')
            $(del).html('Delete')
            $(del).attr('data-file', key)
            $(del).attr('id', 'delete-file-link')
            if (key !== this.currentFile)
                $(load).on('click', async e => {
                    let g = e.target
                    if (!g.dataset.file)
                        return
                    let playing = this.player.isPlaying
                    await this.loadMIDI(g.dataset.file)
                    if (playing)
                        this.playMIDI()
                    this.updateFileList()
                })
            $(del).on('click', async e => {
                let g = e.target
                if (!g.dataset.file)
                    return

                this.fileData.delete(g.dataset.file)
                if (this.currentFile === g.dataset.file)
                    this.unloadMIDI()
                this.updateFileList()
            })
            $(li).append(p)
            $(li).append(load)
            $(li).append(del)
            list.append(li)
        }
    }
    async openMIDIDialog() {
        return new Promise((resolve, reject) => {
            let input = document.createElement('input');
            input.type = 'file', input.accept = '.mid'
            input.multiple = true
            this.hasFileDialogOpen = true
            $(input).on('change', async e => {
                try {
                    for (let file of e.target.files) {
                        if (!file) continue;
                        this.fileData.set(file.name,  await file.arrayBuffer())
                    }
                    this.updateFileList()
                } catch (err) {
                    reject(err)
                }
                this.hasFileDialogOpen = false
            })
            input.click();
            input.remove()
            resolve(true)
        });
    }
    toggleMenu() {
        let div = $('.hypermod#main-menu, .hypermod#tabs')
        div.each((i, e) => {
            if (e.id === 'tabs')
                if (e.style.display == 'flex') {
                    $(e).css({
                        display: 'none'
                    })
                    this.hasMenuOpen = false
                } else {
                    $(e).css({
                        display: 'flex'
                    })
                    this.hasMenuOpen = true
                }
            else
                if (e.style.display == 'block') {
                    $(e).css({
                        display: 'none'
                    })
                    this.hasMenuOpen = false
                } else {
                    $(e).css({
                        display: 'block'
                    })
                    this.hasMenuOpen = true
                }
        })
    }
    async loadUI() {
        let html = ''

        // load files
        let res_locations = await fetch('../hypermod/ui/_hmLocations.json')
        if (!res_locations.ok) throw `AHH! - location loading failed! - code ${res_locations.status}, \'${res_locations.statusText}\'`
        this.locations = await res_locations.json()

        let res_bindings = await import('../hypermod/ui/_hmBindings.js')
        this.bindings = res_bindings.default(this)

        let res_styles = await fetch('../hypermod/ui/_hmStyles.css')
        if (!res_styles.ok) throw `AHH! - style loading failed! - code ${res_styles.status}, \'${res_styles.statusText}\'`
        this.styles = await res_styles.text()

        // load ui
        for (let key of Object.keys(this.locations)) {
            let res = await fetch(this.locations[key])
            if (!res.ok) throw `AHH! - ui loading failed! - ${res.status}, \'${res.statusText}\'`

            let data = await res.text()
            this.ui[key] = data
        }

        // apply styles
        html += `<style>${this.styles}</style>`

        // add ui
        html += this.ui.main
        $('div.hypermod#hypermod-container').append(html)
        $('div.hypermod#hypermod-container').append(this.canvas)

        // apply bindings
        for (let key of Object.keys(this.bindings)) {
            let b = this.bindings[key]
            for (let lkey of Object.keys(b)) {
                let l = b[lkey]
                $(key).on(lkey, l)
            }
        }

        // add hypermod hotkey
        $(window).on('keydown', e => {
            switch (e.code) {
                case 'KeyH':
                    let div = $('.hypermod#main-menu, .hypermod#tabs')
                    if ($('.chatting').length != 0)
                        return
                    this.toggleMenu()
                    break
            }
        })

        // update settings
        $('input.hypermod').each((i, t: HTMLInputElement) => {
            if (!t.dataset.setting)
                return
            if (!(t.dataset.setting in this.defaultSettings))
                return
            switch (t.type) {
                case 'checkbox':
                    if (t.dataset.subsetting) {
                        t.checked = this.settings[t.dataset.setting]?.[t.dataset.subsetting] ?? this.defaultSettings[t.dataset.setting]?.[t.dataset.subsetting]
                    } else {
                        t.checked = this.settings[t.dataset.setting] ?? this.defaultSettings[t.dataset.setting]
                    }
                    break
                case 'range':
                    if (t.dataset.subsetting) {
                        t.value = this.settings[t.dataset.setting]?.[t.dataset.subsetting]?.toString() ?? this.defaultSettings[t.dataset.setting]?.[t.dataset.subsetting]?.toString()
                        let s = $(`span.hypermod[data-setting=${t.dataset.setting}][data-subsetting=${t.dataset.subsetting}]`)
                        s.html(t.value)
                    } else {
                        t.value = this.settings[t.dataset.setting]?.toString() ?? this.defaultSettings[t.dataset.setting]?.toString()
                        let s = $(`span.hypermod[data-setting=${t.dataset.setting}]`)
                        s.html(t.value)
                    }
                case 'text':
                    if (t.dataset.subsetting) {
                        t.value = this.settings[t.dataset.setting]?.[t.dataset.subsetting] ?? this.defaultSettings[t.dataset.setting]?.[t.dataset.subsetting]
                    } else {
                        t.value = this.settings[t.dataset.setting] ?? this.defaultSettings[t.dataset.setting]
                    }
                    break
            }
        })
    }
}