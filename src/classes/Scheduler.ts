// import: local interfaces
import { SchedulerTimeout } from '../interfaces/SchedulerTimeout.js'

// code
export class Scheduler {
    initialized: boolean = false
    tasks: (() => void)[] = []
    timeouts: SchedulerTimeout[] = []
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
            return
        this.tasks.push(cb)
    }
    remove(cb: () => void) {
        if (!this.initialized)
            return
        this.tasks.splice(this.tasks.indexOf(cb), 1)
    }
    setTimeout(cb: () => void, delay: number) {
        if (!this.initialized)
            return
        if (delay <= 0)
            return cb()
        this.timeouts.push({
            cb,
            time: performance.now() + delay
        })
        return this.timeouts.length
    }
    clearTimeout(cb: () => void) {
        if (!this.initialized)
            return
        this.timeouts.splice(this.timeouts.findIndex(t => t.cb === cb), 1)
    }
}