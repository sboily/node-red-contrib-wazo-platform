const { WazoApiClient } = require('@wazo/sdk');
const fetch = require('node-fetch');
const https = require('https');

const agent = new https.Agent({
  rejectUnauthorized: false,
});

const internalHTTP = async (req, res, apiUrl) => {
  const client = new WazoApiClient({
    server: `${req.body.host}:${req.body.port}`,
    agent: agent,
    clientId: 'wazo-nodered',
  });

  try {
    const auth = await client.auth.refreshToken(req.body.refreshToken);
    client.setToken(auth.token);
    const url = `https://${req.body.host}:${req.body.port}/${apiUrl}`;
    const result = await fetchAPI(url, auth.token, req.body.tenant_uuid);
    res.json(result);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

const fetchAPI = async (url, token, tenant_uuid) => {
  const options = {
    method: 'GET',
    agent: agent,
    headers: {
      'content-type': 'application/json',
      'X-Auth-Token': token,
      ...(tenant_uuid && { 'Wazo-Tenant': tenant_uuid }),
    },
  };

  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

const makeCall = async (url, token, context, extension, user_uuid, tenant_uuid, all_lines) => {
  const body = {
    destination: { context, extension, priority: 1 },
    source: { user: user_uuid, all_lines },
  };

  const options = {
    method: 'POST',
    agent: agent,
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      'X-Auth-Token': token,
      ...(tenant_uuid && { 'Wazo-Tenant': tenant_uuid }),
    },
  };

  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

const hangupCall = async (url, token, tenant_uuid) => {
  const options = {
    method: 'DELETE',
    agent: agent,
    headers: {
      'content-type': 'application/json',
      'X-Auth-Token': token,
      ...(tenant_uuid && { 'Wazo-Tenant': tenant_uuid }),
    },
  };

  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
};

const continueInDialplan = async (url, token, body) => {
  const options = {
    method: 'PUT',
    agent: agent,
    headers: {
      'content-type': 'application/json',
      'X-Auth-Token': token,
    },
    body: JSON.stringify(body),
  };

  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
};

const initiateCallUser = async (url, token, user_uuid, tenant_uuid) => {
  const body = { user_uuid };
  return makeCall(url, token, null, null, user_uuid, tenant_uuid, null, body);
};

const createNodeAddCall = async (url, token, call_id) => {
  const body = { calls: [{ id: call_id }] };
  return makeCall(url, token, null, null, null, null, null, body);
};

const getVoicemail = async (url, token, tenant_uuid) => {
  return fetchAPI(url, token, tenant_uuid);
};

const getToken = async (url, token) => {
  return fetchAPI(`${url}/${token}`, token);
};

const sendFax = async (url, token, context, extension, fax_content, caller_id, tenant_uuid) => {
  const params = new URLSearchParams({ context, extension, caller_id }).toString();
  const faxUrl = `${url}/api/calld/1.0/faxes?${params}`;

  const options = {
    method: 'POST',
    agent: agent,
    body: fax_content,
    headers: {
      'content-type': 'application/pdf',
      'X-Auth-Token': token,
      ...(tenant_uuid && { 'Wazo-Tenant': tenant_uuid }),
    },
  };

  const response = await fetch(faxUrl, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

const sendPush = async (url, token, msg, tenant_uuid) => {
  const body = {
    notification_type: msg.notification_type,
    user_uuid: msg.user_uuid,
    title: msg.title,
    body: msg.body,
    extra: msg.extra,
  };

  const options = {
    method: 'POST',
    agent: agent,
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      'X-Auth-Token': token,
      ...(tenant_uuid && { 'Wazo-Tenant': tenant_uuid }),
    },
  };

  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
};

const apiRequest = async (url, method, token, body, header, tenant_uuid) => {
  const options = {
    method: method,
    agent: agent,
    headers: {
      'content-type': header,
      'accept': 'application/json',
      'X-Auth-Token': token,
      ...(tenant_uuid && { 'Wazo-Tenant': tenant_uuid }),
    },
    ...(body && { body: JSON.stringify(body) }),
  };

  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  if (method === 'PUT' || method === 'DELETE') {
    return;
  }
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  return isJson ? response.json() : response.text();
};

module.exports = {
  apiRequest,
  continueInDialplan,
  createNodeAddCall,
  getToken,
  getVoicemail,
  hangupCall,
  initiateCallUser,
  internalHTTP,
  makeCall,
  sendFax,
  sendPush,
};
