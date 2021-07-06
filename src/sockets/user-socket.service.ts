import {SocketService, IO, Socket, Input, Emit, Args, SocketSession, Nsp} from "@tsed/socketio";
import { Exchange, Portfolio } from '@prisma/client';
import { GenericReduxSocketEvent } from '../models/generic-reduc-socket-event';
import { $log } from '@tsed/common';

@SocketService("/user")
export class UserSocketService {
    userSockets: { [userToken: string]: SocketIO.Socket } = {};
    @Nsp nsp: SocketIO.Namespace;

    constructor(@IO private io: SocketIO.Server) {}

    @Input("user::subscribe")
    @Emit("user::subscribed")
    async subscribeUser(@Args(0) userToken: string, @Socket socket: SocketIO.Socket, @SocketSession session: SocketSession) {
        this.userSockets[userToken] = socket;
        return "subscribed";
    }

    async portfolioReceived(portfolio: Portfolio) {
      return this.emitUserReduxEvent(portfolio.userId, 'portfolio/portfolioReceived', portfolio);
    }

    async exchangesReceived(userId: number, exchanges: Exchange[]) {
      return this.emitUserReduxEvent(userId, 'exchanges/exchangesReceived', exchanges);
    }

    @Emit("socket::user::event")
    private async emitGenericReduxEvent(type: string, payload: any): Promise<GenericReduxSocketEvent> {
      const eventPayload =  new GenericReduxSocketEvent(type, payload);
      this.nsp.emit('socket::user::event', payload);
      return eventPayload;
    }

    @Emit("socket::user::event")
    private async emitUserReduxEvent(userId: number, type: string, payload: any): Promise<GenericReduxSocketEvent> {
      const eventPayload =  new GenericReduxSocketEvent(type, payload);
      this.userSockets[userId]?.nsp.emit('socket::user::event', eventPayload);
      return eventPayload;
    }

    /**
     * Triggered the namespace is created
     */
    $onNamespaceInit(nsp: SocketIO.Namespace) {
      // $log.info("onNamespaceInit", nsp)
    }

    $onConnection(@Socket socket: SocketIO.Socket, @SocketSession session: SocketSession) {
      $log.info("connection", socket.id)
    }
    /**
     * Triggered when a client disconnects from the Namespace.
     */
    $onDisconnect(@Socket socket: SocketIO.Socket) {
      $log.info("disconnect", socket.id)
    }
}