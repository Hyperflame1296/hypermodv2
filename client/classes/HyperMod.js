class HyperMod {
    ui = new Object
    locations = new Object
    bindings = new Object
    styles = new Object
    lsSettings = new Object
    fileData = new Map
    fpsHist = new Array
    player = new Player
    npsTracker = new NPSTracker
    currentFile
    version = 'v0.2.0'
    defaultSettings = {
        // MPP section
        forceInfNoteQuota: true,
        disableAudioEngine: false,
        trackNPS: false,
        connectUrl: 'wss://mppclone.com',
        // Player section
        enableClientSidePlayback: false,
        enableChannelColors: true,
        // optimizations section
        removeWorkerTimer: true,
        removeNameBouncing: true,
        removeNoteBouncing: true,
        removeKeyShadows: true,
        removeKeyGradients: false,
        removeKeyFade: true,
        enableBufferedBlips: false,
        enableBlipLimit: true,
        blipLimit: 8,
        // visuals section
        removeHyperModText: false,
        removeRainbowGraphics: false,
        enableFpsGraph: true,
        fpsCalculationInterval: 125,
        enableNoteVisualizer: false,
        noteVisualizerInterval: 125,
        noteVisualizerSpeed: 100,
        enableNoteColors: true
    }
    settings = {
        // MPP section
        forceInfNoteQuota: true,
        disableAudioEngine: false,
        trackNPS: false,
        connectUrl: 'wss://mppclone.com',
        // Player section
        enableClientSidePlayback: false,
        enableChannelColors: true,
        // optimizations section
        removeWorkerTimer: true,
        removeNameBouncing: true,
        removeNoteBouncing: true,
        removeKeyShadows: true,
        removeKeyGradients: false,
        removeKeyFade: true,
        enableBufferedBlips: false,
        enableBlipLimit: true,
        blipLimit: 8,
        // visuals section
        removeHyperModText: false,
        removeRainbowGraphics: false,
        enableFpsGraph: true,
        fpsCalculationInterval: 125,
        enableNoteVisualizer: false,
        noteVisualizerInterval: 125,
        noteVisualizerSpeed: 100,
        enableNoteColors: true
    }
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
    canvas = document.createElement('canvas')
    ctx = this.canvas?.getContext('2d')
    now = performance.now()
    frames = 0
    fps = 0
    lastTime = performance.now()
    prefix = '$'
    tags = {
        log: `[HyperMod ${this.version}] - `,
        success: `[HyperMod ${this.version}] - [✅] - `,
        warn: `[HyperMod ${this.version}] - [⚠] - `,
        error: `[HyperMod ${this.version}] - [❌] - `
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
                    let initial = this.tags.success + 'Commands: '
                    for (let command of this.commands) {
                        initial += `\`${command.name}\`${this.commands.indexOf(command) + 1 === this.commands.length ? '' : ', '}`
                    }
                    MPP.chat.send(initial)
                } else {
                    MPP.chat.send('a')
                }
            }
        },
        {
            name: 'js',
            description: 'Evaluates JavaScript code.',
            syntax: `${this.prefix}js [command]`,
            func: (a, msg) => {
                let input = a.slice(1).join(' ')
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
                    MPP.chat.send(`[✅] » \`${str}\``)
                }).catch(err => {
                    MPP.chat.send(`[❌] » \`${err}\``)
                })
            }
        }
    ]
    constructor() {
        if (typeof MPP !== 'undefined' && typeof MPP.addons?.hyperMod !== 'undefined')
            throw Error`no...`

        this.loadUI()
        this.getSettings()
        this.updateSettings()
        this.updateFileList()
        $(this.canvas).addClass('hypermod')
        let keys = ['a-1', 'as-1', 'b-1', 'c0', 'cs0', 'd0', 'ds0', 'e0', 'f0', 'fs0', 'g0', 'gs0', 'a0', 'as0', 'b0', 'c1', 'cs1', 'd1', 'ds1', 'e1', 'f1', 'fs1', 'g1', 'gs1', 'a1', 'as1', 'b1', 'c2', 'cs2', 'd2', 'ds2', 'e2', 'f2', 'fs2', 'g2', 'gs2', 'a2', 'as2', 'b2', 'c3', 'cs3', 'd3', 'ds3', 'e3', 'f3', 'fs3', 'g3', 'gs3', 'a3', 'as3', 'b3', 'c4', 'cs4', 'd4', 'ds4', 'e4', 'f4', 'fs4', 'g4', 'gs4', 'a4', 'as4', 'b4', 'c5', 'cs5', 'd5', 'ds5', 'e5', 'f5', 'fs5', 'g5', 'gs5', 'a5', 'as5', 'b5', 'c6', 'cs6', 'd6', 'ds6', 'e6', 'f6', 'fs6', 'g6', 'gs6', 'a6', 'as6', 'b6', 'c7']
        this.player.on('midiEvent', e => {
            if (typeof MPP === 'undefined')
                return
            let note
            let ch = (e.channel ?? 0) % 16
            let gp = MPP.client.getOwnParticipant()
            let p = this.lsSettings.enableChannelColors ? 
                {
                    ...gp,
                    color: this.channelColors[ch]
                }
            :
                gp
            switch (e.type) {
                case 8: // note off
                    note = keys[e.note - 21]
                    if (!note)
                        return
                    if (this.lsSettings.enableClientSidePlayback) {
                        MPP.piano.stop(note, p)
                    } else {
                        MPP.piano.stop(note, p)
                        MPP.client.stopNote(note)
                    }
                    break
                case 9: // note on
                    note = keys[e.note - 21]
                    if (!note)
                        return
                    if (this.lsSettings.enableClientSidePlayback) {
                        MPP.piano.play(note, e.velocity / 127, p)
                    } else {
                        MPP.piano.play(note, e.velocity / 127, p)
                        MPP.client.startNote(note, e.velocity / 127)
                    }
                    break
            }
        })
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
    receiveMessage(msg) {
        if (typeof MPP === 'undefined')
            return

        if (msg.p.id !== MPP.client.participantId)
            return

        let a = msg.a?.trim().split(' ') ?? [],
            b = a[0]?.trim() ?? '',
            c = a[1]?.trim() ?? ''

        if (b.startsWith(this.prefix)) {
            try {
                let command = this.commands.find(c => c.name === b.replace(this.prefix, ''))
                if (!command)
                    return MPP.chat.send(this.tags.error + `No such command \`${b}\``)

                command.func(a, msg)
            } catch (err) {
                MPP.chat.send(this.tags.error `${err}`)
            }
        }
    }
    canvasUpdate() {
        this.canvas.width = innerWidth
        this.canvas.height = innerHeight
        let hyperModButton = $('div.ugly-button#hypermod-btn')
        let buttonHue = (performance.now() / 8) % 360
        if (!this.lsSettings.removeRainbowGraphics)
            hyperModButton.css({
                'border-color': `hsl(${buttonHue}, 100%, 90%)`
            })
        
        this.ctx.font = '30px monospace'
        this.ctx.fillStyle = !this.lsSettings.removeRainbowGraphics ? `hsl(${buttonHue}, 100%, 90%)` : '#fff'
        this.ctx.lineWidth = 2
        this.ctx.strokeStyle = '#fff'
        if (!this.lsSettings.removeHyperModText) {
            this.ctx.textAlign = 'center'
            this.ctx.fillText('HyperMod v2', this.canvas.width / 2, 130)
            this.ctx.fillStyle = '#ffffff6b'
            this.ctx.font = 'italic 20px monospace'
            this.ctx.fillText(`(${this.version})`, this.canvas.width / 2, 160)
            this.ctx.font = '30px monospace'
            this.ctx.fillStyle = !this.lsSettings.removeRainbowGraphics ? `hsl(${buttonHue}, 100%, 90%)` : '#fff'
        }
        this.ctx.font = '20px monospace'
        this.ctx.textAlign = 'right'
        this.ctx.fillText(`${(this.fps ?? 0).toFixed(1)} FPS`, this.canvas.width - 20, this.canvas.height - 100)
        if (this.lsSettings.trackNPS)
            this.ctx.fillText(`${(this.npsTracker?.getNPS() ?? 0).toFixed(1)} NPS`, this.canvas.width - 20, this.canvas.height - 120)
        this.frames++;
        this.now = performance.now();
        if (this.lsSettings.enableFpsGraph) {
            let w = 300
            let h = 150
            let sx = 100
            let sy = parseInt($('div#piano')[0].style.marginTop) - (h + 50)
            for (let i = 0; i < this.fpsHist.length; i++) {
                let f = this.fpsHist[i]
                let h = (f / Math.max(...this.fpsHist)) * 150
                let x = sx + i
                let y = (sy + 150) - h
                this.ctx.fillRect(x, y, 1, h)
            }
            this.ctx.strokeRect(sx, sy, w, h)
        }
        if (this.lsSettings.enableNoteVisualizer) {
            let w = 300
            let h = 150
            let sx = this.canvas.width - w - 100
            let sy = parseInt($('div#piano')[0].style.marginTop) - (h + 50)
            this.ctx.strokeRect(sx, sy, w, h)
        }
        let now = performance.now()
        if (now - this.lastTime >= this.lsSettings.fpsCalculationInterval) {
            this.fps = (this.frames * 1000) / (now - this.lastTime);
            this.frames = 0;
            this.lastTime = now;
            if (this.fpsHist.length >= 300)
                this.fpsHist.shift()
            this.fpsHist.push(this.fps)
        }
    }
    async loadMIDI(fn) {
        let data = await this.fileData.get(fn)
        if (!data)
            throw new Error(`There is no MIDI named \'${fn}\' loaded into HyperMod.`)
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
    updateFileList() {
        let list = $('ul.hypermod#files')
        list.empty()
        if (Array.from(this.fileData.keys()).length <= 0)
            return list.html('(none)')

        for (let key of this.fileData.keys()) {
            let li = document.createElement('li')
            let p = document.createElement('p')
            let a = key === this.currentFile ? document.createElement('p') : document.createElement('a')
            $(li).addClass('hypermod hm-inline')
            $(p).addClass('hypermod')
            key !== this.currentFile ? $(a).addClass('hypermod hm-link') : void 0
            $(p).html(key)
            $(a).html(key === this.currentFile ? '<i style=\'color: darkgray\'>Loaded</i>' : 'Load')
            $(p).attr('title', 'File name.')
            $(a).attr('title', key === this.currentFile ? 'This MIDI is currently loaded.' : 'Load this MIDI.')
            $(a).attr('data-file', key)
            $(a).attr('id', 'load-file-link')
            if (key !== this.currentFile)
                $(a).click(async e => {
                    let g = e.target
                    if (!g.dataset.file)
                        return

                    await this.loadMIDI(g.dataset.file)
                    this.updateFileList()
                })
            $(li).append(p)
            $(li).append(a)
            list.append(li)
        }
        if (typeof this.currentFile === 'undefined')
            $('.hypermod#midi-controls').addClass('inactive')
        else
            $('.hypermod#midi-controls').removeClass('inactive')
    }
    async openMIDIDialog() {
        return new Promise((resolve, reject) => {
            let input = document.createElement('input');
            input.type = 'file', input.accept = '.mid,.midi'
            input.addEventListener('change', async e => {
                try {
                    for (let file of e.target.files) {
                        if (!file) continue;
                        this.fileData.set(file.name,  await file.arrayBuffer())
                    }
                } catch (err) {
                    reject(err)
                }
                this.updateFileList()
            })
            input.click();
            resolve()
        });
    }
    async loadUI() {
        let html = ''

        // load files
        let res_locations = await fetch('hypermod/ui/_hmLocations.json')
        if (!res_locations.ok) throw `HTTPError: code ${res_locations.status}, \'${res_locations.statusText}\'`
        this.locations = await res_locations.json()

        let res_bindings = await fetch('hypermod/ui/_hmBindings.js')
        if (!res_bindings.ok) throw `HTTPError: code ${res_bindings.status}, \'${res_bindings.statusText}\'`
        this.bindings = eval(await res_bindings.text())

        let res_styles = await fetch('hypermod/ui/_hmStyles.css')
        if (!res_styles.ok) throw `HTTPError: code ${res_styles.status}, \'${res_styles.statusText}\'`
        this.styles = await res_styles.text()

        // load ui
        for (let key of Object.keys(this.locations)) {
            let res = await fetch(this.locations[key])
            if (!res.ok) throw `HTTPError: code ${res.status}, \'${res.statusText}\'`

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
        $(window).keydown(e => {
            switch (e.code) {
                case 'KeyH':
                    let div = $('.hypermod#main-menu')
                    if ($('.chatting').length == 0)
                        div[0].style.pointerEvents == 'all' ?
                            div.css({
                                'pointer-events': 'none',
                                opacity: '0'
                            })
                        :
                            div.css({
                                'pointer-events': 'all',
                                opacity: '1'
                            })
                    break
            }
        })

        // update settings
        $('input.hypermod').each((i, t) => {
            if (!t.dataset.setting)
                return
            switch (t.type) {
                case 'checkbox':
                    t.checked = this.settings[t.dataset.setting]
                    break
                case 'range':
                    t.value = this.settings[t.dataset.setting].toString()
                    let s = $(`span.hypermod[data-setting=${t.dataset.setting}]`)
                    s.html(t.value)
                case 'text':
                    t.value = this.settings[t.dataset.setting]
                    break
            }
        })
    }
}
if (typeof module !== 'undefined') {
    module.exports = HyperMod
} else {
    globalThis.HyperMod = HyperMod
}