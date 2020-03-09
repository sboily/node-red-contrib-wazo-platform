module.exports = function (RED) {
  const { WazoApiClient } = require('@wazo/sdk');

  function list_calls_node(n) {
    RED.nodes.createNode(this, n);
    conn = RED.nodes.getNode(n.server);
    this.client = conn.client.application;

    var node = this;

    node.on('input', async msg => {
      node_uuid = msg.payload.node ? msg.payload.node.uuid : msg.payload.node_uuid;
      application_uuid = msg.payload.application_uuid;

      if (node_uuid && application_uuid) {
        try {
          const { ...callsNode } = await node.client.listCallsNodes(application_uuid, node_uuid);
          node.log(`List calls node ${node_uuid}`);
          msg.payload.application_uuid = application_uuid;
          msg.payload.node_uuid = node_uuid;
          msg.payload.data = callsNode;
          node.send(msg);
        }
        catch(err) {
          node.error(err);
          throw err;
        }
      }
    });

  }

  RED.nodes.registerType("wazo list_calls_node", list_calls_node);

}
