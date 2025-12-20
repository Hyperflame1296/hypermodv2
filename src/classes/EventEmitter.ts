export class EventEmitter {
    _events: Record<string, ((data?: any) => any)[]>
    constructor() {
        this._events = {}
    }
    on(en: string, fn: ((data?: any) => any)) {
        if (!(en in this._events)) this._events[en] = []
        this._events[en].push(fn)
        return this
    }
    off(en: string, fn: ((data?: any) => any)) {
        if (!(en in this._events)) return
        var idx = this._events[en].indexOf(fn)
        if (idx < 0) return
        this._events[en].splice(idx, 1)
        if (!this._events[en].length)
            delete this._events[en]
        return this
    }
    emit(en: string, ...data: any[]) {
        if (!(en in this._events)) return
        var fns = this._events[en].slice(0)
        if (fns.length < 1) return
        for (var i = 0; i < fns.length; i++) fns[i].apply(this, data)
    }
}