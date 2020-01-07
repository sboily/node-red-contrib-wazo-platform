module.exports = function (RED) {
    
  function call(n) {
    RED.nodes.createNode(this, n);
    wazoConn = RED.nodes.getNode(n.server);
    this.context = n.context;
    this.exten = n.exten;
    this.autoAnswer = n.autoAnswer;
    this.client = wazoConn.client.application;

    var node = this;

    node.on('input', msg => {
      if (msg.data.call.id) {
        call_id = msg.data.call.id;
        application_uuid = msg.data.application_uuid;
        exten = node.exten;
        context = node.context;
        callerId = msg.data.call.displayed_caller_id_number;

        console.log('Bridge Call');
        try {
          node.client.bridgeCall(application_uuid, call_id, context, exten, node.autoAnswer, callerId);
          node.send(msg);
        }
        catch(err) {
          console.log(err);
        }
      }
    });  
  }

  RED.nodes.registerType("wazo call", call);

}
