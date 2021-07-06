global.window = global;

module.exports = function (RED) {
  const { WazoApiClient } = require('@wazo/sdk');
  const fetch = require('node-fetch');
  const https = require("https");

  const agent = new https.Agent({
    rejectUnauthorized: false
  });
    
  function moh(n) {
    RED.nodes.createNode(this, n);
    conn = RED.nodes.getNode(n.server);
    this.moh_uuid = n.moh_uuid;
    this.client = conn.client.application;

    var node = this;

    node.on('input', async msg => {
      call_id = msg.payload.call ? msg.payload.call.id : msg.payload.call_id;
      application_uuid = msg.payload.application_uuid; 
      if (call_id && application_uuid) {
        moh_uuid = node.moh_uuid || msg.payload.moh_uuid;
        node.log('Start moh');
        try {
          const result = await node.client.startMohCall(application_uuid, call_id, moh_uuid);
          msg.payload.call_id = call_id;
          msg.payload.application_uuid = application_uuid;
          msg.payload.moh_uuid = moh_uuid;
          msg.payload.data = result;
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
  const confdListMoh = (url, token) => {
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

  RED.httpAdmin.post('/wazo-platform/moh', async function(req, res) {
    client = new WazoApiClient({
      server: `${req.body.host}:${req.body.port}`,
      agent: agent,
      clientId: 'wazo-nodered'
    });

    try {
      const { ...auth } = await client.auth.refreshToken(req.body.refreshToken);
      client.setToken(auth.token);
      try {
        // FIXME: Remove when SDK will be ready
        // const { ...moh } = await client.confd.listMoh();

        const url = `https://${req.body.host}:${req.body.port}/api/confd/1.1/moh`;
        const moh = await confdListMoh(url, auth.token);
        res.json(moh);
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

  RED.nodes.registerType("wazo moh", moh);

};
