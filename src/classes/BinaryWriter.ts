export class BinaryWriter {
    textEncoder: TextEncoder = new TextEncoder()
    buffers: Uint8Array<ArrayBuffer>[]
    constructor() {
        this.buffers = []
    }

    writeUInt8(value: number) {
        let arr = new Uint8Array(new ArrayBuffer(1))
        arr[0] = value
        this.buffers.push(arr)
    }

    writeUInt16(value: number) {
        let arr = new Uint8Array(new ArrayBuffer(2))
        arr[0] = value & 0xff
        arr[1] = value >>> 8
        this.buffers.push(arr)
    }

    writeUserId(value: string) {
        let arr = new Uint8Array(new ArrayBuffer(12))
        for (let i = 12; i--; ) {
            arr[i] = parseInt(value[i * 2] + value[i * 2 + 1], 16)
        }
        this.buffers.push(arr)
    }

    writeColor(value: string) {
        value = value.substring(1)
        let arr = new Uint8Array(new ArrayBuffer(3))
        for (let i = 3; i--; ) {
            arr[i] = parseInt(value[i * 2] + value[i * 2 + 1], 16)
        }
        this.buffers.push(arr)
    }

    writeVarlong(value: number) {
        let length = 1
        let threshold = 128
        while (value >= threshold) {
            length++
            threshold *= 128
        }
        let arr = new Uint8Array(new ArrayBuffer(length))
        for (let i = 0; i < length - 1; i++) {
            let segment = value % 128
            value = Math.floor(value / 128)
            arr[i] = 0b10000000 | segment
        }
        arr[length - 1] = value
        this.buffers.push(arr)
    }

    writeString(string: string) {
        let stringBuffer = this.textEncoder.encode(string)
        this.writeVarlong(stringBuffer.length)
        this.buffers.push(stringBuffer)
    }

    getBuffer() {
        let length = 0
        for (let buffer of this.buffers) {
            length += buffer.length
        }
        let outputBuffer = new Uint8Array(new ArrayBuffer(length))
        let index = 0
        for (let buffer of this.buffers) {
            outputBuffer.set(buffer, index)
            index += buffer.length
        }
        return outputBuffer.buffer
    }
}