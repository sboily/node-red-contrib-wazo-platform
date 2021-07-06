global.window = global;

module.exports = function (RED) {
  const { WazoApiClient } = require('@wazo/sdk');
  const fetch = require('node-fetch');
  const https = require("https");

  const agent = new https.Agent({
    rejectUnauthorized: false
  });
    
  function create_node(n) {
    RED.nodes.createNode(this, n);
    conn = RED.nodes.getNode(n.server);
    this.refreshToken = n.refreshToken;
    this.client = conn.client.application;

    var node = this;

    node.on('input', async msg => {
      call_id = msg.payload.call ? msg.payload.call.id : msg.payload.call_id;
      application_uuid = msg.payload.application_uuid;

      if (call_id && application_uuid) {
        const token = await conn.authenticate();

        try {
          const url = `https://${conn.host}:${conn.port}/api/calld/1.0/applications/${application_uuid}/nodes`;
          const nodeCreated = await createNodeAddCall(url, token, call_id);
          node.log(`Add call to node ${nodeCreated.uuid}`);
          msg.payload.call_id = call_id;
          msg.payload.application_uuid = application_uuid;
          msg.payload.node_uuid = nodeCreated.uuid;
          msg.payload.data = nodeCreated;
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

  RED.nodes.registerType("wazo create_node", create_node);

};
