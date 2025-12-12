export interface Participant {
    afk: boolean
    color: string
    id: string
    name: string
    tag: {
        text: string
        color: string
    },
    x: number
    y: number
    _id: string
}