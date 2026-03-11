declare module 'electrobun/view' {
  import type { ElectrobunRPCSchema, RPCWithTransport } from 'electrobun/bun'

  export class Electroview<T = unknown> {
    constructor(config: { rpc: T })
    static defineRPC<Schema extends ElectrobunRPCSchema = ElectrobunRPCSchema>(config: Record<string, unknown>): RPCWithTransport<Schema['webview'], Schema['bun']>
  }
}
