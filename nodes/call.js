module.exports = function (RED) {
  const { WazoApiClient } = require('@wazo/sdk');
  const fetch = require('node-fetch');
  const https = require("https");

  const agent = new https.Agent({
    rejectUnauthorized: false
  });

  function call(n) {
    RED.nodes.createNode(this, n);
    wazoConn = RED.nodes.getNode(n.server);
    this.context = n.context;
    this.exten = n.exten;
    this.auto_answer = n.auto_answer;
    this.client = wazoConn.client.application;

    var node = this;

    node.on('input', msg => {
      if (msg.payload.call.id) {
        let call_id = msg.payload.call.id;
        let application_uuid = msg.payload.application_uuid;
        let exten = node.exten || msg.payload.exten;
        let context = node.context;
        let callerId = msg.payload.call.displayed_caller_id_number;

        node.log('Bridge Call');
        try {
          msg.payload = node.client.bridgeCall(application_uuid, call_id, context, exten, node.auto_answer, callerId);
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
  async function listContexts(url, token) {
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

  RED.httpAdmin.post('/wazo-platform/contexts', RED.auth.needsPermission('wazo.write'), async function(req, res) {
    client = new WazoApiClient({
      server: `${req.body.host}:${req.body.port}`,
      agent: agent,
      clientId: 'wazo-nodered'
    });

    try {
      const { ...authentication } = await client.auth.refreshToken(req.body.refreshToken);
      client.setToken(authentication.token);
      try {
        // FIXME: Remove when SDK will be ready
        // const { ...trunks } = await client.confd.listContexts();

        const url = `https://${req.body.host}:${req.body.port}/api/confd/1.1/contexts`;
        const { ...trunks } = await listContexts(url, authentication.token);

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

  RED.nodes.registerType("wazo call", call);

}
