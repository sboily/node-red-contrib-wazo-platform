module.exports = function (RED) {
    
  function progress(n) {
    RED.nodes.createNode(this, n);
    conn = RED.nodes.getNode(n.server);
    this.client = conn.apiClient.application;

    var node = this;

    node.on('input', async msg => {
      call_id = msg.payload.call ? msg.payload.call.id : msg.payload.call_id;
      application_uuid = msg.payload.application_uuid;

      if (call_id && application_uuid) {
        const result = await node.client.startProgressCall(application_uuid, call_id);
        node.log('Start call progress');
        msg.payload.call_id = call_id;
        msg.payload.application_uuid = application_uuid;
        msg.payload.data = result;
        node.send(msg);
      }
    });
  }

  RED.nodes.registerType("wazo progress", progress);
};
