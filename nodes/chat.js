module.exports = function (RED) {
  const { WazoApiClient } = require('@wazo/sdk');

  function chat(n) {
    RED.nodes.createNode(this, n);
    this.conn = RED.nodes.getNode(n.server);
    this.user_uuid = n.user_uuid;
    this.bot_uuid = n.bot_uuid;
    this.room_name = n.room_name;
    this.client = this.conn.client.chatd;
    this.room_uuid = null;

    var node = this;

    node.on('input', async msg => {
      const message = await send_message(msg.payload);
      node.room_name = msg.topic ? msg.topic : node.room_name;
      msg.payload = message;
      node.send(msg);
    });

    const authenticate = async () => {
      if (!node.conn.client.client.token) {
        try {
          await node.conn.authenticate();
        }
        catch(err) {
          node.error(err);
          throw err;
        }
      }
    }

    const create_room = async (room_name, user_uuid, bot_uuid) => {
      try {
        //const {...room } = await node.client.createRoom(room_name, [{uuid: user_uuid}, {uuid: bot_uuid}]);
        const {...room } = await node.client.createRoom(room_name, [{uuid: user_uuid}]);
        node.room_uuid = room.uuid;
        return room.uuid;
      }
      catch(err) {
        node.error(err);
        throw err;
      }
    }

    const send_message = async (message) => {
      authenticate();
      let room_uuid;
      if (!node.room_uuid) {
        const room_uuid = await create_room(node.room_name, node.user_uuid, node.bot_uuid);
      }
      if (room_uuid || node.room_uuid) {
        const data = {
          content: message,
          userUuid: node.user_uuid,
          alias: "Node RED notification",
          type: "ChatMessage"
        }
        const result = await node.client.sendRoomMessage(node.room_uuid, data);
        return result;
      }
    }

  }

  RED.nodes.registerType("wazo chat", chat);

}
