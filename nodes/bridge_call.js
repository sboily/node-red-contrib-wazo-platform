global.window = global;

module.exports = function (RED) {
  function BridgeCall(n) {
    RED.nodes.createNode(this, n);
    const conn = RED.nodes.getNode(n.server);
    this.context = n.context;
    this.exten = n.exten;
    this.autoAnswer = n.auto_answer;
    this.tenantUuid = n.tenant_uuid;
    this.client = conn.apiClient.application;

    this.on('input', async (msg) => {
      const callId = msg.payload.call ? msg.payload.call.id : msg.payload.call_id;
      const applicationUuid = msg.payload.application_uuid;
      const exten = this.exten || msg.payload.exten;
      const context = this.context || msg.payload.context;
      const tenantUuid = this.tenantUuid || msg.payload.tenant_uuid;
      const callerId = msg.payload.call ? msg.payload.call.displayed_caller_id_number : msg.payload.displayed_caller_id_number;
      const autoAnswer = this.autoAnswer || msg.payload.auto_answer;

      if (callId && applicationUuid) {
        this.log('Bridge Call');
        try {
          if (tenantUuid) {
            this.client.setTenant(tenantUuid);
          }
          const bridgeCall = await this.client.bridgeCall(applicationUuid, callId, context, exten, autoAnswer, callerId);
          msg.payload = { call_id: callId, application_uuid: applicationUuid, data: bridgeCall };
          this.send(msg);
        } catch (err) {
          this.error(`Bridge call error: ${err.message}`, msg);
        }
      } else {
        this.warn('Missing call_id or application_uuid in payload');
      }
    });
  }

  RED.nodes.registerType("wazo bridge_call", BridgeCall);
};
