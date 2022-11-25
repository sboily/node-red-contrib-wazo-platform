global.window = global;

module.exports = function (RED) {
  const { initiateCallUser, createNodeAddCall } = require('./lib/internal_api.js');

  function call_user(n) {
    RED.nodes.createNode(this, n);
    this.user_uuid = n.user_uuid;
    this.conn = RED.nodes.getNode(n.server);
    this.client = this.conn.apiClient.calld;

    var node = this;

    node.on('input', async msg => {
      call_id = msg.payload.call ? msg.payload.call.id : msg.payload.call_id;
      application_uuid = msg.payload.application_uuid;
      node_uuid = msg.payload.node_uuid;

      if (call_id && application_uuid) {
        const token = await node.conn.authenticate();

        if (!node_uuid) {
          const url = `https://${node.conn.host}:${node.conn.port}/api/calld/1.0/applications/${application_uuid}/nodes`;
          const nodeCreated = await createNodeAddCall(url, token, call_id);
          node_uuid = nodeCreated.uuid;
        }

        const url = `https://${node.conn.host}:${node.conn.port}/api/calld/1.0/applications/${application_uuid}/nodes/${node_uuid}/calls/user`;
        try {
          const call_user = await initiateCallUser(url, token, node.user_uuid);
          node.log(`Call user ${node.user_uuid} to node ${node_uuid}`);
          msg.payload.call_id = call_id;
          msg.payload.application_uuid = application_uuid;
          msg.payload.node_uuid = node_uuid;
          msg.payload.data = call_user;
          node.send(msg);
        }
        catch(err) {
          node.error(err);
          throw err;
        }
      }
    });

  }

  RED.nodes.registerType("wazo call user", call_user);
};
