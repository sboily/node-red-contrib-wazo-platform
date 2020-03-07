module.exports = function (RED) {
  const { WazoApiClient } = require('@wazo/sdk');

  function presence(n) {
    RED.nodes.createNode(this, n);
    this.user_uuid = n.user_uuid;
    this.conn = RED.nodes.getNode(n.server);
    this.ws = this.conn;
    this.client = this.conn.client.chatd;

    var node = this;

    node.ws.on('chatd_presence_updated', msg => {
      if (msg.payload.uuid == node.user_uuid) {
        setNodeStatus(msg.payload.state, msg.payload.status);
        node.send(msg);
      }
    });

    node.on('input', async msg => {
      state = msg.payload.state;
      status = msg.payload.status;
      user_uuid = msg.payload.user_uuid || node.user_uuid;

      if (msg.topic !== 'chatd_presence_updated' && state) {
        if (status) {
          changeStatus(user_uuid, state, status);
        } else {
          changeState(user_uuid, state);
        }
        msg.payload['user_uuid'] = user_uuid;
        node.send(msg);
      }
    });

    const setNodeStatus = (state, status) => {
      node.status({fill:"blue", shape:"dot", text: `state: ${state} - status: ${status}`})
    };

    const initState = async () => {
      const token = await node.conn.authenticate();
      const presence = await node.client.getContactStatusInfo(node.user_uuid);
      setNodeStatus(presence.state, presence.status);
    }

    const changeState = async (user_uuid, state) => {
      try {
        const token = await node.conn.authenticate();
        node.client.updateState(user_uuid, state);
        node.log(`Update state presence for ${user_uuid} to ${state}`);
        setNodeStatus(state, undefined);
      }
      catch(err) {
        node.error(err);
      }
    }

    const changeStatus = async (user_uuid, state, status) => {
      try {
        const token = await node.conn.authenticate();
        node.client.updateStatus(user_uuid, state, status);
        node.log(`Update state/status presence for ${user_uuid} to ${state}/${status}`);
        setNodeStatus(state, status);
      }
      catch(err) {
        node.error(err);
      }
    }

    initState();
  }

  RED.nodes.registerType("wazo presence", presence);

}
