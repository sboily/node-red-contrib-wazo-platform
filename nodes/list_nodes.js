module.exports = function (RED) {
  const { WazoApiClient } = require('@wazo/sdk');

  function list_nodes(n) {
    RED.nodes.createNode(this, n);
    conn = RED.nodes.getNode(n.server);
    this.client = conn.client.application;

    var node = this;

    node.on('input', async msg => {
      application_uuid = msg.payload.application_uuid;

      if (application_uuid) {
        try {
          const nodesNode = await node.client.listNodes(application_uuid);
          node.log('List nodes');
          msg.payload.application_uuid = application_uuid;
          msg.payload.data = nodesNode;
          node.send(msg);
        }
        catch(err) {
          node.error(err);
          throw err;
        }
      }
    });

  }

  RED.nodes.registerType("wazo list_nodes", list_nodes);

};