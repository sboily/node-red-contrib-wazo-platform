global.window = global;

module.exports = function (RED) {
  const { getVoicemail } = require('./lib/internal_api.js');

  function Voicemail(n) {
    RED.nodes.createNode(this, n);
    this.conn = RED.nodes.getNode(n.server);
    this.voicemailName = n.voicemail_name;
    this.voicemailId = n.voicemail_id;
    this.tenantUuid = n.tenant_uuid;
    this.client = this.conn.apiClient.calld;
    this.ws = this.conn;

    this.newMessages = 0;
    this.oldMessages = 0;

    const voicemailEventsList = [
      'user_voicemail_message_created',
      'user_voicemail_message_updated',
      'user_voicemail_message_deleted'
    ];

    voicemailEventsList.forEach((event) => {
      this.ws.on(event, (msg) => {
        handleVoicemailMessage(msg);
        this.send(msg);
      });
    });

    this.on('input', async (msg) => {
      if (msg.topic.startsWith('user_voicemail_message_') && msg.payload.voicemail_id === this.voicemailId) {
        handleVoicemailMessage(msg);
        this.send(msg);
      }
    });

    const handleVoicemailMessage = (msg) => {
      const { topic, payload } = msg;
      const { message } = payload;

      if (topic === 'user_voicemail_message_created') {
        if (message.folder.type === "new") { this.newMessages += 1; }
        if (message.folder.type === "old") { this.oldMessages += 1; }
      } else if (topic === 'user_voicemail_message_updated' && message.folder.type === "old") {
        this.newMessages -= 1;
        this.oldMessages += 1;
      } else if (topic === 'user_voicemail_message_deleted') {
        if (message.folder.type === "new") { this.newMessages -= 1; }
        if (message.folder.type === "old") { this.oldMessages -= 1; }
      }

      setStatus();
    }

    const setStatus = () => {
      this.status({ fill: "blue", shape: "dot", text: `voicemails - new: ${this.newMessages} old: ${this.oldMessages}` });
    }

    const initVoicemail = async (url, tenantUuid) => {
      const token = await this.conn.authenticate();
      const voicemails = await getVoicemail(url, token, tenantUuid);
      voicemails.folders.forEach((folder) => {
        if (folder.type === "new") { this.newMessages = folder.messages.length; }
        if (folder.type === "old") { this.oldMessages = folder.messages.length; }
      });
      setStatus();
    }

    const url = `https://${this.conn.host}:${this.conn.port}/api/calld/1.0/voicemails/${this.voicemailId}`;
    initVoicemail(url, this.tenantUuid);
  }

  RED.nodes.registerType("wazo voicemail", Voicemail);
};
