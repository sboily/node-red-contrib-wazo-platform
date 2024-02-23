module.exports = function (RED) {
  const https = require("https");
  const fs = require('fs');
  const request = require('request');

  const agent = new https.Agent({
    rejectUnauthorized: false
  });

  function FetchVoicemail(n) {
    RED.nodes.createNode(this, n);
    const conn = RED.nodes.getNode(n.server);
    this.saveFile = n.save_file;
    this.isUser = n.is_user;
    this.tenantUuid = n.tenant_uuid;
    this.base64 = n.base64;
    this.client = conn.apiClient.calld;
    this.ws = conn;

    this.ws.on('user_voicemail_message_created', (msg) => {
      this.fetchVoicemail(msg);
    });

    this.ws.on('initialized', () => {
      this.status({
        fill: "green",
        shape: "dot",
        text: "connected"
      });
    });

    this.ws.on('onclose', () => {
      this.status({
        fill: "red",
        shape: "ring",
        text: "disconnected"
      });
    });

    this.ws.on('onerror', () => {
      this.status({
        fill: "red",
        shape: "ring",
        text: "disconnected"
      });
    });

    this.on('input', (msg) => {
      this.fetchVoicemail(msg);
    });

    this.fetchVoicemail = async (msg) => {
      const voicemailId = msg.payload.voicemail_id;
      const messageId = msg.payload.message_id;
      const userUuid = msg.payload.user_uuid;
      const tenantUuid = msg.payload.tenant_uuid || this.tenantUuid;

      if (voicemailId && messageId) {
        this.status({ fill: "blue", shape: "dot", text: 'Fetch voicemail' });
        const token = await conn.authenticate();
        let url = `https://${conn.host}:${conn.port}/api/calld/1.0/voicemails/${voicemailId}/messages/${messageId}/recording?download=1`;
        if (this.isUser) {
          url = `https://${conn.host}:${conn.port}/api/calld/1.0/users/me/voicemails/messages/${messageId}/recording?download=1`;
        }
        this.getVoicemailRecording(msg, url, voicemailId, messageId, token, userUuid, tenantUuid);
      }
    };

    this.getVoicemailRecording = (msg, url, voicemailId, messageId, token, userUuid, tenantUuid) => {
      const options = {
        method: 'GET',
        url,
        agent,
        headers: {
          'content-type': 'application/json',
          'X-Auth-Token': token
        }
      };

      if (tenantUuid) {
        options.headers['Wazo-Tenant'] = tenantUuid;
      }

      const chunks = [];
      const sendReq = request.get(options);

      sendReq.on('data', (chunk) => {
        chunks.push(Buffer.from(chunk));
      }).on('end', () => {
        let buffer = Buffer.concat(chunks);

        if (this.base64) {
          buffer = buffer.toString('base64');
        }

        if (this.saveFile) {
          const dest = `voicemail-${voicemailId}-${messageId}.wav`;
          fs.writeFile(dest, buffer, 'binary', (err) => {
            if (err) {
              this.error(err);
            }
          });

          msg.payload = {
            user_uuid: userUuid,
            buffer,
            file: dest
          };
        } else {
          msg.payload = buffer;
          msg.user_uuid = userUuid;
        }
        this.send(msg);
      });

      sendReq.on('response', (response) => {
        if (response.statusCode !== 200) {
          this.error('Error: Response status was ' + response.statusCode);
        }
        this.status({});
      });
    };
  }

  RED.nodes.registerType("wazo fetch voicemail", FetchVoicemail);
};
