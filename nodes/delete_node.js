module.exports = function (RED) {
  function DeleteNode(n) {
    RED.nodes.createNode(this, n);
    const conn = RED.nodes.getNode(n.server);
    this.client = conn.apiClient.application;

    this.on('input', async (msg) => {
      const nodeUuid = msg.payload.node_uuid;
      const applicationUuid = msg.payload.application_uuid;

      if (nodeUuid && applicationUuid) {
        this.log("Delete node");
        try {
          const deleteNode = await this.client.removeNode(applicationUuid, nodeUuid);
          this.log(`Remove node ${nodeUuid}`);
          msg.payload = { application_uuid: applicationUuid, node_uuid: nodeUuid, data: deleteNode };
          this.send(msg);
        } catch (err) {
          this.error(`Delete node error: ${err.message}`, msg);
        }
      } else {
        this.warn('Missing node_uuid or application_uuid in payload');
      }
    });
  }

  RED.nodes.registerType("wazo delete_node", DeleteNode);
};
