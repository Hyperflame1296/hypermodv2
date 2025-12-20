export class BinaryReader extends Uint8Array {
    textDecoder = new TextDecoder()
    #hexLookupTable = (() => {
        let arr = []
        for (let i = 0; i < 256; i++) {
            arr.push(i.toString(16).padStart(2, '0'))
        }
        arr
    })()
    constructor(arrayBuffer) {
        super(arrayBuffer)
        this.index = 0
    }

    reachedEnd() {
        return this.index >= this.length
    }

    readUInt8() {
        if (this.index >= this.length) throw new Error('Invalid buffer read')
        return this[this.index++]
    }

    readUInt16() {
        if (this.index + 2 > this.length) throw new Error('Invalid buffer read')
        let num = this[this.index] | (this[this.index + 1] << 8)
        this.index += 2
        return num
    }

    readUserId() {
        if (this.index + 12 > this.length) throw new Error('Invalid buffer read')
        let string = ''
        for (let i = 12; i--; ) {
            string += this.#hexLookupTable[this[this.index++]]
        }
        return string
    }

    readColor() {
        if (this.index + 3 > this.length) throw new Error('Invalid buffer read')
        let string = '#'
        for (let i = 3; i--; ) {
            string += this.#hexLookupTable[this[this.index++]]
        }
        return string
    }

    readBitflag(bit) {
        if (this.index >= this.length) throw new Error('Invalid buffer read')
        return ((this[this.index] >> bit) & 0b1) === 1
    }

    readVarlong() {
        let num = this[this.index++]
        if (num < 128) return num
        num = num & 0b1111111
        let factor = 128
        while (true) {
            //we don't really need to check if this varlong is too long
            let thisValue = this[this.index++]
            if (thisValue < 128) {
                return num + thisValue * factor
            } else {
                if (this.index >= this.length) throw new Error('Invalid buffer read')
                num += (thisValue & 0b1111111) * factor
            }
            factor *= 128
        }
    }

    readString() {
        let byteLength = this.readVarlong()
        if (this.index + byteLength > this.length) throw new Error('Invalid buffer read')
        let string = this.textDecoder.decode(this.buffer.slice(this.index, this.index + byteLength))
        this.index += byteLength
        return string
    }
}