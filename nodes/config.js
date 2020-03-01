module.exports = function(RED) {
  const { WazoApiClient, WazoWebSocketClient } = require('@wazo/sdk');
  const fetch = require('node-fetch');
  const https = require("https");
  const ws = require("ws");

  WazoWebSocketClient.eventLists.push('stt');
  WazoWebSocketClient.eventLists.push('queue_log');
  WazoWebSocketClient.eventLists.push('queue_caller_abandon');
  WazoWebSocketClient.eventLists.push('queue_caller_join');
  WazoWebSocketClient.eventLists.push('queue_caller_leave');
  WazoWebSocketClient.eventLists.push('queue_member_added');
  WazoWebSocketClient.eventLists.push('queue_member_pause');
  WazoWebSocketClient.eventLists.push('queue_member_penalty');
  WazoWebSocketClient.eventLists.push('queue_member_removed');
  WazoWebSocketClient.eventLists.push('queue_member_ringinuse');
  WazoWebSocketClient.eventLists.push('queue_member_status');

  const agent = new https.Agent({
    rejectUnauthorized: false
  });

  function config(n) {
    RED.nodes.createNode(this, n);
    this.host = n.host;
    this.port = n.port;
    this.debug = n.debug;
    this.expiration = n.expiration;
    this.refreshToken = n.refreshToken;
    this.insecure = true;

    var node = this;

    this.client = new WazoApiClient({
      server: `${this.host}:${this.port}`,
      agent: agent,
      clientId: 'wazo-nodered'
    });

    this.authenticate = async function() {
      node.log("Connection to Wazo Auth...");

      try {
        const { ...result } = await this.client.auth.refreshToken(this.refreshToken, null, this.expiration);
        this.client.setToken(result.token);
        this.client.setRefreshToken(this.refreshToken);
        return result;
      }
      catch(error) {
        node.error(error);
      }
    };

    this.websocket = createClient(node);

  }

  const createClient = async (node) => {
    if (node.insecure) {
      process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
    }

    const session = await node.authenticate();
    if (!session) {
      node.error('There is no authenticated session');
    }

    const client = new WazoWebSocketClient({
      host: node.host,
      token: session.token,
      events: ['*'],
      version: 2
    }, {
        WebSocket: ws,
        debug: node.debug
    });

    node.client.setOnRefreshToken((token) => {
      client.updateToken(token);
      node.log('Refresh Token refreshed');
    });

    WazoWebSocketClient.eventLists.map(event => client.on(event, (msg) => {
      if (msg.data) { msg.payload = msg.data; }
      if (msg.name) { msg.topic = msg.name; }

      if (msg.name == 'auth_session_expire_soon') {
        if (msg.data.uuid == session.sessionUuid) {
          node.log('Session will expire, force Refresh Token');
          client.forceRefreshToken();
        }
      }

      node.emit('onmessage', msg);
      node.emit(msg.name, msg);

    }));

    client.on('onopen', () => {
      node.emit('onopen');
    });

    client.on('initialized', () => {
      node.emit('initialized');
    });

    client.on('onclose', (err) => {
      node.emit('onclosed', err);
    });

    client.on('onerror', (err) => {
      node.emit('onerror', err);
    });

    try {
      client.connect();
      return client;
    }
    catch(err) {
      node.error(err);
    }
  }

  // FIXME: Remove when SDK will be ready
  const listRefreshToken = async (url, token) => {
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

  RED.httpAdmin.post('/wazo-platform/auth', async (req, res) => {
    client = new WazoApiClient({
      server: `${req.body.host}:${req.body.port}`,
      agent: agent,
      clientId: 'wazo-nodered'
    });

    try {
      const { refreshToken, ...result } = await this.client.auth.logIn({
        username: req.body.username,
        password: req.body.password,
        expiration: req.body.expiration
      });

      res.send(refreshToken);
    }
    catch(err) {
      res.send(err);
    }
  });

  RED.httpAdmin.post('/wazo-platform/get-refresh', async (req, res) => {
    client = new WazoApiClient({
      server: `${req.body.host}:${req.body.port}`,
      agent: agent,
      clientId: 'wazo-nodered'
    });

    try {
      const { ...authentication } = await client.auth.refreshToken(req.body.refreshToken);
      client.setToken(authentication.token);

      try {
        const url = `https://${req.body.host}:${req.body.port}/api/auth/0.1/users/me/tokens`;
        const { ...refreshToken } = await listRefreshToken(url, authentication.token);
        res.json(refreshToken);
      }
      catch(err) {
        res.send(err);
      }
    }
    catch(err) {
      res.send(err);
    }

  });

  RED.httpAdmin.get("/wazo-platform/lib/*", (req, res) => {
    var options = {
      root: __dirname + '/lib/',
      dotfiles: 'deny'
    };
    res.sendFile(req.params[0], options);
  });

  RED.nodes.registerType("wazo config", config);

}
