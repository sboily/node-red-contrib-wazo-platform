module.exports = function (RED) {
  function StopMoh(n) {
    RED.nodes.createNode(this, n);
    const conn = RED.nodes.getNode(n.server);
    this.client = conn.apiClient.application;

    this.on('input', async (msg) => {
      const callId = msg.payload.call.id;
      const applicationUuid = msg.payload.application_uuid;
      const mohUuid = msg.payload.moh_uuid;

      if (callId && applicationUuid && mohUuid) {
        this.log('Stop MOH');
        try {
          const result = await this.client.stopMohCall(applicationUuid, callId, mohUuid);
          msg.payload = { call_id: callId, application_uuid: applicationUuid, moh_uuid: mohUuid, data: result };
          this.send(msg);
        } catch (err) {
          this.error(`Stop MOH error: ${err.message}`, msg);
        }
      } else {
        this.warn('Missing call_id, application_uuid, or moh_uuid in payload');
      }
    });
  }

  RED.nodes.registerType("wazo stop_moh", StopMoh);
};
