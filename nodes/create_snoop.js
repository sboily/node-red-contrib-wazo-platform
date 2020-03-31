module.exports = function (RED) {
  const { WazoApiClient } = require('@wazo/sdk');

  function create_snoop(n) {
    RED.nodes.createNode(this, n);
    conn = RED.nodes.getNode(n.server);
    this.client = conn.client.application;

    var node = this;

    node.on('input', async msg => {
      application_uuid = msg.payload.application_uuid;

      if (application_uuid) {
        try {
          const data = {};
          const snoop = await node.client.createSnoop(application_uuid, data);
          node.log('Create snoop');
          msg.payload.application_uuid = application_uuid;
          msg.payload.data = snoop;
          node.send(msg);
        }
        catch(err) {
          node.error(err);
          throw err;
        }
      }
    });

  }

  RED.nodes.registerType("wazo create_snoop", create_snoop);

};