module.exports = function (RED) {
    
  function stop_moh(n) {
    RED.nodes.createNode(this, n);
    wazoConn = RED.nodes.getNode(n.server);
    this.client = wazoConn.client.application;

    var node = this;

    node.on('input', async msg => {
      if (msg.payload.call.id) {
        call_id = msg.payload.call.id;
        application_uuid = msg.payload.application_uuid;
        stop_moh_uuid = msg.payload.stop_moh_uuid;
        node.log('Call stop_moh');
        try {
          const result = await node.client.stopMohCall(application_uuid, call_id, stop_moh_uuid);
          msg.payload = result;
          node.send(msg);
        }
        catch(err) {
          node.error(err);
          throw err;
        }
      }
    });  
  }

  RED.nodes.registerType("wazo stop_moh", stop_moh);

}
