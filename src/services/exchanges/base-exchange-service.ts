export class BaseExchangeClient {
  key: string;
  secret: string;
  passphrase: string;
  client: any;
  isUp = false;

  protected handleConnection() {
    throw new Error('handleConnection is not implemented.');
  }

  protected getClient(): any {
    if (!this.client) {
      throw new Error('client is not connected.  please connect first');
    }
    return this.client;
  }
}
