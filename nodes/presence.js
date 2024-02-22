module.exports = function (RED) {
  function WazoPresenceNode(config) {
    RED.nodes.createNode(this, config);
    this.userUuid = config.user_uuid;
    this.tenantUuid = config.tenant_uuid;
    this.connection = RED.nodes.getNode(config.server);
    this.client = this.connection.apiClient.chatd;

    const node = this;

    this.connection.on('chatd_presence_updated', msg => {
      if (msg.payload.uuid === node.userUuid) {
        setNodeStatus(msg.payload.state, msg.payload.status);
        node.send(msg);
      }
    });

    node.on('input', async msg => {
      const state = msg.payload.state;
      const status = msg.payload.status;
      const userUuid = msg.payload.user_uuid || node.userUuid;
      const tenantUuid = msg.payload.tenant_uuid || node.tenantUuid;

      if (msg.topic !== 'chatd_presence_updated' && state) {
        try {
          if (status) {
            await changeStatus(userUuid, tenantUuid, state, status);
          } else {
            await changeState(userUuid, tenantUuid, state);
          }
          msg.payload.user_uuid = userUuid;
          msg.payload.tenant_uuid = tenantUuid;
          node.send(msg);
        } catch (err) {
          node.error(`Error updating presence: ${err.message}`);
        }
      }
    });

    const setNodeStatus = (state, status) => {
      node.status({ fill: "blue", shape: "dot", text: `state: ${state} - status: ${status}` });
    };

    const initState = async () => {
      try {
        await node.connection.authenticate();
        node.connection.apiClient.setTenant(node.tenantUuid);
        const presence = await node.client.getContactStatusInfo(node.userUuid);
        setNodeStatus(presence.state, presence.status);
      } catch (err) {
        node.error(`Error initializing state: ${err.message}`);
      }
    };

    const changeState = async (userUuid, tenantUuid, state) => {
      await node.connection.authenticate();
      node.connection.apiClient.setTenant(tenantUuid);
      await node.client.updateState(userUuid, state);
      node.log(`Update state presence for ${userUuid} to ${state}`);
      setNodeStatus(state, undefined);
    };

    const changeStatus = async (userUuid, tenantUuid, state, status) => {
      await node.connection.authenticate();
      node.connection.apiClient.setTenant(tenantUuid);
      await node.client.updateStatus(userUuid, state, status);
      node.log(`Update state/status presence for ${userUuid} to ${state}/${status}`);
      setNodeStatus(state, status);
    };

    initState();
  }

  RED.nodes.registerType("wazo presence", WazoPresenceNode);
};
