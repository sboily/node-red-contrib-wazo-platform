module.exports = function (RED) {
  const { WazoWebSocketClient } = require('@wazo/sdk');
  var ws = require("ws");

  function websocket(n) {
    RED.nodes.createNode(this, n);
    wazoAuthConn = RED.nodes.getNode(n.server);
    application = RED.nodes.getNode(n.application);
    this.no_filter = n.no_filter;
    this.debug = n.debug;

    this.host = wazoAuthConn.host;
    this.port = wazoAuthConn.port;
    this.client = wazoAuthConn.client;
    this.application_uuid = null;
    this.ws = ws;

    if (application) {
      this.application_uuid = application.app_uuid;
    }

    var node = this;

    wazoAuthConn.authenticate().then(data => {
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
          debug: node.debug
      });

      node.client.setOnRefreshToken((token) => {
        wazo_ws.updateToken(token);
        console.log('Refresh Token refreshed');
      });

      wazo_ws.on('auth_session_expire_soon', (data) => {
        if (data.data.uuid !== session.sessionUuid) {
          return;
        }
        console.log('Force refresh Token');
        node.client.forceRefreshToken();
      });

      WazoWebSocketClient.eventLists.forEach(event => wazo_ws.on(event, (msg) => {
        if (!node.application_uuid) {
          node.send(msg);
          return;
        }

        if (msg.data && (msg.data.application_uuid == node.application_uuid)) {
          node.send(msg);
          return;
        } else if (node.no_filter && (msg.data && !msg.data.application_uuid)) {
          node.send(msg);
          return;
        }
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
