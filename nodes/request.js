global.window = global;

module.exports = function (RED) {
  const { apiRequest } = require('./lib/internal_api.js');

  function WazoRequest(n) {
    RED.nodes.createNode(this, n);
    this.conn = RED.nodes.getNode(n.server);
    this.serviceName = n.service_name;
    this.tenant = n.tenant_uuid;

    this.on('input', async (msg) => {
      const {
        version,
        method,
        endpoint,
        body = null,
        header = 'application/json',
        tenant = this.tenant
      } = msg.payload;

      const url = `https://${this.conn.host}:${this.conn.port}/api/${this.serviceName}/${version}/${endpoint}`;

      this.log(`Make a ${method} request to the service ${this.serviceName} on ${url}`);
      this.status({ fill: "blue", shape: "dot", text: `Request to ${this.serviceName}!` });

      try {
        const token = await this.conn.authenticate();
        const result = await apiRequest(url, method, token, body, header, tenant);

        msg.payload = result;
        this.send(msg);
        this.status({});
      } catch (error) {
        this.error(`Error making API request: ${error.message}`, msg);
        this.status({ fill: "red", shape: "ring", text: "Error" });
      }
    });
  }

  RED.nodes.registerType("wazo request", WazoRequest);
};
