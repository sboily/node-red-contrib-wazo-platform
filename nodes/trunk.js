global.window = global;

module.exports = function (RED) {
  function trunk(n) {
    RED.nodes.createNode(this, n);
    this.conn = RED.nodes.getNode(n.server);
    this.trunk_id = n.trunk_id;
    this.tenant_uuid = n.tenant_uuid;
    this.client = this.conn.apiClient.calld;
    this.ws = this.conn;

    var node = this;

    node.ws.on('trunk_status_updated', msg => {
      if (msg.payload.id == node.trunk_id) {
        setStatus(msg.payload);
        node.send(msg);
      }
    });

    const setStatus = (data) => {
      if (data.registered) {
        node.status({fill:"green", shape:"dot", text: `register - calls: ${data.current_call_count}`});
      } else {
        node.status({fill:"red", shape:"dot", text: `unregister - calls: ${data.current_call_count}`});
      }
    };

    const initListTrunks = async () => {
      const token = await node.conn.authenticate();
      node.conn.apiClient.setTenant(node.tenant_uuid);
      const trunks = await node.client.listTrunks();
      trunks.items.map(item => {
        if (item.id == node.trunk_id) {
          setStatus(item);
        }
      });
    };

    initListTrunks();
  }

  RED.nodes.registerType("wazo trunk", trunk);
};
