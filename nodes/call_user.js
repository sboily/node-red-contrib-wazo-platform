global.window = global;

module.exports = function (RED) {
  const { initiateCallUser, createNodeAddCall } = require('./lib/internal_api.js');

  function CallUser(n) {
    RED.nodes.createNode(this, n);
    this.userUuid = n.user_uuid;
    this.tenantUuid = n.tenant_uuid;
    this.conn = RED.nodes.getNode(n.server);
    this.client = this.conn.apiClient.calld;

    this.on('input', async (msg) => {
      const callId = msg.payload.call ? msg.payload.call.id : msg.payload.call_id;
      const applicationUuid = msg.payload.application_uuid;
      let nodeUuid = msg.payload.node_uuid;
      const tenantUuid = msg.payload.tenant_uuid || this.tenantUuid;
      const userUuid = msg.payload.user_uuid || this.userUuid;

      if (callId && applicationUuid) {
        const token = await this.conn.authenticate();
        const baseUrl = `https://${this.conn.host}:${this.conn.port}/api/calld/1.0/applications/${applicationUuid}`;

        if (!nodeUuid) {
          const nodeUrl = `${baseUrl}/nodes`;
          const nodeCreated = await createNodeAddCall(nodeUrl, token, callId);
          nodeUuid = nodeCreated.uuid;
        }

        const userCallUrl = `${baseUrl}/nodes/${nodeUuid}/calls/user`;
        try {
          const callUser = await initiateCallUser(userCallUrl, token, userUuid, tenantUuid);
          this.log(`Call user ${userUuid} to node ${nodeUuid}`);
          msg.payload = { call_id: callId, application_uuid: applicationUuid, node_uuid: nodeUuid, data: callUser };
          this.send(msg);
        } catch (err) {
          this.error(`Call user error: ${err.message}`, msg);
        }
      } else {
        this.warn('Missing call_id or application_uuid in payload');
      }
    });
  }

  RED.nodes.registerType("wazo call user", CallUser);
};
