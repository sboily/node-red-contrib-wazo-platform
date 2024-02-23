module.exports = function (RED) {
  function ChatNode(n) {
    RED.nodes.createNode(this, n);
    this.conn = RED.nodes.getNode(n.server);
    this.client = this.conn.apiClient.chatd;

    this.userUuid = n.user_uuid;
    this.tenantUuid = n.tenant_uuid;
    this.botUuid = n.bot_uuid;
    this.roomName = n.room_name;
    this.roomUuid = null;
    this.alias = null;

    this.on('input', async (msg) => {
      this.roomName = msg.topic || this.roomName;
      this.alias = msg.alias || this.alias;

      this.status({ fill: "blue", shape: "dot", text: 'Send Chat' });
      this.conn.apiClient.setTenant(this.tenantUuid);
      const message = await this.sendMessage(msg.payload);
      msg.payload = message;
      this.send([msg, null]);
      this.status({});
    });

    this.on('close', (done) => {
      console.log('reload node');
      this.removeEventListener('chatd_user_room_message_created', this.conn);
      this.roomUuid = null;
      this.alias = null;
      done();
    });

    this.conn.on('chatd_user_room_message_created', async (msg) => {
      await this.getRooms();
      const userUuidAcl = msg.required_acl.split('.')[3];
      if (msg.payload.user_uuid == this.userUuid && userUuidAcl == this.userUuid && msg.payload.room.uuid == this.roomUuid && !msg.payload.read) {
        this.status({ fill: "blue", shape: "ring", text: 'Chat received' });
        this.send([null, msg]);
        this.status({});
      }
    });

    this.listRooms = async () => await this.client.getUserRooms();

    this.getRooms = async () => {
      const rooms = await this.listRooms();
      rooms.forEach(room => {
        if (room.name == this.roomName) {
          this.roomUuid = room.uuid;
        }
      });
      return this.roomUuid;
    };

    this.createRoom = async (userUuid, botUuid) => {
      if (!this.roomUuid) {
        const roomUuid = await this.getRooms();
        if (roomUuid) {
          return roomUuid;
        }
      }

      try {
        const room = await this.client.createRoom(this.roomName, [{ uuid: userUuid }]);
        this.roomUuid = room.uuid;
        return room.uuid;
      } catch (err) {
        this.error(`Chat error: ${err.message}`);
      }
    };

    this.sendMessage = async (message) => {
      if (!this.roomUuid) {
        this.roomUuid = await this.createRoom(this.userUuid, this.botUuid);
      }
      if (this.roomUuid) {
        const data = {
          content: message,
          userUuid: this.userUuid,
          alias: this.alias || "Node RED notification",
          type: "ChatMessage"
        };
        const result = await this.client.sendRoomMessage(this.roomUuid, data);
        return result;
      }
    };
  }

  RED.nodes.registerType("wazo chat", ChatNode);
};
