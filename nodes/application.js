module.exports = function(RED) {

  function application(n) {
    RED.nodes.createNode(this, config);
    wazoConn = RED.nodes.getNode(n.server);
    this.client = wazoConn.client.calld;
    this.name = n.name;
    this.app_uuid = n.app_uuid;

    var node = this;
  }

  RED.nodes.registerType("wazo application", application);

}
