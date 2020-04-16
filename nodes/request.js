module.exports = function (RED) {
  const fetch = require('node-fetch');
  const https = require("https");

  const agent = new https.Agent({
    rejectUnauthorized: false
  });

  function request(n) {
    RED.nodes.createNode(this, n);
    this.conn = RED.nodes.getNode(n.server);
    this.serviceName = n.service_name;

    var node = this;

    node.on('input', async msg => {
      const version = msg.payload.version;
      const method = msg.payload.method;
      const endpoint = msg.payload.endpoint;
      const query = msg.payload.query;
      const body = msg.payload.body;
      const url = `https://${node.conn.host}:${node.conn.port}/api/${node.serviceName}/${version}/${endpoint}`;

      node.log(`Make a ${method} request to the service ${node.serviceName} on ${url}`);
      node.status({fill:"blue", shape:"dot", text: `Request to ${node.serviceName}!`});
      const token = await node.conn.authenticate();
      const result = await apiRequest(url, method, token, query, body);
      msg.payload = result;
      node.send(msg);
      node.status({});
    });

  }

  const apiRequest = (url, method, token, query, body) => {
    const options = {
        method: method,
        agent: agent,
        headers: {
          'content-type': 'application/json',
          'accept': 'application/json',
          'X-Auth-Token': token
        }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    return fetch(url, options).then(response => {
      if (response.status >= 400) {
        return response.statusText;
      }
      else if (response.status >= 200 && response.status < 300) {
        if (options.method == 'PUT' || options.method == 'DELETE') {
          return null;
        }
        const contentType = response.headers.get('content-type') || '';
        const isJson = contentType.indexOf('application/json') !== -1;
        return isJson ? response.json() : response.text(); 
      }
    }).then(data => data);
  
  };

  RED.httpAdmin.get('/wazo-platform/service', (req, res) => {
    const services = [
      'agentd',
      'auth',
      'calld',
      'call-logd',
      'chatd',
      'confd',
      'dird',
      'provd',
      'webhookd',
    ];
    res.json(services);
  });

  RED.nodes.registerType("wazo request", request);

};