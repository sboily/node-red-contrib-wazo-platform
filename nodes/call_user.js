module.exports = function (RED) {
  const { WazoApiClient } = require('@wazo/sdk');
  const fetch = require('node-fetch');
  const https = require("https");

  const agent = new https.Agent({
    rejectUnauthorized: false
  });

  function call_user(n) {
    RED.nodes.createNode(this, n);
    this.user_uuid = n.user_uuid;
    this.conn = RED.nodes.getNode(n.server);
    this.client = this.conn.client.calld;

    var node = this;

    node.on('input', async msg => {
      call_id = msg.payload.call ? msg.payload.call.id : msg.payload.call_id;
      application_uuid = msg.payload.application_uuid;
      node_uuid = msg.payload.node_uuid;

      if (call_id && application_uuid) {
        const token = await node.conn.authenticate();

        if (!node_uuid) {
          const url = `https://${node.conn.host}:${node.conn.port}/api/calld/1.0/applications/${application_uuid}/nodes`;
          const { ...nodeCreated} = await createNodeAddCall(url, token, call_id);
          node_uuid = nodeCreated.uuid;
        }

        const url = `https://${node.conn.host}:${node.conn.port}/api/calld/1.0/applications/${application_uuid}/nodes/${node_uuid}/calls/user`;
        try {
          const { ...call_user} = await initiateCallUser(url, token, node.user_uuid);
          node.log(`Call user ${node.user_uuid} to node ${node_uuid}`);
          msg.payload.call_id = call_id;
          msg.payload.application_uuid = application_uuid;
          msg.payload.node_uuid = node_uuid;
          msg.payload.data = call_user;
          node.send(msg);
        }
        catch(err) {
          node.error(err);
          throw err;
        }
      }
    });

  }

  // FIXME: Remove when SDK will be ready
  const initiateCallUser = async (url, token, user_uuid) => {
    const body = {
      user_uuid: user_uuid
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

  // FIXME: Remove when SDK will be ready
  const listNodes = async (url, token) => {
    const options = {
        method: 'GET',
        agent: agent,
        headers: {
          'content-type': 'application/json',
          'X-Auth-Token': token
        }
    };

    return fetch(url, options).then(response => response.json()).then(data => data);
  };

  // FIXME: Remove when SDK will be ready
  const createNodeAddCall = async (url, token, call_id) => {
    const body = {
      calls: [{
        id: call_id
      }]
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
       const { ...auth } = await client.auth.refreshToken(req.body.refreshToken);
       client.setToken(auth.token);
      try {
        const { ...users } = await client.confd.listUsers();
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

  RED.nodes.registerType("wazo call user", call_user);

};