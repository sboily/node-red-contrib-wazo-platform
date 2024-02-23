global.window = global;

module.exports = function (RED) {
  const { makeCall } = require('./lib/internal_api.js');

  function MakeCall(n) {
    RED.nodes.createNode(this, n);
    this.conn = RED.nodes.getNode(n.server);
    this.userUuid = n.user_uuid;
    this.context = n.context;
    this.extension = n.extension;
    this.tenantUuid = n.tenant_uuid;
    this.client = this.conn.apiClient.calld;

    this.on('input', async (msg) => {
      const userUuid = msg.payload.user_uuid || this.userUuid;
      const context = msg.payload.context || this.context;
      const extension = msg.payload.extension || this.extension;
      const allLines = msg.payload.all_lines !== undefined ? msg.payload.all_lines : true;
      const tenantUuid = msg.payload.tenant_uuid || this.tenantUuid;
      const token = await this.conn.authenticate();

      try {
        const url = `https://${this.conn.host}:${this.conn.port}/api/calld/1.0/calls`;
        const makeCallResult = await makeCall(url, token, context, extension, userUuid, tenantUuid, allLines);
        this.log(`Make call to ${extension} for ${userUuid}`);
        msg.payload = makeCallResult;
        this.send(msg);
      } catch (err) {
        this.error(`Make call error: ${err.message}`, msg);
      }
    });
  }

  RED.nodes.registerType("wazo make call", MakeCall);
};
