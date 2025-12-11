class AudioEngine {
    volume: number
    sounds: Record<string, AudioBuffer>
    paused: boolean
    voices: number
    init(cb) {
        this.volume = 0.6
        this.sounds = {}
        this.paused = true
        this.voices = 0
        return this
    }
    load(id: string, url: string | URL, cb: () => any) {}
    play() {}
    stop() {}
    setVolume(x: number) {
        this.volume = x
    }
    resume() {
        this.paused = false
    }
}
export {
    AudioEngine
}