module.exports = function (RED) {
    
  function hold(n) {
    RED.nodes.createNode(this, n);
    wazoConn = RED.nodes.getNode(n.server);
    this.client = wazoConn.client.application;

    var node = this;

    node.on('input', async msg => {
      if (msg.payload.call.id) {
        call_id = msg.payload.call.id;
        application_uuid = msg.payload.application_uuid;
        node.log('Call hold');
        try {
          const result = await node.client.startHoldCall(application_uuid, call_id);
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

  RED.nodes.registerType("wazo hold", hold);

}
