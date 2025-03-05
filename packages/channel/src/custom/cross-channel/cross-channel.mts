import { Channel } from '../index.mjs';

/**
 * A CrossChannel is a channel of which the send and receive modules are not internally connected. This means
 * that the send and receive message types can also differ. A normal Channel can receive its own message, but a
 * CrossChannel cannot, and so they are usually created in pairs to perform bidirectional communication with some
 * other entity.
 * @typeparam TSend - the send message type
 * @typeparam TReceive - the receive message type
 */
export interface CrossChannel<TSend = void, TReceive = TSend>
  extends Channel.Read<TReceive>,
    Channel.Write<TSend> {}

export namespace CrossChannel {
  /**
   * A pair of CrossChannels in which the send module of the first is connected to the receive of the second,
   * and the send module of the second is connected to the receive module of the first.
   * @typeparam TSend - the send message type
   * @typeparam TReceive - the receive message type
   */
  export type Pair<TSend, TReceive> = readonly [
    crossSendCh: CrossChannel<TSend, TReceive>,
    crossReceiveCh: CrossChannel<TReceive, TSend>,
  ];

  /**
   * Configuration options for creating a CrossChannel
   */
  export interface Config {
    /**
     * The write channel configuration.
     */
    write?: Channel.Config;
    /**
     * The read channel configuration.
     */
    read?: Channel.Config;
  }

  /**
   * Defines the static `CrossChannel` API.
   */
  export interface Constructors {
    /**
     * Returns a pair of connected CrossChannels of which the send module of the first is connected to the
     * receive module of the second, and the send module of the second is connected to the receive module
     * of the first.
     * @typeparam TSend - the send message type
     * @typeparam TReceive - the receive message type
     */
    createPair<TSend = void, TReceive = TSend>(
      config?: CrossChannel.Config
    ): CrossChannel.Pair<TSend, TReceive>;

    /**
     * Returns a CrossChannel where the send module comprises the given `writeCh`, and the receive module
     * conists of the given `readCh`.
     * @typeparam TSend - the send message type
     * @typeparam TReceive - the receive message type
     * @param writeCh - the write channel to use for sending messages
     * @param readCh - the read channel to use for receiving messages
     */
    combine<TSend = void, TReceive = TSend>(
      writeCh: Channel.Write<TSend>,
      readCh: Channel.Read<TReceive>
    ): CrossChannel<TSend, TReceive>;
  }
}

export const CrossChannel: CrossChannel.Constructors = Object.freeze(
  class {
    static createPair<TSend = void, TReceive = TSend>(
      config: CrossChannel.Config = {}
    ): CrossChannel.Pair<TSend, TReceive> {
      const sendCh = Channel.create<TSend>(config.write);
      const receiveCh = Channel.create<TReceive>(config.read);

      const crossReceiveCh = CrossChannel.combine(receiveCh, sendCh);
      const crossSendCh = CrossChannel.combine(sendCh, receiveCh);

      return [crossSendCh, crossReceiveCh];
    }

    static combine<TSend = void, TReceive = TSend>(
      writeCh: Channel.Write<TSend>,
      readCh: Channel.Read<TReceive>
    ): CrossChannel<TSend, TReceive> {
      const result: CrossChannel<TSend, TReceive> = {
        get capacity() {
          return readCh.capacity;
        },
        get length() {
          return readCh.length;
        },
        get isClosed() {
          return writeCh.isClosed;
        },
        get isExhausted() {
          return readCh.isExhausted;
        },
        [Symbol.asyncIterator]() {
          return readCh[Symbol.asyncIterator]();
        },
        asyncStream() {
          return readCh.asyncStream();
        },
        readable() {
          return result;
        },
        writable() {
          return result;
        },
        receive<RT>(options?: {
          signal?: AbortSignal | undefined;
          timeoutMs?: number | undefined;
          recover?: ((channelError: Channel.Error) => RT) | undefined;
        }): Promise<any> {
          return readCh.receive(options as any);
        },
        send(value, options): Promise<any> {
          return writeCh.send(value, options as any);
        },
        sendAll(source, options): Promise<any> {
          return writeCh.sendAll(source, options as any);
        },
        close() {
          return writeCh.close();
        },
      };

      return result;
    }
  }
);
