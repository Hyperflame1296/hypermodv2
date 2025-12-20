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
        _id?: string
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
    'clearchat': {
        m: 'clearchat'
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
        login?: Login,
        '🐈'?: number
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
    'setcolor': {
        m: 'setcolor'
        _id: string
        color: string
    }
    'setname': {
        m: 'setname'
        _id: string
        name: string
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
            name: string
            color: string
        }
    }
    'v': {
        m: 'v',
        vanish: boolean
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