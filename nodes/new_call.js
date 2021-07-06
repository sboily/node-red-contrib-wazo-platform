global.window = global;

module.exports = function (RED) {
  const { WazoApiClient } = require('@wazo/sdk');
  const fetch = require('node-fetch');
  const https = require("https");

  const agent = new https.Agent({
    rejectUnauthorized: false
  });
    
  function new_call(n) {
    RED.nodes.createNode(this, n);
    this.conn = RED.nodes.getNode(n.server);
    this.app_uuid = n.app_uuid;

    var node = this;

    node.on('input', async msg => {
      application_uuid = msg.payload.application_uuid ? msg.payload.application_uuid : node.app_uuid;

      if (application_uuid) {
        try {
          const call = {
            exten: msg.payload.exten,
            context: msg.payload.context,
            autoanswer: msg.payload.autoanswer || false,
            displayed_caller_id_name: msg.payload.displayed_caller_id_name || "",
            displayed_caller_id_number: msg.payload.displayed_caller_id_number || "",
            variables: msg.payload.variables || {}
          };
          const url = `https://${node.conn.host}:${node.conn.port}/api/calld/1.0/applications/${application_uuid}/calls`;
          const token = await node.conn.authenticate();
          const new_call = await createNewCall(url, token, call);
          msg.payload.application_uuid = application_uuid;
          msg.payload.call_id = new_call.id;
          msg.payload.data = new_call;
          node.send(msg);
        }
        catch(err) {
          node.error(err);
          throw err;
        }
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

    return fetch(url, options).then(response => response.json()).then(data => data);
  };

  RED.nodes.registerType("wazo new_call", new_call);

};
