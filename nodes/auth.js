module.exports = function(RED) {
  const { WazoApiClient } = require('@wazo/sdk');

  function wazoAuth(n) {
    RED.nodes.createNode(this, n);
    this.host = n.host;
    this.port = n.port;
    this.refreshToken = n.refreshToken;

    var node = this;

    this.client = new WazoApiClient({
      server: `${this.host}:${this.port}`,
      clientId: 'wazo-nodered'
    });

    this.authenticate = async function() {
      console.log("Connection to Wazo Auth...");

      try {
        const { ...result } = await this.client.auth.refreshToken(this.refreshToken);
        this.client.setToken(result.token);
        this.client.setRefreshToken(this.refreshToken);
        return result;
      }
      catch(error) {
        console.log(error);
      }
    };

  }

  RED.nodes.registerType("wazo auth", wazoAuth);

}
