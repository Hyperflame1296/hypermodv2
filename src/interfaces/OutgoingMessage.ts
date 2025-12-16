// import: local interfaces
import type { Login } from './Login.js'
import type { Note } from './Note.js'
import type { ChannelSettings } from './ChannelSettings.js'

// import: local types
import type { Target } from '../types/Target.js'

// declaration
export interface OutgoingMessage {
    // basic messages
    'a': {
        m: 'a'
        message: string
        reply_to?: string
    }
    'bye': {
        m: 'bye'
    }
    'ch': {
        m: 'ch'
        _id: string
        set: ChannelSettings
    }
    'chown': {
        m: 'chown'
        id?: string
    }
    'chset': {
        m: 'chset'
        set: ChannelSettings
    }
    'custom': {
        m: 'custom'
        data: any
        target: Target
    }
    'devices': {
        m: 'devices'
        list: {
            type: 'input' | 'output'
            manufacturer: string
            name: string
            version: string
            enabled?: boolean
            volume: number
        }[]
    }
    'dm': {
        m: 'dm'
        message: string
        _id: string
        reply_to?: string
    }
    'hi': {
        m: 'hi'
        token?: string
        login: Login
    }
    'kickban': {
        m: 'kickban'
        _id: string
        ms: number
    }
    'm': {
        m: 'm'
        x: number
        y: number
    }
    'n': {
        m: 'n'
        t: number
        n: Note[]
    }
    't': {
        m: 't'
        e: number
    }
    'unban': {
        m: 'unban'
        _id: number
    }
    'userset': {
        m: 'userset'
        set: {
            name: number
            color: string
        }
    }
    // subscriptions
    '+ls': {
        m: '+ls'
    }
    '-ls': {
        m: '-ls'
    }
    '+custom': {
        m: '+custom'
    }
    '-custom': {
        m: '-custom'
    }
}