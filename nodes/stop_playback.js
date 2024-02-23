module.exports = function (RED) {
  function StopPlayback(n) {
    RED.nodes.createNode(this, n);
    const conn = RED.nodes.getNode(n.server);
    this.client = conn.apiClient.application;

    this.on('input', async (msg) => {
      const applicationUuid = msg.payload.application_uuid;
      const playbackUuid = msg.payload.playback_uuid;

      if (applicationUuid && playbackUuid) {
        this.log('Stop playback');
        try {
          const result = await this.client.stopPlaybackCall(applicationUuid, playbackUuid);
          msg.payload = { application_uuid: applicationUuid, playback_uuid: playbackUuid, data: result };
          this.send(msg);
        } catch (err) {
          this.error(`Stop playback error: ${err.message}`, msg);
        }
      } else {
        this.warn('Missing application_uuid or playback_uuid in payload');
      }
    });
  }

  RED.nodes.registerType("wazo stop_playback", StopPlayback);
};
