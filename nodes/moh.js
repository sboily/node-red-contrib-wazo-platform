global.window = global;

module.exports = function (RED) {
  function Moh(n) {
    RED.nodes.createNode(this, n);
    const conn = RED.nodes.getNode(n.server);
    this.mohUuid = n.moh_uuid;
    this.client = conn.apiClient.application;

    this.on('input', async (msg) => {
      const callId = msg.payload.call ? msg.payload.call.id : msg.payload.call_id;
      const applicationUuid = msg.payload.application_uuid;

      if (callId && applicationUuid) {
        const mohUuid = this.mohUuid || msg.payload.moh_uuid;
        this.log('Start moh');
        try {
          const result = await this.client.startMohCall(applicationUuid, callId, mohUuid);
          msg.payload = { call_id: callId, application_uuid: applicationUuid, moh_uuid: mohUuid, data: result };
          this.send(msg);
        } catch (err) {
          this.error(`MOH error: ${err.message}`, msg);
        }
      } else {
        this.warn('Missing call_id or application_uuid in payload');
      }
    });
  }

  RED.nodes.registerType("wazo moh", Moh);
};
