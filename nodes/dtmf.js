module.exports = function (RED) {

  function send_dtmf(n) {
    RED.nodes.createNode(this, n);
    conn = RED.nodes.getNode(n.server);
    this.client = conn.client.application;

    var node = this;

    node.on('input', async msg => {
      call_id = msg.payload.call ? msg.payload.call.id : msg.payload.call_id;
      application_uuid = msg.payload.application_uuid;
      digits = msg.payload.digits;

      if (call_id && application_uuid) {
        node.log('Send DTMF');
        try {
          const result = await node.client.sendDTMFCall(application_uuid, call_id, digits);
          msg.payload.call_id = call_id;
          msg.payload.application_uuid = application_uuid;
          msg.payload.data = result;
          node.send(msg);
        }
        catch(err) {
          node.error(err);
          throw err;
        }
      }
    });
  }

  RED.nodes.registerType("wazo dtmf", send_dtmf);

};
