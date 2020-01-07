module.exports = function(RED) {

  function application(n) {
    RED.nodes.createNode(this, n);
    wazoConn = RED.nodes.getNode(n.server);
    this.app_name = n.app_name;
    this.app_uuid = n.app_uuid;

    var node = this;
  }

  RED.nodes.registerType("wazo application", application);

}
