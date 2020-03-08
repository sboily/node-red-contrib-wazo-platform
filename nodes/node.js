module.exports = function (RED) {
  const { WazoApiClient } = require('@wazo/sdk');
  const fetch = require('node-fetch');
  const https = require("https");

  const agent = new https.Agent({
    rejectUnauthorized: false
  });
    
  function node(n) {
    RED.nodes.createNode(this, n);
    conn = RED.nodes.getNode(n.server);
    this.node_name = n.node_name;
    this.node_uuid = n.node_uuid;
    this.refreshToken = n.refreshToken;
    this.client = conn.client.application;

    var node = this;

    node.on('input', async msg => {
      call_id = msg.payload.call ? msg.payload.call.id : msg.payload.call_id;
      application_uuid = msg.payload.application_uuid;
      if (call_id && application_uuid) {
        node.log("Call will entered to a node");

        const token = await conn.authenticate();

        if (node.node_uuid) {
          try {
            const { ...calls_node} = await node.client.listCallsNodes(application_uuid, node.node_uuid);
            node.node_uuid = calls_node.uuid;
          }
          catch(err) {
            node.node_uuid = null;
          }
        }

        if (node.node_uuid) {
          try {
            const { ...callNode} = await node.client.addCallNodes(application_uuid, node.node_uuid, call_id);
            node.log(`Add call to existing node ${node.node_uuid}`);
            msg.payload.call_id = call_id;
            msg.payload.application_uuid = application_uuid;
            msg.payload.node_uuid = node.node_uuid;
            msg.payload.data = callNode;
            node.send(msg);
          }
          catch(err) {
            node.error(err);
            throw err;
          }
        } else {
          try {
            const url = `https://${conn.host}:${conn.port}/api/calld/1.0/applications/${application_uuid}/nodes`;
            const { ...nodeCreated} = await createNodeAddCall(url, token, call_id);
            node.log(`Add call to node ${nodeCreated.uuid}`);
            node.node_uuid = nodeCreated.uuid;
            msg.payload.call_id = call_id;
            msg.payload.application_uuid = application_uuid;
            msg.payload.node_uuid = node.node_uuid;
            msg.payload.data = nodeCreated;
            node.send(msg);
          }
          catch(err) {
            node.error(err);
            throw err;
          }
        }
      }
    });

  }

  // FIXME: Remove when SDK will be ready
  async function createNodeAddCall(url, token, call_id) {
    const body = {
      calls: [{
        id: call_id
      }]
    }

    const options = {
        method: 'POST',
        agent: agent,
        body: JSON.stringify(body),
        headers: {
          'content-type': 'application/json',
          'X-Auth-Token': token
        }
    }

    return fetch(url, options).then(response => response.json()).then(data => data);
  }

  RED.httpAdmin.post('/wazo-platform/node', (req, res) => {
  });

  RED.nodes.registerType("wazo node", node);

}
