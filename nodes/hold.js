module.exports = function (RED) {
  function Hold(n) {
    RED.nodes.createNode(this, n);
    const conn = RED.nodes.getNode(n.server);
    this.client = conn.apiClient.application;

    this.on('input', async (msg) => {
      const callId = msg.payload.call ? msg.payload.call.id : msg.payload.call_id;
      const applicationUuid = msg.payload.application_uuid;

      if (callId && applicationUuid) {
        this.log('Hold call');
        try {
          const result = await this.client.startHoldCall(applicationUuid, callId);
          msg.payload = { call_id: callId, application_uuid: applicationUuid, data: result };
          this.send(msg);
        } catch (err) {
          this.error(`Hold error: ${err.message}`, msg);
        }
      } else {
        this.warn('Missing call_id or application_uuid in payload');
      }
    });
  }

  RED.nodes.registerType("wazo hold", Hold);
};
