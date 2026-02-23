// import: local interfaces
import { SchedulerTimeout } from '../interfaces/SchedulerTimeout.js'

// code
export class Scheduler {
    initialized: boolean = false
    tasks: (() => void)[] = []
    timeouts: SchedulerTimeout[] = []
    timeoutMap: Map<number, SchedulerTimeout> = new Map()
    #timeoutId: number = 0
    init() {
        if (this.initialized)
            return console.warn('Scheduler.init() called more than once!')
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
        let now = performance.now()
        for (let i = this.timeouts.length - 1; i >= 0; i--) {
            let timeout = this.timeouts[i]
            if (timeout === undefined)
                continue
            if (now < timeout.time)
                continue
            timeout.cb()
            this.timeouts.splice(i, 1)
            this.timeoutMap.delete(timeout.id)
        }
        for (let i = 0; i < this.tasks.length; i++) {
            this.tasks[i]()
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
        let timeout = {
            cb,
            time: performance.now() + delay,
            id: ++this.#timeoutId
        }
        this.timeouts.push(timeout)
        this.timeoutMap.set(timeout.id, timeout)
        return this.#timeoutId
    }
    rescheduleTimeout(id: number, delay: number = 0) {
        if (!this.initialized)
            return false
        let timeout = this.timeoutMap.get(id)
        if (!timeout)
            return false
        timeout.time = performance.now() + Math.max(delay, 0)
        return true
    }
    clearTimeout(id: number) {
        if (!this.initialized)
            return false
        let timeoutIndex = this.timeouts.findIndex(t => t.id === id)
        let timeout = this.timeouts[timeoutIndex]
        this.timeouts.splice(timeoutIndex, 1)
        this.timeoutMap.delete(timeout.id)
        return true
    }
}