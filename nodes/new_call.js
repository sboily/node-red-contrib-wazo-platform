global.window = global;

module.exports = function (RED) {
  const fetch = require('node-fetch');
  const https = require("https");

  const agent = new https.Agent({
    rejectUnauthorized: false
  });

  function NewCall(n) {
    RED.nodes.createNode(this, n);
    this.conn = RED.nodes.getNode(n.server);
    this.appUuid = n.app_uuid;

    this.on('input', async (msg) => {
      const applicationUuid = msg.payload.application_uuid || this.appUuid;

      if (applicationUuid) {
        try {
          const call = {
            exten: msg.payload.exten,
            context: msg.payload.context,
            autoanswer: msg.payload.autoanswer || false,
            displayed_caller_id_name: msg.payload.displayed_caller_id_name || "",
            displayed_caller_id_number: msg.payload.displayed_caller_id_number || "",
            variables: msg.payload.variables || {}
          };
          const url = `https://${this.conn.host}:${this.conn.port}/api/calld/1.0/applications/${applicationUuid}/calls`;
          const token = await this.conn.authenticate();
          const newCallResult = await createNewCall(url, token, call);
          msg.payload = { application_uuid: applicationUuid, call_id: newCallResult.id, data: newCallResult };
          this.send(msg);
        } catch (err) {
          this.error(`New call error: ${err.message}`, msg);
        }
      } else {
        this.warn('Missing application_uuid in payload');
      }
    });
  }

  // FIXME: Remove when SDK will be ready
  const createNewCall = async (url, token, body) => {
    const options = {
      method: 'POST',
      agent: agent,
      body: JSON.stringify(body),
      headers: {
        'content-type': 'application/json',
        'X-Auth-Token': token
      }
    };

    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  };

  RED.nodes.registerType("wazo new_call", NewCall);
};
