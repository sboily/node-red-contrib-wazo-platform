module.exports = function (RED) {
  const { WazoApiClient } = require('@wazo/sdk');
  const fetch = require('node-fetch');
  const https = require("https");

  const agent = new https.Agent({
    rejectUnauthorized: false
  });

  function bridge_call(n) {
    RED.nodes.createNode(this, n);
    conn = RED.nodes.getNode(n.server);
    this.context = n.context;
    this.exten = n.exten;
    this.auto_answer = n.auto_answer;
    this.client = conn.client.application;

    var node = this;

    node.on('input', msg => {
      call_id = msg.payload.call.id || msg.payload.call_id;
      application_uuid = msg.payload.application_uuid;
      exten = node.exten || msg.payload.exten;
      context = node.context || msg.payload.context;
      callerId = msg.payload.call.displayed_caller_id_number || msg.payload.displayed_caller_id_number;
      autoAnswer = node.auto_answer || msg.payload.auto_answer;;

      if (call_id && application_uuid) {
        node.log('Bridge Call');
        try {
          msg.payload = node.client.bridgeCall(application_uuid, call_id, context, exten, autoAnswer, callerId);
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

  RED.httpAdmin.post('/wazo-platform/contexts', async (req, res) => {
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

  RED.nodes.registerType("wazo bridge_call", bridge_call);

}
