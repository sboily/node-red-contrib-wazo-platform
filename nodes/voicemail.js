global.window = global;

module.exports = function (RED) {
  const { getVoicemail } = require('./lib/internal_api.js');

  function voicemail(n) {
    RED.nodes.createNode(this, n);
    this.voicemail_name = n.voicemail_name;
    this.voicemail_id = n.voicemail_id;
    this.conn = RED.nodes.getNode(n.server);
    this.client = this.conn.apiClient.calld;

    this.new_messages = 0;
    this.old_messages = 0;

    var node = this;

    node.on('input', async msg => {
      if (msg.topic == 'user_voicemail_message_created' && msg.payload.voicemail_id == this.voicemail_id) {
        if (msg.payload.message.folder.type == "new") { this.new_messages += 1; }
        if (msg.payload.message.folder.type == "old") { this.old_messages += 1; }
        setStatus();
        node.send(msg);
      }

      if (msg.topic == 'user_voicemail_message_updated' && msg.payload.voicemail_id == this.voicemail_id) {
        if (msg.payload.message.folder.type == "old") {
          this.new_messages -= 1;
          this.old_messages += 1;
        }
        setStatus();
        node.send(msg);
      }

      if (msg.topic == 'user_voicemail_message_deleted' && msg.payload.voicemail_id == this.voicemail_id) {
        if (msg.payload.message.folder.type == "new") { this.new_messages -= 1; }
        if (msg.payload.message.folder.type == "old") { this.old_messages -= 1; }
        setStatus();
        node.send(msg);
      }
    });

    function setStatus() {
      node.status({fill:"blue", shape:"dot", text: `voicemails - new: ${node.new_messages} old: ${node.old_messages}`});
    }

    const initVoicemail = async (url, voicemail_id) => {
      const token = await node.conn.authenticate();
      const voicemails = await getVoicemail(url, token, voicemail_id);
      voicemails.folders.map(item => {
        if (item.type == "new" || item.type == "old") {
          if (item.type == "new") { node.new_messages = item.messages.length; }
          if (item.type == "old") { node.old_messages = item.messages.length; }
          setStatus();
        }
      });
    };

    const url = `https://${this.conn.host}:${this.conn.port}/api/calld/1.0/voicemails/${this.voicemail_id}`;
    initVoicemail(url, this.voicemail_id);
  }

  RED.nodes.registerType("wazo voicemail", voicemail);
};
