module.exports = function (RED) {
  function Hangup(n) {
    RED.nodes.createNode(this, n);
    const conn = RED.nodes.getNode(n.server);
    this.client = conn.apiClient.application;

    this.on('input', async (msg) => {
      const callId = msg.payload.call ? msg.payload.call.id : msg.payload.call_id;
      const applicationUuid = msg.payload.application_uuid;

      if (callId && applicationUuid) {
        try {
          const result = await this.client.hangupCall(applicationUuid, callId);
          this.log('Call hangup');
          msg.payload = { call_id: callId, application_uuid: applicationUuid, data: result };
          this.send(msg);
        } catch (err) {
          this.error(`Hangup error: ${err.message}`, msg);
        }
      } else {
        this.warn('Missing call_id or application_uuid in payload');
      }
    });
  }

  RED.nodes.registerType("wazo hangup", Hangup);
};
