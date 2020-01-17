module.exports = function (RED) {
  const { WazoApiClient } = require('@wazo/sdk');
  const fetch = require('node-fetch');
  const https = require("https");

  const agent = new https.Agent({
    rejectUnauthorized: false
  });

  function voicemail(n) {
    RED.nodes.createNode(this, n);
    this.voicemail_name = n.voicemail_name;
    this.voicemail_id = n.voicemail_id;
    conn = RED.nodes.getNode(n.server);
    this.client = conn.client.calld;

    this.new_messages = 0;
    this.old_messages = 0;

    var node = this;

    conn.authenticate().then(data => {
      if (data) {
        const url = `https://${conn.host}:${conn.port}/api/calld/1.0/voicemails/${this.voicemail_id}`;
        initVoicemail(url, data.token, this.voicemail_id);
      }
    });

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
      node.status({fill:"grey", shape:"dot", text: `voicemails - new: ${node.new_messages} old: ${node.old_messages}`});
    }

    async function initVoicemail(url, token, voicemail_id) {
      const voicemails = await getVoicemail(url, token, voicemail_id);
      voicemails.folders.map(item => {
        if (item.type == "new" || item.type == "old") {
          if (item.type == "new") { node.new_messages = item.messages.length; }
          if (item.type == "old") { node.old_messages = item.messages.length; }
          setStatus();
        }
      });
    }
  }

  async function getVoicemail(url, token, voicemail_id) {
    const options = {
        method: 'GET',
        agent: agent,
        headers: {
          'content-type': 'application/json',
          'X-Auth-Token': token
        }
    };

    return fetch(url, options).then(response => response.json()).then(data => data);
  }

  async function listVoicemails(url, token) {
    const options = {
        method: 'GET',
        agent: agent,
        headers: {
          'content-type': 'application/json',
          'X-Auth-Token': token
        }
    };

    return fetch(url, options).then(response => response.json()).then(data => data);
  }

  RED.httpAdmin.post('/wazo-platform/voicemails', RED.auth.needsPermission('wazo.write'), async function(req, res) {
    client = new WazoApiClient({
      server: `${req.body.host}:${req.body.port}`,
      agent: agent,
      clientId: 'wazo-nodered'
    });

    try {
       const { ...authentication } = await client.auth.refreshToken(req.body.refreshToken);
       client.setToken(authentication.token);
      try {
        const url = `https://${req.body.host}:${req.body.port}/api/confd/1.1/voicemails`;
        const { ...voicemails } = await listVoicemails(url, authentication.token);
        res.json(voicemails);
      }
      catch(err) {
        res.send(err);
      }
    }
    catch(err) {
      res.send(err);
    }
  });

  RED.nodes.registerType("wazo voicemail", voicemail);

}
