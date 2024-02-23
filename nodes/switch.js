module.exports = function (RED) {
  const { switchToApplication } = require('./lib/internal_api.js');

  function SwitchToApplication(n) {
    RED.nodes.createNode(this, n);
    this.conn = RED.nodes.getNode(n.server);
    this.app_uuid = n.app_uuid;

    this.on('input', async (msg) => {
      const callId = msg.payload.call ? msg.payload.call.id : msg.payload.call_id;
      const applicationUuid = msg.payload.application_uuid || this.app_uuid;

      if (callId && applicationUuid) {
        const token = await this.conn.authenticate();
        const url = `https://${this.conn.host}:${this.conn.port}/api/calld/1.0/calls/${callId}/applications/${applicationUuid}`;
        try {
          const result = await switchToApplication(url, token);
          this.log('Switch call to an application');
          msg.payload = { call_id: callId, application_uuid: applicationUuid, data: result };
          this.send(msg);
        } catch (err) {
          this.error(`Switch to an application error: ${err.message}`, msg);
        }
      } else {
        this.warn('Missing call_id or application_uuid in payload');
      }
    });
  }

  RED.nodes.registerType("wazo switch", SwitchToApplication);
};
