module.exports = function (RED) {
  function ListCallsNode(n) {
    RED.nodes.createNode(this, n);
    const conn = RED.nodes.getNode(n.server);
    this.client = conn.apiClient.application;

    this.on('input', async (msg) => {
      const nodeUuid = msg.payload.node ? msg.payload.node.uuid : msg.payload.node_uuid;
      const applicationUuid = msg.payload.application_uuid;

      if (nodeUuid && applicationUuid) {
        try {
          const callsNode = await this.client.listCallsNodes(applicationUuid, nodeUuid);
          this.log(`List calls node ${nodeUuid}`);
          msg.payload = { application_uuid: applicationUuid, node_uuid: nodeUuid, data: callsNode };
          this.send(msg);
        } catch (err) {
          this.error(`List calls node error: ${err.message}`, msg);
        }
      } else {
        this.warn('Missing node_uuid or application_uuid in payload');
      }
    });
  }

  RED.nodes.registerType("wazo list_calls_node", ListCallsNode);
};
