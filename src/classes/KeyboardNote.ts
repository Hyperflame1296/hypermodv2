export class KeyboardNote {
    note: any
    octave: any
    constructor(note: string, octave?: number) {
        this.note = note
        this.octave = octave || 0
    }
}