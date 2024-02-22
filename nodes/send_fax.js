global.window = global;

module.exports = function (RED) {
  const { sendFax } = require('./lib/internal_api.js');

  function send_fax(n) {
    RED.nodes.createNode(this, n);
    conn = RED.nodes.getNode(n.server);
    this.context = n.context;
    this.exten = n.exten;
    this.caller_id = n.caller_id;
    this.tenant_uuid = n.tenant_uuid;
    this.client = conn.apiClient.calld;

    var node = this;

    node.on('input', async msg => {
      exten = msg.payload.exten || node.exten;
      context = msg.payload.context || node.context;
      caller_id = msg.payload.caller_id || node.caller_id;
      tenant_uuid = msg.payload.tenant_uuid || node.tenant_uuid;
      fax_content = msg.payload.fax_content;

      if (fax_content) {
        node.log('Send Fax');
        try {
          const faxData = await sendFax(context, exten, fax_content, caller_id, tenant_uuid);
          msg.payload.data = faxData;
          node.send(msg);
        }
        catch(err) {
          node.error(`Send fax error: ${err.message}`);
        }
      }
    });
  }

  RED.nodes.registerType("wazo send_fax", send_fax);
};
