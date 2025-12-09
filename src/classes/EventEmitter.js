class EventEmitter {
    constructor() {
        this._events = {}
    }
    on(en, fn) {
        if (!this._events.hasOwnProperty(en)) this._events[en] = []
        this._events[en].push(fn)
    }
    off(en, fn) {
        if (!this._events.hasOwnProperty(en)) return
        var idx = this._events[en].indexOf(fn)
        if (idx < 0) return
        this._events[en].splice(idx, 1)
    }
    emit(en) {
        if (!this._events.hasOwnProperty(en)) return
        var fns = this._events[en].slice(0)
        if (fns.length < 1) return
        var args = Array.prototype.slice.call(arguments, 1)
        for (var i = 0; i < fns.length; i++) fns[i].apply(this, args)
    }
}
export {
    EventEmitter
}