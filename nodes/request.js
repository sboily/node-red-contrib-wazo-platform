global.window = global;

module.exports = function (RED) {
  const { apiRequest } = require('./lib/internal_api.js');

  function request(n) {
    RED.nodes.createNode(this, n);
    this.conn = RED.nodes.getNode(n.server);
    this.serviceName = n.service_name;
    this.tenant = n.tenant_uuid;

    var node = this;

    node.on('input', async msg => {
      const version = msg.payload.version;
      const method = msg.payload.method;
      const endpoint = msg.payload.endpoint;
      const query = msg.payload.query;
      const body = msg.payload.body;
      const header = msg.payload.header || 'application/json';
      const tenant = msg.payload.tenant || this.tenant;
      const url = `https://${node.conn.host}:${node.conn.port}/api/${node.serviceName}/${version}/${endpoint}`;

      node.log(`Make a ${method} request to the service ${node.serviceName} on ${url}`);
      node.status({fill:"blue", shape:"dot", text: `Request to ${node.serviceName}!`});
      const token = await node.conn.authenticate();
      const result = await apiRequest(url, method, token, query, body, header, tenant);
      msg.payload = result;
      node.send(msg);
      node.status({});
    });

  }

  RED.nodes.registerType("wazo request", request);
};
