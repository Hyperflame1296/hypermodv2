// import: local interfaces
import type { AccountInfo } from './AccountInfo.js'
import type { ChannelInfo } from './ChannelInfo.js'
import type { ChannelSettings } from './ChannelSettings.js'
import type { Note } from './Note.js'
import type { ParticipantInfo } from './ParticipantInfo.js'
import type { UserPermissions } from './UserPermissions.js'

// declaration
export interface IncomingMessage {
    'a': {
        m: 'a'
        id: string
        t: number
        a: string
        p: ParticipantInfo
        r?: string
    }
    'b': {
        m: 'b'
        code: string
    }
    'bye': {
        m: 'bye'
        p: string
    }
    'c': {
        m: 'c'
        c: {
            m: 'a'
            id: string
            t: number
            a: string
            p: ParticipantInfo
            r?: string
        }[]
    }
    'ch': {
        m: 'ch'
        p: string
        ppl: ParticipantInfo[]
        ch: ChannelInfo
    }
    'custom': {
        m: 'custom'
        data: any
        p: string
    }
    'dm': {
        m: 'dm'
        id: string
        t: number
        a: string
        sender: ParticipantInfo
        recipient: ParticipantInfo
        r?: string
    }
    'hi': {
        m: 'hi'
        t: number
        u: ParticipantInfo
        permissions: UserPermissions
        token?: string
        motd: string
        accountInfo: AccountInfo
    }
    'ls': {
        m: 'ls'
        c: boolean
        u: ChannelInfo[]
    }
    'm': {
        m: 'm'
        x: string
        y: string
        id: string
    }
    'n': {
        m: 'n'
        t: number
        p: string
        n: Note[]
    }
    'notification': {
        m: 'notification'
        duration?: number
        class?: string
        id?: string
        title?: string
        text?: string
        html?: string
        target?: string
    }
    'nq': {
        m: 'nq'
        maxHistLen: number
        max: number
        allowance: number
    }
    'p': {
        m: 'p'
        _id: string
        name: string
        color: string
        id: string
        x: number
        y: number
    }
    't': {
        m: 't'
        t: number
        e?: number
    }
}