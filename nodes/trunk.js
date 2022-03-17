global.window = global;

module.exports = function (RED) {
  const { WazoApiClient } = require('@wazo/sdk');
  const fetch = require('node-fetch');
  const https = require("https");

  const agent = new https.Agent({
    rejectUnauthorized: false
  });

  function trunk(n) {
    RED.nodes.createNode(this, n);
    this.conn = RED.nodes.getNode(n.server);
    this.trunk_id = n.trunk_id;
    this.client = this.conn.apiClient.calld;
    this.ws = this.conn;

    var node = this;

    node.ws.on('trunk_status_updated', msg => {
      if (msg.payload.id == node.trunk_id) {
        setStatus(msg.payload);
        node.send(msg);
      }
    });

    const setStatus = (data) => {
      if (data.registered) {
        node.status({fill:"green", shape:"dot", text: `register - calls: ${data.current_call_count}`});
      } else {
        node.status({fill:"red", shape:"dot", text: `unregister - calls: ${data.current_call_count}`});
      }
    };

    const initListTrunks = async () => {
      const token = await node.conn.authenticate();
      const trunks = await node.client.listTrunks();
      trunks.items.map(item => {
        if (item.id == node.trunk_id) {
          setStatus(item);
        }
      });
    };

    initListTrunks();
  }

  // FIXME: Remove when SDK will be ready
  const confdListTrunks = (url, token) => {
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

  RED.httpAdmin.post('/wazo-platform/trunks', async function(req, res) {
    client = new WazoApiClient({
      server: `${req.body.host}:${req.body.port}`,
      agent: agent,
      clientId: 'wazo-nodered'
    });

    try {
      const auth = await client.auth.refreshToken(req.body.refreshToken);
      client.setToken(auth.token);
      try {
        // FIXME: Remove when SDK will be ready
        // const { ...trunks } = await client.confd.listTrunks();

        const url = `https://${req.body.host}:${req.body.port}/api/confd/1.1/trunks`;
        const trunks = await confdListTrunks(url, auth.token);
        res.json(trunks);
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

  RED.nodes.registerType("wazo trunk", trunk);

};
