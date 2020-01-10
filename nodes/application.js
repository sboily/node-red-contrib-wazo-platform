module.exports = function(RED) {
  const { WazoApiClient } = require('@wazo/sdk');

  function application(n) {
    RED.nodes.createNode(this, n);
    wazoConn = RED.nodes.getNode(n.server);
    this.app_name = n.app_name;
    this.app_uuid = n.app_uuid;

    var node = this;
  }

  RED.httpAdmin.post('/wazo-platform/applications', RED.auth.needsPermission('wazo.write'), async function(req, res) {
    client = new WazoApiClient({
      server: `${req.body.host}:${req.body.port}`,
      clientId: 'wazo-nodered'
    });

    const { ...authentication } = await client.auth.refreshToken(req.body.refreshToken);
    client.setToken(authentication.token);

    const { ...applications } = await client.confd.listApplications();

    res.json(applications);
  });

  RED.nodes.registerType("wazo application", application);

}
