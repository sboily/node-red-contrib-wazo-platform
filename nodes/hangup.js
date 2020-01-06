module.exports = function (RED) {
    
  function hangup(n) {
    RED.nodes.createNode(this, n);
    wazoConn = RED.nodes.getNode(n.server);
    this.client = wazoConn.client.calld;

    var node = this;

    node.on('input', function(msg) {
      if (msg.data.call_id) {
        node.client.cancelCall(msg.data.call_id);
      }
    });  
  }

  RED.nodes.registerType("wazo hangup", hangup);
}
