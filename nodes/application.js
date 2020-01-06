module.exports = function(RED) {

  function wazoApplication(config) {
    RED.nodes.createNode(this, config);
    this.server = config.server;
    this.apikey = config.apikey;
    this.apisecret = config.apisecret;
    this.name = config.name;
    this.app_uuid = config.app_uuid;
  }

  RED.nodes.registerType("wazoApplication", wazoApplication, {
    credentials: {
      server: {type: "text"},
      apikey: {type: "text"},
      apisecret: {type: "text"},
      app_uuid: {type: "text"}
    }
  });

}
