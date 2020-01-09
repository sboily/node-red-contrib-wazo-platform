module.exports = function (RED) {
    
  function playback(n) {
    RED.nodes.createNode(this, n);
    wazoConn = RED.nodes.getNode(n.server);
    this.uri = n.uri;
    this.language = n.language;
    this.client = wazoConn.client.application;

    var node = this;

    node.on('input', msg => {
      if (msg.data.call.id) {
        call_id = msg.data.call.id;
        application_uuid = msg.data.application_uuid;
        node.log('Call playback');
        try {
          node.client.startPlaybackCall(application_uuid, call_id, node.language, node.uri);
          node.send(msg);
        }
        catch(err) {
          node.error(err)
        }
      }
    });  
  }

  RED.nodes.registerType("wazo playback", playback);

}
