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
export {
    AudioEngine
}