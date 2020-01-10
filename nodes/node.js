module.exports = function (RED) {
    
  function node(n) {
    RED.nodes.createNode(this, n);
    wazoConn = RED.nodes.getNode(n.server);
    this.node_name = n.node_name;
    this.node_uuid = n.node_uuid;
    this.client = wazoConn.client.application;

    var node = this;

    node.on('input', msg => {
      call_id = msg.data.call.id;
      application_uuid = msg.data.application_uuid;

      if (call_id) {
        node.log('Add call to node');
        try {
          const result = node.client.createNewNodeWithCall(application_uuid, [{id: call_id}]);
          node.send(msg);
        }
        catch(err) {
          node.error(err);
        }
      }
    });  
  }

  RED.httpAdmin.post('/wazo-platform/node', RED.auth.needsPermission('wazo.read'), function(req, res) {
  });

  RED.nodes.registerType("wazo node", node);

}
