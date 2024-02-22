module.exports = function (RED) {
  const { WazoApiClient } = require('@wazo/sdk');

  function view_snoop(n) {
    RED.nodes.createNode(this, n);
    conn = RED.nodes.getNode(n.server);
    this.client = conn.apiClient.application;

    var node = this;

    node.on('input', async msg => {
      snoop_uuid = msg.payload.uuid || msg.payload.snoop_uuid;
      application_uuid = msg.payload.application_uuid;

      if (snoop_uuid && application_uuid) {
        try {
          const snoop = await node.client.viewSnoop(application_uuid, snoop_uuid);
          node.log(`View snoop ${snoop_uuid}`);
          msg.payload.application_uuid = application_uuid;
          msg.payload.snoop_uuid = snoop_uuid;
          msg.payload.data = snoop;
          node.send(msg);
        }
        catch(err) {
          node.error(`View snoop error: ${err.message}`);
        }
      }
    });

  }

  RED.nodes.registerType("wazo view_snoop", view_snoop);

};
