interface AudioVoice {
    source: AudioBufferSourceNode, 
    gain: GainNode
    part_id: string, 
    voice?: any
}
export {
    AudioVoice
}