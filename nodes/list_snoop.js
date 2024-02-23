module.exports = function (RED) {
  function ListSnoop(n) {
    RED.nodes.createNode(this, n);
    const conn = RED.nodes.getNode(n.server);
    this.client = conn.apiClient.application;

    this.on('input', async (msg) => {
      const applicationUuid = msg.payload.application_uuid;

      if (applicationUuid) {
        try {
          const snoopNode = await this.client.listSnoop(applicationUuid);
          this.log('List snoop');
          msg.payload = { application_uuid: applicationUuid, data: snoopNode };
          this.send(msg);
        } catch (err) {
          this.error(`List snoop error: ${err.message}`, msg);
        }
      } else {
        this.warn('Missing application_uuid in payload');
      }
    });
  }

  RED.nodes.registerType("wazo list_snoop", ListSnoop);
};
