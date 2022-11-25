global.window = global;

module.exports = function (RED) {
  function bridge_call(n) {
    RED.nodes.createNode(this, n);
    conn = RED.nodes.getNode(n.server);
    this.context = n.context;
    this.exten = n.exten;
    this.auto_answer = n.auto_answer;
    this.client = conn.apiClient.application;

    var node = this;

    node.on('input', async msg => {
      call_id = msg.payload.call ? msg.payload.call.id : msg.payload.call_id;
      application_uuid = msg.payload.application_uuid;
      exten = node.exten || msg.payload.exten;
      context = node.context || msg.payload.context;
      callerId = msg.payload.call ? msg.payload.call.displayed_caller_id_number : msg.payload.displayed_caller_id_number;
      autoAnswer = node.auto_answer || msg.payload.auto_answer;

      if (call_id && application_uuid) {
        node.log('Bridge Call');
        try {
          const bridgeCall = await node.client.bridgeCall(application_uuid, call_id, context, exten, autoAnswer, callerId);
          msg.payload.call_id = call_id;
          msg.payload.application_uuid = application_uuid;
          msg.payload.data = bridgeCall;
          node.send(msg);
        }
        catch(err) {
          node.error(err);
          throw err;
        }
      }
    });
  }

  RED.nodes.registerType("wazo bridge_call", bridge_call);
};
