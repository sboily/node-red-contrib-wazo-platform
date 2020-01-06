module.exports = function (RED) {
    
  function hangup(n) {
    RED.nodes.createNode(this, n);

    node.on('input', function(msg) {
    });  
  }

  RED.nodes.registerType("wazo hangup", hangup);
}
