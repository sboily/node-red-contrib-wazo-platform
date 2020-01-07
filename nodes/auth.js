module.exports = function(RED) {
  const { WazoApiClient } = require('@wazo/sdk');

  function wazoAuth(n) {
    RED.nodes.createNode(this, n);
    this.host = n.host;
    this.port = n.port;
    this.client = null;

    if (this.credentials) {
      this.username = this.credentials.username;
      this.password = this.credentials.password;
    }

    var node = this;

    this.connect = async function() {
      console.log("Connection to Wazo Auth...");
      this.client = new WazoApiClient({
        server: `${this.host}:${this.port}`,
        clientId: 'wazo-nodered'
      });

      const { refreshToken, ...result } = await this.client.auth.logIn({
        expiration: 180,
        username: this.username,
        password: this.password
      });

      this.client.setToken(result.token);
      this.client.setRefreshToken(refreshToken);
      return result;
    };

  }

  RED.nodes.registerType("wazo auth", wazoAuth, {
    credentials: {
      username: {type: "text"},
      password: {type: "password"},
    }
  });

}
