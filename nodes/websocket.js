module.exports = function (RED) {
  const { WazoWebSocketClient } = require('@wazo/sdk');
  var ws = require("ws");

  function websocket(n) {
    RED.nodes.createNode(this, n);
    this.wazoAuthConn = RED.nodes.getNode(n.server);
    this.host = this.wazoAuthConn.host;
    this.port = this.wazoAuthConn.port;
    this.ws = ws;

    var node = this;

    this.wazoAuthConn.authenticate().then(data => {
      ws_connect(data);
    });

    function ws_connect(session) {
      const wazo_ws = new WazoWebSocketClient({
        host: node.host,
        token: session.token,
        events: ['*'],
        version: 2
      }, {
          WebSocket: node.ws,
          debug: true
      });

      node.wazoAuthConn.client.setOnRefreshToken((token) => {
        wazo_ws.updateToken(token);
        console.log('Refresh Token refreshed');
      });

      wazo_ws.on('auth_session_expire_soon', (data) => {
        if (data.data.uuid !== session.sessionUuid) {
          return;
        }
        console.log('Force refresh Token');
        node.wazoAuthConn.client.forceRefreshToken();
      });

      WazoWebSocketClient.eventLists.forEach(event => wazo_ws.on(event, (data) => {
        node.send(data);
      }));

      wazo_ws.on('onopen', () => {
        node.status({
          fill:"green",
          shape:"ring",
          text: "connecting"
        });
      });

      wazo_ws.on('initialized', () => {
        node.status({
          fill:"green",
          shape:"dot",
          text: "connected"
        });
      });

      wazo_ws.on('onclose', () => {
        node.status({
          fill:"red",
          shape:"ring",
          text: "disconnected"
        });
      });

      wazo_ws.on('onerror', () => {
        node.status({
          fill:"red",
          shape:"dot",
          text: "disconnected (error)"
        });
      });

      wazo_ws.connect();
    }
  }

  RED.nodes.registerType("wazo websocket", websocket);
}
