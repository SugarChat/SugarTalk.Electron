export class GoogleOAuth2Client {
  private redirectUri: string;

  private clientId: string;

  constructor(clientId: string, redirectUri: string) {
    this.clientId = clientId;
    this.redirectUri = redirectUri;
  }

  getToken = (code: string) => {};
}
