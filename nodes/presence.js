module.exports = function (RED) {
  const { WazoApiClient } = require('@wazo/sdk');
  const fetch = require('node-fetch');
  const https = require("https");

  const agent = new https.Agent({
    rejectUnauthorized: false
  });

  function presence(n) {
    RED.nodes.createNode(this, n);
    this.user_uuid = n.user_uuid;
    conn = RED.nodes.getNode(n.server);
    this.client = conn.client.chatd;

    var node = this;

    node.on('input', async msg => {
      state = msg.payload.state;
      status = msg.payload.status;
      user_uuid = msg.payload.user_uuid || node.user_uuid;

      if (state) {
        if (!conn.client.client.token) {
          try {
            await conn.authenticate();
          }
          catch(err) {
            node.error(err);
          }
        }
        const token = conn.client.client.token;
        if (status) {
          change_status(user_uuid, state, status);
        } else {
          change_state(user_uuid, state);
        }
        msg.payload['user_uuid'] = user_uuid;
        node.send(msg);
      }
    });

    function change_state(user_uuid, state) {
      try {
        node.client.updateState(user_uuid, state);
        node.log(`Update state presence for ${user_uuid} to ${state}`);
      }
      catch(err) {
        node.error(err);
      }
    }

    function change_status(user_uuid, state, status) {
      try {
        node.client.updateStatus(user_uuid, state, status);
        node.log(`Update state/status presence for ${user_uuid} to ${state}/${status}`);
      }
      catch(err) {
        node.error(err);
      }
    }

  }

  RED.httpAdmin.post('/wazo-platform/users', RED.auth.needsPermission('wazo.write'), async function(req, res) {
    client = new WazoApiClient({
      server: `${req.body.host}:${req.body.port}`,
      agent: agent,
      clientId: 'wazo-nodered'
    });

    try {
       const { ...authentication } = await client.auth.refreshToken(req.body.refreshToken);
       client.setToken(authentication.token);
      try {
        const { ...users } = await client.confd.listUsers();
        res.json(users);
      }
      catch(err) {
        res.send(err);
      }
    }
    catch(err) {
      res.send(err);
    }
  });

  RED.nodes.registerType("wazo presence", presence);

}
