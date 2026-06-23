// Tipos mínimos da Web NFC API (Chrome para Android).
// Não vem no lib.dom padrão do TS, então declaramos o necessário.

interface NDEFMessage {
  records: ReadonlyArray<NDEFRecord>;
}

interface NDEFRecord {
  recordType: string;
  mediaType?: string;
  id?: string;
  data?: DataView;
  encoding?: string;
  lang?: string;
}

interface NDEFReadingEvent extends Event {
  serialNumber: string;
  message: NDEFMessage;
}

declare class NDEFReader extends EventTarget {
  scan(options?: { signal?: AbortSignal }): Promise<void>;
  addEventListener(
    type: "reading",
    listener: (this: this, ev: NDEFReadingEvent) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: "readingerror",
    listener: (this: this, ev: Event) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
}

interface Window {
  NDEFReader?: typeof NDEFReader;
}
