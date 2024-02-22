global.window = global;

module.exports = function (RED) {
  function moh(n) {
    RED.nodes.createNode(this, n);
    conn = RED.nodes.getNode(n.server);
    this.moh_uuid = n.moh_uuid;
    this.client = conn.apiClient.application;

    var node = this;

    node.on('input', async msg => {
      call_id = msg.payload.call ? msg.payload.call.id : msg.payload.call_id;
      application_uuid = msg.payload.application_uuid; 
      if (call_id && application_uuid) {
        moh_uuid = node.moh_uuid || msg.payload.moh_uuid;
        node.log('Start moh');
        try {
          const result = await node.client.startMohCall(application_uuid, call_id, moh_uuid);
          msg.payload.call_id = call_id;
          msg.payload.application_uuid = application_uuid;
          msg.payload.moh_uuid = moh_uuid;
          msg.payload.data = result;
          node.send(msg);
        }
        catch(err) {
          node.error(`MOH error: ${err.message}`);
        }
      }
    });  
  }

  RED.nodes.registerType("wazo moh", moh);
};
