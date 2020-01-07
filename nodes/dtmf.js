module.exports = function (RED) {
    
  function dtmf(n) {
    RED.nodes.createNode(this, n);
    this.dtmf = n.dtmf;

    var node = this;

    node.on('input', msg => {
      if (msg.name == 'application_call_dtmf_received') {
        if (msg.data.dtmf == node.dtmf) {
          console.log(`DTMF ${node.dtmf} received`);
          node.send(Call(msg));
        }
      }
    });
  }

  function Call(msg) {
    return {
      name: 'application_call_object',
      origin_uuid: msg.origin_uuid,
      required_acl: msg.required_cal,
      data: {
        application_uuid: msg.data.application_uuid,
        call: {
          id: msg.data.call_id
        }
      }
    }
  }

  RED.nodes.registerType("wazo dtmf", dtmf);

}
