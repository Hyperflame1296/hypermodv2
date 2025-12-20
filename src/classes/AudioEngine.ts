class AudioEngine {
    volume: number
    sounds: Record<string, AudioBuffer>
    paused: boolean
    init(cb) {
        this.volume = 0.6
        this.sounds = {}
        this.paused = true
        return this
    }
    load(id: string, url: string | URL, cb: () => any) {}
    play(id: string, vol: number, delay_ms: number, part_id: string) {}
    stop(id: string, delay_ms: number, part_id: string) {}
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