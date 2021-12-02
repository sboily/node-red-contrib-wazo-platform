global.window = global;

module.exports = function (RED) {
  const { WazoApiClient } = require('@wazo/sdk');
  const fetch = require('node-fetch');
  const https = require("https");

  const agent = new https.Agent({
    rejectUnauthorized: false
  });

  function make_call(n) {
    RED.nodes.createNode(this, n);
    this.user_uuid = n.user_uuid;
    this.context = n.context;
    this.extension = n.extension;
    this.conn = RED.nodes.getNode(n.server);
    this.client = this.conn.client.calld;

    var node = this;

    node.on('input', async msg => {
      const user_uuid = msg.payload.user_uuid ? msg.payload.user_uuid : node.user_uuid;
      const context = msg.payload.context ? msg.payload.context : node.context;
      const extension = msg.payload.extension ? msg.payload.extension : node.extension;
      const all_lines = msg.payload.all_lines ?  msg.payload.all_lines: true;
      const token = await node.conn.authenticate();

      try {
        const url = `https://${node.conn.host}:${node.conn.port}/api/calld/1.0/calls`;
        const make_call = await makeCall(url, token, context, extension, user_uuid, all_lines);
        node.log(`Make call to ${extension} for ${user_uuid}`);
        msg.payload = make_call;
        node.send(msg);
      }
      catch(err) {
        node.error(err);
        throw err;
      }
    });

  }

  // FIXME: Remove when SDK will be ready
  const makeCall = async (url, token, context, extension, user_uuid, all_lines) => {
    const body = {
      destination: {
        context: context,
        extension: extension,
        priority: 1
      },
      source: {
        user: user_uuid,
        all_lines: all_lines,
      }
    };

    const options = {
        method: 'POST',
        agent: agent,
        body: JSON.stringify(body),
        headers: {
          'content-type': 'application/json',
          'X-Auth-Token': token
        }
    };

    return fetch(url, options).then(response => response.json()).then(data => data);
  };

  RED.httpAdmin.post('/wazo-platform/users', async (req, res) => {
    client = new WazoApiClient({
      server: `${req.body.host}:${req.body.port}`,
      agent: agent,
      clientId: 'wazo-nodered'
    });

    try {
       const auth = await client.auth.refreshToken(req.body.refreshToken);
       client.setToken(auth.token);
      try {
        const users = await client.confd.listUsers();
        res.json(users);
      }
      catch(err) {
        res.send(err);
        throw err;
      }
    }
    catch(err) {
      res.send(err);
      throw err;
    }
  });

  RED.httpAdmin.post('/wazo-platform/contexts', async (req, res) => {
    client = new WazoApiClient({
      server: `${req.body.host}:${req.body.port}`,
      agent: agent,
      clientId: 'wazo-nodered'
    });

    try {
      const authentication = await client.auth.refreshToken(req.body.refreshToken);
      client.setToken(authentication.token);
      try {
        // FIXME: Remove when SDK will be ready
        // const { ...contexts } = await client.confd.listContexts();

        const url = `https://${req.body.host}:${req.body.port}/api/confd/1.1/contexts`;
        const contexts = await listContexts(url, authentication.token);

        res.json(contexts);
      }
      catch(err) {
        res.send(err);
        throw err;
      }
    }
    catch(err) {
      res.send(err);
      throw err;
    }

  });

  RED.nodes.registerType("wazo make call", make_call);

};
