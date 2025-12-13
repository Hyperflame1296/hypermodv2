// declaration
export type Target =
    | {
        mode: 'subscribed'
        global?: boolean
    }
    | {
        mode: 'id'
        id: string
        global?: boolean
    }
    | {
        mode: 'ids'
        ids: string[]
        global?: boolean
    }