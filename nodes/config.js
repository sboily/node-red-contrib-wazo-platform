global.window = global;

module.exports = function (RED) {
  const { internalHTTP } = require('./lib/internal_api.js');
  const { WazoApiClient, WazoWebSocketClient } = require('@wazo/sdk');
  const https = require('https');
  const ws = require('ws');

  const eventList = [
    'fax_outbound_created',
    'fax_outbound_succeeded',
    'fax_outbound_failed',
    'queue_log',
    'queue_caller_abandon',
    'queue_caller_join',
    'queue_caller_leave',
    'queue_member_added',
    'queue_member_pause',
    'queue_member_penalty',
    'queue_member_removed',
    'queue_member_ringinuse',
    'queue_member_status',
    'stt',
    'user_created',
    'user_deleted',
    'user_edited',
    'call_push_notification',
  ];

  WazoWebSocketClient.eventLists.push(...eventList);

  const agent = new https.Agent({
    rejectUnauthorized: false,
  });

  function WazoConfigNode(config) {
    RED.nodes.createNode(this, config);
    this.host = config.host;
    this.port = config.port;
    this.debug = config.debug;
    this.expiration = config.expiration;
    this.refreshToken = config.refreshToken;
    this.insecure = true;
    this.token = false;
    this.sessionUuid = false;

    this.apiClient = new WazoApiClient({
      server: `${this.host}:${this.port}`,
      agent: agent,
      clientId: 'wazo-nodered',
    });

    this.authenticate = async () => {
      try {
        const check = await this.apiClient.auth.checkToken(this.token);
        if (check !== true) {
          this.log(`Connection to ${this.host} to get a valid token`);
          const auth = await this.apiClient.auth.refreshToken(this.refreshToken, null, this.expiration);
          this.token = auth.token;
          this.sessionUuid = auth.sessionUuid;
          this.apiClient.setToken(auth.token);
          this.apiClient.setRefreshToken(this.refreshToken);
        }
        return this.token;
      } catch (err) {
        this.error(err);
        throw err;
      }
    };

    this.setMaxListeners(0);
    const websocket = createClient(this);
  }

  const createClient = async (node) => {
    node.log(`Create websocket on ${node.host}`);
    if (node.insecure) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }

    const token = await node.authenticate();
    const wsClient = new WazoWebSocketClient({
      host: node.host,
      token: token,
      events: ['*'],
      version: 2,
    }, {
      WebSocket: ws,
      debug: node.debug,
    });

    node.apiClient.setOnRefreshToken((token) => {
      wsClient.updateToken(token);
      node.apiClient.setToken(token);
      node.log('Refresh Token refreshed');
    });

    eventList.forEach((event) => {
      wsClient.on(event, (message) => {
        if (event === 'auth_session_expire_soon' && message.data.uuid === node.sessionUuid) {
          node.log('Session will expire, force Refresh Token');
          node.apiClient.forceRefreshToken();
        }

        const msg = {
          topic: event,
          tenant_uuid: message.tenant_uuid,
          origin_uuid: message.origin_uuid,
          required_acl: message.required_acl,
          payload: message.data,
        };

        node.emit('onmessage', msg);
        node.emit(msg.topic, msg);
      });
    });

    wsClient.on('onopen', () => {
      node.emit('onopen');
    });

    wsClient.on('initialized', () => {
      node.emit('initialized');
    });

    wsClient.on('onclose', (err) => {
      node.emit('onclosed', err);
    });

    wsClient.on('onerror', (err) => {
      node.emit('onerror', err);
    });

    node.on('close', async (done) => {
      console.log('close websocket');
      wsClient.close();
      done();
    });

    try {
      wsClient.connect();
      return wsClient;
    } catch (err) {
      node.error(err);
      throw err;
    }
  };

  RED.nodes.registerType('wazo config', WazoConfigNode);

  // REGISTER ALL HTTP INTERNAL ENDPOINTS

  const registerEndpoint = (path, handler) => {
    RED.httpAdmin.post(`/wazo-platform/${path}`, async (req, res) => {
      await internalHTTP(req, res, `api/confd/1.1/${path}`, handler);
    });
  };

  RED.httpAdmin.post('/wazo-platform/auth', async (req, res) => {
    const apiClient = new WazoApiClient({
      server: `${req.body.host}:${req.body.port}`,
      agent: agent,
      clientId: 'wazo-nodered',
    });

    try {
      const { refreshToken, ...result } = await apiClient.auth.logIn({
        username: req.body.username,
        password: req.body.password,
        expiration: req.body.expiration,
      });

      res.send(refreshToken);
    } catch (err) {
      res.send(err);
      throw err;
    }
  });

  RED.httpAdmin.get('/wazo-platform/lib/*', (req, res) => {
    const options = {
      root: __dirname + '/lib/',
      dotfiles: 'deny',
    };
    res.sendFile(req.params[0], options);
  });

  registerEndpoint('users', 'listUsers');
  registerEndpoint('contexts', 'listContexts');
  registerEndpoint('tenants', 'listTenants');
  registerEndpoint('moh', 'listMoh');
  registerEndpoint('voicemails', 'listVoicemails');
  registerEndpoint('applications', 'listApplications');
  registerEndpoint('trunks', 'listTrunks');

  RED.httpAdmin.post('/wazo-platform/get-refresh', async (req, res) => {
    await internalHTTP(req, res, 'api/auth/0.1/users/me/tokens', 'listRefreshToken');
  });

  RED.httpAdmin.get('/wazo-platform/service', (req, res) => {
    const services = [
      'agentd',
      'auth',
      'calld',
      'call-logd',
      'chatd',
      'confd',
      'dird',
      'provd',
      'webhookd',
    ];
    res.json(services);
  });

  RED.httpAdmin.get('/wazo-platform/events', (req, res) => {
    res.json(WazoWebSocketClient.eventLists);
  });
};

