global.window = global;

module.exports = function (RED) {
  const { getVoicemail } = require('./lib/internal_api.js');

  function Voicemail(n) {
    RED.nodes.createNode(this, n);
    this.voicemailName = n.voicemail_name;
    this.voicemailId = n.voicemail_id;
    this.tenantUuid = n.tenant_uuid;
    this.conn = RED.nodes.getNode(n.server);
    this.client = this.conn.apiClient.calld;

    this.newMessages = 0;
    this.oldMessages = 0;

    const node = this;

    node.on('input', async (msg) => {
      if (msg.topic.startsWith('user_voicemail_message_') && msg.payload.voicemail_id === this.voicemailId) {
        handleVoicemailMessage(msg);
        node.send(msg);
      }
    });

    function handleVoicemailMessage(msg) {
      const { topic, payload } = msg;
      const { message } = payload;

      if (topic === 'user_voicemail_message_created') {
        if (message.folder.type === "new") { node.newMessages += 1; }
        if (message.folder.type === "old") { node.oldMessages += 1; }
      } else if (topic === 'user_voicemail_message_updated' && message.folder.type === "old") {
        node.newMessages -= 1;
        node.oldMessages += 1;
      } else if (topic === 'user_voicemail_message_deleted') {
        if (message.folder.type === "new") { node.newMessages -= 1; }
        if (message.folder.type === "old") { node.oldMessages -= 1; }
      }

      setStatus();
    }

    function setStatus() {
      node.status({ fill: "blue", shape: "dot", text: `voicemails - new: ${node.newMessages} old: ${node.oldMessages}` });
    }

    async function initVoicemail() {
      const token = await node.conn.authenticate();
      const voicemails = await getVoicemail(node.voicemailId, token, node.tenantUuid);
      voicemails.folders.forEach((folder) => {
        if (folder.type === "new") { node.newMessages = folder.messages.length; }
        if (folder.type === "old") { node.oldMessages = folder.messages.length; }
        setStatus();
      });
    }

    initVoicemail();
  }

  RED.nodes.registerType("wazo voicemail", Voicemail);
};
