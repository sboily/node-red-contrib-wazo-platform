module.exports = function (RED) {
  const { createNodeAddCall } = require('./lib/internal_api.js');

  function CreateNode(n) {
    RED.nodes.createNode(this, n);
    const conn = RED.nodes.getNode(n.server);
    this.refreshToken = n.refreshToken;
    this.client = conn.apiClient.application;

    this.on('input', async (msg) => {
      const callId = msg.payload.call ? msg.payload.call.id : msg.payload.call_id;
      const applicationUuid = msg.payload.application_uuid;

      if (callId && applicationUuid) {
        const token = await conn.authenticate();

        try {
          const url = `https://${conn.host}:${conn.port}/api/calld/1.0/applications/${applicationUuid}/nodes`;
          const nodeCreated = await createNodeAddCall(url, token, callId);
          this.log(`Add call to node ${nodeCreated.uuid}`);
          msg.payload = { call_id: callId, application_uuid: applicationUuid, node_uuid: nodeCreated.uuid, data: nodeCreated };
          this.send(msg);
        } catch (err) {
          this.error(`Create node error: ${err.message}`, msg);
        }
      } else {
        this.warn('Missing call_id or application_uuid in payload');
      }
    });
  }

  RED.nodes.registerType("wazo create_node", CreateNode);
};
