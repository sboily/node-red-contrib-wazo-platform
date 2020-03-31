module.exports = function (RED) {
  const { WazoApiClient } = require('@wazo/sdk');

  function update_snoop_node(n) {
    RED.nodes.createNode(this, n);
    conn = RED.nodes.getNode(n.server);
    this.client = conn.client.application;

    var node = this;

    node.on('input', async msg => {
      snoop_uuid = msg.payload.uuid || msg.payload.snoop_uuid;
      application_uuid = msg.payload.application_uuid;

      if (snoop_uuid && application_uuid) {
        try {
          const data = {};
          const snoop = await node.client.updateSnoop(application_uuid, snoop_uuid, data);
          node.log(`Update snoop ${snoop_uuid}`);
          msg.payload.application_uuid = application_uuid;
          msg.payload.snoop_uuid = node_uuid;
          msg.payload.data = snoop;
          node.send(msg);
        }
        catch(err) {
          node.error(err);
          throw err;
        }
      }
    });

  }

  RED.nodes.registerType("wazo update_snoop", update_snoop);

};