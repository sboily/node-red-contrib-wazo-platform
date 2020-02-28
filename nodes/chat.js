module.exports = function (RED) {
  const { WazoApiClient } = require('@wazo/sdk');

  function chat(n) {
    RED.nodes.createNode(this, n);
    this.user_uuid = n.user_uuid;
    this.bot_uuid = n.bot_uuid;
    const conn = RED.nodes.getNode(n.server);
    this.client = conn.client.chatd;

    var node = this;

    node.on('input', async msg => {
      if (!conn.client.client.token) {
        try {
          await conn.authenticate();
        }
        catch(err) {
          node.error(err);
        }
      }
      const token = conn.client.client.token;
      node.send(msg);
    });

    async function create_room(user_uuid, bot_uuid) {
      try {
        const {...room } = await node.client.createRoom(node.room_name, [user_uuid, bot_uuid]);
        node.log(room);
      }
      catch(err) {
        node.error(err);
      }
    }

  }

  RED.nodes.registerType("wazo chat", chat);

}
