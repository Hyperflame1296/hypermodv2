// import: local interfaces
import { SchedulerTimeout } from '../interfaces/SchedulerTimeout.js'

// code
export class Scheduler {
    initialized: boolean = false
    tasks: (() => void)[] = []
    timeouts: SchedulerTimeout[] = []
    #timeoutId: number = 0
    init() {
        if (this.initialized)
            return console.warn('MPP.scheduler.init() called more than once!')
        this.initialized = true
        let loop = () => {
            this.update()
            requestAnimationFrame(loop)
        }
        loop()
    }
    update() {
        if (!this.initialized)
            return
        for (let i = this.timeouts.length - 1; i >= 0; i--) {
            let timeout = this.timeouts[i]
            if (typeof timeout === 'undefined')
                continue
            if (performance.now() < timeout.time)
                continue
            timeout.cb()
            this.timeouts.splice(i, 1)
        }
        for (let task of this.tasks) {
            task()
        }
    }
    post(cb: () => void) {
        if (!this.initialized)
            return false
        this.tasks.push(cb)
        return true
    }
    remove(cb: () => void) {
        if (!this.initialized)
            return false
        this.tasks.splice(this.tasks.indexOf(cb), 1)
        return true
    }
    setTimeout(cb: () => void, delay: number = 0) {
        if (!this.initialized)
            return false
        if (delay <= 0) {
            cb()
            return ++this.#timeoutId
        }
        this.timeouts.push({
            cb,
            time: performance.now() + delay,
            id: ++this.#timeoutId
        })
        return this.#timeoutId
    }
    rescheduleTimeout(id: number, delay: number = 0) {
        if (!this.initialized)
            return false
        let timeout = this.timeouts.find(t => t.id === id)
        if (!timeout)
            return false
        timeout.time = performance.now() + Math.max(delay, 0)
        return true
    }
    clearTimeout(id: number) {
        if (!this.initialized)
            return false
        this.timeouts.splice(this.timeouts.findIndex(t => t.id === id), 1)
        return true
    }
}