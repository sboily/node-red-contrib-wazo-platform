module.exports = function (RED) {
  const { WazoWebSocketClient } = require('@wazo/sdk');
    
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

  RED.httpAdmin.get('/wazo-platform/events', RED.auth.needsPermission('wazo.read'), async function(req, res) {
    res.json(WazoWebSocketClient.eventLists);
  });

  RED.nodes.registerType("wazo event", event);

}
