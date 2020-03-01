module.exports = function (RED) {
  const { WazoApiClient } = require('@wazo/sdk');
  const https = require("https");
  const fs = require('fs');
  const request = require('request');

  const agent = new https.Agent({
    rejectUnauthorized: false
  });

  function fetch_voicemail(n) {
    RED.nodes.createNode(this, n);
    conn = RED.nodes.getNode(n.server);
    this.save_file = n.save_file;
    this.is_user = n.is_user;
    this.base64 = n.base64;
    this.client = conn.client.calld;
    this.ws = conn;

    var node = this;

    node.ws.on('user_voicemail_message_created', msg => {
      fetchVoicemail(msg);
    });

    node.ws.on('initialized', () => {
      node.status({
        fill:"green",
        shape:"dot",
        text: "connected"
      });
    });

    node.ws.on('onclose', (err) => {
      node.status({
        fill:"red",
        shape:"ring",
        text: "disconnected"
      });
    });

    node.on('input', msg => {
      fetchVoicemail(msg);
    });

    const fetchVoicemail = (msg) => {
      if (msg.payload.voicemail_id && msg.payload.message_id) {
        const voicemail_id = msg.payload.voicemail_id;
        const message_id = msg.payload.message_id;
        node.status({fill:"blue", shape:"dot", text: 'Fetch voicemail'});
        getVoicemail(voicemail_id, message_id);
      }
    }

    const getVoicemail = (voicemail_id, message_id) => {
      conn.authenticate().then(data => {
        if (data) {
          let url = `https://${conn.host}:${conn.port}/api/calld/1.0/voicemails/${voicemail_id}/messages/${message_id}/recording?download=1`;
          if (node.is_user) {
            url = `https://${conn.host}:${conn.port}/api/calld/1.0/users/me/voicemails/messages/${message_id}/recording?download=1`;
          }
          getVoicemailRecording(url, voicemail_id, message_id, data.token, node);
        }
      });
    }

  }

  const getVoicemailRecording = (url, voicemail_id, message_id, token, node) => {
    const options = {
      method: 'GET',
      url: url,
      agent: agent,
      headers: {
        'content-type': 'application/json',
        'X-Auth-Token': token
      }
    }

    const chunks = [];
    const sendReq = request.get(options);

    sendReq.on('data', chunk => chunks.push(Buffer.from(chunk))).on('end', () => {
      const buffer = Buffer.concat(chunks);

      if (node.base64) {
        buffer = buffer.toString('base64');
      }

      if (node.save_file) {
        const dest = `voicemail-${voicemail_id}-${message_id}.wav`;
        fs.writeFile(dest, buffer, 'binary', (err) => {
          if (err) {
            node.error(err);
          }
        });

        node.send({
          payload: {
            buffer: buffer,
            file: dest
          }
        });
      } else {
        node.send({
          payload: buffer
        });
      }
    });

    sendReq.on('response', (response) => {
      if (response.statusCode !== 200) {
        node.error('Error: Response status was ' + response.statusCode);
      }
      node.status({});
    });

  }

  RED.nodes.registerType("wazo fetch voicemail", fetch_voicemail);

}
