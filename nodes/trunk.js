module.exports = function (RED) {
    
  function trunk(n) {
    RED.nodes.createNode(this, n);
    this.trunk_id = n.trunk_id;
    wazoConn = RED.nodes.getNode(n.server);
    this.client = wazoConn.client.calld;

    var node = this;

    wazoConn.authenticate().then(data => {
      initListTrunks();
    });

    node.on('input', msg => {
      if (msg.name == 'trunk_status_updated') {
        if (msg.data.id == node.trunk_id) {
          console.log(`Trunk ${node.trunk_id} event`);
          setStatus(msg.data);
          node.send(msg);
        }
      }
    });

    function setStatus(data) {
      if (data.registered) {
        node.status({fill:"green", shape:"dot", text: `connected - calls: ${data.current_call_count}`})
      } else {
        node.status({fill:"red", shape:"dot", text: "disconnected"})
      }
    };

    async function initListTrunks() {
      const trunks = await node.client.listTrunks();
      trunks.items.map(item => {
        if (item.id == node.trunk_id) {
          setStatus(item);
        }
      });
    }

  }

  RED.nodes.registerType("wazo trunk", trunk);

}
