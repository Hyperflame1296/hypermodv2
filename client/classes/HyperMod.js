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
        trackNPS: false,
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
        enableBlipLimit: true,
        blipLimit: 8,
        // visuals section
        removeHyperModText: false,
        removeRainbowGraphics: false,
        enableFpsGraph: true,
        fpsCalculationInterval: 125,
        noteVisualizerSpeed: 100,
        enableNoteColors: true
    }
    settings = {
        // MPP section
        forceInfNoteQuota: true,
        trackNPS: false,
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
        enableBlipLimit: true,
        blipLimit: 8,
        // visuals section
        removeHyperModText: false,
        removeRainbowGraphics: false,
        enableFpsGraph: true,
        fpsCalculationInterval: 125,
        enableNoteVisualizer: true,
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
    constructor() {
        if (typeof MPP !== 'undefined' && typeof MPP.addons?.hyperMod !== 'undefined')
            throw Error`no...`

        this.loadUI()
        this.getSettings()
        this.updateSettings()
        $(this.canvas).addClass('hypermod')
        this.player.on('midiEvent', e => {
            if (typeof MPP === 'undefined')
                return
            
            let keys = Object.keys(MPP.piano.keys)
            let note
            let ch = (e.channel ?? 0) % 16
            let p = this.lsSettings.enableChannelColors ? 
                {
                    ...MPP.client.ppl[MPP.client.participantId] ?? MPP.client.offlineParticipant,
                    color: this.channelColors[ch]
                }
            :
                MPP.client.ppl[MPP.client.participantId] ?? MPP.client.offlineParticipant
            switch (e.type) {
                case 8: // note off
                    note = keys[e.note - 21]
                    if (this.lsSettings.enableClientSideMIDIPlayer) {
                        MPP.piano.stop(note, p, 0)
                    } else {
                        MPP.release(note)
                    }
                    break
                case 9: // note on
                    note = keys[e.note - 21]
                    if (!note)
                        return
                    if (this.lsSettings.enableClientSidePlayback) {
                        MPP.piano.play(note, e.velocity / 127, p, 0)
                    } else {
                        MPP.press(note, e.velocity / 127)
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
    async loadMIDI(url) {
        let file = await fetch(url)
        let data = await file.arrayBuffer()
        await this.player.loadArrayBuffer(data)
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
    unloadMIDI() {
        this.player.unload()
    }
    playMIDI() {
        this.player.play()
    }
    pauseMIDI() {
        this.player.pause()
    }
    stopMIDI() {
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
    async openMIDIDialog() {
        return new Promise((resolve, reject) => {
            let input = document.createElement('input');
            input.type = 'file', input.accept = '.mid,.midi'
            input.addEventListener('change', async e => {
                let file = e.target.files[0];
                if (!file) return reject('No file selected');
                try {
                    let arrayBuffer = await file.arrayBuffer();
                    this.fileData.set(file.name, arrayBuffer)
                    resolve(arrayBuffer);
                } catch (err) {
                    reject(err);
                }
            })
            input.click();
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
                        div[0].style.display == 'block' ?
                            div.css({
                                display: 'none'
                            })
                        :
                            div.css({
                                display: 'block'
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
                    break
            }
        })
    }
}
if (typeof module !== 'undefined') {
    module.exports = HyperMod
} else {
    this.HyperMod = HyperMod
}