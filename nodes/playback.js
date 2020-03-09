module.exports = function (RED) {
    
  function playback(n) {
    RED.nodes.createNode(this, n);
    conn = RED.nodes.getNode(n.server);
    this.uri = n.uri;
    this.language = n.language;
    this.client = conn.client.application;

    var node = this;

    node.on('input', async msg => {
      call_id = msg.payload.call ? msg.payload.call.id : msg.payload.call_id;
      application_uuid = msg.payload.application_uuid;
      playback_uri = node.uri || msg.payload.uri;

      if (call_id && application_uuid && playback_uri) {
        node.log('Call playback');
        try {
          const result = await node.client.startPlaybackCall(application_uuid, call_id, node.language, playback_uri);
          msg.payload.call_id = call_id;
          msg.payload.application_uuid = application_uuid;
          msg.payload.data = result;
          node.send(msg);
        }
        catch(err) {
          node.error(err);
          throw err;
        }
      }
    });  
  }

  RED.nodes.registerType("wazo playback", playback);

};