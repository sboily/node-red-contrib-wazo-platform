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
      if (msg.data.call.id) {
        call_id = msg.data.call.id;
        application_uuid = msg.data.application_uuid;
        exten = node.exten || msg.payload.exten;
        context = node.context;
        callerId = msg.data.call.displayed_caller_id_number;

        node.log('Bridge Call');
        try {
          node.client.bridgeCall(application_uuid, call_id, context, exten, node.auto_answer, callerId);
          node.send(msg);
        }
        catch(err) {
          node.error(err);
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
      }
    }
    catch(err) {
      res.send(err);
    }

  });

  RED.nodes.registerType("wazo call", call);

}
