module.exports = function (RED) {
  function UpdateSnoop(n) {
    RED.nodes.createNode(this, n);
    const conn = RED.nodes.getNode(n.server);
    this.client = conn.apiClient.application;

    this.on('input', async (msg) => {
      const snoopUuid = msg.payload.uuid || msg.payload.snoop_uuid;
      const applicationUuid = msg.payload.application_uuid;
      const whisperMode = msg.payload.whisper_mode;

      if (snoopUuid && applicationUuid && whisperMode) {
        try {
          const snoop = await this.client.updateSnoop(applicationUuid, snoopUuid, whisperMode);
          this.log(`Update snoop ${snoopUuid}`);
          msg.payload = { application_uuid: applicationUuid, snoop_uuid: snoopUuid, data: snoop };
          this.send(msg);
        } catch (err) {
          this.error(`Update snoop error: ${err.message}`, msg);
        }
      } else {
        this.warn('Missing snoop_uuid, application_uuid, or whisper_mode in payload');
      }
    });
  }

  RED.nodes.registerType("wazo update_snoop", UpdateSnoop);
};
