module.exports = function (RED) {
    
  function stop_playback(n) {
    RED.nodes.createNode(this, n);
    wazoConn = RED.nodes.getNode(n.server);
    this.client = wazoConn.client.application;

    var node = this;

    node.on('input', async msg => {
      application_uuid = msg.payload.application_uuid;
      playback_uuid = msg.payload.playback_uuid;
      if (application_uuid && playback_uuid) {
        node.log('Stop playback');
        try {
          const result = await node.client.stopPlaybackCall(application_uuid, playback_uuid);
          msg.payload.application_uuid = application_uuid;
          msg.payload.playback_uuid = playback_uuid;
          msg.payload.data = result;
          node.send(msg);
        }
        catch(err) {
          node.error(err)
          throw err;
        }
      }
    });  
  }

  RED.nodes.registerType("wazo stop_playback", stop_playback);

}
