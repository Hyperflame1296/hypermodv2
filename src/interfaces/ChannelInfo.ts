// import: local interfaces
import type { ChannelSettings } from './ChannelSettings.js'
import type { Crown } from './Crown.js'
import type { ParticipantInfo } from './ParticipantInfo.js'

// declaration
export interface ChannelInfo {
    banned?: boolean
    count: number
    id: string
    _id: string
    crown?: Crown
    settings: ChannelSettings
    ppl?: ParticipantInfo[]
}