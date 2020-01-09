module.exports = function (RED) {
    
  function answer(n) {
    RED.nodes.createNode(this, n);
    wazoConn = RED.nodes.getNode(n.server);
    this.client = wazoConn.client.application;

    var node = this;

    node.on('input', msg => {
      if (msg.data.call.id) {
        call_id = msg.data.call.id;
        application_uuid = msg.data.application_uuid;
        node.log('Call answer');
        try {
          node.client.answerCall(application_uuid, call_id);
          node.send(msg);
        }
        catch(err) {
          node.error(err);
        }
      }
    });  
  }

  RED.nodes.registerType("wazo answer", answer);

}
