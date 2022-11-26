module.exports = function (RED) {
  const { hangupCall } = require('./lib/internal_api.js');
    
  function hangup_call(n) {
    RED.nodes.createNode(this, n);
    this.conn = RED.nodes.getNode(n.server);
    this.tenant_uuid = n.tenant_uuid;

    var node = this;

    node.on('input', async (msg, send, done) => {
      call_id = msg.payload.call_id;
      tenant_uuid = msg.payload.tenant_uuid || this.tenant_uuid;

      const token = await node.conn.authenticate();

      if (call_id) {
        const url = `https://${node.conn.host}:${node.conn.port}/api/calld/1.0/calls/${call_id}`;
        const result = await hangupCall(url, token, tenant_uuid);
        node.log('Call hangup');
        send(msg);
        done();
      }
    });  
  }

  RED.nodes.registerType("wazo hangup call", hangup_call);
};
