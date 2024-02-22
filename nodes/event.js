module.exports = function (RED) {
  function WazoEventNode(config) {
    RED.nodes.createNode(this, config);
    this.ws = RED.nodes.getNode(config.server);
    this.eventName = config.event_name;
    this.noFilter = config.no_filter;
    this.applicationUuid = config.app_uuid;
    this.tenantUuid = config.tenant_uuid;

    const node = this;

    const handleEvent = (msg) => {
      if (!node.applicationUuid || (msg.payload && msg.payload.application_uuid === node.applicationUuid)) {
        node.send(msg);
      } else if (node.noFilter && msg.payload && msg.payload.application_uuid) {
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

    node.ws.on(node.eventName, handleEvent);

    node.ws.on('initialized', () => {
      updateStatus({ fill: 'green', shape: 'dot', text: 'connected' });
    });

    node.ws.on('onclose', () => {
      updateStatus({ fill: 'red', shape: 'ring', text: 'disconnected' });
    });

    node.ws.on('onerror', () => {
      updateStatus({ fill: 'red', shape: 'ring', text: 'disconnected' });
    });
  }

  RED.nodes.registerType('wazo event', WazoEventNode);
};
