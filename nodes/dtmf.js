module.exports = function (RED) {
    
  function dtmf(n) {
    RED.nodes.createNode(this, n);
    this.dtmf = n.dtmf;

    var node = this;

    node.on('input', msg => {
      if (msg.name == 'application_call_dtmf_received') {
        if (msg.data.dtmf == node.dtmf) {
          node.log(`DTMF ${node.dtmf} received`);
          node.send(Call(msg));
        }
      }
    });
  }

  function Call(msg) {
    const data = {
      application_uuid: msg.data.application_uuid,
      call: {
        id: msg.data.call_id
      }
    }
    return {
      name: 'application_call_object',
      topic: 'application_call_object',
      origin_uuid: msg.origin_uuid,
      required_acl: msg.required_cal,
      payload: data,
      data: data
    }
  }

  RED.nodes.registerType("wazo dtmf", dtmf);

}
