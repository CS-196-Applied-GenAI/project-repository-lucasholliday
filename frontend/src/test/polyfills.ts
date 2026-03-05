import 'whatwg-fetch'
import { TextDecoder, TextEncoder } from 'util'
import { ReadableStream, TransformStream, WritableStream } from 'stream/web'

class MockBroadcastChannel {
  name: string
  onmessage: ((event: MessageEvent) => void) | null

  constructor(name: string) {
    this.name = name
    this.onmessage = null
  }

  postMessage(_message: unknown) {}
  close() {}
  addEventListener(_type: string, _listener: EventListenerOrEventListenerObject) {}
  removeEventListener(_type: string, _listener: EventListenerOrEventListenerObject) {}
}

Object.assign(globalThis, {
  TextEncoder,
  TextDecoder,
  ReadableStream,
  TransformStream,
  WritableStream,
  BroadcastChannel: MockBroadcastChannel,
})
