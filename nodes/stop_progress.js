module.exports = function (RED) {
    
  function stop_progress(n) {
    RED.nodes.createNode(this, n);
    conn = RED.nodes.getNode(n.server);
    this.client = conn.client.application;

    var node = this;

    node.on('input', async msg => {
      call_id = msg.payload.call.id;
      application_uuid = msg.payload.application_uuid;
      if (call_id && application_uuid) {
        const result = await node.client.stopProgressCall(application_uuid, call_id);
        node.log('Stop call progress');
        msg.payload = result;
        node.send(msg);
      }
    });
  }

  RED.nodes.registerType("wazo stop_progress", stop_progress);
}
