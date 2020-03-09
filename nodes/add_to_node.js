module.exports = function (RED) {
  const { WazoApiClient } = require('@wazo/sdk');

  function add_to_node(n) {
    RED.nodes.createNode(this, n);
    conn = RED.nodes.getNode(n.server);
    this.client = conn.client.application;

    var node = this;

    node.on('input', async msg => {
      call_id = msg.payload.call ? msg.payload.call.id : msg.payload.call_id;
      application_uuid = msg.payload.application_uuid;
      node_uuid = msg.payload.node_uuid;

      if (call_id && application_uuid && node_uuid) {
        const token = await conn.authenticate();

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
      }
    });

  }

  RED.nodes.registerType("wazo add_to_node", add_to_node);

};