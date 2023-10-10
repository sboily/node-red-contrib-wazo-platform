module.exports = function (RED) {
  const { sendPush } = require('./lib/internal_api.js');
    
  function push(n) {
    RED.nodes.createNode(this, n);
    this.tenant_uuid = n.tenant_uuid;
    this.conn = RED.nodes.getNode(n.server);

    var node = this;

    node.on('input', async msg => {
      const data = {
        notification_type: msg.payload.notification_type,
        title: msg.payload.title,
        body: msg.payload.body,
        user_uuid: msg.payload.user_uuid,
        extra: msg.payload.extra
      }
      const tenant_uuid = this.tenant_uuid || msg.payload.tenant_uuid;

      node.log('Call push notification');
      try {
        const url = `https://${node.conn.host}:${node.conn.port}/api/webhookd/1.0/mobile/notifications`;
        const token = await node.conn.authenticate();
        await sendPush(url, token, data, tenant_uuid);
        node.send(msg);
      }
      catch(err) {
        node.error(err);
        throw err;
      }
    });  
  }

  RED.nodes.registerType("wazo push", push);

};
