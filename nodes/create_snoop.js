module.exports = function (RED) {
  const { WazoApiClient } = require('@wazo/sdk');

  function create_snoop(n) {
    RED.nodes.createNode(this, n);
    conn = RED.nodes.getNode(n.server);
    this.client = conn.apiClient.application;

    var node = this;

    node.on('input', async msg => {
      call_id = msg.payload.call ? msg.payload.call.id : msg.payload.call_id;
      application_uuid = msg.payload.application_uuid;
      snooping_call_id = msg.payload.snooping_call_id;
      whisper_mode = msg.payload.whisper_mode;

      if (call_id && application_uuid && snooping_call_id && whisper_mode) {
        try {
          const snoop = await node.client.createSnoop(application_uuid, call_id, snooping_call_id, whisper_mode);
          node.log('Create snoop');
          msg.payload.call_id = call_id;
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

  RED.nodes.registerType("wazo create_snoop", create_snoop);

};
