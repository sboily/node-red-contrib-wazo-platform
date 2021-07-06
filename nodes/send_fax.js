global.window = global;

module.exports = function (RED) {
  const { WazoApiClient } = require('@wazo/sdk');
  const fetch = require('node-fetch');
  const https = require("https");

  const agent = new https.Agent({
    rejectUnauthorized: false
  });

  function send_fax(n) {
    RED.nodes.createNode(this, n);
    conn = RED.nodes.getNode(n.server);
    this.context = n.context;
    this.extension = n.exten;
    this.caller_id = n.caller_id;
    this.client = conn.client.calld;

    var node = this;

    node.on('input', async msg => {
      extension = node.extension || msg.payload.exten;
      context = node.context || msg.payload.context;
      caller_id = node.caller_id || msg.payload.caller_id;
      fax_content = msg.payload.fax_content;

      if (fax_content) {
        node.log('Send Fax');
        try {
          const faxData = await sendFax(context, extension, fax_content, caller_id);
          msg.payload.data = faxData;
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
  async function sendFax(context, extension, fax_content, caller_id) {
    const params = {
      context: context,
      extension: extension,
      caller_id: caller_id
    };

    const esc = encodeURIComponent;
    const query = Object.keys(params).map(k => `${esc(k)}=${esc(params[k])}`).join('&')
    const url = `https://${this.conn.host}:${this.conn.port}/api/calld/1.0/faxes?${query}`;
    const token = await this.conn.authenticate();

    const options = {
        method: 'POST',
        agent: agent,
        body: fax_content,
        headers: {
          'content-type': 'application/pdf',
          'X-Auth-Token': token
        }
    };

    return fetch(url, options).then(response => response.json()).then(data => data);
  }

  // FIXME: Remove when SDK will be ready
  const listContexts = async (url, token) => {
    const options = {
        method: 'GET',
        agent: agent,
        headers: {
          'content-type': 'application/json',
          'X-Auth-Token': token
        }
    };

    return fetch(url, options).then(response => response.json()).then(data => data);
  };

  RED.httpAdmin.post('/wazo-platform/contexts', async (req, res) => {
    client = new WazoApiClient({
      server: `${req.body.host}:${req.body.port}`,
      agent: agent,
      clientId: 'wazo-nodered'
    });

    try {
      const authentication = await client.auth.refreshToken(req.body.refreshToken);
      client.setToken(authentication.token);
      try {
        // FIXME: Remove when SDK will be ready
        // const { ...contexts } = await client.confd.listContexts();

        const url = `https://${req.body.host}:${req.body.port}/api/confd/1.1/contexts`;
        const contexts = await listContexts(url, authentication.token);

        res.json(contexts);
      }
      catch(err) {
        res.send(err);
        throw err;
      }
    }
    catch(err) {
      res.send(err);
      throw err;
    }

  });

  RED.nodes.registerType("wazo send_fax", send_fax);

};
