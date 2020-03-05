module.exports = function (RED) {
    
  function progress(n) {
    RED.nodes.createNode(this, n);
    wazoConn = RED.nodes.getNode(n.server);
    this.client = wazoConn.client.application;

    var node = this;

    node.on('input', async msg => {
      if (msg.payload.call.id) {
        call_id = msg.payload.call.id;
        application_uuid = msg.payload.application_uuid;
        const result = await node.client.startProgressCall(application_uuid, call_id);
        node.log('Call progress');
        msg.payload = result;
        node.send(msg);
      }
    });
  }

  RED.nodes.registerType("wazo progress", progress);
}
