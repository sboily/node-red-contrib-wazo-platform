module.exports = function (RED) {
    
  function moh(n) {
    RED.nodes.createNode(this, n);
    wazoConn = RED.nodes.getNode(n.server);
    this.client = wazoConn.client.application;

    var node = this;

    node.on('input', async msg => {
      if (msg.payload.call.id) {
        call_id = msg.payload.call.id;
        application_uuid = msg.payload.application_uuid;
        moh_uuid = msg.payload.moh_uuid;
        node.log('Call moh');
        try {
          const result = await node.client.startMohCall(application_uuid, call_id, moh_uuid);
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

  RED.nodes.registerType("wazo moh", moh);

}
