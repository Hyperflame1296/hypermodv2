// import: local interfaces
import type { Tag } from "./Tag.js"

// declaration
export interface ParticipantInfo {
    id?: string
    _id: string
    name: string
    color: string
    x?: number | string
    y?: number | string
    afk?: boolean
    tag?: Tag,
    vanished?: boolean
    // client stuff
    nameDiv?: HTMLDivElement
    cursorDiv?: HTMLDivElement
    displayX?: number
    displayY?: number
}