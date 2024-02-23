module.exports = function (RED) {
  function DeleteSnoop(n) {
    RED.nodes.createNode(this, n);
    const conn = RED.nodes.getNode(n.server);
    this.client = conn.apiClient.application;

    this.on('input', async (msg) => {
      const snoopUuid = msg.payload.uuid || msg.payload.snoop_uuid;
      const applicationUuid = msg.payload.application_uuid;

      if (snoopUuid && applicationUuid) {
        try {
          const snoop = await this.client.removeSnoop(applicationUuid, snoopUuid);
          this.log(`Delete snoop ${snoopUuid}`);
          msg.payload = { application_uuid: applicationUuid, snoop_uuid: snoopUuid, data: snoop };
          this.send(msg);
        } catch (err) {
          this.error(`Delete snoop error: ${err.message}`, msg);
        }
      } else {
        this.warn('Missing snoop_uuid or application_uuid in payload');
      }
    });
  }

  RED.nodes.registerType("wazo delete_snoop", DeleteSnoop);
};
