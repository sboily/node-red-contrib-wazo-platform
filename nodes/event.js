module.exports = function (RED) {
    
  function event(n) {
    RED.nodes.createNode(this, n);
    this.eventName = n.event_name;

    var node = this;

    node.on('input', msg => {
      if (msg.name == node.eventName) {
        node.send(msg);
      }
    });  
  }

  RED.nodes.registerType("wazo event", event);

}
