module.exports = function (RED) {
  const { WazoApiClient } = require('@wazo/sdk');

  function create_node(n) {
    RED.nodes.createNode(this, n);
    conn = RED.nodes.getNode(n.server);
    this.client = conn.client.application;

    var node = this;

    node.on('input', async msg => {
      call_id = msg.payload.call ? msg.payload.call.id : msg.payload.call_id;
      application_uuid = msg.payload.application_uuid;

      if (call_id && application_uuid) {
        const token = await conn.authenticate();

        try {
          const nodeCreated = await node.client.createNewNodeWithCall(url, token, call_id);
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

  RED.nodes.registerType("wazo create_node", create_node);

};