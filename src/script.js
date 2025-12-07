let translation = window.i18nextify.init({
    autorun: false
})

if (location.host === 'multiplayerpiano.com') {
    let url = new URL('https://multiplayerpiano.net/' + location.search)
    if (localStorage.token) url.searchParams.set('token', localStorage.token)
    location.replace(url)
    throw new Error('Redirecting to multiplayerpiano.net')
}
if (location.host === 'multiplayerpiano.net') {
    let url = new URL(location.href)
    let token = url.searchParams.get('token')
    if (token) {
        localStorage.token = token

        url.searchParams.delete('token')

        location.replace(url)

        throw new Error('Finalizing redirect.')
    }
}

// 钢琴

$(function() {
    translation.start()
    console.log("%cWelcome to MPP's developer console!", 'color:blue; font-size:20px;')
    console.log(
        '%cCheck out the source code: https://github.com/mppnet/frontend/tree/main/client\nGuide for coders and bot developers: https://docs.google.com/document/d/1OrxwdLD1l1TE8iau6ToETVmnLuLXyGBhA0VfAY1Lf14/edit?usp=sharing',
        'color:gray; font-size:12px;'
    )
    
    var test_mode = window.location.hash && window.location.hash.match(/^(?:#.+)*#test(?:#.+)*$/i)

    var gSeeOwnCursor = window.location.hash && window.location.hash.match(/^(?:#.+)*#seeowncursor(?:#.+)*$/i)

    var gMidiVolumeTest = window.location.hash && window.location.hash.match(/^(?:#.+)*#midivolumetest(?:#.+)*$/i)

    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (elt /*, from*/) {
            var len = this.length >>> 0
            var from = Number(arguments[1]) || 0
            from = from < 0 ? Math.ceil(from) : Math.floor(from)
            if (from < 0) from += len
            for (; from < len; from++) {
                if (from in this && this[from] === elt) return from
            }
            return -1
        }
    }
    Notification.requestPermission()
    window.requestAnimationFrame =
        window.requestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (cb) {
            setTimeout(cb, 1000 / 30)
        }

    var DEFAULT_VELOCITY = 0.5

    var TIMING_TARGET = 1000

    // Utility

    ////////////////////////////////////////////////////////////////
    let gHyperMod = new HyperMod()
    class Rect {
        constructor(x, y, w, h) {
            this.x = x
            this.y = y
            this.w = w
            this.h = h
            this.x2 = x + w
            this.y2 = y + h
        }
        contains(x, y) {
            return x >= this.x && x <= this.x2 && y >= this.y && y <= this.y2
        }
    }

    let BASIC_PIANO_SCALES = {
        // ty https://www.pianoscales.org/
        // major keys
        'Notes in C Major': ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C'],
        'Notes in D Major': ['D', 'E', 'G♭', 'G', 'A', 'B', 'D♭', 'D'],
        'Notes in E Major': ['E', 'G♭', 'A♭', 'A', 'B', 'D♭', 'E♭', 'E'],
        'Notes in F Major': ['F', 'G', 'A', 'B♭', 'C', 'D', 'E', 'F'],
        'Notes in G Major': ['G', 'A', 'B', 'C', 'D', 'E', 'G♭', 'G'],
        'Notes in A Major': ['A', 'B', 'D♭', 'D', 'E', 'G♭', 'A♭', 'A'],
        'Notes in B Major': ['B', 'D♭', 'E♭', 'E', 'G♭', 'A♭', 'B♭', 'B'],
        'Notes in C# / Db Major': ['D♭', 'E♭', 'F', 'G♭', 'A♭', 'B♭', 'C', 'D♭'],
        'Notes in D# / Eb Major': ['E♭', 'F', 'G', 'A♭', 'B♭', 'C', 'D', 'E♭'],
        'Notes in F# / Gb Major': ['G♭', 'A♭', 'B♭', 'B', 'D♭', 'E♭', 'F', 'G♭'],
        'Notes in G# / Ab Major': ['A♭', 'B♭', 'C', 'D♭', 'E♭', 'F', 'G', 'A♭'],
        'Notes in A# / Bb Major': ['B♭', 'C', 'D', 'E♭', 'F', 'G', 'A', 'B♭'],
        // natural minor keys
        'Notes in A Minor': ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'A'],
        'Notes in A# / Bb Minor': ['B♭', 'C', 'D♭', 'E♭', 'F', 'G♭', 'A♭', 'B♭'],
        'Notes in B Minor': ['B', 'D♭', 'D', 'E', 'G♭', 'G', 'A', 'B'],
        'Notes in C Minor': ['C', 'D', 'E♭', 'F', 'G', 'A♭', 'B♭', 'C'],
        'Notes in C# / Db Minor': ['D♭', 'E♭', 'E', 'G♭', 'A♭', 'A', 'B', 'D♭'],
        'Notes in D Minor': ['D', 'E', 'F', 'G', 'A', 'B♭', 'C', 'D'],
        'Notes in D# / Eb Minor': ['E♭', 'F', 'G♭', 'A♭', 'B♭', 'B', 'D♭', 'E♭'],
        'Notes in E Minor': ['E', 'G♭', 'G', 'A', 'B', 'C', 'D', 'E'],
        'Notes in F Minor': ['F', 'G', 'A♭', 'B♭', 'C', 'D♭', 'E♭', 'F'],
        'Notes in F# / Gb Minor': ['G♭', 'A♭', 'A', 'B', 'D♭', 'D', 'E', 'G♭'],
        'Notes in G Minor': ['G', 'A', 'B♭', 'C', 'D', 'E♭', 'F', 'G'],
        'Notes in G# / Ab Minor': ['A♭', 'B♭', 'B', 'D♭', 'E♭', 'E', 'G♭', 'A♭']
    }

    // AudioEngine classes

    ////////////////////////////////////////////////////////////////

    class AudioEngine {
        init(cb) {
            this.volume = 0.6
            this.sounds = {}
            this.paused = true
            this.voices = 0
            return this
        }
        load(id, url, cb) {}
        play() {}
        stop() {}
        setVolume(x) {
            this.volume = x
        }
        resume() {
            this.paused = false
        }
    }
    class AudioEngineWeb extends AudioEngine {
        constructor() {
            super()
            this.threshold = 0
            if (!gHyperMod.lsSettings.removeWorkerTimer) {
                this.worker = new Worker('threads/timer.js')
                this.worker.onmessage = e => {
                    if (e.data.args)
                        if (e.data.args.action == 0) {
                            this.actualPlay(e.data.args.id, e.data.args.vol, e.data.args.time, e.data.args.part_id)
                        } else {
                            this.actualStop(e.data.args.id, e.data.args.time, e.data.args.part_id)
                        }
                }
            }
        }
        init(cb) {
            super.init(this)
            this.context = new AudioContext({ latencyHint: 'interactive' })

            this.masterGain = this.context.createGain()
            this.masterGain.connect(this.context.destination)
            this.masterGain.gain.value = this.volume

            this.limiterNode = this.context.createDynamicsCompressor()
            this.limiterNode.threshold.value = -10
            this.limiterNode.knee.value = 0
            this.limiterNode.ratio.value = 20
            this.limiterNode.attack.value = 0.002
            this.limiterNode.release.value = 0.08553
            this.limiterNode.connect(this.masterGain)

            // for synth mix
            this.pianoGain = this.context.createGain()
            this.pianoGain.gain.value = 0.5
            this.pianoGain.connect(this.limiterNode)
            this.synthGain = this.context.createGain()
            this.synthGain.gain.value = 0.5
            this.synthGain.connect(this.limiterNode)

            this.playings = {}

            if (cb) requestAnimationFrame(cb)
            return this
        }
        load(id, url, cb) {
            try {
                fetch(url).then(f => {
                    if (!f.ok) throw new Error('http error: ' + f.status)
                    f.arrayBuffer().then(data => {
                        this.context.decodeAudioData(data).then(b => {
                            this.sounds[id] = b
                            cb?.()
                        })
                    })
                })
            } catch (e) {
                console.error(`${e}\n${e.stack}`)
                new SiteNotification({
                    id: 'audio-download-error',
                    title: 'Problem',
                    text: 'For some reason, an audio download failed:' + e.message,
                    target: '#piano',
                    duration: 10000
                })
            }
        }
        actualPlay(id, vol, time, part_id) {
            //the old play(), but with time insted of delay_ms.
            if (this.paused) return
            if (!this.sounds.hasOwnProperty(id)) return
            if (this.volume <= 0 || gHyperMod.lsSettings.disableAudioEngine) return
            if (!this.playings[id])
                this.playings[id] = []
            var source = this.context.createBufferSource()
            source.buffer = this.sounds[id]
            var gain = this.context.createGain()
            gain.gain.value = vol
            source.connect(gain)
            gain.connect(this.pianoGain)
            source.start(time)
            // Patch from ste-art remedies stuttering under heavy load
            if (this.playings[id].length > 0 || this.voices > 50) {
                let playing = this.playings[id].shift()
                if (playing) {
                    playing.source.stop(time)
                    if (enableSynth && playing.voice) {
                        playing.voice.stop(time)
                    }
                }
                this.voices--
            }
            let playing = { source, gain, part_id }
            if (enableSynth) {
                this.playings[id].voice = new SynthVoice(id, time)
            }
            this.playings[id].push(playing)
            this.voices++
        }
        play(id, vol, delay_ms, part_id) {
            if (!this.sounds.hasOwnProperty(id)) return
            if (this.volume <= 0 || gHyperMod.lsSettings.disableAudioEngine) return
            var time = this.context.currentTime + delay_ms / 1000 //calculate time on note receive.
            var delay = delay_ms - this.threshold
            if (delay <= 0) this.actualPlay(id, vol, time, part_id)
            else {
                if (gHyperMod.lsSettings.removeWorkerTimer || !this.worker)
                    setTimeout(() => {
                        this.actualPlay(id, vol, time, part_id)
                    }, delay)
                else
                    this.worker.postMessage({
                        delay: delay,
                        args: {
                            action: 0 /*play*/,
                            id: id,
                            vol: vol,
                            time: time,
                            part_id: part_id
                        }
                    }) // but start scheduling right before play.
            }
        }
        actualStop(id, time, part_id) {
            if (this.volume <= 0 || gHyperMod.lsSettings.disableAudioEngine) return
            if (!this.playings[id])
                this.playings[id] = []
            if (id in this.playings && this.playings[id]) {
                let playing = this.playings[id].shift()
                if (playing && playing.part_id === part_id) {
                    var gain = playing.gain.gain
                    gain.setValueAtTime(gain.value, time)
                    gain.linearRampToValueAtTime(gain.value * 0.1, time + 0.16)
                    gain.linearRampToValueAtTime(0.0, time + 0.4)
                    playing.source.stop(time + 0.41)

                    if (playing.voice) {
                        playing.voice.stop(time)
                    }
                    this.voices--
                }
            }
        }
        stop(id, delay_ms, part_id) {
            if (this.volume <= 0 || gHyperMod.lsSettings.disableAudioEngine) return
            var time = this.context.currentTime + delay_ms / 1000
            var delay = delay_ms - this.threshold
            if (delay <= 0) this.actualStop(id, time, part_id)
            else {
                if (gHyperMod.lsSettings.removeWorkerTimer || !this.worker)
                    setTimeout(() => {
                        this.actualStop(id, time, part_id)
                    }, delay)
                else
                    this.worker.postMessage({
                        delay: delay,
                        args: {
                            action: 1 /*stop*/,
                            id: id,
                            time: time,
                            part_id: part_id
                        }
                    })
            }
        }
        setVolume(x) {
            super.setVolume(x)
            this.masterGain.gain.value = this.volume
        }
        resume() {
            this.paused = false
            this.context.resume()
        }
    }
    class HMAudioEngine extends AudioEngine { // for future use
        initialized = false
        bufferLength = 0.125
        voices = {}
        lastTime = 0
        constructor() {
            super()
        }
        init(cb) {
            if (this.initialized) return this
            super.init()
            this.context = new AudioContext()
            this.initialized = true
            this.lastTime = performance.now()
            this.buffer = this.context.createBuffer(2, this.context.sampleRate * this.bufferLength, this.context.sampleRate)
            this.source = this.context.createBufferSource()
            this.source.buffer = this.buffer
            this.source.connect(this.context.destination)
            this.source.start()
            if (cb) requestAnimationFrame(cb)
            this.writeBuffer()
            this.loop()
            return this
        }
        loop() {
            if (!this.initialized) return
            if (performance.now() - this.lastTime > this.bufferLength * 1000) {
                this.source.stop()
                this.writeBuffer()
                this.source = this.context.createBufferSource()
                this.source.buffer = this.buffer
                this.source.connect(this.context.destination)
                this.source.start()
                this.lastTime = performance.now()
            }
            requestAnimationFrame(::this.loop)
        }
        play() {
            
        }
        writeBuffer() {
            
        }
        load(id, url, cb) {
            try {
                fetch(url).then(f => {
                    if (!f.ok) throw new Error('http error: ' + f.status)
                    f.arrayBuffer().then(data => {
                        this.context.decodeAudioData(data).then(b => {
                            this.sounds[id] = b
                            cb?.()
                        })
                    })
                })
            } catch (e) {
                console.error(`${e}\n${e.stack}`)
                new SiteNotification({
                    id: 'audio-download-error',
                    title: 'Problem',
                    text: 'For some reason, an audio download failed:' + e.message,
                    target: '#piano',
                    duration: 10000
                })
            }
        }
    }

    // Renderer classes

    ////////////////////////////////////////////////////////////////

    class Renderer {
        init(piano) {
            this.piano = piano
            this.resize()
            return this
        }
        resize(width, height) {
            if (typeof width == 'undefined') width = $(this.piano.rootElement).width()
            if (typeof height == 'undefined') height = Math.floor(width * 0.2)
            $(this.piano.rootElement).css({
                height: height + 'px',
                marginTop: Math.floor($(window).height() / 2 - height / 2) + 'px'
            })
            this.width = width * window.devicePixelRatio
            this.height = height * window.devicePixelRatio
        }
        visualize(key, color) {}
    }
    class CanvasRenderer extends Renderer {
        constructor() {
            super()
        }
        static translateMouseEvent(e) {
            var element = e.target
            var offx = 0
            var offy = 0
            do {
                if (!element) break // wtf, wtf?
                offx += element.offsetLeft
                offy += element.offsetTop
            } while ((element = element.offsetParent))
            return {
                x: (e.pageX - offx) * window.devicePixelRatio,
                y: (e.pageY - offy) * window.devicePixelRatio
            }
        }
        init(piano) {
            this.canvas = document.createElement('canvas')
            this.ctx = this.canvas.getContext('2d')
            piano.rootElement.append(this.canvas)

            super.init(piano)
            // create render loop

            var render = () => {
                this.redraw()
                requestAnimationFrame(render)
            }
            render()

            // add event listeners
            var mouse_down = false
            var last_key = null
            $(piano.rootElement).mousedown(e => {
                mouse_down = true
                //event.stopPropagation();
                if (!gNoPreventDefault) e.preventDefault()

                var pos = CanvasRenderer.translateMouseEvent(e)
                var hit = this.getHit(pos.x, pos.y)
                if (hit) {
                    keyboard.press(hit.key.note, hit.v)
                    last_key = hit.key
                }
            })
            piano.rootElement.addEventListener(
                'touchstart',
                e => {
                    mouse_down = true
                    //event.stopPropagation();
                    if (!gNoPreventDefault) e.preventDefault()
                    for (var i in e.changedTouches) {
                        var pos = CanvasRenderer.translateMouseEvent(e.changedTouches[i])
                        var hit = this.getHit(pos.x, pos.y)
                        if (hit) {
                            keyboard.press(hit.key.note, hit.v)
                            last_key = hit.key
                        }
                    }
                },
                false
            )
            $(window).mouseup(() => {
                if (last_key) {
                    keyboard.release(last_key.note)
                }
                mouse_down = false
                last_key = null
            })
            return this
        }
        resize(width, height) {
            super.resize(width, height)
            if (this.width < 104) this.width = 104
            if (this.height < this.width * 0.2) this.height = Math.floor(this.width * 0.2)
            this.canvas.width = this.width
            this.canvas.height = this.height
            this.canvas.style.width = this.width / window.devicePixelRatio + 'px'
            this.canvas.style.height = this.height / window.devicePixelRatio + 'px'

            // calculate key sizes
            this.whiteKeyWidth = Math.floor(this.width / 52)
            this.whiteKeyHeight = Math.floor(this.height * 0.9)
            this.blackKeyWidth = Math.floor(this.whiteKeyWidth * 0.75)
            this.blackKeyHeight = Math.floor(this.height * 0.5)

            this.blackKeyOffset = Math.floor(this.whiteKeyWidth - this.blackKeyWidth / 2)
            this.keyMovement = Math.floor(this.whiteKeyHeight * 0.015)

            this.whiteBlipWidth = Math.floor(this.whiteKeyWidth * 0.7)
            this.whiteBlipHeight = Math.floor(this.whiteBlipWidth * 0.8)
            this.whiteBlipX = Math.floor((this.whiteKeyWidth - this.whiteBlipWidth) / 2)
            this.whiteBlipY = Math.floor(this.whiteKeyHeight - this.whiteBlipHeight * 1.2)
            this.blackBlipWidth = Math.floor(this.blackKeyWidth * 0.7)
            this.blackBlipHeight = Math.floor(this.blackBlipWidth * 0.8)
            this.blackBlipY = Math.floor(this.blackKeyHeight - this.blackBlipHeight * 1.2)
            this.blackBlipX = Math.floor((this.blackKeyWidth - this.blackBlipWidth) / 2)

            // prerender white key
            this.whiteKeyRender = document.createElement('canvas')
            this.whiteKeyRender.width = this.whiteKeyWidth
            this.whiteKeyRender.height = this.height + 10
            var ctx = this.whiteKeyRender.getContext('2d')
            if (ctx.createLinearGradient && !gHyperMod.lsSettings.removeKeyGradients) {
                var gradient = ctx.createLinearGradient(0, 0, 0, this.whiteKeyHeight)
                gradient.addColorStop(0, '#eee')
                gradient.addColorStop(0.75, '#fff')
                gradient.addColorStop(1, '#dad4d4')
                ctx.fillStyle = gradient
            } else {
                ctx.fillStyle = '#fff'
            }
            ctx.strokeStyle = '#000'
            ctx.lineJoin = 'round'
            ctx.lineCap = 'round'
            ctx.lineWidth = 10
            ctx.strokeRect(
                ctx.lineWidth / 2,
                ctx.lineWidth / 2,
                this.whiteKeyWidth - ctx.lineWidth,
                this.whiteKeyHeight - ctx.lineWidth
            )
            ctx.lineWidth = 4
            ctx.fillRect(
                ctx.lineWidth / 2,
                ctx.lineWidth / 2,
                this.whiteKeyWidth - ctx.lineWidth,
                this.whiteKeyHeight - ctx.lineWidth
            )

            // prerender black key
            this.blackKeyRender = document.createElement('canvas')
            this.blackKeyRender.width = this.blackKeyWidth + 10
            this.blackKeyRender.height = this.blackKeyHeight + 10
            var ctx = this.blackKeyRender.getContext('2d')
            if (ctx.createLinearGradient && !gHyperMod.lsSettings.removeKeyGradients) {
                var gradient = ctx.createLinearGradient(0, 0, 0, this.blackKeyHeight)
                gradient.addColorStop(0, '#000')
                gradient.addColorStop(1, '#444')
                ctx.fillStyle = gradient
            } else {
                ctx.fillStyle = '#000'
            }
            ctx.strokeStyle = '#222'
            ctx.lineJoin = 'round'
            ctx.lineCap = 'round'
            ctx.lineWidth = 8
            ctx.strokeRect(
                ctx.lineWidth / 2,
                ctx.lineWidth / 2,
                this.blackKeyWidth - ctx.lineWidth,
                this.blackKeyHeight - ctx.lineWidth
            )
            ctx.lineWidth = 4
            ctx.fillRect(
                ctx.lineWidth / 2,
                ctx.lineWidth / 2,
                this.blackKeyWidth - ctx.lineWidth,
                this.blackKeyHeight - ctx.lineWidth
            )

            if (!gHyperMod.lsSettings.removeKeyShadows) {
                // prerender shadows
                this.shadowRender = []
                var y = -this.canvas.height * 2
                for (var j = 0; j < 2; j++) {
                    var canvas = document.createElement('canvas')
                    this.shadowRender[j] = canvas
                    canvas.width = this.canvas.width
                    canvas.height = this.canvas.height
                    var ctx = canvas.getContext('2d')
                    var sharp = j ? true : false
                    ctx.lineJoin = 'round'
                    ctx.lineCap = 'round'
                    ctx.lineWidth = 1
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
                    ctx.shadowBlur = this.keyMovement * 3
                    ctx.shadowOffsetY = -y + this.keyMovement
                    if (sharp) {
                        ctx.shadowOffsetX = this.keyMovement
                    } else {
                        ctx.shadowOffsetX = 0
                        ctx.shadowOffsetY = -y + this.keyMovement
                    }
                    for (var i in this.piano.keys) {
                        if (!this.piano.keys.hasOwnProperty(i)) continue
                        var key = this.piano.keys[i]
                        if (key.sharp != sharp) continue

                        if (key.sharp) {
                            ctx.fillRect(
                                this.blackKeyOffset + this.whiteKeyWidth * key.spatial + ctx.lineWidth / 2,
                                y + ctx.lineWidth / 2,
                                this.blackKeyWidth - ctx.lineWidth,
                                this.blackKeyHeight - ctx.lineWidth
                            )
                        } else {
                            ctx.fillRect(
                                this.whiteKeyWidth * key.spatial + ctx.lineWidth / 2,
                                y + ctx.lineWidth / 2,
                                this.whiteKeyWidth - ctx.lineWidth,
                                this.whiteKeyHeight - ctx.lineWidth
                            )
                        }
                    }
                }
            }
            // update key rects
            for (var i in this.piano.keys) {
                if (!this.piano.keys[i]) continue
                var key = this.piano.keys[i]
                if (key.sharp) {
                    key.rect = new Rect(
                        this.blackKeyOffset + this.whiteKeyWidth * key.spatial,
                        0,
                        this.blackKeyWidth,
                        this.blackKeyHeight
                    )
                } else {
                    key.rect = new Rect(this.whiteKeyWidth * key.spatial, 0, this.whiteKeyWidth, this.whiteKeyHeight)
                }
            }
        }
        redraw() {
            var now = Date.now()
            var timeLoadedEnd = now - 1000
            var timePlayedEnd = now - 100
            var timeBlipEnd = now - 1000

            !gHyperMod.lsSettings.removeKeyFade ? this.ctx.save() : void 0
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
            // draw all keys
            for (var j = 0; j < 2; j++) {
                !gHyperMod.lsSettings.removeKeyFade ? this.ctx.globalAlpha = 1.0 : void 0
                !gHyperMod.lsSettings.removeKeyShadows && this.shadowRender ? this.ctx.drawImage(this.shadowRender[j], 0, 0) : void 0
                var sharp = j ? true : false
                for (var i in this.piano.keys) {
                    if (!this.piano.keys.hasOwnProperty(i)) continue
                    var key = this.piano.keys[i]
                    if (key.sharp != sharp) continue

                    if (!gHyperMod.lsSettings.removeKeyFade)
                        if (!key.loaded) {
                            this.ctx.globalAlpha = 0.2
                        } else if (key.timeLoaded > timeLoadedEnd) {
                            this.ctx.globalAlpha = ((now - key.timeLoaded) / 1000) * 0.8 + 0.2
                        } else {
                            this.ctx.globalAlpha = 1.0
                        }
                    
                    var y = 0
                    if (key.timePlayed > timePlayedEnd && !gHyperMod.lsSettings.removeNoteBouncing) {
                        y = Math.floor(this.keyMovement - ((now - key.timePlayed) / 100) * this.keyMovement)
                    }
                    var x = Math.floor(
                        key.sharp ? this.blackKeyOffset + this.whiteKeyWidth * key.spatial : this.whiteKeyWidth * key.spatial
                    )
                    var image = key.sharp ? this.blackKeyRender : this.whiteKeyRender
                    this.ctx.drawImage(image, x, y)

                    var keyName = key.baseNote[0].toUpperCase()
                    if (sharp) keyName += '#'
                    keyName += key.octave + 1

                    if (gShowPianoNotes) {
                        this.ctx.font = `${(key.sharp ? this.blackKeyWidth : this.whiteKeyWidth) / 2}px Arial`
                        this.ctx.fillStyle = key.sharp ? 'white' : 'black'
                        this.ctx.textAlign = 'center'

                        // do two passes to render both sharps and flat names.
                        if (keyName.includes('#')) {
                            this.ctx.fillText(
                                keyName,
                                x + (key.sharp ? this.blackKeyWidth : this.whiteKeyWidth) / 2,
                                y + (key.sharp ? this.blackKeyHeight : this.whiteKeyHeight) - 30 - this.ctx.lineWidth
                            )
                        }

                        keyName = keyName.replace('C#', 'D♭')
                        keyName = keyName.replace('D#', 'E♭')
                        keyName = keyName.replace('F#', 'G♭')
                        keyName = keyName.replace('G#', 'A♭')
                        keyName = keyName.replace('A#', 'B♭')

                        this.ctx.fillText(
                            keyName,
                            x + (key.sharp ? this.blackKeyWidth : this.whiteKeyWidth) / 2,
                            y + (key.sharp ? this.blackKeyHeight : this.whiteKeyHeight) - 10 - this.ctx.lineWidth
                        )
                    }

                    let highlightScale = BASIC_PIANO_SCALES[gHighlightScaleNotes]
                    if (highlightScale && key.loaded) {
                        keyName = keyName.replace('C#', 'D♭')
                        keyName = keyName.replace('D#', 'E♭')
                        keyName = keyName.replace('F#', 'G♭')
                        keyName = keyName.replace('G#', 'A♭')
                        keyName = keyName.replace('A#', 'B♭')
                        let keynameNoOctave = keyName.slice(0, -1)
                        if (highlightScale.includes(keynameNoOctave)) {
                            let prev = this.ctx.globalAlpha
                            !gHyperMod.lsSettings.removeKeyFade ? this.ctx.globalAlpha = 0.3 : void 0
                            this.ctx.fillStyle = '#0f0'
                            if (key.sharp) {
                                this.ctx.fillRect(x, y, this.blackKeyWidth, this.blackKeyHeight)
                            } else {
                                this.ctx.fillRect(x, y, this.whiteKeyWidth, this.whiteKeyHeight)
                            }
                            !gHyperMod.lsSettings.removeKeyFade ? this.ctx.globalAlpha = prev : void 0
                        }
                    }

                    // render blips
                    if (key.blips.length > 0) {
                        var w, h
                        if (key.sharp) {
                            x += this.blackBlipX
                            y = this.blackBlipY
                            w = this.blackBlipWidth
                            h = this.blackBlipHeight
                        } else {
                            x += this.whiteBlipX
                            y = this.whiteBlipY
                            w = this.whiteBlipWidth
                            h = this.whiteBlipHeight
                        }
                        for (var b = 0; b < key.blips.length; b++) {
                            var blip = key.blips[b]
                            if (blip.time > timeBlipEnd) {
                                let alphaHex = Math.round((1 - (now - blip.time) / 1000) * 255).toString(16).padStart(2, '0')
                                this.ctx.fillStyle = blip.color + alphaHex
                                this.ctx.fillRect(x, y, w, h)
                            } else {
                                key.blips.splice(b, 1)
                                --b
                            }
                            y -= Math.floor(h * 1.1)
                        }
                    }
                }
            }
            !gHyperMod.lsSettings.removeKeyFade ? this.ctx.restore() : void 0
        }
        renderNoteLyrics() {
            // render lyric
            for (var part_id in this.noteLyrics) {
                if (!this.noteLyrics.hasOwnProperty(i)) continue
                var lyric = this.noteLyrics[part_id]
                var lyric_x = x
                var lyric_y = this.whiteKeyHeight + 1
                this.ctx.fillStyle = key.lyric.color
                var alpha = this.ctx.globalAlpha
                !gHyperMod.lsSettings.removeKeyFade ? this.ctx.globalAlpha = alpha - ((now - key.lyric.time) / 1000) * alpha : void 0
                this.ctx.fillRect(x, y, 10, 10)
            }
        }
        getHit(x, y) {
            for (var j = 0; j < 2; j++) {
                var sharp = j ? false : true // black keys first
                for (var i in this.piano.keys) {
                    if (!this.piano.keys.hasOwnProperty(i)) continue
                    var key = this.piano.keys[i]
                    if (key.sharp != sharp) continue
                    if (key.rect?.contains(x, y)) {
                        var v = y / (key.sharp ? this.blackKeyHeight : this.whiteKeyHeight)
                        v += 0.25
                        v *= DEFAULT_VELOCITY
                        if (v > 1.0) v = 1.0
                        return { key: key, v: v }
                    }
                }
            }
            return null
        }
        isSupported() {
            var canvas = document.createElement('canvas')
            return !!(canvas.getContext && canvas.getContext('2d'))
        }
    }

    // Soundpack Stuff by electrashave ♥

    ////////////////////////////////////////////////////////////////

    class SoundSelector {
        constructor(piano) {
            this.initialized = false
            this.keys = piano.keys
            this.loading = {}
            this.notification
            this.packs = []
            this.piano = piano
            this.soundSelection = localStorage.soundSelection ?? 'mppclassic'
            this.addPack({
                name: 'MPP Classic',
                keys: Object.keys(this.piano.keys),
                ext: '.mp3',
                url: 'assets/sounds/mppclassic/'
            })
        }
        addPack(pack, load) {
            this.loading[pack.url || pack] = true
            let add = (obj) => {
                let added = typeof this.packs.find((a) => obj.name === a.name) !== 'undefined'
                if (added) return console.warn(`Woah woah woah, pack \'${pack.name ?? pack}\' already exists!`) //no adding soundpacks twice D:<

                if (obj.url.substr(obj.url.length - 1) != '/') obj.url = obj.url + '/'
                let html = document.createElement('li')
                html.classList = 'pack'
                html.innerText = obj.name + ' (' + obj.keys.length + ' keys)'
                html.onclick = () => {
                    this.loadPack(obj.name)
                    this.notification.close()
                }
                obj.html = html
                this.packs.push(obj)
                this.packs.sort()
                if (load) this.loadPack(obj.name)
                delete this.loading[obj.url]
            }

            if (typeof pack == 'string') {
                let useDomain = true
                if (pack.match(/^(http|https):\/\//i)) useDomain = false
                $.getJSON(pack + '/info.json').done((json) => {
                    json.url = pack
                    add(json)
                })
            } else add(pack) //validate packs??
        }
        addPacks(packs) {
            for (var i = 0; packs.length > i; i++) this.addPack(packs[i])
        }
        init() {
            if (this.initialized) return console.warn('Sound selector already initialized!')
            $('#sound-btn').on('click', () => {
                if (document.getElementById('Notification-Sound-Selector') != null) return this.notification.close()
                var html = document.createElement('ul')
                //$(html).append("<p>Current Sound: " + self.soundSelection + "</p>");

                for (var i = 0; this.packs.length > i; i++) {
                    var pack = this.packs[i]
                    if (pack.name == this.soundSelection) pack.html.classList = 'pack enabled'
                    else pack.html.classList = 'pack'
                    pack.html.setAttribute('translated', '')
                    html.appendChild(pack.html)
                }

                this.notification = new SiteNotification({
                    title: 'Sound Selector',
                    html: html,
                    id: 'Sound-Selector',
                    duration: -1,
                    target: '#sound-btn'
                })
            })
            this.initialized = true
            this.loadPack(this.soundSelection, true)
        }
        loadPack(pack, f) {
            pack = this.packs.find((a) => pack === a.name)
            if (!pack) return

            if (typeof pack === 'string') {
                console.warn('Sound pack does not exist! Loading default pack...')
                return this.loadPack('MPP Classic')
            }
            if (pack.name === this.soundSelection && !f) return
            if (pack.keys.length != Object.keys(this.piano.keys).length) {
                this.piano.keys = {}
                for (var i = 0; pack.keys.length > i; i++) this.piano.keys[pack.keys[i]] = this.keys[pack.keys[i]]
                this.piano.renderer.resize()
            }
            for (var i in this.piano.keys) {
                if (!this.piano.keys.hasOwnProperty(i)) continue
                ;(() => {
                    var key = this.piano.keys[i]
                    key.loaded = false
                    let useDomain = true
                    if (pack.url.match(/^(http|https):\/\//i)) useDomain = false
                    this.piano.audio.load(key.note, pack.url + key.note + pack.ext, function () {
                        key.loaded = true
                        key.timeLoaded = Date.now()
                    })
                })()
            }
            if (localStorage) localStorage.soundSelection = pack.name
            this.soundSelection = pack.name
        }
        removePack(name) {
            var found = false
            for (var i = 0; this.packs.length > i; i++) {
                var pack = this.packs[i]
                if (pack.name == name) {
                    this.packs.splice(i, 1)
                    if (pack.name == this.soundSelection) this.loadPack(this.packs[0].name) //add mpp default if none?
                    break
                }
            }
            if (!found) console.warn('Sound pack not found!')
        }
    }

    // Pianoctor

    ////////////////////////////////////////////////////////////////

    class PianoKey {
        constructor(note, octave) {
            this.note = note + octave
            this.baseNote = note
            this.octave = octave
            this.sharp = note.indexOf('s') != -1
            this.loaded = false
            this.timeLoaded = 0
            this.domElement = null
            this.timePlayed = 0
            this.blips = []
        }
    }
    class Piano {
        constructor(rootElement) {
            this.rootElement = rootElement
        }
        init() {
            window.AudioContext = window.AudioContext || window.webkitAudioContext || undefined
            this.keys = {}

            var white_spatial = 0
            var black_spatial = 0
            var black_it = 0
            var black_lut = [2, 1, 2, 1, 1]
            var addKey = (note, octave) => {
                var key = new PianoKey(note, octave)
                this.keys[key.note] = key
                if (key.sharp) {
                    key.spatial = black_spatial
                    black_spatial += black_lut[black_it % 5]
                    ++black_it
                } else {
                    key.spatial = white_spatial
                    ++white_spatial
                }
            }
            if (test_mode) {
                addKey('c', 2)
            } else {
                addKey('a', -1)
                addKey('as', -1)
                addKey('b', -1)
                var notes = 'c cs d ds e f fs g gs a as b'.split(' ')
                for (var oct = 0; oct < 7; oct++) {
                    for (var i in notes) {
                        addKey(notes[i], oct)
                    }
                }
                addKey('c', 7)
            }
            this.audio = new AudioEngineWeb().init()
            this.renderer = new CanvasRenderer().init(this)
            window.addEventListener('resize', () => {
                this.renderer.resize()
            })
            return this
        }
        bufferPlay(note, vol, participant, delay_ms=0) {
            if (gHyperMod.lsSettings.trackNPS) gHyperMod.npsTracker.noteOn();
            if (!this.keys.hasOwnProperty(note) || !participant) return;
            const key = this.keys[note];
            key.lastHitTime = performance.now() + delay_ms;
            key.lastColor = participant.color;
            const limit = 17;

            // --- Visual circular buffer ---
            if (!key._blipBuffer) {
                key._blipBuffer = new Array(limit).fill(null);
                key._blipHead = 0;
                key._blipTail = 0;
                key._blipCount = 0;
            }

            // --- Audio immediate (play right away) ---
            if (key.loaded && this.audio.volume > 0) this.audio.play(key.note, vol, delay_ms, participant.id);

            // --- Initialize fixed-size circular buffers ---
            if (!this._midiBuffer) this._midiBuffer = { buf: new Array(500), head: 0, tail: 0, count: 0 };
            if (!this._blipBuffer) this._blipBuffer = { buf: new Array(1000), head: 0, tail: 0, count: 0 };

            // --- Enqueue MIDI with skip if full ---
            const midiBuf = this._midiBuffer;
            if (midiBuf.count < midiBuf.buf.length) {
                midiBuf.buf[midiBuf.tail] = { note: key.note, vol: vol * 100, delay: delay_ms, participantId: participant.id };
                midiBuf.tail = (midiBuf.tail + 1) % midiBuf.buf.length;
                midiBuf.count++;
            }

            // --- Enqueue Blip with skip if full ---
            const blipBuf = this._blipBuffer;
            if (blipBuf.count < blipBuf.buf.length) {
                blipBuf.buf[blipBuf.tail] = { key, color: participant.color, participant };
                blipBuf.tail = (blipBuf.tail + 1) % blipBuf.buf.length;
                blipBuf.count++;
            }

            // --- Flusher loop ---
            if (!this._flusherRunning) {
                this._flusherRunning = true;

                const flush = () => {
                    const midiPerFrame = 125;   // flush max 50 MIDI notes per frame
                    const blipPerFrame = 250;   // flush max 20 blips per frame

                    // --- MIDI flush ---
                    for (let i = 0; i < midiPerFrame && midiBuf.count > 0; i++) {
                        const ev = midiBuf.buf[midiBuf.head];
                        gMidi.noteOn(ev.note, ev.vol, ev.delay, ev.participantId);
                        midiBuf.head = (midiBuf.head + 1) % midiBuf.buf.length;
                        midiBuf.count--;
                    }

                    // --- Blip flush ---
                    for (let i = 0; i < blipPerFrame && blipBuf.count > 0; i++) {
                        const ev = blipBuf.buf[blipBuf.head];
                        const k = ev.key;
                        const timeNow = Date.now();

                        k._blipBuffer[k._blipTail] = { time: timeNow, color: ev.color };
                        k._blipTail = (k._blipTail + 1) % limit;
                        if (k._blipCount < limit) k._blipCount++;
                        else k._blipHead = (k._blipHead + 1) % limit;

                        k.blips = [];
                        for (let j = 0; j < k._blipCount; j++)
                            k.blips.push(k._blipBuffer[(k._blipHead + j) % limit]);

                        if (!gHyperMod.lsSettings.removeNameBouncing && ev.participant.nameDiv && !ev.participant.nameDiv.__isBouncing) {
                            const div = ev.participant.nameDiv;
                            div.__isBouncing = true;
                            div.classList.add("play");
                            setTimeout(() => { div.classList.remove("play"); div.__isBouncing = false; }, 30);
                        }

                        blipBuf.head = (blipBuf.head + 1) % blipBuf.buf.length;
                        blipBuf.count--;
                    }

                    // --- continue only if buffers not empty ---
                    if (midiBuf.count > 0 || blipBuf.count > 0) requestAnimationFrame(flush);
                    else this._flusherRunning = false;
                };

                requestAnimationFrame(flush);
            }
        }
        play(note, vol, participant, delay_ms=0) {
            if (gHyperMod.lsSettings.trackNPS) gHyperMod.npsTracker.noteOn()
            if (!this.keys.hasOwnProperty(note) || !participant) return
            var key = this.keys[note]
            if (key.loaded && this.audio.volume > 0 && !gHyperMod.lsSettings.disableAudioEngine) this.audio.play(key.note, vol, delay_ms, participant.id)
            gMidi.noteOn(key.note, vol * 100, delay_ms, participant.id)
            // redunant, but idc
            if (delay_ms <= 0) {
                // spawn a blip
                let limit = gHyperMod.lsSettings.blipLimit
                key.timePlayed = Date.now()
                if (gHyperMod.lsSettings.enableBlipLimit && key.blips.length >= limit)
                    key.blips.shift()
                key.blips.push({ time: key.timePlayed, color: participant.color })
                // bounce player's name, if enabled
                if (!gHyperMod.lsSettings.removeNameBouncing) {
                    var jq_namediv = $(participant.nameDiv)
                    jq_namediv.addClass('play')
                    setTimeout(function () {
                        jq_namediv.removeClass('play')
                    }, 30)
                }
            } else
                setTimeout(() => {
                    // spawn a blip
                    let limit = gHyperMod.lsSettings.blipLimit
                    key.timePlayed = Date.now()
                    if (gHyperMod.lsSettings.enableBlipLimit && key.blips.length >= limit)
                        key.blips.shift()
                    key.blips.push({ time: key.timePlayed, color: participant.color })
                    // bounce player's name, if enabled
                    if (!gHyperMod.lsSettings.removeNameBouncing) {
                        var jq_namediv = $(participant.nameDiv)
                        jq_namediv.addClass('play')
                        setTimeout(function () {
                            jq_namediv.removeClass('play')
                        }, 30)
                    }
                }, delay_ms)
        }
        stop(note, participant, delay_ms=0) {
            if (!this.keys.hasOwnProperty(note)) return
            var key = this.keys[note]
            if (key.loaded && this.audio.volume > 0 && !gHyperMod.lsSettings.disableAudioEngine) this.audio.stop(key.note, delay_ms, participant.id)
            gMidi.noteOff(key.note, delay_ms, participant.id)
        }
    }
    var gPiano = new Piano($('#piano')[0]).init()

    var gSoundSelector = new SoundSelector(gPiano)
    gSoundSelector.addPacks([
        'assets/sounds/Emotional/',
        'assets/sounds/Emotional_2.0/',
        'assets/sounds/GreatAndSoftPiano/',
        'assets/sounds/HardAndToughPiano/',
        'assets/sounds/HardPiano/',
        'assets/sounds/Harp/',
        'assets/sounds/Harpsicord/',
        'assets/sounds/LoudAndProudPiano/',
        'assets/sounds/MLG/',
        'assets/sounds/Music_Box/',
        'assets/sounds/NewPiano/',
        'assets/sounds/Orchestra/',
        'assets/sounds/Piano2/',
        'assets/sounds/PianoSounds/',
        'assets/sounds/Rhodes_MK1/',
        'assets/sounds/SoftPiano/',
        'assets/sounds/Steinway_Grand/',
        'assets/sounds/Untitled/',
        'assets/sounds/Vintage_Upright/',
        'assets/sounds/Vintage_Upright_Soft/'
    ])
    //gSoundSelector.addPacks(["/sounds/Emotional_2.0/", "/sounds/Harp/", "/sounds/Music_Box/", "/sounds/Vintage_Upright/", "/sounds/Steinway_Grand/", "/sounds/Emotional/", "/sounds/Untitled/"]);
    gSoundSelector.init()

    let keyboard = new class Keyboard {
        sustain = false
        autoSustain = false
        heldNotes = {}
        sustainNotes = {}
        press(id, vol) {
            if (gClient.preventsPlaying() || gNoteQuota.points - 1 <= 0)
                return
            this.heldNotes[id] = true
            if ((this.sustain || this.autoSustain) && !enableSynth)
                this.sustainNotes[id] = true;

            if (gHyperMod.lsSettings.enableBufferedBlips)
                gPiano.bufferPlay(id, vol !== undefined ? vol : DEFAULT_VELOCITY, gClient.getOwnParticipant(), 0)
            else
                gPiano.play(id, vol !== undefined ? vol : DEFAULT_VELOCITY, gClient.getOwnParticipant(), 0)
            gClient.startNote(id, vol)
            gNoteQuota.spend(1)
        }
        release(id) {
            if (!this.heldNotes[id])
                return
            this.heldNotes[id] = false
            if ((this.sustain || this.autoSustain) && !enableSynth)
                return this.sustainNotes[id] = true
            if (gNoteQuota.points - 1 <= 0)
                return
            gPiano.stop(id, gClient.getOwnParticipant(), 0)
            gClient.stopNote(id)
            gNoteQuota.spend(1)
        }
        sustainDown() {
            if (this.autoSustain)
                return
            this.sustain = true
        }
        sustainUp() {
            if (this.autoSustain)
                return
            this.sustain = false
            for (let key in this.sustainNotes) {
                if (!key || !this.sustainNotes[key])
                    continue
                if (gNoteQuota.points - 1 <= 0)
                    continue
                gPiano.stop(key, gClient.getOwnParticipant(), 0)
                gClient.stopNote(key)
                gNoteQuota.spend(1)
            }
            this.sustainNotes = {}
        }
    }
    function getParameterByName(name, url = window.location.href) {
        name = name.replace(/[\[\]]/g, '\\$&')
        var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
            results = regex.exec(url)
        if (!results) return null
        if (!results[2]) return ''
        return decodeURIComponent(results[2].replace(/\+/g, ' '))
    }

    //html/css overrides for multiplayerpiano.com
    if (window.location.hostname === 'multiplayerpiano.com') {
        //disable autocomplete
        $('#chat-input')[0].autocomplete = 'off'
        //add rules button
        let aElement = document.createElement('a')
        aElement.href = 'https://docs.google.com/document/d/1wQvGwQdaI8PuEjSWxKDDThVIoAlCYIxQOyfyi4o6HcM/edit?usp=sharing'
        aElement.title = 'Multiplayer Piano Rules'
        aElement.target = '_blank'
        let buttonElement = document.createElement('button')
        buttonElement.style =
            'height: 24px; font-size: 12px; background: #111; border: 1px solid #444; padding: 5px; cursor: pointer; line-height: 12px; border-radius: 2px; -webkit-border-radius: 2px; -moz-border-radius: 2px; overflow: hidden; white-space: nowrap; color: #fff; position: absolute; right: 6px; top: 0px; z-index: 20001;'
        buttonElement.innerText = 'Rules'
        aElement.appendChild(buttonElement)
        document.body.appendChild(aElement)
    }

    function getRoomNameFromURL() {
        let channel_id = decodeURIComponent(window.location.search).replace('?c=', '')
        if (channel_id.substr(0, 1) == '/') channel_id = channel_id.substr(1)
        if (!channel_id) {
            channel_id = getParameterByName('c')
        }
        if (!channel_id) channel_id = 'lobby'
        return channel_id
    }

    // internet science

    ////////////////////////////////////////////////////////////////

    var channel_id = getRoomNameFromURL()

    var loginInfo
    if (getParameterByName('callback') === 'discord') {
        var code = getParameterByName('code')
        if (code) {
            loginInfo = {
                type: 'discord',
                code
            }
        }
        history.pushState({ name: 'lobby' }, 'Piano > lobby', '/')
        channel_id = 'lobby'
    }

    var wssport = 8443
    var gClient = new Client(gHyperMod.lsSettings.connectUrl ?? 'wss://mppclone.com')
    if (loginInfo) {
        gClient.setLoginInfo(loginInfo)
    }
    gClient.setChannel(channel_id)

    gClient.on('disconnect', function (evt) {
        //console.log(evt);
    })

    var tabIsActive = true
    var youreMentioned = false
    var youreReplied = false

    window.addEventListener('focus', function (event) {
        tabIsActive = true
        youreMentioned = false
        youreReplied = false
        var count = Object.keys(MPP.client.ppl).length
        if (count > 0) {
            document.title = 'Piano (' + count + ')'
        } else {
            document.title = 'Multiplayer Piano'
        }
    })

    window.addEventListener('blur', function (event) {
        tabIsActive = false
    })

    // Setting status
    ;(function () {
        gClient.on('status', function (status) {
            $('#status').text(status)
        })
        gClient.on('count', function (count) {
            if (count > 0) {
                $('#status').html(
                    '<span class="number" translated>' +
                        count +
                        '</span> ' +
                        window.i18nextify.i18next.t('people are playing', { count })
                )
                if (!tabIsActive) {
                    if (youreMentioned || youreReplied) {
                        return
                    }
                }
                document.title = 'Piano (' + count + ')'
            } else {
                document.title = 'Multiplayer Piano'
            }
        })
    })()

    // Show moderator buttons
    ;(function () {
        let receivedHi = false
        gClient.on('hi', function (msg) {
            if (receivedHi) return
            receivedHi = true
            if (!msg.motd) msg.motd = 'This site makes a lot of sound! You may want to adjust the volume before continuing.'
            document.getElementById('motd-text').innerHTML = msg.motd
            openModal('#motd')
            $(document).off('keydown', modalHandleEsc)
            var user_interact = function (evt) {
                if (
                    (evt.path || (evt.composedPath && evt.composedPath())).includes(document.getElementById('motd')) ||
                    evt.target === document.getElementById('motd')
                ) {
                    closeModal()
                }
                document.removeEventListener('click', user_interact)
                gPiano.audio.resume()
            }
            gClient.sendArray([{ m: '+custom' }]) // subscribe to custom messages
            document.addEventListener('click', user_interact)
            if (gClient.permissions.clearChat) {
                $('#clearchat-btn').show()
            }
            if (gClient.permissions.vanish) {
                $('#vanish-btn').show()
            } else {
                $('#vanish-btn').hide()
            }
        })
    })()

    var participantTouchhandler //declare this outside of the smaller functions so it can be used below and setup later

        // Handle changes to participants
    ;(function () {
        function setupParticipantDivs(part) {
            var hadNameDiv = Boolean(part.nameDiv)

            var nameDiv
            if (hadNameDiv) {
                nameDiv = part.nameDiv
                $(nameDiv).empty()
            } else {
                nameDiv = document.createElement('div')
                nameDiv.addEventListener('mousedown', (e) => participantTouchhandler(e, nameDiv))
                nameDiv.addEventListener('touchstart', (e) => participantTouchhandler(e, nameDiv))
                nameDiv.style.display = 'none'
                $(nameDiv).fadeIn(2000)
                nameDiv.id = 'namediv-' + part._id
                nameDiv.className = 'name'
                nameDiv.participantId = part.id
                $('#names')[0].appendChild(nameDiv)
                part.nameDiv = nameDiv
            }
            nameDiv.style.backgroundColor = part.color || '#777'
            var tagText = typeof part.tag === 'object' ? part.tag.text : part.tag
            if (tagText === 'BOT') nameDiv.title = 'This is an authorized bot.'
            if (tagText === 'MOD') nameDiv.title = 'This user is an official moderator of the site.'
            if (tagText === 'ADMIN') nameDiv.title = 'This user is an official administrator of the site.'
            if (tagText === 'OWNER') nameDiv.title = 'This user is the owner of the site.'
            if (tagText === 'MEDIA') nameDiv.title = 'This is a well known person on Twitch, Youtube, or another platform.'
            if (tagText === 'DEV') nameDiv.title = 'This user has contributed code to the site.'

            updateLabels(part)

            var hasOtherDiv = false
            if (part.vanished) {
                hasOtherDiv = true
                var vanishDiv = document.createElement('div')
                vanishDiv.className = 'nametag'
                vanishDiv.textContent = 'VANISH'
                vanishDiv.style.backgroundColor = '#00ffcc'
                vanishDiv.id = 'namevanish-' + part._id
                part.nameDiv.appendChild(vanishDiv)
            }
            if (part.tag) {
                hasOtherDiv = true
                var tagDiv = document.createElement('div')
                tagDiv.className = 'nametag'
                tagDiv.textContent = tagText || ''
                tagDiv.style.backgroundColor = tagColor(part.tag)
                tagDiv.id = 'nametag-' + part._id
                part.nameDiv.appendChild(tagDiv)
            }
            if (part.afk) {
                var afkDiv = document.createElement('div')
                afkDiv.className = 'nametag'
                afkDiv.textContent = 'AFK'
                afkDiv.style.backgroundColor = '#00000040'
                afkDiv.style['margin-left'] = '5px'
                afkDiv.style['margin-right'] = '0px'
                afkDiv.style.float = 'right'
                afkDiv.id = 'afktag-' + part._id
                part.nameDiv.appendChild(afkDiv)
            }

            var textDiv = document.createElement('div')
            textDiv.className = 'nametext'
            textDiv.textContent = part.name || ''
            textDiv.id = 'nametext-' + part._id
            if (hasOtherDiv) textDiv.style.float = 'left'
            part.nameDiv.appendChild(textDiv)
            part.nameDiv.setAttribute('translated', '')

            var arr = $('#names .name')
            arr.sort(function (a, b) {
                if (a.id > b.id) return 1
                else if (a.id < b.id) return -1
                else return 0
            })
            $('#names').html(arr)
        }
        gClient.on('participant added', function (part) {
            if (shouldHideUser(part)) return

            part.displayX = 150
            part.displayY = 50
            var tagText = typeof part.tag === 'object' ? part.tag.text : part.tag

            // add nameDiv
            setupParticipantDivs(part)

            // add cursorDiv
            if ((gClient.participantId !== part.id || gSeeOwnCursor) && !gCursorHides.includes(part.id) && !gHideAllCursors) {
                var div = document.createElement('div')
                div.className = 'cursor'
                div.style.display = 'none'
                part.cursorDiv = $('#cursors')[0].appendChild(div)
                $(part.cursorDiv).fadeIn(2000)

                var div = document.createElement('div')
                div.className = 'name'
                div.style.backgroundColor = part.color || '#777'

                if (part.tag) {
                    var tagDiv = document.createElement('span')
                    tagDiv.className = 'curtag'
                    tagDiv.textContent = tagText || ''
                    tagDiv.style.backgroundColor = tagColor(part.tag)
                    tagDiv.id = 'nametag-' + part._id
                    div.appendChild(tagDiv)
                }

                var namep = document.createElement('span')
                namep.className = 'nametext'
                namep.textContent = part.name || ''
                // namep.style.backgroundColor = part.color || "#777"
                div.setAttribute('translated', '')
                div.appendChild(namep)
                part.cursorDiv.appendChild(div)
            } else {
                part.cursorDiv = undefined
            }
        })
        gClient.on('participant removed', function (part) {
            if (shouldHideUser(part)) return
            // remove nameDiv
            var nd = $(part.nameDiv)
            var cd = $(part.cursorDiv)
            cd.fadeOut(2000)
            nd.fadeOut(2000, function () {
                nd.remove()
                cd.remove()
                part.nameDiv = undefined
                part.cursorDiv = undefined
            })
        })
        gClient.on('participant update', function (part) {
            if (shouldHideUser(part)) return
            var name = part.name || ''
            var color = part.color || '#777'
            setupParticipantDivs(part)
            $(part.cursorDiv).find('.name .nametext').text(name)
            $(part.cursorDiv).find('.name').css('background-color', color)
        })
        gClient.on('ch', function (msg) {
            for (var id in gClient.ppl) {
                if (gClient.ppl.hasOwnProperty(id)) {
                    var part = gClient.ppl[id]
                    updateLabels(part)
                }
            }
        })
        gClient.on('participant added', function (part) {
            if (shouldHideUser(part)) return
            updateLabels(part)
        })
        function updateLabels(part) {
            if (part.id === gClient.participantId) {
                $(part.nameDiv).addClass('me')
            } else {
                $(part.nameDiv).removeClass('me')
            }
            if (gClient.channel.crown && gClient.channel.crown.participantId === part.id) {
                $(part.nameDiv).addClass('owner')
                $(part.cursorDiv).addClass('owner')
            } else {
                $(part.nameDiv).removeClass('owner')
                $(part.cursorDiv).removeClass('owner')
            }
            if (gPianoMutes.indexOf(part._id) !== -1) {
                $(part.nameDiv).addClass('muted-notes')
            } else {
                $(part.nameDiv).removeClass('muted-notes')
            }
            if (gChatMutes.indexOf(part._id) !== -1) {
                $(part.nameDiv).addClass('muted-chat')
            } else {
                $(part.nameDiv).removeClass('muted-chat')
            }
        }
        function tagColor(tag) {
            if (typeof tag === 'object') return tag.color
            if (tag === 'BOT') return '#55f'
            if (tag === 'OWNER') return '#a00'
            if (tag === 'ADMIN') return '#f55'
            if (tag === 'MOD') return '#0a0'
            if (tag === 'MEDIA') return '#f5f'
            return '#777'
        }
        function updateCursor(msg) {
            let part = gClient.ppl[msg.id]
            if (shouldHideUser(part)) return
            if (part && part.cursorDiv) {
                if (gSmoothCursor) {
                    part.cursorDiv.style.transform = 'translate3d(' + msg.x + 'vw, ' + msg.y + 'vh, 0)'
                } else {
                    part.cursorDiv.style.left = msg.x + '%'
                    part.cursorDiv.style.top = msg.y + '%'
                }
            }
        }
        gClient.on('m', updateCursor)
        gClient.on('participant added', updateCursor)
    })()

    // Handle changes to crown
    ;(function () {
        var jqcrown = $('<div id="crown"></div>').appendTo(document.body).hide()
        var jqcountdown = $('<span></span>').appendTo(jqcrown)
        var countdown_interval
        jqcrown.click(function () {
            gClient.sendArray([{ m: 'chown', id: gClient.participantId }])
        })
        gClient.on('ch', function (msg) {
            if (msg.ch.crown) {
                var crown = msg.ch.crown
                if (!crown.participantId || !gClient.ppl[crown.participantId]) {
                    var land_time = crown.time + 2000 - gClient.serverTimeOffset
                    var avail_time = crown.time + 15000 - gClient.serverTimeOffset
                    jqcountdown.text('')
                    jqcrown.show()
                    if (land_time - Date.now() <= 0) {
                        jqcrown.css({
                            left: crown.endPos.x + '%',
                            top: crown.endPos.y + '%'
                        })
                    } else {
                        jqcrown.css({
                            left: crown.startPos.x + '%',
                            top: crown.startPos.y + '%'
                        })
                        jqcrown.addClass('spin')
                        jqcrown.animate(
                            {
                                left: crown.endPos.x + '%',
                                top: crown.endPos.y + '%'
                            },
                            2000,
                            'linear',
                            function () {
                                jqcrown.removeClass('spin')
                            }
                        )
                    }
                    clearInterval(countdown_interval)
                    countdown_interval = setInterval(function () {
                        var time = Date.now()
                        if (time >= land_time) {
                            var ms = avail_time - time
                            if (ms > 0) {
                                jqcountdown.text(Math.ceil(ms / 1000) + 's')
                            } else {
                                jqcountdown.text('')
                                clearInterval(countdown_interval)
                            }
                        }
                    }, 1000)
                } else {
                    jqcrown.hide()
                }
            } else {
                jqcrown.hide()
            }
        })
        gClient.on('disconnect', function () {
            jqcrown.fadeOut(2000)
        })
    })()

    // Playing notes
    gClient.on('n', function (msg) {
        var t = msg.t - gClient.serverTimeOffset + TIMING_TARGET - Date.now()
        var participant = gClient.findParticipantById(msg.p)
        if (gPianoMutes.indexOf(participant._id) !== -1) return
        for (var i = 0; i < msg.n.length; i++) {
            var note = msg.n[i]
            var ms = t + (note.d || 0)
            if (ms < 0) {
                ms = 0
            } else if (ms > 10000) continue
            if (note.s) {
                gPiano.stop(note.n, participant, ms)
            } else {
                var vel = typeof note.v !== 'undefined' ? parseFloat(note.v) : DEFAULT_VELOCITY
                if (!vel) vel = 0
                else if (vel < 0) vel = 0
                else if (vel > 1) vel = 1;
                if (gHyperMod.lsSettings.enableBufferedBlips)
                    gPiano.bufferPlay(note.n, vel, participant, ms)
                else
                    gPiano.play(note.n, vel, participant, ms)
                if (enableSynth) {
                    gPiano.stop(note.n, participant, ms + 1000)
                }
            }
        }
    })

    // Send cursor updates
    var mx = 0,
        last_mx = -10,
        my = 0,
        last_my = -10
    setInterval(function () {
        if (Math.abs(mx - last_mx) > 0.1 || Math.abs(my - last_my) > 0.1) {
            last_mx = mx
            last_my = my
            gClient.sendArray([{ m: 'm', x: mx, y: my }])
            if (gSeeOwnCursor) {
                gClient.emit('m', {
                    m: 'm',
                    id: gClient.participantId,
                    x: mx,
                    y: my
                })
            }
            var part = gClient.getOwnParticipant()
            if (part) {
                part.x = mx
                part.y = my
            }
        }
    }, 50)
    $(document).mousemove(function (event) {
        mx = ((event.pageX / $(window).width()) * 100).toFixed(2)
        my = ((event.pageY / $(window).height()) * 100).toFixed(2)
    })

    // Room settings button
    ;(function () {
        gClient.on('ch', function (msg) {
            if (gClient.isOwner() || gClient.permissions.chsetAnywhere) {
                $('#room-settings-btn').show()
            } else {
                $('#room-settings-btn').hide()
            }
            if (
                !gClient.channel.settings.lobby &&
                (gClient.permissions.chownAnywhere || gClient.channel.settings.owner_id === gClient.user._id)
            ) {
                $('#getcrown-btn').show()
            } else {
                $('#getcrown-btn').hide()
            }
        })
        $('#room-settings-btn').click(function (evt) {
            if (gClient.channel && (gClient.isOwner() || gClient.permissions.chsetAnywhere)) {
                var settings = gClient.channel.settings
                openModal('#room-settings')
                setTimeout(function () {
                    $('#room-settings .checkbox[name=visible]').prop('checked', settings.visible)
                    $('#room-settings .checkbox[name=chat]').prop('checked', settings.chat)
                    $('#room-settings .checkbox[name=crownsolo]').prop('checked', settings.crownsolo)
                    $('#room-settings .checkbox[name=nocussing]').prop('checked', settings['no cussing'])
                    $('#room-settings input[name=color]').val(settings.color)
                    $('#room-settings input[name=color2]').val(settings.color2)
                    $('#room-settings .checkbox[name=noindex]').prop('checked', settings.noindex)
                    $('#room-settings .checkbox[name=allowBots]').prop('checked', settings.allowBots)
                    $('#room-settings input[name=limit]').val(settings.limit)
                }, 100)
            }
        })
        $('#room-settings .submit').click(function () {
            var settings = {
                visible: $('#room-settings .checkbox[name=visible]').is(':checked'),
                chat: $('#room-settings .checkbox[name=chat]').is(':checked'),
                crownsolo: $('#room-settings .checkbox[name=crownsolo]').is(':checked'),
                'no cussing': $('#room-settings .checkbox[name=nocussing]').is(':checked'),
                noindex: $('#room-settings .checkbox[name=noindex]').is(':checked'),
                allowBots: $('#room-settings .checkbox[name=allowBots]').is(':checked'),
                color: $('#room-settings input[name=color]').val(),
                color2: $('#room-settings input[name=color2]').val(),
                limit: $('#room-settings input[name=limit]').val()
            }
            gClient.setChannelSettings(settings)
            closeModal()
        })
        $('#room-settings .drop-crown').click(function () {
            closeModal()
            if (confirm('This will drop the crown...!')) gClient.sendArray([{ m: 'chown' }])
        })
    })()

    // Clear chat button
    $('#clearchat-btn').click(function (evt) {
        if (confirm('Are you sure you want to clear chat?')) gClient.sendArray([{ m: 'clearchat' }])
    })

    // Get crown button
    $('#getcrown-btn').click(function (evt) {
        gClient.sendArray([{ m: 'chown', id: MPP.client.getOwnParticipant().id }])
    })

    // Vanish or unvanish button
    $('#vanish-btn').click(function (evt) {
        gClient.sendArray([{ m: 'v', vanish: !gClient.getOwnParticipant().vanished }])
    })
    gClient.on('participant update', (part) => {
        if (part._id === gClient.getOwnParticipant()._id) {
            if (part.vanished) {
                $('#vanish-btn').text('Unvanish')
            } else {
                $('#vanish-btn').text('Vanish')
            }
        }
    })
    gClient.on('participant added', (part) => {
        if (part._id === gClient.getOwnParticipant()._id) {
            if (part.vanished) {
                $('#vanish-btn').text('Unvanish')
            } else {
                $('#vanish-btn').text('Vanish')
            }
        }
    })

    // Handle notifications
    gClient.on('notification', function (msg) {
        new SiteNotification(msg)
    })

    // Don't foget spin
    gClient.on('ch', function (msg) {
        var chidlo = msg.ch._id.toLowerCase()
        if (chidlo === 'spin' || chidlo.substr(-5) === '/spin') {
            $('#piano').addClass('spin')
        } else {
            $('#piano').removeClass('spin')
        }
    })

    /*function eb() {
    if(gClient.channel && gClient.channel._id.toLowerCase() === "test/fishing") {
      ebsprite.start(gClient);
    } else {
      ebsprite.stop();
    }
  }
  if(ebsprite) {
    gClient.on("ch", eb);
    eb();
  }*/

    // Crownsolo notice
    gClient.on('ch', function (msg) {
        let notice = ''
        let has_notice = false
        if (msg.ch.settings.crownsolo) {
            has_notice = true
            notice += '<p>This room is set to "only the owner can play."</p>'
        }
        if (msg.ch.settings['no cussing']) {
            has_notice = true
            notice += '<p>This room is set to "no cussing."</p>'
        }
        let notice_div = $('#room-notice')
        if (has_notice) {
            notice_div.html(notice)
            if (notice_div.is(':hidden')) notice_div.fadeIn(1000)
        } else {
            if (notice_div.is(':visible')) notice_div.fadeOut(1000)
        }
    })
    gClient.on('disconnect', function () {
        $('#room-notice').fadeOut(1000)
    })

    var gPianoMutes = (localStorage.pianoMutes ? localStorage.pianoMutes : '').split(',').filter((v) => v)
    var gChatMutes = (localStorage.chatMutes ? localStorage.chatMutes : '').split(',').filter((v) => v)
    var gShowIdsInChat = localStorage.showIdsInChat == 'true'
    var gShowTimestampsInChat = localStorage.showTimestampsInChat == 'true'
    var gNoChatColors = localStorage.noChatColors == 'true'
    var gNoBackgroundColor = localStorage.noBackgroundColor == 'true'
    var gOutputOwnNotes = localStorage.outputOwnNotes ? localStorage.outputOwnNotes == 'true' : true
    var gVirtualPianoLayout = localStorage.virtualPianoLayout == 'true'
    var gSmoothCursor = localStorage.smoothCursor == 'true'
    var gShowChatTooltips = localStorage.showChatTooltips == 'true'
    var gShowPianoNotes = localStorage.showPianoNotes == 'true'
    var gHighlightScaleNotes = localStorage.highlightScaleNotes
    var gCursorHides = (localStorage.cursorHides ? localStorage.cursorHides : '').split(',').filter((v) => v)
    var gHideAllCursors = localStorage.hideAllCursors == 'true'
    var gHidePiano = localStorage.hidePiano == 'true'
    var gHideChat = localStorage.hideChat == 'true'
    var gNoPreventDefault = localStorage.noPreventDefault == 'true'
    var gHideBotUsers = localStorage.hideBotUsers == 'true'
    var gSnowflakes = new Date().getMonth() === 11 && localStorage.snowflakes !== 'false'

    //   var gWarnOnLinks = localStorage.warnOnLinks ? loalStorage.warnOnLinks == "true" : true;
    var gDisableMIDIDrumChannel = localStorage.disableMIDIDrumChannel ? localStorage.disableMIDIDrumChannel == 'true' : true

    function shouldShowSnowflakes() {
        let snowflakes = document.querySelector('.snowflakes')
        if (gSnowflakes) {
            snowflakes.style.visibility = 'visible'
        } else {
            snowflakes.style.visibility = 'hidden'
        }
    }

    shouldShowSnowflakes()
    // This code is not written specficially for readibility, it is a heavily used function and performance matters.
    // If someone finds this code and knows a more performant way to do this (with proof of it being more performant)
    // it may be replaced with the more performant code.
    // Returns true if we should hide the user, and returns false when we should not.
    function shouldHideUser(user) {
        if (gHideBotUsers) {
            if (user) {
                if (user.tag && user.tag.text === 'BOT') {
                    return true
                } else {
                    return false
                }
            }
        } else {
            return false
        }
    }

    // Hide piano attribute
    if (gHidePiano) {
        $('#piano').hide()
    } else {
        $('#piano').show()
    }

    // Hide chat attribute
    if (gHideChat) {
        $('#chat').hide()
    } else {
        $('#chat').show()
    }

    // smooth cursor attribute

    if (gSmoothCursor) {
        $('#cursors').attr('smooth-cursors', '')
    } else {
        $('#cursors').removeAttr('smooth-cursors')
    }

    // Background color
    ;(function () {
        var old_color1 = new Color('#000000')
        var old_color2 = new Color('#000000')
        function setColor(hex, hex2) {
            var color1 = new Color(hex)
            var color2 = new Color(hex2 || hex)
            if (!hex2) color2.add(-0x40, -0x40, -0x40)

            var bottom = document.getElementById('bottom')

            document.body.style.setProperty('--color', color1.toHexa())
            document.body.style.setProperty('--color2', color2.toHexa())

            bottom.style.setProperty('--color', color1.toHexa())
            bottom.style.setProperty('--color2', color2.toHexa())
        }

        function setColorToDefault() {
            setColor('#220022', '#000022')
        }

        window.setBackgroundColor = setColor
        window.setBackgroundColorToDefault = setColorToDefault

        setColorToDefault()

        gClient.on('ch', function (ch) {
            if (gNoBackgroundColor) {
                setColorToDefault()
                return
            }
            if (ch.ch.settings) {
                if (ch.ch.settings.color) {
                    setColor(ch.ch.settings.color, ch.ch.settings.color2)
                } else {
                    setColorToDefault()
                }
            }
        })
    })()

    var volume_slider = document.getElementById('volume-slider')
    volume_slider.value = gPiano.audio.volume
    $('#volume-label').text('Volume: ' + Math.floor(gPiano.audio.volume * 100) + '%')
    volume_slider.addEventListener('input', function (evt) {
        var v = +volume_slider.value
        gPiano.audio.setVolume(v)
        if (window.localStorage) localStorage.volume = v
        $('#volume-label').text('Volume: ' + Math.floor(v * 100) + '%')
    })

    class Note {
        constructor(note, octave) {
            this.note = note
            this.octave = octave || 0
        }
    }

    var n = function (a, b) {
        return { note: new Note(a, b), held: false }
    }

    var layouts = {
        MPP: {
            65: n('gs'),
            90: n('a'),
            83: n('as'),
            88: n('b'),
            67: n('c', 1),
            70: n('cs', 1),
            86: n('d', 1),
            71: n('ds', 1),
            66: n('e', 1),
            78: n('f', 1),
            74: n('fs', 1),
            77: n('g', 1),
            75: n('gs', 1),
            188: n('a', 1),
            76: n('as', 1),
            190: n('b', 1),
            191: n('c', 2),
            222: n('cs', 2),

            49: n('gs', 1),
            81: n('a', 1),
            50: n('as', 1),
            87: n('b', 1),
            69: n('c', 2),
            52: n('cs', 2),
            82: n('d', 2),
            53: n('ds', 2),
            84: n('e', 2),
            89: n('f', 2),
            55: n('fs', 2),
            85: n('g', 2),
            56: n('gs', 2),
            73: n('a', 2),
            57: n('as', 2),
            79: n('b', 2),
            80: n('c', 3),
            189: n('cs', 3),
            173: n('cs', 3), // firefox why
            219: n('d', 3),
            187: n('ds', 3),
            61: n('ds', 3), // firefox why
            221: n('e', 3)
        },
        VP: {
            112: n('c', -1),
            113: n('d', -1),
            114: n('e', -1),
            115: n('f', -1),
            116: n('g', -1),
            117: n('a', -1),
            118: n('b', -1),

            49: n('c'),
            50: n('d'),
            51: n('e'),
            52: n('f'),
            53: n('g'),
            54: n('a'),
            55: n('b'),
            56: n('c', 1),
            57: n('d', 1),
            48: n('e', 1),
            81: n('f', 1),
            87: n('g', 1),
            69: n('a', 1),
            82: n('b', 1),
            84: n('c', 2),
            89: n('d', 2),
            85: n('e', 2),
            73: n('f', 2),
            79: n('g', 2),
            80: n('a', 2),
            65: n('b', 2),
            83: n('c', 3),
            68: n('d', 3),
            70: n('e', 3),
            71: n('f', 3),
            72: n('g', 3),
            74: n('a', 3),
            75: n('b', 3),
            76: n('c', 4),
            90: n('d', 4),
            88: n('e', 4),
            67: n('f', 4),
            86: n('g', 4),
            66: n('a', 4),
            78: n('b', 4),
            77: n('c', 5)
        }
    }

    var key_binding = gVirtualPianoLayout ? layouts.VP : layouts.MPP

    var capsLockKey = false

    var transpose = 0

    function handleKeyDown(evt) {
        if (evt.target.type) return
        //console.log(evt);
        var code = parseInt(evt.keyCode)
        let keys = Object.keys(gPiano.keys)
        if (key_binding[code] !== undefined) {
            var binding = key_binding[code]
            if (!binding.held) {
                binding.held = true

                var note = binding.note
                var octave = 1 + note.octave
                if (!gVirtualPianoLayout) {
                    if (evt.shiftKey) ++octave
                    else if (capsLockKey || evt.ctrlKey) --octave
                    else if (evt.altKey) octave += 2
                }
                note = note.note + octave
                var index = keys.indexOf(note)
                if (gVirtualPianoLayout && evt.shiftKey) {
                    note = keys[index + transpose + 1]
                } else note = keys[index + transpose]
                if (note === undefined) return
                var vol = velocityFromMouseY()
                keyboard.press(note, vol)
            }

            if (++gKeyboardSeq == 3) {
                gKnowsYouCanUseKeyboard = true
                if (window.gKnowsYouCanUseKeyboardTimeout) clearTimeout(gKnowsYouCanUseKeyboardTimeout)
                if (localStorage) localStorage.knowsYouCanUseKeyboard = true
                if (window.gKnowsYouCanUseKeyboardNotification) gKnowsYouCanUseKeyboardNotification.close()
            }

            if (!gNoPreventDefault) evt.preventDefault()
            evt.stopPropagation()
            return false
        } else if (code == 0x14) {
            // Caps Lock
            capsLockKey = true
            if (!gNoPreventDefault) evt.preventDefault()
        } else if (code == 0x20) {
            // Space Bar
            keyboard.sustainDown()
            if (!gNoPreventDefault) evt.preventDefault()
        } else if (code === 38 && transpose <= 100) {
            transpose += 12
            sendTransposeNotif()
        } else if (code === 40 && transpose >= -100) {
            transpose -= 12
            sendTransposeNotif()
        } else if (code === 39 && transpose < 100) {
            transpose++
            sendTransposeNotif()
        } else if (code === 37 && transpose > -100) {
            transpose--
            sendTransposeNotif()
        } else if (code == 9) {
            // Tab (don't tab away from the piano)
            if (!gNoPreventDefault) evt.preventDefault()
        } else if (code == 8) {
            // Backspace (don't navigate Back)
            keyboard.autoSustain = !keyboard.autoSustain
            if (!keyboard.autoSustain)
                keyboard.sustainUp()
            if (!gNoPreventDefault) evt.preventDefault()
        }
    }

    function sendTransposeNotif() {
        new SiteNotification({
            title: 'Transposing',
            html: 'Transpose level: ' + transpose,
            target: '#midi-btn',
            duration: 1500
        })
    }

    function handleKeyUp(evt) {
        if (evt.target.type) return
        var code = parseInt(evt.keyCode)
        let keys = Object.keys(gPiano.keys)
        if (key_binding[code] !== undefined) {
            var binding = key_binding[code]
            if (binding.held) {
                binding.held = false

                var note = binding.note
                var octave = 1 + note.octave
                if (!gVirtualPianoLayout) {
                    if (evt.shiftKey) ++octave
                    else if (capsLockKey || evt.ctrlKey) --octave
                    else if (evt.altKey) octave += 2
                }
                note = note.note + octave
                var index = keys.indexOf(note)
                if (gVirtualPianoLayout && evt.shiftKey) {
                    note = keys[index + transpose + 1]
                } else note = keys[index + transpose]
                if (note === undefined) return
                keyboard.release(note)
            }

            if (!gNoPreventDefault) evt.preventDefault()
            evt.stopPropagation()
            return false
        } else if (code == 20) {
            // Caps Lock
            capsLockKey = false
            if (!gNoPreventDefault) evt.preventDefault()
        } else if (code === 0x20) {
            // Space Bar
            keyboard.sustainUp()
            if (!gNoPreventDefault) evt.preventDefault()
        }
    }

    function handleKeyPress(evt) {
        if (evt.target.type) return
        if (!gNoPreventDefault) evt.preventDefault()
        evt.stopPropagation()
        if (evt.keyCode == 27 || evt.keyCode == 13) {
            //$("#chat input").focus();
        }
        return false
    }

    var recapListener = function (evt) {
        captureKeyboard()
    }

    var capturingKeyboard = false

    function captureKeyboard() {
        if (!capturingKeyboard) {
            capturingKeyboard = true
            $('#piano').off('mousedown', recapListener)
            $('#piano').off('touchstart', recapListener)
            $(document).on('keydown', handleKeyDown)
            $(document).on('keyup', handleKeyUp)
            $(window).on('keypress', handleKeyPress)
        }
    }

    function releaseKeyboard() {
        if (capturingKeyboard) {
            capturingKeyboard = false
            $(document).off('keydown', handleKeyDown)
            $(document).off('keyup', handleKeyUp)
            $(window).off('keypress', handleKeyPress)
            $('#piano').on('mousedown', recapListener)
            $('#piano').on('touchstart', recapListener)
        }
    }

    captureKeyboard()

    var velocityFromMouseY = function () {
        return 0.1 + (my / 100) * 0.6
    }

    // NoteQuota
    var gNoteQuota = do {
        var last_rat = 0
        var nqjq = $('#quota .value')
        new NoteQuota(function (points) {
            // update UI
            var rat = (points / this.max) * 100
            if (rat <= last_rat) nqjq.stop(true, true).css('width', rat.toFixed(0) + '%')
            else nqjq.stop(true, true).animate({ width: rat.toFixed(0) + '%' }, 2000, 'linear')
            last_rat = rat
        })
    }
    let normalNoteQuotaParams = NoteQuota.PARAMS_NORMAL
    if (gHyperMod.lsSettings.forceInfNoteQuota) {
        gClient.on('nq', function(nq_params) {
            normalNoteQuotaParams = nq_params
            gNoteQuota.setParams(NoteQuota.PARAMS_INFINITE)
        })
        gClient.on('disconnect', function () {
            normalNoteQuotaParams = NoteQuota.PARAMS_OFFLINE
            gNoteQuota.setParams(NoteQuota.PARAMS_INFINITE)
        })
    } else {
        gClient.on('nq', function(nq_params) {
            normalNoteQuotaParams = nq_params
            gNoteQuota.setParams(nq_params)
        })
        gClient.on('disconnect', function () {
            normalNoteQuotaParams = NoteQuota.PARAMS_OFFLINE
            gNoteQuota.setParams(NoteQuota.PARAMS_OFFLINE)
        })
    }

    //DMs
    var gDmParticipant
    var gIsDming = false
    var gKnowsHowToDm = localStorage.knowsHowToDm === 'true'
    gClient.on('participant removed', (part) => {
        if (gIsDming && part._id === gDmParticipant._id) {
            chat.endDM()
            chat.endDM()
        }
    })

    //Replies

    var gReplyParticipant
    var gIsReplying = false
    var gMessageId
    gClient.on(`participant removed`, (part) => {
        if (gIsReplying && part._id === gReplyParticipant._id) {
            MPP.chat.cancelReply()
        }
    })

    // click participant names
    ;(function () {
        participantTouchhandler = function (e, ele) {
            var target = ele
            var target_jq = $(target)
            if (!target_jq) return
            if (target_jq.hasClass('name')) {
                target_jq.addClass('play')
                var id = target.participantId
                if (id == gClient.participantId) {
                    openModal('#rename', 'input[name=name]')
                    setTimeout(function () {
                        $('#rename input[name=name]').val(gClient.ppl[gClient.participantId].name)
                        $('#rename input[name=color]').val(gClient.ppl[gClient.participantId].color)
                    }, 100)
                } else if (id) {
                    var part = gClient.ppl[id] || null
                    if (part) {
                        participantMenu(part)
                        e.stopPropagation()
                    }
                }
            }
        }
        var releasehandler = function (e) {
            $('#names .name').removeClass('play')
        }
        document.body.addEventListener('mouseup', releasehandler)
        document.body.addEventListener('touchend', releasehandler)

        var removeParticipantMenus = function () {
            $('.participant-menu').remove()
            $('.participantSpotlight').hide()
            document.removeEventListener('mousedown', removeParticipantMenus)
            document.removeEventListener('touchstart', removeParticipantMenus)
        }

        var participantMenu = function (part) {
            if (!part) return
            removeParticipantMenus()
            document.addEventListener('mousedown', removeParticipantMenus)
            document.addEventListener('touchstart', removeParticipantMenus)
            $('#' + part.id)
                .find('.enemySpotlight')
                .show()
            var menu = $('<div class="participant-menu"></div>')
            $('body').append(menu)
            // move menu to name position
            var jq_nd = $(part.nameDiv)
            var pos = jq_nd.position()
            menu.css({
                top: pos.top + jq_nd.height() + 15,
                left: pos.left + 6,
                background: part.color || 'black'
            })
            menu.on('mousedown touchstart', function (evt) {
                evt.stopPropagation()
                var target = $(evt.target)
                if (target.hasClass('menu-item')) {
                    target.addClass('clicked')
                    menu.fadeOut(200, function () {
                        removeParticipantMenus()
                    })
                }
            })
            // this spaces stuff out but also can be used for informational
            $('<div class="info"></div>')
                .appendTo(menu)
                .text(part._id)
                .on('mousedown touchstart', (evt) => {
                    navigator.clipboard.writeText(part._id)
                    evt.target.innerText = 'Copied!'
                    setTimeout(() => {
                        evt.target.innerText = part._id
                    }, 2500)
                })
            // add menu items
            if (gPianoMutes.indexOf(part._id) == -1) {
                $(`<div class="menu-item">${window.i18nextify.i18next.t('Mute Notes')}</div>`)
                    .appendTo(menu)
                    .on('mousedown touchstart', function (evt) {
                        gPianoMutes.push(part._id)
                        if (localStorage) localStorage.pianoMutes = gPianoMutes.join(',')
                        $(part.nameDiv).addClass('muted-notes')
                    })
            } else {
                $(`<div class="menu-item">${window.i18nextify.i18next.t('Unmute Notes')}</div>`)
                    .appendTo(menu)
                    .on('mousedown touchstart', function (evt) {
                        var i
                        while ((i = gPianoMutes.indexOf(part._id)) != -1) gPianoMutes.splice(i, 1)
                        if (localStorage) localStorage.pianoMutes = gPianoMutes.join(',')
                        $(part.nameDiv).removeClass('muted-notes')
                    })
            }
            if (gChatMutes.indexOf(part._id) == -1) {
                $(`<div class="menu-item">${window.i18nextify.i18next.t('Mute Chat')}</div>`)
                    .appendTo(menu)
                    .on('mousedown touchstart', function (evt) {
                        gChatMutes.push(part._id)
                        if (localStorage) localStorage.chatMutes = gChatMutes.join(',')
                        $(part.nameDiv).addClass('muted-chat')
                    })
            } else {
                $(`<div class="menu-item">${window.i18nextify.i18next.t('Unmute Chat')}</div>`)
                    .appendTo(menu)
                    .on('mousedown touchstart', function (evt) {
                        var i
                        while ((i = gChatMutes.indexOf(part._id)) != -1) gChatMutes.splice(i, 1)
                        if (localStorage) localStorage.chatMutes = gChatMutes.join(',')
                        $(part.nameDiv).removeClass('muted-chat')
                    })
            }
            if (!(gPianoMutes.indexOf(part._id) >= 0) || !(gChatMutes.indexOf(part._id) >= 0)) {
                $(`<div class="menu-item">${window.i18nextify.i18next.t('Mute Completely')}</div>`)
                    .appendTo(menu)
                    .on('mousedown touchstart', function (evt) {
                        gPianoMutes.push(part._id)
                        if (localStorage) localStorage.pianoMutes = gPianoMutes.join(',')
                        gChatMutes.push(part._id)
                        if (localStorage) localStorage.chatMutes = gChatMutes.join(',')
                        $(part.nameDiv).addClass('muted-notes')
                        $(part.nameDiv).addClass('muted-chat')
                    })
            }
            if (gPianoMutes.indexOf(part._id) >= 0 || gChatMutes.indexOf(part._id) >= 0) {
                $(`<div class="menu-item">${window.i18nextify.i18next.t('Unmute Completely')}</div>`)
                    .appendTo(menu)
                    .on('mousedown touchstart', function (evt) {
                        var i
                        while ((i = gPianoMutes.indexOf(part._id)) != -1) gPianoMutes.splice(i, 1)
                        while ((i = gChatMutes.indexOf(part._id)) != -1) gChatMutes.splice(i, 1)
                        if (localStorage) localStorage.pianoMutes = gPianoMutes.join(',')
                        if (localStorage) localStorage.chatMutes = gChatMutes.join(',')
                        $(part.nameDiv).removeClass('muted-notes')
                        $(part.nameDiv).removeClass('muted-chat')
                    })
            }
            if (gIsDming && gDmParticipant._id === part._id) {
                $(`<div class="menu-item">${window.i18nextify.i18next.t('End Direct Message')}</div>`)
                    .appendTo(menu)
                    .on('mousedown touchstart', function (evt) {
                        chat.endDM()
                    })
            } else {
                $(`<div class="menu-item">${window.i18nextify.i18next.t('Direct Message')}</div>`)
                    .appendTo(menu)
                    .on('mousedown touchstart', function (evt) {
                        if (!gKnowsHowToDm) {
                            localStorage.knowsHowToDm = true
                            gKnowsHowToDm = true
                            new SiteNotification({
                                target: '#piano',
                                duration: 20000,
                                title: window.i18nextify.i18next.t('How to DM'),
                                text: window.i18nextify.i18next.t(
                                    'After you click the button to direct message someone, future chat messages will be sent to them instead of to everyone. To go back to talking in public chat, send a blank chat message, or click the button again.'
                                )
                            })
                        }
                        chat.startDM(part)
                    })
            }
            if (gCursorHides.indexOf(part._id) == -1) {
                $(`<div class="menu-item">${window.i18nextify.i18next.t('Hide Cursor')}</div>`)
                    .appendTo(menu)
                    .on('mousedown touchstart', function (evt) {
                        gCursorHides.push(part._id)
                        if (localStorage) localStorage.cursorHides = gCursorHides.join(',')
                        $(part.cursorDiv).hide()
                    })
            } else {
                $(`<div class="menu-item">${window.i18nextify.i18next.t('Show Cursor')}</div>`)
                    .appendTo(menu)
                    .on('mousedown touchstart', function (evt) {
                        var i
                        while ((i = gCursorHides.indexOf(part._id)) != -1) gCursorHides.splice(i, 1)
                        if (localStorage) localStorage.cursorHides = gCursorHides.join(',')
                        $(part.cursorDiv).show()
                    })
            }

            $(`<div class="menu-item">${window.i18nextify.i18next.t('Mention')}</div>`)
                .appendTo(menu)
                .on('mousedown touchstart', function (evt) {
                    $('#chat-input')[0].value += '@' + part.id + ' '
                    setTimeout(() => {
                        $('#chat-input').focus()
                    }, 1)
                })

            if (gClient.isOwner() || gClient.permissions.chownAnywhere) {
                if (!gClient.channel.settings.lobby) {
                    $(`<div class="menu-item give-crown">${window.i18nextify.i18next.t('Give Crown')}</div>`)
                        .appendTo(menu)
                        .on('mousedown touchstart', function (evt) {
                            if (confirm('Give room ownership to ' + part.name + '?'))
                                gClient.sendArray([{ m: 'chown', id: part.id }])
                        })
                }
                $(`<div class="menu-item kickban">${window.i18nextify.i18next.t('Kickban')}</div>`)
                    .appendTo(menu)
                    .on('mousedown touchstart', function (evt) {
                        var minutes = prompt('How many minutes? (0-300)', '30')
                        if (minutes === null) return
                        minutes = parseFloat(minutes) || 0
                        var ms = minutes * 60 * 1000
                        gClient.sendArray([{ m: 'kickban', _id: part._id, ms: ms }])
                    })
            }
            if (gClient.permissions.siteBan) {
                $(`<div class="menu-item site-ban">${window.i18nextify.i18next.t('Site Ban')}</div>`)
                    .appendTo(menu)
                    .on('mousedown touchstart', function (evt) {
                        openModal('#siteban')
                        setTimeout(function () {
                            $('#siteban input[name=id]').val(part._id)
                            $('#siteban input[name=reasonText]').val('Discrimination against others')
                            $('#siteban input[name=reasonText]').attr('disabled', true)
                            $('#siteban select[name=reasonSelect]').val('Discrimination against others')
                            $('#siteban input[name=durationNumber]').val(5)
                            $('#siteban input[name=durationNumber]').attr('disabled', false)
                            $('#siteban select[name=durationUnit]').val('hours')
                            $('#siteban textarea[name=note]').val('')
                            $('#siteban p[name=errorText]').text('')
                            if (gClient.permissions.siteBanAnyReason) {
                                $('#siteban select[name=reasonSelect] option[value=custom]').attr('disabled', false)
                            } else {
                                $('#siteban select[name=reasonSelect] option[value=custom]').attr('disabled', true)
                            }
                        }, 100)
                    })
            }
            if (gClient.permissions.usersetOthers) {
                $(`<div class="menu-item set-color">${window.i18nextify.i18next.t('Set Color')}</div>`)
                    .appendTo(menu)
                    .on('mousedown touchstart', function (evt) {
                        var color = prompt('What color?', part.color)
                        if (color === null) return
                        gClient.sendArray([{ m: 'setcolor', _id: part._id, color: color }])
                    })
            }
            if (gClient.permissions.usersetOthers) {
                $(`<div class="menu-item set-name">${window.i18nextify.i18next.t('Set Name')}</div>`)
                    .appendTo(menu)
                    .on('mousedown touchstart', function (evt) {
                        var name = prompt('What name?', part.name)
                        if (name === null) return
                        gClient.sendArray([{ m: 'setname', _id: part._id, name: name }])
                    })
            }
            menu.fadeIn(100)
        }
    })()

    // Notification class

    ////////////////////////////////////////////////////////////////
    class SiteNotification extends EventEmitter {
        constructor(par) {
            super()
            if (this instanceof SiteNotification === false) throw 'yeet'

            var par = par || {}

            this.id = 'Notification-' + (par.id || Math.random())
            this.title = par.title || ''
            this.text = par.text || ''
            this.html = par.html || ''
            this.target = $(par.target || '#piano')
            this.duration = par.duration || 30000
            this['class'] = par['class'] || 'classic'

            var self = this
            var eles = $('#' + this.id)
            if (eles.length > 0) {
                eles.remove()
            }
            this.domElement = $(
                '<div class="notification"><div class="notification-body"><div class="title"></div>' +
                    '<div class="text"></div></div><div class="x" translated>X</div></div>'
            )
            this.domElement[0].id = this.id
            this.domElement.addClass(this['class'])
            this.domElement.find('.title').text(this.title)
            if (this.text.length > 0) {
                this.domElement.find('.text').text(this.text)
            } else if (this.html instanceof HTMLElement) {
                this.domElement.find('.text')[0].appendChild(this.html)
            } else if (this.html.length > 0) {
                this.domElement.find('.text').html(this.html)
            }
            document.body.appendChild(this.domElement.get(0))

            this.position()
            this.onresize = function () {
                self.position()
            }
            window.addEventListener('resize', this.onresize)

            this.domElement.find('.x').click(function () {
                self.close()
            })

            if (this.duration > 0) {
                setTimeout(function () {
                    self.close()
                }, this.duration)
            }

            return this
        }
        position() {
            var pos = this.target.offset()
            var x = pos.left - this.domElement.width() / 2 + this.target.width() / 4
            var y = pos.top - this.domElement.height() - 8
            var width = this.domElement.width()
            if (x + width > $('body').width()) {
                x -= x + width - $('body').width()
            }
            if (x < 0) x = 0
            this.domElement.offset({ left: x, top: y })
        }

        close() {
            window.removeEventListener('resize', this.onresize)
            this.domElement.fadeOut(500, () => {
                this.domElement.remove()
                this.emit('close')
            })
        }
    }

    // set variables from settings or set settings

    ////////////////////////////////////////////////////////////////

    var gKeyboardSeq = 0
    var gKnowsYouCanUseKeyboard = false
    if (localStorage && localStorage.knowsYouCanUseKeyboard) gKnowsYouCanUseKeyboard = true
    if (!gKnowsYouCanUseKeyboard) {
        window.gKnowsYouCanUseKeyboardTimeout = setTimeout(function () {
            window.gKnowsYouCanUseKeyboardNotification = new SiteNotification({
                title: window.i18nextify.i18next.t('Did you know!?!'),
                text: window.i18nextify.i18next.t('You can play the piano with your keyboard, too.  Try it!'),
                target: '#piano',
                duration: 10000
            })
        }, 30000)
    }

    if (window.localStorage) {
        if (localStorage.volume) {
            volume_slider.value = localStorage.volume
            gPiano.audio.setVolume(localStorage.volume)
            $('#volume-label').html(
                window.i18nextify.i18next.t('Volume') +
                    '<span translated>: ' +
                    Math.floor(gPiano.audio.volume * 100) +
                    '%</span>'
            )
        } else localStorage.volume = gPiano.audio.volume

        window.gHasBeenHereBefore = localStorage.gHasBeenHereBefore || false
        if (!gHasBeenHereBefore) {
            /*new SiteNotification({
        title: "Important Info",
        html: "If you were not on multiplayerpiano.net or mppclone.com previously, you are now! This is due to an issue with the owner of multiplayerpiano.com, who has added a bunch of things in the website's code that has affected the site negatively. Since they are using our servers, it's best that you use this website. If you have any issues, please join our <a href=\"https://discord.com/invite/338D2xMufC\">Discord</a> and let us know!",
        duration: -1
      });*/
        }
        localStorage.gHasBeenHereBefore = true
    }

    // New room, change room

    ////////////////////////////////////////////////////////////////

    $('#room > .info').text('--')
    gClient.on('ch', function (msg) {
        var channel = msg.ch
        var info = $('#room > .info')
        info.text(channel._id)
        if (channel.settings.lobby) info.addClass('lobby')
        else info.removeClass('lobby')
        if (!channel.settings.chat) info.addClass('no-chat')
        else info.removeClass('no-chat')
        if (channel.settings.crownsolo) info.addClass('crownsolo')
        else info.removeClass('crownsolo')
        if (channel.settings['no cussing']) info.addClass('no-cussing')
        else info.removeClass('no-cussing')
        if (!channel.settings.visible) info.addClass('not-visible')
        else info.removeClass('not-visible')
    })
    gClient.on('ls', function (ls) {
        for (var i in ls.u) {
            if (!ls.u.hasOwnProperty(i)) continue
            var room = ls.u[i]
            var info = $('#room .info[roomid="' + (room.id + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0') + '"]')

            if (info.length == 0) {
                info = $('<div class="info"></div>')
                info.attr('roomname', room._id)
                info.attr('roomid', room.id)
                $('#room .more').append(info)
            }

            info.attr('translated', '')

            info.text(room.count + '/' + ('limit' in room.settings ? room.settings.limit : 20) + ' ' + room._id)
            if (room.settings.lobby) info.addClass('lobby')
            else info.removeClass('lobby')
            if (!room.settings.chat) info.addClass('no-chat')
            else info.removeClass('no-chat')
            if (room.settings.crownsolo) info.addClass('crownsolo')
            else info.removeClass('crownsolo')
            if (room.settings['no cussing']) info.addClass('no-cussing')
            else info.removeClass('no-cussing')
            if (!room.settings.visible) info.addClass('not-visible')
            else info.removeClass('not-visible')
            if (room.banned) info.addClass('banned')
            else info.removeClass('banned')
        }
    })
    $('#room').on('click', function (evt) {
        evt.stopPropagation()

        // clicks on a new room
        if ($(evt.target).hasClass('info') && $(evt.target).parents('.more').length) {
            $('#room .more').fadeOut(250)
            var selected_name = $(evt.target).attr('roomname')
            if (typeof selected_name != 'undefined') {
                changeRoom(selected_name, 'right')
            }
            return false
        }
        // clicks on "New Room..."
        else if ($(evt.target).hasClass('new')) {
            openModal('#new-room', 'input[name=name]')
        }
        // all other clicks
        var doc_click = function (evt) {
            if ($(evt.target).is('#room .more')) return
            $(document).off('mousedown', doc_click)
            $('#room .more').fadeOut(250)
            gClient.sendArray([{ m: '-ls' }])
        }
        $(document).on('mousedown', doc_click)
        $('#room .more .info').remove()
        $('#room .more').show()
        gClient.sendArray([{ m: '+ls' }])
    })
    $('#new-room-btn').on('click', function (evt) {
        evt.stopPropagation()
        openModal('#new-room', 'input[name=name]')
    })

    $('#play-alone-btn').on('click', function (evt) {
        evt.stopPropagation()
        var room_name = 'Room' + Math.floor(Math.random() * 1000000000000)
        changeRoom(room_name, 'right', { visible: false })
        setTimeout(function () {
            new SiteNotification({
                id: 'share',
                title: window.i18nextify.i18next.t('Playing alone'),
                html:
                    window.i18nextify.i18next.t(
                        'You are playing alone in a room by yourself, but you can always invite friends by sending them the link.'
                    ) +
                    '<br><a href="' +
                    location.href +
                    '">' +
                    location.href +
                    '</a>',
                duration: 25000
            })
        }, 1000)
    })

    //Account button
    $('#account-btn').on('click', function (evt) {
        evt.stopPropagation()
        openModal('#account')
        if (gClient.accountInfo) {
            $('#account #account-info').show()
            if (gClient.accountInfo.type === 'discord') {
                $('#account #avatar-image').prop('src', gClient.accountInfo.avatar)
                $('#account #logged-in-user-text').text(gClient.accountInfo.username + '#' + gClient.accountInfo.discriminator)
            }
        } else {
            $('#account #account-info').hide()
        }
    })

    var gModal

    function modalHandleEsc(evt) {
        if (evt.keyCode == 27) {
            closeModal()
            if (!gNoPreventDefault) evt.preventDefault()
            evt.stopPropagation()
        }
    }

    function openModal(selector, focus) {
        if (chat) chat.blur()
        releaseKeyboard()
        $(document).on('keydown', modalHandleEsc)
        $('#modal #modals > *').hide()
        $('#modal').fadeIn(250)
        $(selector).show()
        setTimeout(function () {
            $(selector).find(focus).focus()
        }, 100)
        gModal = selector
    }

    function closeModal() {
        $(document).off('keydown', modalHandleEsc)
        $('#modal').fadeOut(100)
        $('#modal #modals > *').hide()
        captureKeyboard()
        gModal = null
    }

    var modal_bg = $('#modal .bg')[0]
    $(modal_bg).on('click', function (evt) {
        if (evt.target != modal_bg) return
        closeModal()
    })
    ;(function () {
        function submit() {
            var name = $('#new-room .text[name=name]').val()
            var settings = {
                visible: $('#new-room .checkbox[name=visible]').is(':checked'),
                chat: true
            }
            $('#new-room .text[name=name]').val('')
            closeModal()
            changeRoom(name, 'right', settings)
            setTimeout(function () {
                new SiteNotification({
                    id: 'share',
                    title: window.i18nextify.i18next.t('Created a Room'),
                    html:
                        window.i18nextify.i18next.t('You can invite friends to your room by sending them the link.') +
                        '<br><a href="' +
                        location.href +
                        '">' +
                        location.href +
                        '</a>',
                    duration: 25000
                })
            }, 1000)
        }
        $('#new-room .submit').click(function (evt) {
            submit()
        })
        $('#new-room .text[name=name]').keypress(function (evt) {
            if (evt.keyCode == 13) {
                submit()
            } else if (evt.keyCode == 27) {
                closeModal()
            } else {
                return
            }
            if (!gNoPreventDefault) evt.preventDefault()
            evt.stopPropagation()
            return false
        })
    })()

    function changeRoom(name, direction, settings, push) {
        if (!settings) settings = {}
        if (!direction) direction = 'right'
        if (typeof push == 'undefined') push = true
        var opposite = direction == 'left' ? 'right' : 'left'

        !name ? (name = 'lobby') : void 0
        if (gClient.channel && gClient.channel._id === name) return
        if (push) {
            let url = "/?c=" + encodeURIComponent(name).replace("'", "%27");
            if (window.history && history.pushState) {
                history.pushState(
                    { depth: (gHistoryDepth += 1), name: name },
                    "Piano > " + name,
                    url,
                )
            } else {
                window.location = url;
                return;
            }
        }

        gClient.setChannel(name, settings)

        var t = 0,
            d = 100
        $('#piano')
            .addClass('ease-out')
            .addClass('slide-' + opposite)
        setTimeout(
            function () {
                $('#piano')
                    .removeClass('ease-out')
                    .removeClass('slide-' + opposite)
                    .addClass('slide-' + direction)
            },
            (t += d)
        )
        setTimeout(
            function () {
                $('#piano')
                    .addClass('ease-in')
                    .removeClass('slide-' + direction)
            },
            (t += d)
        )
        setTimeout(
            function () {
                $('#piano').removeClass('ease-in')
            },
            (t += d)
        )
    }

    var gHistoryDepth = 0
    $(window).on('popstate', function (evt) {
        var depth = evt.state ? evt.state.depth : 0
        //if (depth == gHistoryDepth) return; // <-- forgot why I did that though...
        //yeah brandon idk why you did that either, but it's stopping the back button from changing rooms after 1 click so I commented it out

        var direction = depth <= gHistoryDepth ? 'left' : 'right'
        gHistoryDepth = depth

        var name = getRoomNameFromURL()
        changeRoom(name, direction, null, false)
    })

    // Rename

    ////////////////////////////////////////////////////////////////
    ;(function () {
        function submit() {
            var set = {
                name: $('#rename input[name=name]').val(),
                color: $('#rename input[name=color]').val()
            }
            //$("#rename .text[name=name]").val("");
            closeModal()
            gClient.sendArray([{ m: 'userset', set: set }])
        }
        $('#rename .submit').click(function (evt) {
            submit()
        })
        $('#rename .text[name=name]').keypress(function (evt) {
            if (evt.keyCode == 13) {
                submit()
            } else if (evt.keyCode == 27) {
                closeModal()
            } else {
                return
            }
            if (!gNoPreventDefault) evt.preventDefault()
            evt.stopPropagation()
            return false
        })
    })()

    //site-wide bans
    ;(function () {
        function submit() {
            var msg = { m: 'siteban' }

            msg.id = $('#siteban .text[name=id]').val()

            var durationUnit = $('#siteban select[name=durationUnit]').val()
            if (durationUnit === 'permanent') {
                if (!gClient.permissions.siteBanAnyDuration) {
                    $('#siteban p[name=errorText]').text(
                        "You don't have permission to ban longer than 1 month. Contact a higher staff to ban the user for longer."
                    )
                    return
                }
                msg.permanent = true
            } else {
                var factor = 0
                switch (durationUnit) {
                    case 'seconds':
                        factor = 1000
                        break
                    case 'minutes':
                        factor = 1000 * 60
                        break
                    case 'hours':
                        factor = 1000 * 60 * 60
                        break
                    case 'days':
                        factor = 1000 * 60 * 60 * 24
                        break
                    case 'weeks':
                        factor = 1000 * 60 * 60 * 24 * 7
                        break
                    case 'months':
                        factor = 1000 * 60 * 60 * 24 * 30
                        break
                    case 'years':
                        factor = 1000 * 60 * 60 * 24 * 365
                        break
                }
                var duration = factor * parseFloat($('#siteban input[name=durationNumber]').val())
                if (duration < 0) {
                    $('#siteban p[name=errorText]').text('Invalid duration.')
                    return
                }
                if (duration > 1000 * 60 * 60 * 24 * 30 && !gClient.permissions.siteBanAnyDuration) {
                    $('#siteban p[name=errorText]').text(
                        "You don't have permission to ban longer than 1 month. Contact a higher staff to ban the user for longer."
                    )
                    return
                }
                msg.duration = duration
            }

            var reason
            if ($('#siteban select[name=reasonSelect]').val() === 'custom') {
                reason = $('#siteban .text[name=reasonText]').val()
                if (reason.length === 0) {
                    $('#siteban p[name=errorText]').text('Please provide a reason.')
                    return
                }
            } else {
                reason = $('#siteban select[name=reasonSelect]').val()
            }
            msg.reason = reason

            var note = $('#siteban textarea[name=note]').val()
            if (note) {
                msg.note = note
            }

            closeModal()
            gClient.sendArray([msg])
        }
        $('#siteban .submit').click(function (evt) {
            submit()
        })
        $('#siteban select[name=reasonSelect]').change(function (evt) {
            if (this.value === 'custom') {
                $('#siteban .text[name=reasonText]').attr('disabled', false)
                $('#siteban .text[name=reasonText]').val('')
            } else {
                $('#siteban .text[name=reasonText]').attr('disabled', true)
                $('#siteban .text[name=reasonText]').val(this.value)
            }
        })
        $('#siteban select[name=durationUnit]').change(function (evt) {
            if (this.value === 'permanent') {
                $('#siteban .text[name=durationNumber]').attr('disabled', true)
            } else {
                $('#siteban .text[name=durationNumber]').attr('disabled', false)
            }
        })
        $('#siteban .text[name=id]').keypress(textKeypressEvent)
        $('#siteban .text[name=reasonText]').keypress(textKeypressEvent)
        $('#siteban .text[name=note]').keypress(textKeypressEvent)
        function textKeypressEvent(evt) {
            if (evt.keyCode == 13) {
                submit()
            } else if (evt.keyCode == 27) {
                closeModal()
            } else {
                return
            }
            if (!gNoPreventDefault) evt.preventDefault()
            evt.stopPropagation()
            return false
        }
    })()

    //Accounts
    ;(function () {
        function logout() {
            delete localStorage.token
            delete gClient.accountInfo
            gClient.stop()
            gClient.start()
            closeModal()
        }
        $('#account .logout-btn').click(function (evt) {
            logout()
        })
        $('#account .login-discord').click(function (evt) {
            location.replace(
                encodeURI(
                    `https://discord.com/api/oauth2/authorize?client_id=926633278100877393&redirect_uri=${location.origin}/?callback=discord&response_type=code&scope=identify email`
                )
            )
        })
    })()

    // chatctor

    ////////////////////////////////////////////////////////////////
    let gTypingTimeout
    let typingUsers = new Set()
    function listFormat(list) {
        if (!Array.isArray(list) && typeof list[Symbol.iterator] === 'function') {
            list = Array.from(list)
        }
        if (list.length == 0) return ''
        else if (list.length == 1) return list[0]
        else if (list.length == 2) return list[0] + ' and ' + list[1]
        else return list.slice(0, -1).join(', ') + ', and ' + list[list.length - 1]
    }
    function updateTypingStatus() {
        let element = $('#typing-container.hypermod')
        if (typingUsers.size == 0) {
            element.hide()
        } else {
            element.show()
            let text = listFormat(typingUsers.values().map(id => gClient.findParticipantById(id).name))
            element.text(typingUsers.size == 1 ? text + ' is typing...' : text + ' are typing...')
        }
    }
    function startTyping() {
        gClient.sendArray([{ 
            m: 'custom',
            target: {
                mode: 'subscribed'
            },
            data: {
                m: 'hypermod',
                type: 'typing'
            }
        }])
    }
    function stopTyping() {
        gClient.sendArray([{ 
            m: 'custom',
            target: {
                mode: 'subscribed'
            },
            data: {
                m: 'hypermod',
                type: 'typing',
                stop: true
            }
        }])
    }
    gClient.on('custom', msg => {
        if (msg.data.m === 'hypermod') {
            switch (msg.data.type) {
                case 'typing':
                    if (msg.data.stop) {
                        typingUsers.delete(msg.p)
                    } else {
                        typingUsers.add(msg.p)
                    }
                    updateTypingStatus()
                    break
            }
        }
    })
    var chat = do {
        gClient.on('ch', function (msg) {
            if (msg.ch.settings.chat) {
                chat.show()
            } else {
                chat.hide()
            }
        })
        gClient.on('disconnect', function (msg) {})
        gClient.on('c', function (msg) {
            chat.clear()
            if (msg.c) {
                for (var i = 0; i < msg.c.length; i++) {
                    chat.receive(msg.c[i])
                }
            }
        })
        gClient.on('a', function (msg) {
            chat.receive(msg)
            gHyperMod.receiveMessage(msg)
        })
        gClient.on('dm', function (msg) {
            chat.receive(msg)
        })

        $('#chat-input').on('focus', function (evt) {
            releaseKeyboard()
            $('#chat').addClass('chatting')
            chat.scrollToBottom()
        })
        /*$("#chat input").on("blur", function(evt) {
      captureKeyboard();
      $("#chat").removeClass("chatting");
      chat.scrollToBottom();
    });*/
        $(document).mousedown(function (evt) {
            if (!$('#chat').has(evt.target).length > 0) {
                chat.blur()
            }
        })
        document.addEventListener('touchstart', function (event) {
            for (var i in event.changedTouches) {
                var touch = event.changedTouches[i]
                if (!$('#chat').has(touch.target).length > 0) {
                    chat.blur()
                }
            }
        })
        $(document).on('keydown', function (evt) {
            if ($('#chat').hasClass('chatting')) {
                if (evt.keyCode == 27) {
                    chat.blur()
                    if (!gNoPreventDefault) evt.preventDefault()
                    evt.stopPropagation()
                } else if (evt.keyCode == 13) {
                    $('#chat-input').focus()
                }
            } else if (!gModal && (evt.keyCode == 27 || evt.keyCode == 13)) {
                $('#chat-input').focus()
            }
        })
        $('#chat-input').on('input', e => {
            if (!gClient.isConnected()) return
            if (!gHyperMod.lsSettings.showUsersWhenTyping) return
            if (e.target.value.length == 0) {
                stopTyping()
                if (gTypingTimeout) {
                    clearTimeout(gTypingTimeout)
                    gTypingTimeout = undefined
                }
                return updateTypingStatus()
            }
            if (!gTypingTimeout) {
                startTyping()
                updateTypingStatus()
            } else {
                clearTimeout(gTypingTimeout)
                gTypingTimeout = undefined
            }
            gTypingTimeout = setTimeout(() => {
                stopTyping()
                updateTypingStatus()
                gTypingTimeout = undefined
            }, 2000)
        })
        $('#chat-input').on('keydown', function (evt) {
            if (evt.keyCode == 13) {
                if (gClient.isConnected()) {
                    var message = $(this).val()
                    if (message.length == 0) {
                        if (gIsDming) {
                            chat.endDM()
                        }
                        if (gIsReplying) {
                            chat.cancelReply()
                        }
                        setTimeout(function () {
                            chat.blur()
                        }, 100)
                    } else {
                        chat.send(message)
                        $(this).val('')
                        setTimeout(function () {
                            chat.blur()
                        }, 100)
                    }
                }
                if (!gNoPreventDefault) evt.preventDefault()
                evt.stopPropagation()
            } else if (evt.keyCode == 27) {
                chat.blur()
                if (!gNoPreventDefault) evt.preventDefault()
                evt.stopPropagation()
            } else if (evt.keyCode == 9) {
                if (!gNoPreventDefault) evt.preventDefault()
                evt.stopPropagation()
            }
        })

        // Optionally show a warning when clicking links
        /*$("#chat ul").on("click", ".chatLink", function(ev) {
      var $s = $(this);

      if(gWarnOnLinks) {
        if(!$s.hasClass("clickedOnce")) {
          $s.addClass("clickedOnce");
          var id = setTimeout(() => $s.removeClass("clickedOnce"), 2000);
          $s.data("clickTimeout", id)
          return false;
        } else {
          console.log("a")
          $s.removeClass("clickedOnce");
          var id = $s.data("clickTimeout")
          if(id !== void 0) {
            clearTimeout(id)
            $s.removeData("clickTimeout")
          }
        }
      }
    });*/
        var messageCache = [];

        ({
            startDM: function (part) {
                gIsDming = true
                gDmParticipant = part
                $('#chat-input')[0].placeholder = 'Direct messaging ' + part.name + '.'
            },

            endDM: function () {
                gIsDming = false
                $('#chat-input')[0].placeholder = window.i18nextify.i18next.t('You can chat with this thing.')
            },

            startReply: function (part, id) {
                $(`#msg-${gMessageId}`).css({
                    'background-color': 'unset',
                    border: '1px solid #00000000'
                })
                gIsReplying = true
                gReplyParticipant = part
                gMessageId = id
                $('#chat-input')[0].placeholder = `Replying to ${part.name}`
            },

            startDmReply: function (part, id) {
                $(`#msg-${gMessageId}`).css({
                    'background-color': 'unset',
                    border: '1px solid #00000000'
                })
                gIsReplying = true
                gIsDming = true
                gMessageId = id
                gReplyParticipant = part
                gDmParticipant = part
                $('#chat-input')[0].placeholder = `Replying to ${part.name} in a DM.`
            },

            cancelReply: function () {
                if (gIsDming) gIsDming = false
                gIsReplying = false
                $(`#msg-${gMessageId}`).css({
                    'background-color': 'unset',
                    border: '1px solid #00000000'
                })
                $('#chat-input')[0].placeholder = window.i18nextify.i18next.t(`You can chat with this thing.`)
            },

            show: function () {
                $('#chat').fadeIn()
            },

            hide: function () {
                $('#chat').fadeOut()
            },

            clear: function () {
                $('#chat li').remove()
            },

            scrollToBottom: function () {
                var ele = $('#chat ul').get(0)
                ele.scrollTop = ele.scrollHeight - ele.clientHeight
            },

            blur: function () {
                if ($('#chat').hasClass('chatting')) {
                    $('#chat-input').get(0).blur()
                    $('#chat').removeClass('chatting')
                    chat.scrollToBottom()
                    captureKeyboard()
                }
            },

            send: function (message) {
                if (gIsReplying) {
                    if (gIsDming) {
                        gClient.sendArray([
                            {
                                m: 'dm',
                                reply_to: gMessageId,
                                _id: gReplyParticipant._id,
                                message
                            }
                        ])
                        setTimeout(() => {
                            MPP.chat.cancelReply()
                        }, 100)
                    } else {
                        gClient.sendArray([
                            {
                                m: 'a',
                                reply_to: gMessageId,
                                _id: gReplyParticipant._id,
                                message
                            }
                        ])
                        setTimeout(() => {
                            MPP.chat.cancelReply()
                        }, 100)
                    }
                } else {
                    if (gIsDming) {
                        gClient.sendArray([{ m: 'dm', _id: gDmParticipant._id, message }])
                    } else {
                        gClient.sendArray([{ m: 'a', message }])
                    }
                }
            },

            receive: function (msg) {
                if (msg.m === 'dm') {
                    if (gChatMutes.indexOf(msg.sender._id) != -1) return
                } else {
                    if (gChatMutes.indexOf(msg.p._id) != -1) return
                }

                //construct string for creating list element

                var liString = `<li id="msg-${msg.id}">`

                var isSpecialDm = false

                if (msg.m === 'dm') {
                    if (msg.sender._id === gClient.user._id || msg.recipient._id === gClient.user._id) {
                        liString += `<span class="reply"/>`
                    }
                } else {
                    liString += `<span class="reply"/>`
                }

                if (gShowTimestampsInChat) liString += '<span class="timestamp"/>'

                if (msg.m === 'dm') {
                    if (msg.sender._id === gClient.user._id) {
                        //sent dm
                        liString += '<span class="sentDm"/>'
                    } else if (msg.recipient._id === gClient.user._id) {
                        //received dm
                        liString += '<span class="receivedDm"/>'
                    } else {
                        //someone else's dm
                        liString += '<span class="otherDm"/>'
                        isSpecialDm = true
                    }
                }

                if (isSpecialDm) {
                    if (gShowIdsInChat) liString += '<span class="id"/>'
                    liString += '<span class="name"/><span class="dmArrow"/>'
                    if (gShowIdsInChat) liString += '<span class="id2"/>'
                    liString += '<span class="name2"/><span class="message"/>'
                } else {
                    if (gShowIdsInChat) liString += '<span class="id"/>'
                    liString += '<span class="name"/>'
                    if (msg.r) liString += `<span class="replyLink"/>`
                    liString += '<span class="message"/>'
                }

                var li = $(liString)
                li.find(`.reply`).text('➦')

                if (msg.r) {
                    var repliedMsg = messageCache.find((e) => e.id === msg.r)
                    if (!tabIsActive) {
                        if (repliedMsg?.p?._id === gClient.user._id) {
                            document.title = `You have received a reply!`
                            if (gHyperMod.lsSettings.sendNotifications && Notification.permission === 'granted')
                                new Notification(`You have received a reply!`, {
                                    body: `${msg.p.name} has replied to your message.`,
                                })
                            youreReplied = true
                        }
                    }
                    if (repliedMsg) {
                        li.find('.replyLink').text(`➥ ${repliedMsg.m === 'dm' ? repliedMsg.sender.name : repliedMsg.p.name}`)
                        li.find('.replyLink').css({
                            background: `${
                                (repliedMsg?.m === 'dm' ? repliedMsg?.sender?.color : repliedMsg?.p?.color) ?? 'gray'
                            }`
                        })
                        li.find('.replyLink').on('click', (evt) => {
                            $('#chat-input').focus()
                            document.getElementById(`msg-${repliedMsg?.id}`).scrollIntoView({ behavior: 'smooth' })
                            $(`#msg-${repliedMsg?.id}`).css({
                                border: `1px solid ${
                                    repliedMsg?.m === 'dm' ? repliedMsg.sender?.color : repliedMsg.p?.color
                                }80`,
                                'background-color': `${
                                    repliedMsg?.m === 'dm' ? repliedMsg.sender?.color : repliedMsg.p?.color
                                }20`
                            })
                            setTimeout(() => {
                                $(`#msg-${repliedMsg?.id}`).css({
                                    'background-color': 'unset',
                                    border: '1px solid #00000000'
                                })
                            }, 5000)
                        })
                    } else {
                        li.find('.replyLink').text('➥ Unknown Message')
                        li.find('.replyLink').css({ background: 'gray' })
                    }
                }

                //prefix before dms so people know it's a dm
                if (msg.m === 'dm') {
                    if (msg.sender._id === gClient.user._id) {
                        //sent dm
                        li.find('.sentDm').text('To')
                        li.find('.sentDm').css('color', '#ff55ff')
                    } else if (msg.recipient._id === gClient.user._id) {
                        //received dm
                        li.find('.receivedDm').text('From')
                        li.find('.receivedDm').css('color', '#ff55ff')
                    } else {
                        //someone else's dm
                        li.find('.otherDm').text('DM')
                        li.find('.otherDm').css('color', '#ff55ff')

                        li.find('.dmArrow').text('->')
                        li.find('.dmArrow').css('color', '#ff55ff')
                    }
                }

                if (gShowTimestampsInChat) {
                    li.find('.timestamp').text(new Date(msg.t).toLocaleTimeString())
                }

                let message = parseMarkdown(parseContent(msg.a), parseUrl).replace(/@([\da-f]{24})/g, (match, id) => {
                    let user = gClient.ppl[id]
                    if (user) {
                        let nick = parseContent(user.name)
                        if (user.id === gClient.getOwnParticipant().id) {
                            if (!tabIsActive) {
                                youreMentioned = true
                                document.title = window.i18nextify.i18next.t('You were mentioned!')
                                if (gHyperMod.lsSettings.sendNotifications && Notification.permission === 'granted')
                                    new Notification(window.i18nextify.i18next.t('You were mentioned!'), {
                                        body: `${msg.p.name} has mentioned you in chat.`,
                                    })
                            }
                            return `<span class="mention" style="background-color: ${user.color};">${nick}</span>`
                        } else return `@${nick}`
                    } else return match
                })

                //apply names, colors, ids
                li.find('.message').html(message)

                if (msg.m === 'dm') {
                    if (!gNoChatColors) li.find('.message').css('color', msg.sender.color || 'white')
                    if (gShowIdsInChat) {
                        if (msg.sender._id === gClient.user._id) {
                            li.find('.id').text(msg.recipient._id.substring(0, 6))
                        } else {
                            li.find('.id').text(msg.sender._id.substring(0, 6))
                        }
                    }

                    if (msg.sender._id === gClient.user._id) {
                        //sent dm
                        if (!gNoChatColors) li.find('.name').css('color', msg.recipient.color || 'white')
                        li.find('.name').text(msg.recipient.name + ':')
                        if (gShowChatTooltips) li[0].title = msg.recipient._id
                    } else if (msg.recipient._id === gClient.user._id) {
                        //received dm
                        if (!gNoChatColors) li.find('.name').css('color', msg.sender.color || 'white')
                        li.find('.name').text(msg.sender.name + ':')

                        if (gShowChatTooltips) li[0].title = msg.sender._id
                    } else {
                        //someone else's dm
                        if (!gNoChatColors) li.find('.name').css('color', msg.sender.color || 'white')
                        if (!gNoChatColors) li.find('.name2').css('color', msg.recipient.color || 'white')
                        li.find('.name').text(msg.sender.name)
                        li.find('.name2').text(msg.recipient.name + ':')

                        if (gShowIdsInChat) li.find('.id').text(msg.sender._id.substring(0, 6))
                        if (gShowIdsInChat) li.find('.id2').text(msg.recipient._id.substring(0, 6))

                        if (gShowChatTooltips) li[0].title = msg.sender._id
                    }
                } else {
                    if (!gNoChatColors) li.find('.message').css('color', msg.p.color || 'white')
                    if (!gNoChatColors) li.find('.name').css('color', msg.p.color || 'white')

                    li.find('.name').text(msg.p.name + ':')

                    if (!gNoChatColors) li.find('.message').css('color', msg.p.color || 'white')
                    if (gShowIdsInChat) li.find('.id').text(msg.p._id.substring(0, 6))

                    if (gShowChatTooltips) li[0].title = msg.p._id
                }

                //Adds copying _ids on click in chat
                li.find('.id').on('click', (evt) => {
                    if (msg.m === 'dm') {
                        navigator.clipboard.writeText(msg.sender._id === gClient.user._id ? msg.recipient._id : msg.sender._id)
                        li.find('.id').text('Copied')
                        setTimeout(() => {
                            li.find('.id').text(
                                (msg.sender._id === gClient.user._id ? msg.recipient._id : msg.sender._id).substring(0, 6)
                            )
                        }, 2500)
                    } else {
                        navigator.clipboard.writeText(msg.p._id)
                        li.find('.id').text('Copied')
                        setTimeout(() => {
                            li.find('.id').text(msg.p._id.substring(0, 6))
                        }, 2500)
                    }
                })
                li.find('.id2').on('click', (evt) => {
                    navigator.clipboard.writeText(msg.recipient._id)
                    li.find('.id2').text('Copied')
                    setTimeout(() => {
                        li.find('.id2').text(msg.recipient._id.substring(0, 6))
                    }, 2500)
                })

                //Reply button click event listener
                li.find('.reply').on('click', (evt) => {
                    if (msg.m !== 'dm') {
                        MPP.chat.startReply(msg.p, msg.id, msg.a)
                        setTimeout(() => {
                            $(`#msg-${msg.id}`).css({
                                border: `1px solid ${msg?.m === 'dm' ? msg.sender?.color : msg.p?.color}80`,
                                'background-color': `${msg?.m === 'dm' ? msg.sender?.color : msg.p?.color}20`
                            })
                        }, 100)
                        setTimeout(() => {
                            $('#chat-input').focus()
                        }, 100)
                    } else {
                        if (msg.m === 'dm') {
                            let replyingTo = msg.sender._id === gClient.user._id ? msg.recipient : msg.sender
                            if (gClient.ppl[replyingTo._id]) {
                                MPP.chat.startDmReply(replyingTo, msg.id)
                                setTimeout(() => {
                                    $(`#msg-${msg.id}`).css({
                                        border: `1px solid ${msg?.m === 'dm' ? msg.sender?.color : msg.p?.color}80`,
                                        'background-color': `${msg?.m === 'dm' ? msg.sender?.color : msg.p?.color}20`
                                    })
                                }, 100)
                                setTimeout(() => {
                                    $('#chat-input').focus()
                                }, 100)
                            } else {
                                new SiteNotification({
                                    target: '#piano',
                                    title: 'User not found.',
                                    text: 'The user who you are trying to reply to in a DM is not found, so a DM could not be started.'
                                })
                            }
                        }
                    }
                })

                //put list element in chat

                $('#chat ul').append(li)
                messageCache.push(msg)

                var eles = $('#chat ul li').get()
                for (var i = 1; i <= 50 && i <= eles.length; i++) {
                    eles[eles.length - i].style.opacity = 1.0 - i * 0.03
                }
                if (eles.length > 50) {
                    eles[0].style.display = 'none'
                }
                if (eles.length > 256) {
                    messageCache.shift()
                    $(eles[0]).remove()
                }

                // scroll to bottom if not "chatting" or if not scrolled up
                if (!$('#chat').hasClass('chatting')) {
                    chat.scrollToBottom()
                } else {
                    var ele = $('#chat ul').get(0)
                    if (ele.scrollTop > ele.scrollHeight - ele.offsetHeight - 50) chat.scrollToBottom()
                }
            }
        })
    }

    // MIDI

    ////////////////////////////////////////////////////////////////

    var MIDI_TRANSPOSE = -12
    var MIDI_KEY_NAMES = ['a-1', 'as-1', 'b-1']
    var bare_notes = 'c cs d ds e f fs g gs a as b'.split(' ')
    for (var oct = 0; oct < 7; oct++) {
        for (var i in bare_notes) {
            MIDI_KEY_NAMES.push(bare_notes[i] + oct)
        }
    }
    MIDI_KEY_NAMES.push('c7')
    let MIDI_KEY_MAP = Object.fromEntries(
        MIDI_KEY_NAMES.map((name, i) => [name, i])
    );

    var devices_json = '[]'
    function sendDevices() {
        gClient.sendArray([{ m: 'devices', list: JSON.parse(devices_json) }])
    }
    gClient.on('connect', sendDevices)

    var pitchBends = {
        0: 0,
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0,
        7: 0,
        8: 0,
        9: 0,
        10: 0,
        11: 0,
        12: 0,
        13: 0,
        14: 0,
        15: 0
    }
    let participantChannel = {}
    function rebuildParticipantChannels() {
        let keys = Object.keys(gClient.ppl)
        for (let i = 0; i < keys.length; i++)
            participantChannel[keys[i]] = i & 0xf
    }
    gClient.on('participant added', rebuildParticipantChannels)
    gClient.on('participant removed', e => {
        rebuildParticipantChannels()
        typingUsers.delete(e._id)
        updateTypingStatus()
    })
    rebuildParticipantChannels();
    /*
    function showConnections(sticky) {
                //if(document.getElementById("Notification-MIDI-Connections"))
                //sticky = 1; // todo: instead,
                var inputs_ul = document.createElement('ul')
                let midiToggles = JSON.parse(localStorage['hm.midiToggles'] ?? '{"inputs":{},"outputs":{}}')
                if (midi.inputs.size > 0) {
                    var inputs = midi.inputs.values()
                    for (var input_it = inputs.next(); input_it && !input_it.done; input_it = inputs.next()) {
                        var input = input_it.value
                        var li = document.createElement('li')
                        li.connectionId = input.id
                        li.classList.add('connection')
                        if (midiToggles[input.name]) {
                            li.classList.add('enabled')
                            input.enabled = true
                        }
                        li.textContent = input.name
                        li.addEventListener('click', function (evt) {
                            var inputs = midi.inputs.values()
                            for (var input_it = inputs.next(); input_it && !input_it.done; input_it = inputs.next()) {
                                var input = input_it.value
                                if (input.id === evt.target.connectionId) {
                                    input.enabled = !input.enabled
                                    midiToggles[input.name] = input.enabled
                                    localStorage['hm.midiToggles'] = JSON.stringify(midiToggles)
                                    evt.target.classList.toggle('enabled')
                                    //console.log("click", input);
                                    updateDevices()
                                    return
                                }
                            }
                        })
                        if (gMidiVolumeTest) {
                            var knob = document.createElement('canvas')
                            Object.assign(knob, {
                                width: 16 * window.devicePixelRatio,
                                height: 16 * window.devicePixelRatio,
                                className: 'knob'
                            })
                            li.appendChild(knob)
                            knob = new Knob(knob, 0, 2, 0.01, input.volume, 'volume')
                            knob.canvas.style.width = '16px'
                            knob.canvas.style.height = '16px'
                            knob.canvas.style.float = 'right'
                            knob.on('change', function (k) {
                                input.volume = k.value
                            })
                            knob.emit('change', knob)
                        }
                        inputs_ul.appendChild(li)
                    }
                } else {
                    inputs_ul.textContent = '(none)'
                }
                var outputs_ul = document.createElement('ul')
                if (midi.outputs.size > 0) {
                    var outputs = midi.outputs.values()
                    for (var output_it = outputs.next(); output_it && !output_it.done; output_it = outputs.next()) {
                        var output = output_it.value
                        var li = document.createElement('li')
                        li.connectionId = output.id
                        li.classList.add('connection')
                        if (midiToggles[output.name]) {
                            li.classList.add('enabled')
                            output.enabled = true
                        }
                        li.textContent = output.name
                        li.addEventListener('click', function (evt) {
                            var outputs = midi.outputs.values()
                            for (
                                var output_it = outputs.next();
                                output_it && !output_it.done;
                                output_it = outputs.next()
                            ) {
                                var output = output_it.value
                                if (output.id === evt.target.connectionId) {
                                    output.enabled = !output.enabled
                                    midiToggles[output.name] = output.enabled
                                    localStorage['hm.midiToggles'] = JSON.stringify(midiToggles)
                                    evt.target.classList.toggle('enabled')
                                    //console.log("click", output);
                                    updateDevices()
                                    return
                                }
                            }
                        })
                        if (gMidiVolumeTest) {
                            var knob = document.createElement('canvas')
                            Object.assign(knob, {
                                width: 16 * window.devicePixelRatio,
                                height: 16 * window.devicePixelRatio,
                                className: 'knob'
                            })
                            li.appendChild(knob)
                            knob = new Knob(knob, 0, 2, 0.01, output.volume, 'volume')
                            knob.canvas.style.width = '16px'
                            knob.canvas.style.height = '16px'
                            knob.canvas.style.float = 'right'
                            knob.on('change', function (k) {
                                output.volume = k.value
                            })
                            knob.emit('change', knob)
                        }
                        outputs_ul.appendChild(li)
                    }
                } else {
                    outputs_ul.textContent = '(none)'
                }
                outputs_ul.setAttribute('translated', '')
                inputs_ul.setAttribute('translated', '')
                var div = document.createElement('div')
                var h1 = document.createElement('h1')
                h1.textContent = 'Inputs'
                div.appendChild(h1)
                div.appendChild(inputs_ul)
                h1 = document.createElement('h1')
                h1.textContent = 'Outputs'
                div.appendChild(h1)
                div.appendChild(outputs_ul)
                connectionsNotification = new SiteNotification({
                    id: 'MIDI-Connections',
                    title: 'MIDI Connections',
                    duration: sticky ? '-1' : '4500',
                    html: div,
                    target: '#midi-btn'
                })
            }
                */
    let gMidi = {
        access : null,
        inputs : [],
        outputs: [],
        messageBuffer: [new Uint8Array(3), new Uint8Array(3)],
        connectionsNotif: null,
        wait(fn, delay) {
            if (delay > 0) {
                setTimeout(() => {
                    fn()
                }, delay)
            } else {
                fn()
            }
        },
        noteOn(note, vel, delay, part) {
            if (this.outputs.length === 0)
                return false
            if (vel <= gHyperMod.lsSettings.midiOutputVelocityThreshold)
                return false
            let noteNum = MIDI_KEY_MAP[note]
            if (noteNum === undefined) 
                return false
            noteNum = noteNum + 9 - MIDI_TRANSPOSE
            this.wait(() => {
                for (let output of this.outputs) {
                    if (!output.enabled)
                        continue
                    let channel = participantChannel[part]
                    let status  = (vel <= 0 ? 0x80 : 0x90) | (channel == 9 ? (channel + 1) & 0xf : channel)
                    this.messageBuffer[0][0] = status
                    this.messageBuffer[0][1] = noteNum
                    this.messageBuffer[0][2] = vel
                    output.port.send(this.messageBuffer[0])
                }
                return true
            }, delay)
        },
        noteOff(note, delay, part) {
            if (this.outputs.length === 0)
                return false
            let noteNum = MIDI_KEY_MAP[note]
            if (noteNum === undefined) 
                return false
            noteNum = noteNum + 9 - MIDI_TRANSPOSE
            this.wait(() => {
                for (let output of this.outputs) {
                    if (!output.enabled)
                        continue
                    let channel = participantChannel[part]
                    let status  = 0x80 | (channel == 9 ? (channel + 1) & 0xf : channel)
                    this.messageBuffer[1][0] = status
                    this.messageBuffer[1][1] = noteNum
                    this.messageBuffer[1][2] = 0
                    output.port.send(this.messageBuffer[1])
                }
            }, delay)
            return true
        },
        showConnections(sticky) {
            //if(document.getElementById("Notification-MIDI-Connections"))
            //sticky = 1; // todo: instead,
            var inputs_ul = document.createElement('ul')
            let midiToggles = JSON.parse(localStorage['hm.midiToggles'] ?? '{"inputs":{},"outputs":{}}')
            if (this.inputs.length > 0) {
                for (let input of this.inputs) {
                    var li = document.createElement('li')
                    li.classList.add('connection')
                    if (input.enabled) {
                        li.classList.add('enabled')
                    }
                    li.textContent = input.port.name
                    li.addEventListener('click', e => {
                        input.enabled = !input.enabled
                        if (!midiToggles.inputs)
                            midiToggles.inputs = {}
                        midiToggles.inputs[input.port.name] = input.enabled
                        localStorage['hm.midiToggles'] = JSON.stringify(midiToggles)
                        e.target.classList.toggle('enabled')
                    })
                    $(inputs_ul).append(li)
                }
            } else {
                inputs_ul.textContent = '(none)'
            }
            var outputs_ul = document.createElement('ul')
            if (this.outputs.length > 0) {
                for (let output of this.outputs) {
                    var li = document.createElement('li')
                    li.classList.add('connection')
                    if (output.enabled) {
                        li.classList.add('enabled')
                    }
                    li.textContent = output.port.name
                    li.addEventListener('click', e => {
                        output.enabled = !output.enabled
                        if (!midiToggles.outputs)
                            midiToggles.outputs = {}
                        midiToggles.outputs[output.port.name] = output.enabled
                        localStorage['hm.midiToggles'] = JSON.stringify(midiToggles)
                        e.target.classList.toggle('enabled')
                    })
                    $(outputs_ul).append(li)
                }
            } else {
                outputs_ul.textContent = '(none)'
            }
            outputs_ul.setAttribute('translated', '')
            inputs_ul.setAttribute('translated', '')
            let div = document.createElement('div')
            let h1_inputs = document.createElement('h1')
            let h1_outputs = document.createElement('h1')
            h1_inputs.textContent = 'Inputs'
            $(div).append(h1_inputs)
            $(div).append(inputs_ul)
            h1_outputs.textContent = 'Outputs'
            $(div).append(h1_outputs)
            $(div).append(outputs_ul)
            this.connectionsNotif = new SiteNotification({
                id: 'MIDI-Connections',
                title: 'MIDI Connections',
                duration: sticky ? '-1' : '4500',
                html: div,
                target: '#midi-btn'
            })
        }
    };
    (async function () {
        if (navigator.requestMIDIAccess) {
            let midi = await navigator.requestMIDIAccess()
            let midiToggles = JSON.parse(localStorage['hm.midiToggles'] ?? '{"inputs":{},"outputs":{}}')
            gMidi.access  = midi
            gMidi.inputs  = midi.inputs .values().toArray().map(a => ({ enabled: midiToggles.inputs[a.name] ?? true, port: a }))
            gMidi.outputs = midi.outputs.values().toArray().map(a => ({ enabled: midiToggles.outputs[a.name] ?? false, port: a }))
            for (let input of gMidi.inputs) {
                input.port.addEventListener('midimessage', e => {
                    let status  = e.data[0]
                    let opcode  = status >> 0x4
                    let channel = status &  0xf
                    switch (opcode) {
                        case 0x09: // note event
                        case 0x08:
                            let note = e.data[1]
                            let vel  = e.data[2]
                            if (opcode == 0x08 || vel == 0) // note off
                                keyboard.release(MIDI_KEY_NAMES[note - 9 + MIDI_TRANSPOSE + transpose + pitchBends[channel]])
                            else // note on
                                keyboard.press(MIDI_KEY_NAMES[note - 9 + MIDI_TRANSPOSE + transpose + pitchBends[channel]], vel / 127)
                            break
                    }
                })
            }
            document.getElementById('midi-btn').addEventListener('click', function (evt) {
                if (!document.getElementById('Notification-MIDI-Connections')) gMidi.showConnections(true)
                else {
                    gMidi.connectionsNotif.close()
                }
            })
            gMidi.showConnections(false)
        }
    })()
    // bug supply

    ////////////////////////////////////////////////////////////////

    window.onerror = function (message, url, line) {
        /*var url = url || "(no url)";
    var line = line || "(no line)";
    // errors in socket.io
    if(url.indexOf("socket.io.js") !== -1) {
      if(message.indexOf("INVALID_STATE_ERR") !== -1) return;
      if(message.indexOf("InvalidStateError") !== -1) return;
      if(message.indexOf("DOM Exception 11") !== -1) return;
      if(message.indexOf("Property 'open' of object #<c> is not a function") !== -1) return;
      if(message.indexOf("Cannot call method 'close' of undefined") !== -1) return;
      if(message.indexOf("Cannot call method 'close' of null") !== -1) return;
      if(message.indexOf("Cannot call method 'onClose' of null") !== -1) return;
      if(message.indexOf("Cannot call method 'payload' of null") !== -1) return;
      if(message.indexOf("Unable to get value of the property 'close'") !== -1) return;
      if(message.indexOf("NS_ERROR_NOT_CONNECTED") !== -1) return;
      if(message.indexOf("Unable to get property 'close' of undefined or null reference") !== -1) return;
      if(message.indexOf("Unable to get value of the property 'close': object is null or undefined") !== -1) return;
      if(message.indexOf("this.transport is null") !== -1) return;
    }
    // errors in soundmanager2
    if(url.indexOf("soundmanager2.js") !== -1) {
      // operation disabled in safe mode?
      if(message.indexOf("Could not complete the operation due to error c00d36ef") !== -1) return;
      if(message.indexOf("_s.o._setVolume is not a function") !== -1) return;
    }
    // errors in midibridge
    if(url.indexOf("midibridge") !== -1) {
      if(message.indexOf("Error calling method on NPObject") !== -1) return;
    }
    // too many failing extensions injected in my html
    if(url.indexOf(".js") !== url.length - 3) return;
    // extensions inject cross-domain embeds too
    if(url.toLowerCase().indexOf("multiplayerpiano.com") == -1) return;

    // errors in my code
    if(url.indexOf("script.js") !== -1) {
      if(message.indexOf("Object [object Object] has no method 'on'") !== -1) return;
      if(message.indexOf("Object [object Object] has no method 'off'") !== -1) return;
      if(message.indexOf("Property '$' of object [object Object] is not a function") !== -1) return;
    }

    var enc = "/bugreport/"
      + (message ? encodeURIComponent(message) : "") + "/"
      + (url ? encodeURIComponent(url) : "") + "/"
      + (line ? encodeURIComponent(line) : "");
    var img = new Image();
    img.src = enc;*/
    }

    // API
    globalThis.MPP = {
        press: ::keyboard.press,
        release: ::keyboard.release,
        pressSustain: ::keyboard.sustainDown,
        releaseSustain: ::keyboard.sustainUp,
        keyboard,
        midi: gMidi,
        addons: {
            hyperMod: gHyperMod
        },
        piano: gPiano,
        client: gClient,
        chat,
        typingUsers,
        noteQuota: gNoteQuota,
        normalNoteQuotaParams,
        soundSelector: gSoundSelector
    }

    // synth
    var enableSynth = false
    var audio = gPiano.audio
    var context = gPiano.audio.context
    var synth_gain = context.createGain()
    synth_gain.gain.value = 0.05
    synth_gain.connect(audio.synthGain)

    var osc_types = ['sine', 'square', 'sawtooth', 'triangle']
    var osc_type_index = 1

    var osc1_type = 'square'
    var osc1_attack = 0
    var osc1_decay = 0.2
    var osc1_sustain = 0.5
    var osc1_release = 2.0

    class SynthVoice {
        constructor(note_name, time) {
            var note_number = MIDI_KEY_MAP[note_name]
            note_number = note_number + 9 - MIDI_TRANSPOSE
            var freq = Math.pow(2, (note_number - 69) / 12) * 440.0
            this.osc = context.createOscillator()
            this.osc.type = osc1_type
            this.osc.frequency.value = freq
            this.gain = context.createGain()
            this.gain.gain.value = 0
            this.osc.connect(this.gain)
            this.gain.connect(synth_gain)
            this.osc.start(time)
            this.gain.gain.setValueAtTime(0, time)
            this.gain.gain.linearRampToValueAtTime(1, time + osc1_attack)
            this.gain.gain.linearRampToValueAtTime(osc1_sustain, time + osc1_attack + osc1_decay)
        }
        stop(time) {
            //this.gain.gain.setValueAtTime(osc1_sustain, time);
            this.gain.gain.linearRampToValueAtTime(0, time + osc1_release)
            this.osc.stop(time + osc1_release)
        }
    }
    ;(function () {
        var button = document.getElementById('synth-btn')
        var notification

        button.addEventListener('click', function () {
            if (notification) {
                notification.close()
            } else {
                showSynth()
            }
        })

        function showSynth() {
            var html = document.createElement('div')

            // on/off button
            ;(function () {
                var button = document.createElement('input')
                Object.assign(button, {
                    type: 'button',
                    value: window.i18nextify.i18next.t('ON/OFF'),
                    className: enableSynth ? 'switched-on' : 'switched-off'
                })
                button.addEventListener('click', function (evt) {
                    enableSynth = !enableSynth
                    button.className = enableSynth ? 'switched-on' : 'switched-off'
                    if (!enableSynth) {
                        // stop all
                        for (var i in audio.playings) {
                            if (!audio.playings.hasOwnProperty(i)) continue
                            var playing = audio.playings[i]
                            if (playing && playing.voice) {
                                playing.voice.osc.stop()
                                playing.voice = undefined
                            }
                        }
                    }
                })
                html.appendChild(button)
            })()

            // mix
            var knob = document.createElement('canvas')
            Object.assign(knob, {
                width: 32 * window.devicePixelRatio,
                height: 32 * window.devicePixelRatio,
                className: 'knob'
            })
            html.appendChild(knob)
            knob = new Knob(knob, 0, 100, 0.1, 50, 'mix', '%')
            knob.canvas.style.width = '32px'
            knob.canvas.style.height = '32px'
            knob.on('change', function (k) {
                var mix = k.value / 100
                audio.pianoGain.gain.value = 1 - mix
                audio.synthGain.gain.value = mix
            })
            knob.emit('change', knob)

            // osc1 type
            ;(function () {
                osc1_type = osc_types[osc_type_index]
                var button = document.createElement('input')
                Object.assign(button, {
                    type: 'button',
                    value: window.i18nextify.i18next.t(osc_types[osc_type_index])
                })
                button.addEventListener('click', function (evt) {
                    if (++osc_type_index >= osc_types.length) osc_type_index = 0
                    osc1_type = osc_types[osc_type_index]
                    button.value = window.i18nextify.i18next.t(osc1_type)
                })
                html.appendChild(button)
            })()

            // osc1 attack
            var knob = document.createElement('canvas')
            Object.assign(knob, {
                width: 32 * window.devicePixelRatio,
                height: 32 * window.devicePixelRatio,
                className: 'knob'
            })
            html.appendChild(knob)
            knob = new Knob(knob, 0, 1, 0.001, osc1_attack, 'osc1 attack', 's')
            knob.canvas.style.width = '32px'
            knob.canvas.style.height = '32px'
            knob.on('change', function (k) {
                osc1_attack = k.value
            })
            knob.emit('change', knob)

            // osc1 decay
            var knob = document.createElement('canvas')
            Object.assign(knob, {
                width: 32 * window.devicePixelRatio,
                height: 32 * window.devicePixelRatio,
                className: 'knob'
            })
            html.appendChild(knob)
            knob = new Knob(knob, 0, 2, 0.001, osc1_decay, 'osc1 decay', 's')
            knob.canvas.style.width = '32px'
            knob.canvas.style.height = '32px'
            knob.on('change', function (k) {
                osc1_decay = k.value
            })
            knob.emit('change', knob)

            var knob = document.createElement('canvas')
            Object.assign(knob, {
                width: 32 * window.devicePixelRatio,
                height: 32 * window.devicePixelRatio,
                className: 'knob'
            })
            html.appendChild(knob)
            knob = new Knob(knob, 0, 1, 0.001, osc1_sustain, 'osc1 sustain', 'x')
            knob.canvas.style.width = '32px'
            knob.canvas.style.height = '32px'
            knob.on('change', function (k) {
                osc1_sustain = k.value
            })
            knob.emit('change', knob)

            // osc1 release
            var knob = document.createElement('canvas')
            Object.assign(knob, {
                width: 32 * window.devicePixelRatio,
                height: 32 * window.devicePixelRatio,
                className: 'knob'
            })
            html.appendChild(knob)
            knob = new Knob(knob, 0, 2, 0.001, osc1_release, 'osc1 release', 's')
            knob.canvas.style.width = '32px'
            knob.canvas.style.height = '32px'
            knob.on('change', function (k) {
                osc1_release = k.value
            })
            knob.emit('change', knob)

            //useless blank space
            //var div = document.createElement("div");
            //div.innerHTML = "<br><br><br><br><center>this space intentionally left blank</center><br><br><br><br>";
            //html.appendChild(div);

            // notification
            notification = new SiteNotification({
                title: 'Synthesize',
                html: html,
                duration: -1,
                target: '#synth-btn'
            })
            notification.on('close', function () {
                var tip = document.getElementById('tooltip')
                if (tip) tip.parentNode.removeChild(tip)
                notification = null
            })
        }
    })()
    ;(function () {
        if (window.location.hostname === 'multiplayerpiano.com') {
            var button = document.getElementById('client-settings-btn')
            var notification

            button.addEventListener('click', function () {
                if (notification) {
                    notification.close()
                } else {
                    showSynth()
                }
            })

            function showSynth() {
                var html = document.createElement('div')

                // show ids in chat
                ;(function () {
                    var setting = document.createElement('div')
                    setting.classList = 'setting'
                    setting.innerText = 'Show user IDs in chat'
                    if (gShowIdsInChat) {
                        setting.classList.toggle('enabled')
                    }
                    setting.onclick = function () {
                        setting.classList.toggle('enabled')
                        localStorage.showIdsInChat = setting.classList.contains('enabled')
                        gShowIdsInChat = setting.classList.contains('enabled')
                    }
                    html.appendChild(setting)
                })()

                // show timestamps in chat
                ;(function () {
                    var setting = document.createElement('div')
                    setting.classList = 'setting'
                    setting.innerText = 'Timestamps in chat'
                    if (gShowTimestampsInChat) {
                        setting.classList.toggle('enabled')
                    }
                    setting.onclick = function () {
                        setting.classList.toggle('enabled')
                        localStorage.showTimestampsInChat = setting.classList.contains('enabled')
                        gShowTimestampsInChat = setting.classList.contains('enabled')
                    }
                    html.appendChild(setting)
                })()

                // no chat colors
                ;(function () {
                    var setting = document.createElement('div')
                    setting.classList = 'setting'
                    setting.innerText = 'No chat colors'
                    if (gNoChatColors) {
                        setting.classList.toggle('enabled')
                    }
                    setting.onclick = function () {
                        setting.classList.toggle('enabled')
                        localStorage.noChatColors = setting.classList.contains('enabled')
                        gNoChatColors = setting.classList.contains('enabled')
                    }
                    html.appendChild(setting)
                })()

                // no background color
                ;(function () {
                    var setting = document.createElement('div')
                    setting.classList = 'setting'
                    setting.innerText = 'Force dark background'
                    if (gNoBackgroundColor) {
                        setting.classList.toggle('enabled')
                    }
                    setting.onclick = function () {
                        setting.classList.toggle('enabled')
                        localStorage.noBackgroundColor = setting.classList.contains('enabled')
                        gNoBackgroundColor = setting.classList.contains('enabled')
                        if (gClient.channel.settings.color && !gNoBackgroundColor) {
                            setBackgroundColor(gClient.channel.settings.color, gClient.channel.settings.color2)
                        } else {
                            setBackgroundColorToDefault()
                        }
                    }
                    html.appendChild(setting)
                })()

                // output own notes
                ;(function () {
                    var setting = document.createElement('div')
                    setting.classList = 'setting'
                    setting.innerText = 'Output own notes to MIDI'
                    if (gOutputOwnNotes) {
                        setting.classList.toggle('enabled')
                    }
                    setting.onclick = function () {
                        setting.classList.toggle('enabled')
                        localStorage.outputOwnNotes = setting.classList.contains('enabled')
                        gOutputOwnNotes = setting.classList.contains('enabled')
                    }
                    html.appendChild(setting)
                })()

                // virtual piano layout
                ;(function () {
                    var setting = document.createElement('div')
                    setting.classList = 'setting'
                    setting.innerText = 'Virtual Piano layout'
                    if (gVirtualPianoLayout) {
                        setting.classList.toggle('enabled')
                    }
                    setting.onclick = function () {
                        setting.classList.toggle('enabled')
                        localStorage.virtualPianoLayout = setting.classList.contains('enabled')
                        gVirtualPianoLayout = setting.classList.contains('enabled')
                        key_binding = gVirtualPianoLayout ? layouts.VP : layouts.MPP
                    }
                    html.appendChild(setting)
                })()

                // 			gShowChatTooltips
                // Show chat tooltips for _ids.
                ;(function () {
                    var setting = document.createElement('div')
                    setting.classList = 'setting'
                    setting.innerText = 'Show _id tooltips'
                    if (gShowChatTooltips) {
                        setting.classList.toggle('enabled')
                    }
                    setting.onclick = function () {
                        setting.classList.toggle('enabled')
                        localStorage.showChatTooltips = setting.classList.contains('enabled')
                        gShowChatTooltips = setting.classList.contains('enabled')
                    }
                    html.appendChild(setting)
                })()
                ;(function () {
                    var setting = document.createElement('div')
                    setting.classList = 'setting'
                    setting.innerText = 'Show Piano Notes'
                    if (gShowPianoNotes) {
                        setting.classList.toggle('enabled')
                    }
                    setting.onclick = function () {
                        setting.classList.toggle('enabled')
                        localStorage.showPianoNotes = setting.classList.contains('enabled')
                        gShowPianoNotes = setting.classList.contains('enabled')
                    }
                    html.appendChild(setting)
                })()

                // Enable smooth cursors.
                ;(function () {
                    var setting = document.createElement('div')
                    setting.classList = 'setting'
                    setting.innerText = 'Enable smooth cursors'
                    if (gSmoothCursor) {
                        setting.classList.toggle('enabled')
                    }
                    let accounts = Object.values(gClient.ppl)
                    setting.onclick = function () {
                        setting.classList.toggle('enabled')
                        localStorage.smoothCursor = setting.classList.contains('enabled')
                        gSmoothCursor = setting.classList.contains('enabled')
                        if (gSmoothCursor) {
                            $('#cursors').attr('smooth-cursors', '')
                        } else {
                            $('#cursors').removeAttr('smooth-cursors')
                        }
                        if (gSmoothCursor) {
                            accounts.forEach(function (participant) {
                                if (participant.cursorDiv) {
                                    participant.cursorDiv.style.left = ''
                                    participant.cursorDiv.style.top = ''
                                    participant.cursorDiv.style.transform =
                                        'translate3d(' + participant.x + 'vw, ' + participant.y + 'vh, 0)'
                                }
                            })
                        } else {
                            accounts.forEach(function (participant) {
                                if (participant.cursorDiv) {
                                    participant.cursorDiv.style.left = participant.x + '%'
                                    participant.cursorDiv.style.top = participant.y + '%'
                                    participant.cursorDiv.style.transform = ''
                                }
                            })
                        }
                    }
                    html.appendChild(setting)
                })()
                ;(function () {
                    var setting = document.createElement('select')
                    setting.classList = 'setting'
                    setting.style = 'color: inherit; width: calc(100% - 2px);'
                    setting.setAttribute('translated', '')

                    let keys = Object.keys(BASIC_PIANO_SCALES) // lol
                    let option = document.createElement('option')
                    option.value = option.innerText = 'No highlighted notes'
                    option.selected = !gHighlightScaleNotes
                    setting.appendChild(option)

                    for (let key of keys) {
                        let option = document.createElement('option')
                        option.value = key
                        option.innerText = key
                        option.selected = key === gHighlightScaleNotes
                        setting.appendChild(option)
                    }

                    if (gHighlightScaleNotes) {
                        setting.value = gHighlightScaleNotes
                    }

                    setting.onchange = function () {
                        localStorage.highlightScaleNotes = setting.value
                        gHighlightScaleNotes = setting.value
                    }
                    html.appendChild(setting)
                })()
                ;(function () {
                    var setting = document.createElement('div')
                    setting.classList = 'setting'
                    setting.innerText = 'Hide all cursors'
                    if (gHideAllCursors) {
                        setting.classList.toggle('enabled')
                    }
                    setting.onclick = function () {
                        setting.classList.toggle('enabled')
                        localStorage.hideAllCursors = setting.classList.contains('enabled')
                        gHideAllCursors = setting.classList.contains('enabled')
                        if (gHideAllCursors) {
                            $('#cursors').hide()
                        } else {
                            $('#cursors').show()
                        }
                    }
                    html.appendChild(setting)
                })()

                // warn on links
                /*(function() {
          var setting = document.createElement("div");
            setting.classList = "setting";
            setting.innerText = "Warn when clicking links";
            if (gWarnOnLinks) {
                      setting.classList.toggle("enabled");
            }
            setting.onclick = function() {
              setting.classList.toggle("enabled");
              localStorage.warnOnLinks = setting.classList.contains("enabled");
              gWarnOnLinks = setting.classList.contains("enabled");
            };
          html.appendChild(setting);
        })();*/

                //useless blank space
                //var div = document.createElement("div");
                //div.innerHTML = "<br><br><br><br><center>this space intentionally left blank</center><br><br><br><br>";
                //html.appendChild(div);

                // notification
                notification = new SiteNotification({
                    title: 'Client Settings',
                    html: html,
                    duration: -1,
                    target: '#client-settings-btn'
                })
                notification.on('close', function () {
                    var tip = document.getElementById('tooltip')
                    if (tip) tip.parentNode.removeChild(tip)
                    notification = null
                })
            }
        } else {
            var button = document.getElementById('client-settings-btn')
            var content = document.getElementById('client-settings-content')
            var tablinks = document.getElementsByClassName('client-settings-tablink')
            var okButton = document.getElementById('client-settings-ok-btn')

            button.addEventListener('click', (evt) => {
                evt.stopPropagation()
                openModal('#client-settings')
            })

            okButton.addEventListener('click', (evt) => {
                evt.stopPropagation()
                closeModal()
            })

            function createSetting(id, labelText, isChecked, addBr, html, onclickFunc) {
                let setting = document.createElement('input')
                setting.type = 'checkbox'
                setting.id = id
                setting.checked = isChecked
                setting.onclick = onclickFunc

                let label = document.createElement('label')

                label.innerText = window.i18nextify.i18next.t(labelText + ':') + ' '

                label.appendChild(setting)
                html.appendChild(label)
                if (addBr) html.appendChild(document.createElement('br'))
            }

            window.changeClientSettingsTab = (evt, tabName) => {
                content.innerHTML = ''

                for (let index = 0; index < tablinks.length; index++) {
                    tablinks[index].className = tablinks[index].className.replace(' active', '')
                }

                evt.currentTarget.className += ' active'

                switch (tabName.toLowerCase()) {
                    case 'chat':
                        var html = document.createElement('div')

                        createSetting(
                            'show-timestamps-in-chat',
                            'Show timestamps in chat',
                            gShowTimestampsInChat,
                            true,
                            html,
                            () => {
                                gShowTimestampsInChat = !gShowTimestampsInChat
                                localStorage.showTimestampsInChat = gShowTimestampsInChat
                            }
                        )

                        createSetting('show-user-ids-in-chat', 'Show user IDs in chat', gShowIdsInChat, true, html, () => {
                            gShowIdsInChat = !gShowIdsInChat
                            localStorage.showIdsInChat = gShowIdsInChat
                        })

                        createSetting('show-id-tooltips', 'Show ID tooltips', gShowChatTooltips, true, html, () => {
                            gShowChatTooltips = !gShowChatTooltips
                            localStorage.showChatTooltips = gShowChatTooltips
                        })

                        createSetting('no-chat-colors', 'No chat colors', gNoChatColors, true, html, () => {
                            gNoChatColors = !gNoChatColors
                            localStorage.noChatColors = gNoChatColors
                        })

                        createSetting('hide-chat', 'Hide chat', gHideChat, false, html, () => {
                            gHideChat = !gHideChat
                            localStorage.hideChat = gHideChat

                            if (gHideChat) {
                                $('#chat').hide()
                            } else {
                                $('#chat').show()
                            }
                        })

                        content.appendChild(html)
                        break

                    case 'midi':
                        var html = document.createElement('div')

                        createSetting(
                            'output-own-notes-to-midi',
                            'Output own notes to MIDI',
                            gOutputOwnNotes,
                            true,
                            html,
                            () => {
                                gOutputOwnNotes = !gOutputOwnNotes
                                localStorage.outputOwnNotes = gOutputOwnNotes
                            }
                        )

                        createSetting(
                            'disable-midi-drum-channel',
                            'Disable MIDI Drum Channel (channel 10)',
                            gDisableMIDIDrumChannel,
                            true,
                            html,
                            () => {
                                gDisableMIDIDrumChannel = !gDisableMIDIDrumChannel
                                localStorage.disableMIDIDrumChannel = gDisableMIDIDrumChannel
                            }
                        )

                        content.appendChild(html)
                        break

                    case 'piano':
                        var html = document.createElement('div')

                        createSetting('virtual-piano-layout', 'Virtual Piano layout', gVirtualPianoLayout, true, html, () => {
                            gVirtualPianoLayout = !gVirtualPianoLayout
                            localStorage.virtualPianoLayout = gVirtualPianoLayout
                            key_binding = gVirtualPianoLayout ? layouts.VP : layouts.MPP
                        })

                        createSetting('show-piano-notes', 'Show piano notes', gShowPianoNotes, true, html, () => {
                            gShowPianoNotes = !gShowPianoNotes
                            localStorage.showPianoNotes = gShowPianoNotes
                        })

                        createSetting('hide-piano', 'Hide piano', gHidePiano, true, html, () => {
                            gHidePiano = !gHidePiano
                            localStorage.hidePiano = gHidePiano

                            if (gHidePiano) {
                                $('#piano').hide()
                            } else {
                                $('#piano').show()
                            }
                        })

                        var setting = document.createElement('select')
                        setting.classList = 'setting'
                        setting.style = 'width: calc(58.7% - 2px);'

                        setting.onchange = () => {
                            localStorage.highlightScaleNotes = setting.value
                            gHighlightScaleNotes = setting.value
                        }

                        let keys = Object.keys(BASIC_PIANO_SCALES) // lol
                        let option = document.createElement('option')
                        option.value = option.innerText = 'None'
                        option.selected = !gHighlightScaleNotes
                        setting.appendChild(option)

                        for (let key of keys) {
                            let option = document.createElement('option')
                            option.value = key
                            option.innerText = key
                            option.selected = key === gHighlightScaleNotes
                            setting.appendChild(option)
                        }

                        if (gHighlightScaleNotes) {
                            setting.value = gHighlightScaleNotes
                        }

                        var label = document.createElement('label')

                        label.setAttribute('for', setting.id)
                        label.innerText = 'Highlighted notes: '

                        html.appendChild(label)
                        html.appendChild(setting)

                        content.appendChild(html)
                        break

                    case 'misc':
                        var html = document.createElement('div')

                        createSetting(
                            'dont-use-prevent-default',
                            "Don't use prevent default",
                            gNoChatColors,
                            true,
                            html,
                            () => {
                                gNoPreventDefault = !gNoPreventDefault
                                localStorage.noPreventDefault = gNoPreventDefault
                            }
                        )

                        createSetting('force-dark-background', 'Force dark background', gNoBackgroundColor, true, html, () => {
                            gNoBackgroundColor = !gNoBackgroundColor
                            localStorage.noBackgroundColor = gNoBackgroundColor

                            if (gClient.channel.settings.color && !gNoBackgroundColor) {
                                setBackgroundColor(gClient.channel.settings.color, gClient.channel.settings.color2)
                            } else {
                                setBackgroundColorToDefault()
                            }
                        })
                        let accounts = Object.values(gClient.ppl)
                        createSetting('enable-smooth-cursors', 'Enable smooth cursors', gSmoothCursor, true, html, () => {
                            gSmoothCursor = !gSmoothCursor
                            localStorage.smoothCursor = gSmoothCursor
                            if (gSmoothCursor) {
                                $('#cursors').attr('smooth-cursors', '')
                                accounts.forEach(function (participant) {
                                    if (participant.cursorDiv) {
                                        participant.cursorDiv.style.left = ''
                                        participant.cursorDiv.style.top = ''
                                        participant.cursorDiv.style.transform =
                                            'translate3d(' + participant.x + 'vw, ' + participant.y + 'vh, 0)'
                                    }
                                })
                            } else {
                                $('#cursors').removeAttr('smooth-cursors')
                                accounts.forEach(function (participant) {
                                    if (participant.cursorDiv) {
                                        participant.cursorDiv.style.left = participant.x + '%'
                                        participant.cursorDiv.style.top = participant.y + '%'
                                        participant.cursorDiv.style.transform = ''
                                    }
                                })
                            }
                        })

                        createSetting('hide-all-cursors', 'Hide all cursors', gHideAllCursors, true, html, () => {
                            gHideAllCursors = !gHideAllCursors
                            localStorage.hideAllCursors = gHideAllCursors
                            if (gHideAllCursors) {
                                $('#cursors').hide()
                            } else {
                                $('#cursors').show()
                            }
                        })

                        createSetting('hide-bot-users', 'Hide all bots', gHideBotUsers, true, html, () => {
                            gHideBotUsers = !gHideBotUsers
                            localStorage.hideBotUsers = gHideBotUsers
                        })

                        if (new Date().getMonth() === 11) {
                            createSetting('snowflakes', 'Enable snowflakes', gSnowflakes, true, html, () => {
                                gSnowflakes = !gSnowflakes
                                localStorage.snowflakes = gSnowflakes
                                shouldShowSnowflakes()
                            })
                        }

                        content.appendChild(html)
                        break
                }
            }

            changeClientSettingsTab(
                {
                    currentTarget: document.getElementsByClassName('client-settings-tablink')[0]
                },
                'Chat'
            )
        }
    })()

    //confetti, to be removed after the 10th anniversary
    //source: https://www.cssscript.com/confetti-falling-animation/

    var maxParticleCount = 500 //set max confetti count
    var particleSpeed = 2 //set the particle animation speed
    var startConfetti //call to start confetti animation
    var stopConfetti //call to stop adding confetti
    var toggleConfetti //call to start or stop the confetti animation depending on whether it's already running
    var removeConfetti //call to stop the confetti animation and remove all confetti immediately
    ;(function () {
        startConfetti = startConfettiInner
        stopConfetti = stopConfettiInner
        toggleConfetti = toggleConfettiInner
        removeConfetti = removeConfettiInner
        var colors = [
            'DodgerBlue',
            'OliveDrab',
            'Gold',
            'Pink',
            'SlateBlue',
            'LightBlue',
            'Violet',
            'PaleGreen',
            'SteelBlue',
            'SandyBrown',
            'Chocolate',
            'Crimson'
        ]
        var streamingConfetti = false
        var animationTimer = null
        var particles = []
        var waveAngle = 0

        function resetParticle(particle, width, height) {
            particle.color = colors[(Math.random() * colors.length) | 0]
            particle.x = Math.random() * width
            particle.y = Math.random() * height - height
            particle.diameter = Math.random() * 10 + 5
            particle.tilt = Math.random() * 10 - 10
            particle.tiltAngleIncrement = Math.random() * 0.07 + 0.05
            particle.tiltAngle = 0
            return particle
        }

        function startConfettiInner() {
            var width = window.innerWidth
            var height = window.innerHeight
            window.requestAnimFrame = (function () {
                return (
                    window.requestAnimationFrame ||
                    window.webkitRequestAnimationFrame ||
                    window.mozRequestAnimationFrame ||
                    window.oRequestAnimationFrame ||
                    window.msRequestAnimationFrame ||
                    function (callback) {
                        return setTimeout(callback, 16.6666667)
                    }
                )
            })()
            var canvas = document.getElementById('confetti-canvas')
            if (canvas === null) {
                canvas = document.createElement('canvas')
                canvas.setAttribute('id', 'confetti-canvas')
                canvas.setAttribute('style', 'display:block;z-index:999999;pointer-events:none;position:absolute;top:0;left:0')
                document.body.appendChild(canvas)
                canvas.width = width
                canvas.height = height
                window.addEventListener(
                    'resize',
                    function () {
                        canvas.width = window.innerWidth
                        canvas.height = window.innerHeight
                    },
                    true
                )
            }
            var context = canvas.getContext('2d')
            while (particles.length < maxParticleCount) particles.push(resetParticle({}, width, height))
            streamingConfetti = true
            if (animationTimer === null) {
                ;(function runAnimation() {
                    context.clearRect(0, 0, window.innerWidth, window.innerHeight)
                    if (particles.length === 0) animationTimer = null
                    else {
                        updateParticles()
                        drawParticles(context)
                        animationTimer = requestAnimFrame(runAnimation)
                    }
                })()
            }
        }

        function stopConfettiInner() {
            streamingConfetti = false
        }

        function removeConfettiInner() {
            stopConfetti()
            particles = []
        }

        function toggleConfettiInner() {
            if (streamingConfetti) stopConfettiInner()
            else startConfettiInner()
        }

        function drawParticles(context) {
            var particle
            var x
            for (var i = 0; i < particles.length; i++) {
                particle = particles[i]
                context.beginPath()
                context.lineWidth = particle.diameter
                context.strokeStyle = particle.color
                context.shadowColor = 'rgba(0, 0, 0, .3)'
                context.shadowBlur = 4
                context.shadowOffsetY = 2
                context.shadowOffsetX = 0
                x = particle.x + particle.tilt
                context.moveTo(x + particle.diameter / 2, particle.y)
                context.lineTo(x, particle.y + particle.tilt + particle.diameter / 2)
                context.stroke()
            }
        }

        function updateParticles() {
            var width = window.innerWidth
            var height = window.innerHeight
            var particle
            waveAngle += 0.01
            for (var i = 0; i < particles.length; i++) {
                particle = particles[i]
                if (!streamingConfetti && particle.y < -15) particle.y = height + 100
                else {
                    particle.tiltAngle += particle.tiltAngleIncrement
                    particle.x += Math.sin(waveAngle)
                    particle.y += (Math.cos(waveAngle) + particle.diameter + particleSpeed) * 0.5
                    particle.tilt = Math.sin(particle.tiltAngle) * 15
                }
                if (particle.x > width + 20 || particle.x < -20 || particle.y > height) {
                    if (streamingConfetti && particles.length <= maxParticleCount) resetParticle(particle, width, height)
                    else {
                        particles.splice(i, 1)
                        i--
                    }
                }
            }
        }
    })()

    if (window !== top) {
        alert(
            "Hey, it looks like you're visiting our site through another website. Consider playing Multiplayer Piano directly at https://multiplayerpiano.net"
        )
    }

    ;(async () => {
        // prettier-ignore
        let translationIdsWithNames = [{ "code": "bg", "name": "Bulgarian", "native": "Български" }, { "code": "cs", "name": "Czech", "native": "Česky" }, { "code": "de", "name": "German", "native": "Deutsch" }, { "code": "en", "name": "English", "native": "English" }, { "code": "es", "name": "Spanish", "native": "Español" }, { "code": "fr", "name": "French", "native": "Français" }, { "code": "hu", "name": "Hungarian", "native": "Magyar" }, { "code": "is", "name": "Icelandic", "native": "Íslenska" }, { "code": "ja", "name": "Japanese", "native": "日本語" }, { "code": "ko", "name": "Korean", "native": "한국어" }, { "code": "lv", "name": "Latvian", "native": "Latviešu" }, { "code": "nb", "name": "Norwegian Bokmål", "native": "Norsk bokmål" }, { "code": "nl", "name": "Dutch", "native": "Nederlands" }, { "code": "pl", "name": "Polish", "native": "Polski" }, { "code": "pt", "name": "Portuguese", "native": "Português" }, { "code": "ru", "name": "Russian", "native": "Русский" }, { "code": "sk", "name": "Slovak", "native": "Slovenčina" }, { "code": "sv", "name": "Swedish", "native": "Svenska" }, { "code": "tr", "name": "Turkish", "native": "Türkçe" }, { "code": "zh", "name": "Chinese", "native": "中文" }]

        let languages = document.getElementById('languages')

        translationIdsWithNames.forEach((z) => {
            let option = document.createElement('option')
            option.value = z.code
            option.innerText = z.native
            if (z.code == i18nextify.i18next.language.split('-')[0]) {
                option.selected = true
            }
            option.setAttribute('translated', '')
            languages.appendChild(option)
        })

        document.getElementById('lang-btn').addEventListener('click', () => {
            openModal('#language')
        })

        document.querySelector('#language > button').addEventListener('click', async (e) => {
            await i18nextify.i18next.changeLanguage(document.querySelector('#languages').selectedOptions[0].value)
            i18nextify.forceRerender()
            closeModal()
        })
    })()
    gClient.start()
    Object.assign(globalThis, {
        Renderer,
        CanvasRenderer,
        Piano,
        PianoKey,
        Rect,
        AudioEngine,
        AudioEngineWeb,
        SoundSelector,
        SiteNotification
    })
})

// misc

////////////////////////////////////////////////////////////////

// non-ad-free experience
/*(function() {
  function adsOn() {
    if(window.localStorage) {
      var div = document.querySelector("#inclinations");
      div.innerHTML = "Ads:<br>ON / <a id=\"adsoff\" href=\"#\">OFF</a>";
      div.querySelector("#adsoff").addEventListener("click", adsOff);
      localStorage.ads = true;
    }
    // adsterra
    var script = document.createElement("script");
    script.src = "//pl132070.puhtml.com/68/7a/97/687a978dd26d579c788cb41e352f5a41.js";
    document.head.appendChild(script);
  }

  function adsOff() {
    if(window.localStorage) localStorage.ads = false;
    document.location.reload(true);
  }

  function noAds() {
    var div = document.querySelector("#inclinations");
    div.innerHTML = "Ads:<br><a id=\"adson\" href=\"#\">ON</a> / OFF";
    div.querySelector("#adson").addEventListener("click", adsOn);
  }

  if(window.localStorage) {
    if(localStorage.ads === undefined || localStorage.ads === "true")
      adsOn();
    else
      noAds();
  } else {
    adsOn();
  }
})();*/
