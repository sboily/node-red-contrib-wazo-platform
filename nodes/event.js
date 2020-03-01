module.exports = function (RED) {
  const { WazoWebSocketClient } = require('@wazo/sdk');

  function event(n) {
    RED.nodes.createNode(this, n);
    this.ws = RED.nodes.getNode(n.server);
    this.eventName = n.event_name;

    var node = this;

    node.ws.on(node.eventName, msg => {
      node.send(msg);
    });

    node.ws.on('initialized', () => {
      node.status({
        fill:"green",
        shape:"dot",
        text: "connected"
      });
    });

    node.ws.on('onclose', (err) => {
      node.status({
        fill:"red",
        shape:"ring",
        text: "disconnected"
      });
    });

  }

  RED.httpAdmin.get('/wazo-platform/events', (req, res) => {
    res.json(WazoWebSocketClient.eventLists);
  });

  RED.nodes.registerType("wazo event", event);

}
