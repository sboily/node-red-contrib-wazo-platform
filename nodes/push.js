module.exports = function (RED) {
  const { sendPush } = require('./lib/internal_api.js');

  function Push(n) {
    RED.nodes.createNode(this, n);
    this.tenantUuid = n.tenant_uuid;
    this.conn = RED.nodes.getNode(n.server);

    this.on('input', async (msg) => {
      const data = {
        notification_type: msg.payload.notification_type,
        title: msg.payload.title,
        body: msg.payload.body,
        user_uuid: msg.payload.user_uuid,
        extra: msg.payload.extra
      };
      const tenantUuid = this.tenantUuid || msg.payload.tenant_uuid;

      this.log('Call push notification');
      try {
        const url = `https://${this.conn.host}:${this.conn.port}/api/webhookd/1.0/mobile/notifications`;
        const token = await this.conn.authenticate();
        await sendPush(url, token, data, tenantUuid);
        this.send(msg);
      } catch (err) {
        this.error(`Push error: ${err.message}`, msg);
      }
    });
  }

  RED.nodes.registerType("wazo push", Push);
};
