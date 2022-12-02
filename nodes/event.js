module.exports = function (RED) {
  function event(n) {
    RED.nodes.createNode(this, n);
    this.ws = RED.nodes.getNode(n.server);
    this.eventName = n.event_name;
    this.no_filter = n.no_filter;
    this.application_uuid = n.app_uuid;
    this.tenant_uuid = n.tenant_uuid;

    var node = this;

    node.ws.on(node.eventName, msg => {
      if (!node.application_uuid) {
        node.send(msg);
        return;
      }

      if (msg.payload && (msg.payload.application_uuid == node.application_uuid)) {
        node.send(msg);
        return;
      } else if (node.no_filter && (msg.payload && msg.payload.application_uuid)) {
        node.send(msg);
        return;
      }
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

    node.ws.on('onerror', (err) => {
      node.status({
        fill:"red",
        shape:"ring",
        text: "disconnected"
      });
    });

  }

  RED.nodes.registerType("wazo event", event);
};
