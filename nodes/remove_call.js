module.exports = function (RED) {
  function RemoveCall(n) {
    RED.nodes.createNode(this, n);
    const conn = RED.nodes.getNode(n.server);
    this.client = conn.apiClient.application;

    this.on('input', async (msg) => {
      const callId = msg.payload.call ? msg.payload.call.id : msg.payload.call_id;
      const applicationUuid = msg.payload.application_uuid;
      const nodeUuid = msg.payload.node_uuid;

      if (callId && applicationUuid && nodeUuid) {
        try {
          const result = await this.client.removeCallNodes(applicationUuid, nodeUuid, callId);
          this.log('Remove call from node');
          msg.payload = { call_id: callId, application_uuid: applicationUuid, node_uuid: nodeUuid, data: result };
          this.send(msg);
        } catch (err) {
          this.error(`Remove call error: ${err.message}`, msg);
        }
      } else {
        this.warn('Missing call_id, application_uuid, or node_uuid in payload');
      }
    });
  }

  RED.nodes.registerType("wazo remove_call", RemoveCall);
};
