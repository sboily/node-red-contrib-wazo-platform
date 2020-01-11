module.exports = function(RED) {
  const { WazoApiClient } = require('@wazo/sdk');
  const fetch = require('node-fetch');
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

  // FIXME: Remove when SDK will be ready
  async function listRefreshToken(url, token) {
    const options = {
        method: 'GET',
        agent: agent,
        headers: {
          'content-type': 'application/json',
          'X-Auth-Token': token
        }
    };

    return fetch(url, options).then(response => response.json()).then(data => data);
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

  RED.httpAdmin.post('/wazo-platform/get-refresh', RED.auth.needsPermission('wazo.write'), async function(req, res) {
    client = new WazoApiClient({
      server: `${req.body.host}:${req.body.port}`,
      agent: agent,
      clientId: 'wazo-nodered'
    });

    const { ...authentication } = await client.auth.refreshToken(req.body.refreshToken);
    client.setToken(authentication.token);

    const url = `https://${req.body.host}:${req.body.port}/api/auth/0.1/users/me/tokens`;
    const { ...refreshToken } = await listRefreshToken(url, authentication.token);

    res.json(refreshToken);
  });

  RED.httpAdmin.get("/wazo-platform/lib/*", function(req, res) {
    var options = {
      root: __dirname + '/lib/',
      dotfiles: 'deny'
    };
    res.sendFile(req.params[0], options);
  });

  RED.nodes.registerType("wazo auth", wazoAuth);

}
