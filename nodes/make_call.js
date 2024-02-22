global.window = global;

module.exports = function (RED) {
  const { makeCall } = require('./lib/internal_api.js');

  function make_call(n) {
    RED.nodes.createNode(this, n);
    this.user_uuid = n.user_uuid;
    this.context = n.context;
    this.extension = n.extension;
    this.tenant_uuid = n.tenant_uuid;
    this.conn = RED.nodes.getNode(n.server);
    this.client = this.conn.apiClient.calld;

    var node = this;

    node.on('input', async msg => {
      const user_uuid = msg.payload.user_uuid ? msg.payload.user_uuid : node.user_uuid;
      const context = msg.payload.context ? msg.payload.context : node.context;
      const extension = msg.payload.extension ? msg.payload.extension : node.extension;
      const all_lines = msg.payload.all_lines ?  msg.payload.all_lines: true;
      const tenant_uuid = msg.payload.tenant_uuid || node.tenant_uuid;
      const token = await node.conn.authenticate();

      try {
        const url = `https://${node.conn.host}:${node.conn.port}/api/calld/1.0/calls`;
        const make_call = await makeCall(url, token, context, extension, user_uuid, tenant_uuid, all_lines);
        node.log(`Make call to ${extension} for ${user_uuid}`);
        msg.payload = make_call;
        node.send(msg);
      }
      catch(err) {
        node.error(`Make call error: ${err.message}`);
      }
    });

  }

  RED.nodes.registerType("wazo make call", make_call);
};
