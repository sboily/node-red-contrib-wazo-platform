module.exports = function (RED) {
  const { WazoApiClient } = require('@wazo/sdk');

  function update_snoop(n) {
    RED.nodes.createNode(this, n);
    conn = RED.nodes.getNode(n.server);
    this.client = conn.client.application;

    var node = this;

    node.on('input', async msg => {
      snoop_uuid = msg.payload.uuid || msg.payload.snoop_uuid;
      application_uuid = msg.payload.application_uuid;
      whisper_mode = msg.payload.whisper_mode ? msg.payload.whisper_mode : "none";

      if (snoop_uuid && application_uuid && whisper_mode) {
        try {
          const snoop = await node.client.updateSnoop(application_uuid, snoop_uuid, whisper_mode);
          node.log(`Update snoop ${snoop_uuid}`);
          msg.payload.application_uuid = application_uuid;
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
