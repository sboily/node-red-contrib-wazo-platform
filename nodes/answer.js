module.exports = function (RED) {
    
  function answer(n) {
    RED.nodes.createNode(this, n);
    wazoConn = RED.nodes.getNode(n.server);
    this.client = wazoConn.client.calld;

    var node = this;

    node.on('input', function(msg) {
      console.log(msg);
      node.send(msg);
    });  
  }

  RED.nodes.registerType("wazo answer", answer);

}
