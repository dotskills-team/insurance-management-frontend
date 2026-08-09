declare module "socket.io-client" {
  interface Socket {
    id: string;

    on(event: string, callback: (...args: any[]) => void): this;
    once(event: string, callback: (...args: any[]) => void): this;
    off(event: string, callback?: (...args: any[]) => void): this;
    emit(event: string, ...args: any[]): this;

    connect(): this;
    disconnect(): this;
  }

  interface ManagerOptions {
    query?: Record<string, string>;
    transports?: string[];
  }

  interface SocketOptions extends ManagerOptions {}

  function io(
    uri: string,
    opts?: SocketOptions
  ): Socket;

  export = io;
}