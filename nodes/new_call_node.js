module.exports = function (RED) {
  function NewCallNode(n) {
    RED.nodes.createNode(this, n);
    const conn = RED.nodes.getNode(n.server);
    this.client = conn.apiClient.application;

    this.on('input', async (msg) => {
      const applicationUuid = msg.payload.application_uuid;
      const nodeUuid = msg.payload.node_uuid;
      const exten = msg.payload.exten;
      const context = msg.payload.context;
      const autoAnswer = msg.payload.autoanswer || false;

      if (applicationUuid && nodeUuid && exten && context) {
        try {
          const newCallNode = await this.client.addNewCallNodes(applicationUuid, nodeUuid, context, exten, autoAnswer);
          msg.payload = { application_uuid: applicationUuid, node_uuid: nodeUuid, call_id: newCallNode.uuid, data: newCallNode };
          this.send(msg);
        } catch (err) {
          this.error(`New call node error: ${err.message}`, msg);
        }
      } else {
        this.warn('Missing required fields in payload');
      }
    });
  }

  RED.nodes.registerType("wazo new_call_node", NewCallNode);
};
