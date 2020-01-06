module.exports = function (RED) {
  const { WazoWebSocketClient } = require('@wazo/sdk');
  var ws = require("ws");

  function websocket(n) {
    RED.nodes.createNode(this, n);
    this.wazo_auth_conn = RED.nodes.getNode(n.server);
    this.host = this.wazo_auth_conn.host;
    this.port = this.wazo_auth_conn.port;
    this.ws = ws;

    var node = this;

    this.wazo_auth_conn.connect().then(data => {
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

      node.wazo_auth_conn.client.setOnRefreshToken((token) => {
        wazo_ws.updateToken(token);
        console.log('Refresh Token refreshed');
      });

      wazo_ws.on('auth_session_expire_soon', (data) => {
        if (data.data.uuid !== session.sessionUuid) {
          return;
        }
        console.log('Force refresh Token');
        node.wazo_auth_conn.client.forceRefreshToken();
      });

      WazoWebSocketClient.eventLists.forEach(event => wazo_ws.on(event, (data) => {
        node.send(data);
      }));

      wazo_ws.on('onopen', () => {
        node.status({
          fill:"green",
          shape:"dot",
          text: "Connected"
        });
      });

      wazo_ws.on('onclose', () => {
        node.status({
          fill:"red",
          shape:"dot",
          text: "Disconnected"
        });
      });

      wazo_ws.on('onerror', () => {
        node.status({
          fill:"red",
          shape:"dot",
          text: "Disconnected (error)"
        });
      });

      wazo_ws.connect();
    }
  }

  RED.nodes.registerType("wazo websocket", websocket);
}
