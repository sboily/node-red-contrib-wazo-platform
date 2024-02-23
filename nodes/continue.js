global.window = global;

module.exports = function (RED) {
  const { continueInDialplan } = require('./lib/internal_api.js');

  function CallContinue(n) {
    RED.nodes.createNode(this, n);
    this.conn = RED.nodes.getNode(n.server);
    this.context = n.context;
    this.extension = n.extension;
    this.priority = n.priority;
    this.label = n.label;

    this.on('input', async (msg) => {
      const callId = msg.payload.call ? msg.payload.call.id : msg.payload.call_id;
      const applicationUuid = msg.payload.application_uuid;

      const { context, extension, priority, label } = msg.payload;
      const data = {
        context: context || this.context,
        extension: extension || this.extension,
        priority: priority || this.priority,
        label: label || this.label
      };

      if (callId && applicationUuid) {
        const token = await this.conn.authenticate();
        const url = `https://${this.conn.host}:${this.conn.port}/api/calld/1.0/applications/${applicationUuid}/calls/${callId}/continue`;
        try {
          const result = await continueInDialplan(url, token, data);
          this.log('Continue call in dialplan');
          msg.payload = { call_id: callId, application_uuid: applicationUuid, data: result };
          this.send(msg);
        } catch (err) {
          this.error(`Continue in dialplan error: ${err.message}`, msg);
        }
      } else {
        this.warn('Missing call_id or application_uuid in payload');
      }
    });
  }

  RED.nodes.registerType("wazo continue", CallContinue);
};
