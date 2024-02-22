module.exports = function (RED) {
    
  function stop_moh(n) {
    RED.nodes.createNode(this, n);
    conn = RED.nodes.getNode(n.server);
    this.client = conn.apiClient.application;

    var node = this;

    node.on('input', async msg => {
      call_id = msg.payload.call.id;
      application_uuid = msg.payload.application_uuid;
      moh_uuid = msg.payload.moh_uuid;

      if (call_id && application_uuid && moh_uuid) {
        node.log('Stop MOH');
        try {
          const result = await node.client.stopMohCall(application_uuid, call_id, moh_uuid);
          msg.payload.call_id = call_id;
          msg.payload.application_uuid = application_uuid;
          msg.payload.moh_uuid = moh_uuid;
          msg.payload.data = result;
          node.send(msg);
        }
        catch(err) {
          node.error(`Stop MOH error: ${err.message}`);
        }
      }
    });  
  }

  RED.nodes.registerType("wazo stop_moh", stop_moh);

};
