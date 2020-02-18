module.exports = function (RED) {
  const { WazoWebSocketClient } = require('@wazo/sdk');
  var ws = require("ws");

  WazoWebSocketClient.eventLists.push('stt');

  function websocket(n) {
    RED.nodes.createNode(this, n);
    wazoAuthConn = RED.nodes.getNode(n.server);
    application = RED.nodes.getNode(n.application);
    this.no_filter = n.no_filter;
    this.debug = n.debug;
    this.insecure = true;

    this.host = wazoAuthConn.host;
    this.port = wazoAuthConn.port;
    this.client = wazoAuthConn.client;
    this.application_uuid = null;
    this.ws = ws;

    if (application) {
      this.application_uuid = application.app_uuid;
    }

    var node = this;

    wazoAuthConn.authenticate().then(session => {
      if (session) {
        ws_connect(session);
      } else {
        node.error('There is no authenticate session');
      }
    });

    function ws_connect(session) {
      if (node.insecure) {
        process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
      }
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
        node.log('Refresh Token refreshed');
      });

      WazoWebSocketClient.eventLists.forEach(event => wazo_ws.on(event, (msg) => {
        if (msg.data) { msg.payload = msg.data; }
        if (msg.name) { msg.topic = msg.name; }

        if (msg.name == 'auth_session_expire_soon') {
          if (msg.data.uuid == session.sessionUuid) {
            node.log('Session will expire, force Refresh Token');
            node.client.forceRefreshToken();
          }
        }

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
        node.log('Wazo Websocket connection');
        node.status({
          fill:"green",
          shape:"ring",
          text: "connecting"
        });
      });

      wazo_ws.on('initialized', () => {
        node.log('Wazo Websocket is initialized and ready to received messages');
        node.status({
          fill:"green",
          shape:"dot",
          text: "connected"
        });
      });

      wazo_ws.on('onclose', (err) => {
        node.error({message: "Websocket is closed", error: err});
        node.status({
          fill:"red",
          shape:"ring",
          text: "disconnected"
        });
      });

      wazo_ws.on('onerror', (err) => {
        node.error({message: "Websocket has closed with error", error: err});
        node.status({
          fill:"red",
          shape:"dot",
          text: "disconnected (error)"
        });
      });

      try {
        wazo_ws.connect();
      }
      catch(err) {
        node.error(err);
      }
    }
  }

  RED.nodes.registerType("wazo websocket", websocket);
}
