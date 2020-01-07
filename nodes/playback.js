module.exports = function (RED) {
    
  function playback(n) {
    RED.nodes.createNode(this, n);
    wazoConn = RED.nodes.getNode(n.server);
    this.uri = n.uri;
    this.language = 'en_US';
    this.client = wazoConn.client.application;

    var node = this;

    node.on('input', msg => {
      if (msg.data.call.id) {
        call_id = msg.data.call.id;
        application_uuid = msg.data.application_uuid;
        console.log('Call playback');
        try { node.client.startPlaybackCall(application_uuid, call_id, node.language, node.uri) }
        catch(err) { console.log(err) }
      }
      node.send(msg);
    });  
  }

  RED.nodes.registerType("wazo playback", playback);

}
