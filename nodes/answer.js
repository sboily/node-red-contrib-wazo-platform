module.exports = function (RED) {
    
  function answer(n) {
    RED.nodes.createNode(this, n);

    if (this.credentials) {
      // Do something with:
      //  this.server.host
      //  this.server.port
    } else {
      // No config node configured
    }

    var node = this;

    node.on('input', function(msg) {
      console.log(msg);
      msg.wazo = "Answer";
      node.send(msg);
    });  
  }

  RED.nodes.registerType("wazo answer", answer);
}
