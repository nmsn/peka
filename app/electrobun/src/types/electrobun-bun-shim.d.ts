declare module 'electrobun/bun' {
  export type RPCSchema<T = any> = T

  export type ElectrobunRPCSchema = {
    bun: RPCSchema
    webview: RPCSchema
  }

  export type RPCEndpoint<Schema> = Schema extends { requests: infer Requests; messages: infer Messages }
    ? {
        request: {
          [K in keyof Requests]: Requests[K] extends { params: infer Params; response: infer Response }
            ? undefined extends Params
              ? (params?: Params) => Promise<Response>
              : (params: Params) => Promise<Response>
            : never
        }
        send: {
          [K in keyof Messages]: undefined extends Messages[K]
            ? (payload?: Messages[K]) => void
            : (payload: Messages[K]) => void
        }
      }
    : {
        request: Record<string, (...args: any[]) => Promise<any>>
        send: Record<string, (...args: any[]) => void>
      }

  export type RPCWithTransport<Local extends RPCSchema = RPCSchema, Remote extends RPCSchema = RPCSchema> =
    RPCEndpoint<Remote> & {
    setTransport: (transport: unknown) => void
  }

  export interface BrowserWindowInstance<T = RPCWithTransport> {
    id: number
    webview: {
      openDevTools?: () => void
    }
    show(): void
    close(): void
    minimize(): void
    unminimize(): void
    maximize(): void
    unmaximize(): void
    isMinimized(): boolean
    isMaximized(): boolean
    setAlwaysOnTop(alwaysOnTop: boolean): void
    on(eventName: string, handler: (event: unknown) => void): void
  }

  export class BrowserWindow<T = RPCWithTransport> implements BrowserWindowInstance<T> {
    constructor(options?: Record<string, unknown>)
    static getById<T = RPCWithTransport>(id: number): BrowserWindow<T> | undefined
    id: number
    webview: {
      openDevTools?: () => void
    }
    show(): void
    close(): void
    minimize(): void
    unminimize(): void
    maximize(): void
    unmaximize(): void
    isMinimized(): boolean
    isMaximized(): boolean
    setAlwaysOnTop(alwaysOnTop: boolean): void
    on(eventName: string, handler: (event: unknown) => void): void
  }

  export class BrowserView {
    static defineRPC<Schema extends ElectrobunRPCSchema = ElectrobunRPCSchema>(config: Record<string, unknown>): RPCWithTransport<Schema['bun'], Schema['webview']>
  }

  export class Tray {
    constructor(options?: Record<string, unknown>)
    static getById(id: number): Tray | undefined
    setTitle(title: string): void
    setMenu(items: Array<Record<string, unknown>>): void
    on(eventName: string, handler: (event: unknown) => void): void
  }

  export const GlobalShortcut: {
    register: (accelerator: string, callback: () => void) => boolean
    unregisterAll: () => void
  }

  export interface ElectrobunConfig {
    app: {
      name: string
      identifier: string
      version: string
      description?: string
    }
    build?: Record<string, unknown>
  }

  const Electrobun: {
    events: {
      on(eventName: string, handler: (event: unknown) => void): void
    }
  }

  export default Electrobun
}
