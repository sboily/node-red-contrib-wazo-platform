const { WazoApiClient } = require('@wazo/sdk');
const fetch = require('node-fetch');
const https = require("https");

const agent = new https.Agent({
  rejectUnauthorized: false
});

const internalHTTP = async (req, res, apiUrl, resource) => {
  const client = new WazoApiClient({
    server: `${req.body.host}:${req.body.port}`,
    agent: agent,
    clientId: 'wazo-nodered'
  });

  try {
    const { ...auth } = await client.auth.refreshToken(req.body.refreshToken);
    client.setToken(auth.token);
    try {
      const url = `https://${req.body.host}:${req.body.port}/${apiUrl}`;
      const result = await fetchAPI(url, auth.token, req.body.tenant_uuid);
      res.json(result);
    }
    catch(err) {
      res.send(err);
      throw err;
    }
  }
  catch(err) {
    res.send(err);
    throw err;
  }
}

const fetchAPI = (url, token, tenant_uuid) => {
  const options = {
      method: 'GET',
      agent: agent,
      headers: {
        'content-type': 'application/json',
        'X-Auth-Token': token
      }
  }

  if (tenant_uuid) {
    options.headers['Wazo-Tenant'] = tenant_uuid;
  }

  return fetch(url, options).then(response => response.json()).then(data => data);
}

const makeCall = async (url, token, context, extension, user_uuid, tenant_uuid, all_lines) => {
  const body = {
    destination: {
      context: context,
      extension: extension,
      priority: 1
    },
    source: {
      user: user_uuid,
      all_lines: all_lines,
    }
  }

  const options = {
      method: 'POST',
      agent: agent,
      body: JSON.stringify(body),
      headers: {
        'content-type': 'application/json',
        'X-Auth-Token': token
      }
  }

  if (tenant_uuid) {
    options.headers['Wazo-Tenant'] = tenant_uuid;
  }

  return fetch(url, options).then(response => response.json()).then(data => data);
}

const hangupCall = async (url, token, tenant_uuid) => {
  const options = {
      method: 'DELETE',
      agent: agent,
      headers: {
        'content-type': 'application/json',
        'X-Auth-Token': token
      }
  }

  if (tenant_uuid) {
    options.headers['Wazo-Tenant'] = tenant_uuid;
  }

  return fetch(url, options);
}

const initiateCallUser = async (url, token, user_uuid, tenant_uuid) => {
  const body = {
    user_uuid: user_uuid
  }

  const options = {
      method: 'POST',
      agent: agent,
      body: JSON.stringify(body),
      headers: {
        'content-type': 'application/json',
        'X-Auth-Token': token
      }
  }

  if (tenant_uuid) {
    options.headers['Wazo-Tenant'] = tenant_uuid;
  }

  return fetch(url, options).then(response => response.json()).then(data => data);
}

const createNodeAddCall = async (url, token, call_id) => {
  const body = {
    calls: [{
      id: call_id
    }]
  }

  const options = {
      method: 'POST',
      agent: agent,
      body: JSON.stringify(body),
      headers: {
        'content-type': 'application/json',
        'X-Auth-Token': token
      }
  }

  return fetch(url, options).then(response => response.json()).then(data => data);
}

const getVoicemail = async (url, token, voicemail_id, tenant_uuid) => {
  const options = {
      method: 'GET',
      agent: agent,
      headers: {
        'content-type': 'application/json',
        'X-Auth-Token': token
      }
  }

  if (tenant_uuid) {
    options.headers['Wazo-Tenant'] = tenant_uuid;
  }

  return fetch(url, options).then(response => response.json()).then(data => data);
}

const sendFax = async (context, extension, fax_content, caller_id) => {
  const params = {
    context: context,
    extension: extension,
    caller_id: caller_id
  }

  const esc = encodeURIComponent;
  const query = Object.keys(params).map(k => `${esc(k)}=${esc(params[k])}`).join('&')
  const url = `https://${this.conn.host}:${this.conn.port}/api/calld/1.0/faxes?${query}`;
  const token = await this.conn.authenticate();

  const options = {
      method: 'POST',
      agent: agent,
      body: fax_content,
      headers: {
        'content-type': 'application/pdf',
        'X-Auth-Token': token
      }
  }

  return fetch(url, options).then(response => response.json()).then(data => data);
}

const apiRequest = (url, method, token, query, body, header, tenant_uuid) => {
  const options = {
      method: method,
      agent: agent,
      headers: {
        'content-type': header,
        'accept': 'application/json',
        'X-Auth-Token': token
      }
  }

  if (tenant_uuid) {
    options.headers['Wazo-Tenant'] = tenant_uuid;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  return fetch(url, options).then(response => {
    if (response.status >= 400) {
      return response.statusText;
    }
    else if (response.status >= 200 && response.status < 300) {
      if (options.method == 'PUT' || options.method == 'DELETE') {
        return null;
      }
      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.indexOf('application/json') !== -1;
      return isJson ? response.json() : response.text();
    }
  }).then(data => data);

}

module.exports = {
  internalHTTP,
  makeCall,
  initiateCallUser,
  createNodeAddCall,
  getVoicemail,
  sendFax,
  apiRequest,
  hangupCall
}
