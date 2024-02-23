module.exports = function (RED) {
  function SendDtmf(n) {
    RED.nodes.createNode(this, n);
    const conn = RED.nodes.getNode(n.server);
    this.client = conn.apiClient.application;

    this.on('input', async (msg) => {
      const callId = msg.payload.call ? msg.payload.call.id : msg.payload.call_id;
      const applicationUuid = msg.payload.application_uuid;
      const digits = msg.payload.digits;

      if (callId && applicationUuid && digits) {
        this.log('Send DTMF');
        try {
          const result = await this.client.sendDTMFCall(applicationUuid, callId, digits);
          msg.payload = { call_id: callId, application_uuid: applicationUuid, data: result };
          this.send(msg);
        } catch (err) {
          this.error(`DTMF error: ${err.message}`, msg);
        }
      } else {
        this.warn('Missing call_id, application_uuid, or digits in payload');
      }
    });
  }

  RED.nodes.registerType("wazo dtmf", SendDtmf);
};
