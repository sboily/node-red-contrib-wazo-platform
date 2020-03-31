module.exports = function (RED) {
  const { WazoApiClient } = require('@wazo/sdk');

  function delete_snoop(n) {
    RED.nodes.createNode(this, n);
    conn = RED.nodes.getNode(n.server);
    this.client = conn.client.application;

    var node = this;

    node.on('input', async msg => {
      snoop_uuid = msg.payload.uuid || msg.payload.snoop_uuid;
      application_uuid = msg.payload.application_uuid;

      if (snoop_uuid && application_uuid) {
        try {
          const snoop = await node.client.removeSnoop(application_uuid, node_uuid);
          node.log(`Delete snoop ${snoop_uuid}`);
          msg.payload.application_uuid = application_uuid;
          msg.payload.snoop_uuid = snoop_uuid;
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

  RED.nodes.registerType("wazo delete_snoop", delete_snoop);

};