module.exports = function (RED) {
  const { WazoApiClient } = require('@wazo/sdk');
    
  function new_call_node(n) {
    RED.nodes.createNode(this, n);
    conn = RED.nodes.getNode(n.server);
    this.client = conn.apiClient.application;

    var node = this;

    node.on('input', async msg => {
      application_uuid = msg.payload.application_uuid;
      node_uuid = msg.payload.node_uuid;
      exten = msg.payload.exten;
      context = msg.payload.context;
      autoAnswer = msg.payload.autoanswer || false;

      if (application_uuid && node_uuid && exten && context) {
        try {
          const new_call_node = await node.client.addNewCallNodes(application_uuid, node_uuid, context, exten, autoAnswer);
          msg.payload.application_uuid = application_uuid;
          msg.payload.node_uuid = node_uuid;
          msg.payload.call_id = new_call_node.uuid;
          msg.payload.data = new_call_node;
          node.send(msg);
        }
        catch(err) {
          node.error(`New call node error: ${err.message}`);
        }
      }
    });

  }

  RED.nodes.registerType("wazo new_call_node", new_call_node);

};
