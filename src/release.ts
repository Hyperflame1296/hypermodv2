// release everything to the global scope
// this is also surprisingly required to connect to the server

// import: local classes
import { AudioEngine } from './classes/AudioEngine.js'
import { BinaryReader } from './classes/BinaryReader.js'
import { BinaryTranslator } from './classes/BinaryTranslator.js'
import { BinaryWriter } from './classes/BinaryWriter.js'
import { Client } from './classes/Client.js'
import { Color } from './classes/Color.js'
import { EventEmitter } from './classes/EventEmitter.js'
import { HyperMod } from './classes/HyperMod.js'
import { KeyboardNote } from './classes/KeyboardNote.js'
import { Knob } from './classes/Knob.js'
import { NoteQuota } from './classes/NoteQuota.js'
import { NPSTracker } from './classes/NPSTracker.js'
import { Player } from './classes/Player.js'
import { Rect } from './classes/Rect.js'
import { Renderer } from './classes/Renderer.js'
import { Scheduler } from './classes/Scheduler.js'

Object.assign(globalThis, {
    AudioEngine,
    BinaryReader,
    BinaryTranslator,
    BinaryWriter,
    Client,
    Color,
    EventEmitter,
    HyperMod,
    KeyboardNote,
    Knob,
    NoteQuota,
    NPSTracker,
    Player,
    Rect,
    Renderer,
    Scheduler
})