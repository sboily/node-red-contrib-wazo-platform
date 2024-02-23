module.exports = function (RED) {
  function ViewSnoop(n) {
    RED.nodes.createNode(this, n);
    const conn = RED.nodes.getNode(n.server);
    this.client = conn.apiClient.application;

    this.on('input', async (msg) => {
      const snoopUuid = msg.payload.uuid || msg.payload.snoop_uuid;
      const applicationUuid = msg.payload.application_uuid;

      if (snoopUuid && applicationUuid) {
        try {
          const snoop = await this.client.viewSnoop(applicationUuid, snoopUuid);
          this.log(`View snoop ${snoopUuid}`);
          msg.payload = { application_uuid: applicationUuid, snoop_uuid: snoopUuid, data: snoop };
          this.send(msg);
        } catch (err) {
          this.error(`View snoop error: ${err.message}`, msg);
        }
      } else {
        this.warn('Missing snoop_uuid or application_uuid in payload');
      }
    });
  }

  RED.nodes.registerType("wazo view_snoop", ViewSnoop);
};
