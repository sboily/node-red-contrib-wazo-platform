module.exports = function (RED) {
  function websocket(n) {
    RED.nodes.createNode(this, n);
    this.ws = RED.nodes.getNode(n.server);
    this.no_filter = n.no_filter;
    this.application_uuid = n.app_uuid;

    var node = this;

    node.ws.on('onmessage', (msg) => {
      if (!node.application_uuid) {
        node.send(msg);
        return;
      }

      if (msg.data && (msg.payload.application_uuid == node.application_uuid)) {
        node.send(msg);
        return;
      } else if (node.no_filter && (msg.payload && !msg.payload.application_uuid)) {
        node.send(msg);
        return;
      }
    });

    node.ws.on('onopen', () => {
      node.log('Wazo Websocket connection');
      node.status({
        fill:"green",
        shape:"ring",
        text: "connecting"
      });
    });

    node.ws.on('initialized', () => {
      node.log('Wazo Websocket is initialized and ready to received messages');
      node.status({
        fill:"green",
        shape:"dot",
        text: "connected"
      });
    });

    node.ws.on('onclose', (err) => {
      node.error({message: "Websocket is closed", error: err});
      node.status({
        fill:"red",
        shape:"ring",
        text: "disconnected"
      });
    });

    node.ws.on('onerror', (err) => {
      node.error({message: "Websocket has closed with error", error: err});
      node.status({
        fill:"red",
        shape:"dot",
        text: "disconnected (error)"
      });
    });

  }

  RED.nodes.registerType("wazo websocket", websocket);
}
