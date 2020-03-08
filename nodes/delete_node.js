module.exports = function (RED) {
  const { WazoApiClient } = require('@wazo/sdk');

  function delete_node(n) {
    RED.nodes.getNode(this, n);
    conn = RED.nodes.getNode(n.server);
    this.client = conn.client.application;

    var node = this;

    node.on('input', async msg => {
      node_uuid = msg.payload.node_uuid;
      application_uuid = msg.payload.application_uuid;

      if (node_uuid && application_uuid) {
        node.log("Delete node");
        try {
          const { ...node} = await node.client.removeNode(application_uuid, node_uuid);
          node.log(`Remove node ${node_uuid}`);
          msg.payload.application_uuid = application_uuid;
          msg.payload.node_uuid = node_uuid;
          msg.payload.data = node;
          node.send(msg);
        }
        catch(err) {
          node.error(err);
          throw err;
        }
      }
    });

  }

  RED.nodes.registerType("wazo delete_node", delete_node);

}
