module.exports = function (RED) {
  const { hangupCall } = require('./lib/internal_api.js');

  function HangupCall(n) {
    RED.nodes.createNode(this, n);
    this.conn = RED.nodes.getNode(n.server);
    this.tenantUuid = n.tenant_uuid;

    this.on('input', async (msg, send, done) => {
      const callId = msg.payload.call_id;
      const tenantUuid = msg.payload.tenant_uuid || this.tenantUuid;

      if (callId) {
        try {
          const token = await this.conn.authenticate();
          const url = `https://${this.conn.host}:${this.conn.port}/api/calld/1.0/calls/${callId}`;
          await hangupCall(url, token, tenantUuid);
          this.log('Call hangup');
          send(msg);
          done();
        } catch (err) {
          this.error(`Hangup call error: ${err.message}`, msg);
          done(err);
        }
      } else {
        this.warn('Missing call_id in payload');
        done();
      }
    });
  }

  RED.nodes.registerType("wazo hangup call", HangupCall);
};
