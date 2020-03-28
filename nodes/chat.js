module.exports = function (RED) {
  const { WazoApiClient } = require('@wazo/sdk');

  function chat(n) {
    RED.nodes.createNode(this, n);
    this.conn = RED.nodes.getNode(n.server);
    this.ws = this.conn;
    this.client = this.conn.client.chatd;

    this.user_uuid = n.user_uuid;
    this.bot_uuid = n.bot_uuid;
    this.room_name = n.room_name;
    this.room_uuid = null;
    this.alias = null;

    var node = this;

    node.on('input', async msg => {
      node.room_name = msg.topic ? msg.topic : node.room_name;
      node.alias = msg.alias ? msg.alias : null;

      node.status({fill:"blue", shape:"dot", text: 'Send Chat'});
      const message = await send_message(msg.payload);
      msg.payload = message;
      node.send([msg, null]);
      node.status({});
    });

    node.on('close', (done) => {
      console.log('reload node');
      node.removeEventListener('chatd_user_room_message_created', node.ws);
      node.room_uuid = null;
      node.alias = null;
      done();
    });

    node.ws.on('chatd_user_room_message_created', async msg => {
      await get_rooms(node.room_name);
      const user_uuid_acl = msg.required_acl.split('.')[3];
      if (msg.payload.user_uuid == node.user_uuid && user_uuid_acl == node.user_uuid && msg.payload.room.uuid == node.room_uuid && !msg.payload.read) {
        node.status({fill:"blue", shape:"ring", text: 'Chat received'});
        node.send([null, msg]);
        node.status({});
      }
    });

    const list_rooms = async () => await node.client.getUserRooms();

    const get_rooms = async () => {
      const rooms = await list_rooms();
      rooms.map(room => {
        if (room.name == node.room_name) {
          node.room_uuid = room.uuid;
        }
      });
      return node.room_uuid;
    };

    const create_room = async (user_uuid, bot_uuid) => {
      if (!node.room_uuid) {
        const room_uuid = await get_rooms();
        if (room_uuid) {
          return room_uuid;
        }
      }

      try {
        const room = await node.client.createRoom(node.room_name, [{uuid: user_uuid}]);
        node.room_uuid = room.uuid;
        return room.uuid;
      }
      catch(err) {
        node.error(err);
        throw err;
      }
    };

    const send_message = async (message) => {
      if (!node.room_uuid) {
        node.room_uuid = await create_room(node.user_uuid, node.bot_uuid);
      }
      if (node.room_uuid) {
        const data = {
          content: message,
          userUuid: node.user_uuid,
          alias: node.alias || "Node RED notification",
          type: "ChatMessage"
        };
        const result = await node.client.sendRoomMessage(node.room_uuid, data);
        return result;
      }
    };

  }

  RED.nodes.registerType("wazo chat", chat);

};