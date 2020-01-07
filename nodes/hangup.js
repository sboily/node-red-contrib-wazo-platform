module.exports = function (RED) {
    
  function hangup(n) {
    RED.nodes.createNode(this, n);
    wazoConn = RED.nodes.getNode(n.server);
    this.client = wazoConn.client.application;

    var node = this;

    node.on('input', msg => {
      if (msg.data.call.id) {
        call_id = msg.data.call.id;
        application_uuid = msg.data.application_uuid;
        node.client.hangupCall(application_uuid, call_id);
        console.log('Call hangup');
      }
    });  
  }

  RED.nodes.registerType("wazo hangup", hangup);
}
