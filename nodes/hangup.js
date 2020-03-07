module.exports = function (RED) {
    
  function hangup(n) {
    RED.nodes.createNode(this, n);
    wazoConn = RED.nodes.getNode(n.server);
    this.client = wazoConn.client.application;

    var node = this;

    node.on('input', async msg => {
      call_id = msg.payload.call ? msg.payload.call.id : msg.payload.call_id;
      application_uuid = msg.payload.application_uuid;
      if (call_id && application_uuid) {
        const result = await node.client.hangupCall(application_uuid, call_id);
        node.log('Call hangup');
        msg.payload = result;
        node.send(msg);
      }
    });  
  }

  RED.nodes.registerType("wazo hangup", hangup);
}
