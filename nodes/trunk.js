module.exports = function (RED) {
  function Trunk(n) {
    RED.nodes.createNode(this, n);
    this.conn = RED.nodes.getNode(n.server);
    this.trunkId = n.trunk_id;
    this.tenantUuid = n.tenant_uuid;
    this.client = this.conn.apiClient;
    this.ws = this.conn;

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
      await this.conn.authenticate();
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
