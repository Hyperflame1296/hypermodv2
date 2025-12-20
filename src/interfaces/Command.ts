import { IncomingMessage } from './IncomingMessage.js'

export interface Command {
    name: string
    desc: string
    syntax: string
    func: (a?: string[], msg?: IncomingMessage['a']) => void
}