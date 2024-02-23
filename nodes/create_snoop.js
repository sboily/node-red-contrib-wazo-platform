module.exports = function (RED) {
  function CreateSnoop(n) {
    RED.nodes.createNode(this, n);
    const conn = RED.nodes.getNode(n.server);
    this.client = conn.apiClient.application;

    this.on('input', async (msg) => {
      const callId = msg.payload.call ? msg.payload.call.id : msg.payload.call_id;
      const applicationUuid = msg.payload.application_uuid;
      const snoopingCallId = msg.payload.snooping_call_id;
      const whisperMode = msg.payload.whisper_mode;

      if (callId && applicationUuid && snoopingCallId && whisperMode) {
        try {
          const snoop = await this.client.createSnoop(applicationUuid, callId, snoopingCallId, whisperMode);
          this.log('Create snoop');
          msg.payload = { call_id: callId, data: snoop };
          this.send(msg);
        } catch (err) {
          this.error(`Snoop error: ${err.message}`, msg);
        }
      } else {
        this.warn('Missing required fields in payload');
      }
    });
  }

  RED.nodes.registerType("wazo create_snoop", CreateSnoop);
};
