export class EventEmitter {
    _events: Record<string, ((data?: any) => any)[]>
    constructor() {
        this._events = {}
    }
    on(en, fn) {
        if (!(en in this._events)) this._events[en] = []
        this._events[en].push(fn)
    }
    off(en, fn) {
        if (!(en in this._events)) return
        var idx = this._events[en].indexOf(fn)
        if (idx < 0) return
        this._events[en].splice(idx, 1)
        if (!this._events[en].length)
            delete this._events[en]
    }
    emit(en) {
        if (!(en in this._events)) return
        var fns = this._events[en].slice(0)
        if (fns.length < 1) return
        var args = Array.from(arguments).slice(1)
        for (var i = 0; i < fns.length; i++) fns[i].apply(this, args)
    }
}