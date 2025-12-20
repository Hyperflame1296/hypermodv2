export interface SchedulerTimeout {
    cb: () => void
    time: number
    id: number
}