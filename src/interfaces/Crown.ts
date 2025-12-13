// import: local interfaces
import type { Vector2 } from './Vector2.js'

// declaration
export interface Crown {
    userId: string
    participantId?: string
    time: number
    startPos: Vector2
    endPos: Vector2
}