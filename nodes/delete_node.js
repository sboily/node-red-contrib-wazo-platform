module.exports = function (RED) {
  'use strict';

  const { WazoApiClient } = require('@wazo/sdk');
  
  function setProperty(node, msg, name, type, value) {
      if (type === 'msg') {
          msg[name] = value;
      } else if (type === 'flow') {
          node.context().flow.set(name, value);
      } else if (type === 'global') {
          node.context().global.set(name, value);
      }
  }

  function sendErrorMessage(node, text) {
      node.status({
          fill: 'red',
          shape: 'ring',
          text: (typeof text === "object") ? JSON.stringify(text) : text
      });
  }
  
  function setStatus(node, text, color, shape) {
    if (!text && !color && !shape) {
      node.status({});
    } else {
      node.status({
        fill: color || 'blue',
        shape: shape || 'ring',
        text: text
      });
    }
  }
  
  function checkType(node, parameter, type) {
    if (typeof parameter !== type) {
      const text = RED._('delete_node.errors.falsetype') + type;
      sendErrorMessage(node, text);
      throw(text);
    }
  }


  function delete_node(n) {
    RED.nodes.createNode(this, n);
    conn = RED.nodes.getNode(n.server);
    this.client = conn.client.application;
    
    let node = this;
    setStatus(node);

    node.callnode = n.callnode;
    node.callnodeType = n.callnodeType;

    node.on('input', async (msg, send, done) => {
      setStatus(node, "running");

      let callnode = RED.util.evaluateNodeProperty(node.callnode, node.callnodeType, node, msg);
      const node_uuid = callnode.node_uuid || callnode.uuid;
      const application_uuid = callnode.application_uuid;

      try { 
        checkType(node, node_uuid, "string");
        checkType(node, application_uuid, "string");
      } catch (err) {
        done(err);
        return;
      }

      if (node_uuid && application_uuid) {
        node.log("Delete node");
        try {
          const result = await node.client.removeNode(application_uuid, node_uuid);         
          node.log(result);
          setStatus(node, `Last deleted: ${node_uuid}`, "green", "dot");
          setProperty(node, msg, node.callnode, node.callnodeType, result);
        }
        catch(err) {        
          done(err);
        } 
        send(msg);
        if (done) {            
          done();          
        }
      }
    });

  }

  RED.nodes.registerType("wazo delete_node", delete_node);

};