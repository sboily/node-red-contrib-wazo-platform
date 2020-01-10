module.exports = function(RED) {
  const { WazoApiClient } = require('@wazo/sdk');
  const https = require("https");

  const agent = new https.Agent({
    rejectUnauthorized: false
  });

  function wazoAuth(n) {
    RED.nodes.createNode(this, n);
    this.host = n.host;
    this.port = n.port;
    this.refreshToken = n.refreshToken;

    var node = this;

    this.client = new WazoApiClient({
      server: `${this.host}:${this.port}`,
      agent: agent,
      clientId: 'wazo-nodered'
    });

    this.authenticate = async function() {
      node.log("Connection to Wazo Auth...");

      try {
        const { ...result } = await this.client.auth.refreshToken(this.refreshToken);
        this.client.setToken(result.token);
        this.client.setRefreshToken(this.refreshToken);
        return result;
      }
      catch(error) {
        node.error(error);
      }
    };

  }

  RED.httpAdmin.post('/wazo-platform/auth', RED.auth.needsPermission('wazo.write'), async function(req, res) {
    client = new WazoApiClient({
      server: `${req.body.host}:${req.body.port}`,
      agent: agent,
      clientId: 'wazo-nodered'
    });

    const { refreshToken, ...result } = await this.client.auth.logIn({
      username: req.body.username,
      password: req.body.password
    });

    res.send(refreshToken);
  });

  RED.nodes.registerType("wazo auth", wazoAuth);

}
