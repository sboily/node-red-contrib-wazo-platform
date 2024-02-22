module.exports = function (RED) {
  function WazoPlaybackNode(config) {
    RED.nodes.createNode(this, config);
    const connection = RED.nodes.getNode(config.server);
    this.uri = config.uri;
    this.language = config.language;
    this.client = connection.apiClient.application;

    const node = this;

    node.on('input', async msg => {
      const callId = msg.payload.call ? msg.payload.call.id : msg.payload.call_id;
      const applicationUuid = msg.payload.application_uuid;
      const playbackUri = node.uri || msg.payload.uri;

      if (callId && applicationUuid && playbackUri) {
        node.log('Call playback');
        try {
          const result = await node.client.startPlaybackCall(applicationUuid, callId, node.language, playbackUri);
          msg.payload = {
            ...msg.payload,
            call_id: callId,
            application_uuid: applicationUuid,
            data: result,
          };
          node.send(msg);
        } catch (err) {
          node.error(`Playback error: ${err.message}`);
        }
      }
    });
  }

  RED.nodes.registerType("wazo playback", WazoPlaybackNode);
};
