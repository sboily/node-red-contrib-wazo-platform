module.exports = function (RED) {
  const fetch = require('node-fetch');
  const https = require("https");

  const agent = new https.Agent({
    rejectUnauthorized: false
  });
    
  function hangup_call(n) {
    RED.nodes.createNode(this, n);
    this.conn = RED.nodes.getNode(n.server);
    this.client = conn.apiClient.calld;

    var node = this;

    node.on('input', async (msg, send, done) => {
      call_id = msg.payload.call_id;

      const token = await node.conn.authenticate();

      if (call_id) {
        const url = `https://${node.conn.host}:${node.conn.port}/api/calld/1.0/calls/${call_id}`;
        const result = await hangupCall(url, token);
        node.log('Call hangup');
        send(msg);
        done();
      }
    });  
  }

  // FIXME: Remove when SDK will be ready
  const hangupCall = async (url, token) => {
    const options = {
        method: 'DELETE',
        agent: agent,
        headers: {
          'content-type': 'application/json',
          'X-Auth-Token': token
        }
    };

    return fetch(url, options);
  };

  RED.nodes.registerType("wazo hangup call", hangup_call);
};
