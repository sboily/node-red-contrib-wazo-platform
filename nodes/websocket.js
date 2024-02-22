module.exports = function (RED) {
  function WazoWebSocketNode(config) {
    RED.nodes.createNode(this, config);
    this.ws = RED.nodes.getNode(config.server);
    this.noFilter = config.no_filter;
    this.applicationUuid = config.app_uuid;

    const node = this;

    const handleWebSocketMessage = (msg) => {
      if (!node.applicationUuid || (msg.payload && msg.payload.application_uuid === node.applicationUuid)) {
        node.send(msg);
      } else if (node.noFilter && msg.payload && !msg.payload.application_uuid) {
        node.send(msg);
      }
    };

    const updateStatus = (status) => {
      node.status({
        fill: status.fill,
        shape: status.shape,
        text: status.text,
      });
    };

    node.ws.on('onmessage', handleWebSocketMessage);

    node.ws.on('onopen', () => {
      node.log('Wazo Websocket connection');
      updateStatus({ fill: 'green', shape: 'ring', text: 'connecting' });
    });

    node.ws.on('initialized', () => {
      node.log('Wazo Websocket is initialized and ready to receive messages');
      updateStatus({ fill: 'green', shape: 'dot', text: 'connected' });
    });

    node.ws.on('onclose', (err) => {
      node.error({ message: 'Websocket is closed', error: err });
      updateStatus({ fill: 'red', shape: 'ring', text: 'disconnected' });
    });

    node.ws.on('onerror', (err) => {
      node.error({ message: 'Websocket has closed with error', error: err });
      updateStatus({ fill: 'red', shape: 'dot', text: 'disconnected (error)' });
    });
  }

  RED.nodes.registerType('wazo websocket', WazoWebSocketNode);
};
