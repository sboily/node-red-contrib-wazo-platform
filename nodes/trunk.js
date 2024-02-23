module.exports = function (RED) {
  function Trunk(n) {
    RED.nodes.createNode(this, n);
    const conn = RED.nodes.getNode(n.server);
    this.trunkId = n.trunk_id;
    this.tenantUuid = n.tenant_uuid;
    this.client = conn.apiClient;
    this.ws = conn;

    this.ws.on('trunk_status_updated', msg => {
      if (msg.payload.id === this.trunkId) {
        setStatus(msg.payload);
        this.send(msg);
      }
    });

    const setStatus = (data) => {
      if (data.registered) {
        this.status({fill: "green", shape: "dot", text: `register - calls: ${data.current_call_count}`});
      } else {
        this.status({fill: "red", shape: "dot", text: `unregister - calls: ${data.current_call_count}`});
      }
    };

    const initListTrunks = async () => {
      this.client.setTenant(this.tenantUuid);
      const trunks = await this.client.calld.listTrunks();
      trunks.items.forEach(item => {
        if (item.id === this.trunkId) {
          setStatus(item);
        }
      });
    };

    initListTrunks();
  }

  RED.nodes.registerType("wazo trunk", Trunk);
};
