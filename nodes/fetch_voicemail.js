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

    var node = this;

    node.on('input', msg => {
      if (msg.topic == 'user_voicemail_message_created' && msg.payload.voicemail_id) {
        const voicemail_id = msg.payload.voicemail_id;
        const message_id = msg.payload.message_id;
        node.status({fill:"blue", shape:"dot", text: 'Fetch voicemail'});
        fetchVoicemail(voicemail_id, message_id);
      }
    });

    function fetchVoicemail(voicemail_id, message_id) {
      conn.authenticate().then(data => {
        if (data) {
          let url = `https://${conn.host}:${conn.port}/api/calld/1.0/voicemails/${voicemail_id}/messages/${message_id}/recording?download=1`;
          if (node.is_user) {
            url = `https://${conn.host}:${conn.port}/api/calld/1.0/users/me/voicemails/messages/${message_id}/recording?download=1`;
          }
          fetchVoicemailRecording(url, voicemail_id, message_id, data.token, node);
        }
      });
    }
  }

  function fetchVoicemailRecording(url, voicemail_id, message_id, token, node) {
    const options = {
      method: 'GET',
      url: url,
      agent: agent,
      headers: {
        'content-type': 'application/json',
        'X-Auth-Token': token
      }
    }

    let file;
    let dest;

    if (node.save_file) {
      dest = `voicemail-${voicemail_id}-${message_id}.wav`;
      file = fs.createWriteStream(dest);
    }
    const sendReq = request.get(options);

    if (!node.save_file) {
      const chunks = [];
      sendReq.on('data', chunk => chunks.push(Buffer.from(chunk))).on('end', () => {
        const buffer = Buffer.concat(chunks);
        if (node.base64) {
          node.send({payload: buffer.toString('base64')});
        } else {
          node.send({payload: buffer});
        }
      });
    }

    sendReq.on('response', (response) => {
      if (response.statusCode !== 200) {
        node.log('Response status was ' + response.statusCode);
      }

      if (node.save_file) {
        sendReq.pipe(file);
        node.send({payload: dest});
      }
      node.status({});
    });

    if (node.save_file) {
      file.on('finish', () => file.close());
    }

    sendReq.on('error', (err) => {
      if (node.save_file) {
        fs.unlink(dest);
      }
      node.log(err.message);
    });

    if (node.save_file) {
      file.on('error', (err) => {
        fs.unlink(dest);
        node.log(err.message);
      });
    }
  }

  RED.nodes.registerType("wazo fetch voicemail", fetch_voicemail);

}
