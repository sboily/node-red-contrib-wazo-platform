global.window = global;

module.exports = function (RED) {
  const { sendFax } = require('./lib/internal_api.js');

  function SendFax(n) {
    RED.nodes.createNode(this, n);
    const conn = RED.nodes.getNode(n.server);
    this.context = n.context;
    this.exten = n.exten;
    this.callerId = n.caller_id;
    this.tenantUuid = n.tenant_uuid;
    this.client = conn.apiClient.calld;

    this.on('input', async (msg) => {
      const exten = msg.payload.exten || this.exten;
      const context = msg.payload.context || this.context;
      const callerId = msg.payload.caller_id || this.callerId;
      const tenantUuid = msg.payload.tenant_uuid || this.tenantUuid;
      const faxContent = msg.payload.fax_content;

      if (faxContent) {
        this.log('Send Fax');
        try {
          const faxData = await sendFax(context, exten, faxContent, callerId, tenantUuid);
          msg.payload.data = faxData;
          this.send(msg);
        } catch (err) {
          this.error(`Send fax error: ${err.message}`, msg);
        }
      } else {
        this.warn('Missing fax_content in payload');
      }
    });
  }

  RED.nodes.registerType("wazo send_fax", SendFax);
};
