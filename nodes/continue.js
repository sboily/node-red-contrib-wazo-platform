global.window = global;

module.exports = function (RED) {
  const { continueInDialplan } = require('./lib/internal_api.js');
    
  function call_continue(n) {
    RED.nodes.createNode(this, n);
    this.conn = RED.nodes.getNode(n.server);
    this.context = n.context;
    this.extension = n.extension;
    this.priority = n.priority;
    this.label = n.label;

    var node = this;

    node.on('input', async msg => {
      const call_id = msg.payload.call ? msg.payload.call.id : msg.payload.call_id;
      const application_uuid = msg.payload.application_uuid;

      const { context, extension, priority, label } = msg.payload;
      const data = {
        context: context || node.context,
        extension: extension || node.extension
      }

      if ((priority || node.priority) && !(label || node.label)) {
        data['priority'] = priority || node.priority;
      }

      if (!(priority || node.priority) && (label || node.label)) {
        data['label'] = label || node.label;
      }

      if (call_id && application_uuid) {
        const token = await node.conn.authenticate();
        const url = `https://${node.conn.host}:${node.conn.port}/api/calld/1.0/applications/${application_uuid}/calls/${call_id}/continue`;
        const result = await continueInDialplan(url, token, data);
        node.log('Continue call in dialplan');
        msg.payload.call_id = call_id;
        msg.payload.application_uuid = application_uuid;
        msg.payload.data = result;
        node.send(msg);
      }
    });
  }

  RED.nodes.registerType("wazo continue", call_continue);
};
