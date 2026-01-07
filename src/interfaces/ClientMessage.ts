// import: local interfaces
import { ParticipantInfo } from './ParticipantInfo.js'
import { Tag } from './Tag.js'

export interface ClientMessage {
    'participant added': {
        m: 'p'
        _id: string
        name: string
        color: string
        id: string
        x: number
        y: number,
        tag?: Tag
        vanished?: boolean
        nameDiv?: HTMLDivElement
        cursorDiv?: HTMLDivElement
        displayX?: number
        displayY?: number
    }
    'participant removed': ParticipantInfo
    'participant update':  {
        m: 'p'
        _id: string
        name: string
        color: string
        id: string
        x: number
        y: number,
        tag?: Tag
        vanished?: boolean
        nameDiv?: HTMLDivElement
        cursorDiv?: HTMLDivElement
        displayX?: number
        displayY?: number
    }
    'disconnect': CloseEvent
    'connect': undefined
    'status': string
    'count': number
    'wserror': Event
}