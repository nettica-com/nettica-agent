const request = require("request");
const url = require("url");
const envVariables = require("../../env");

const { apiIdentifier, auth0Domain, clientId } = envVariables;

const redirectUri = `file:///callback`;

let accessToken = null;
let profile = null;
let refreshToken = null;

function getAccessToken() {
  return accessToken;
}

function getProfile() {
  return profile;
}

function getAuthenticationURL() {
  return (
    "https://" +
    auth0Domain +
    "/authorize?" +
    "audience=" +
    apiIdentifier +
    "&" +
    "scope=openid profile email offline_access&" +
    "response_type=code&" +
    "client_id=" +
    clientId +
    "&" +
    "redirect_uri=" +
    redirectUri
  );
}

function refreshTokens() {
  return new Promise((resolve, reject) => {
    refreshToken = ""; // keytar.getPassword(keytarService, keytarAccount);

    if (!refreshToken) return reject(new Error("no refresh token available"));

    const refreshOptions = {
      method: "POST",
      url: `https://${auth0Domain}/oauth/token`,
      headers: { "content-type": "application/json" },
      body: {
        grant_type: "refresh_token",
        client_id: clientId,
        refresh_token: refreshToken,
      },
      json: true,
    };

    request(refreshOptions, function (error, response, body) {
      if (error) {
        logout();
        return reject(new Error(error));
      }

      accessToken = body.access_token;

      global.accessToken = accessToken;

      resolve();
    });
  });
}

function loadTokens(callbackURL) {
  return new Promise((resolve, reject) => {
    const urlParts = url.parse(callbackURL, true);
    const query = urlParts.query;

    const exchangeOptions = {
      grant_type: "authorization_code",
      client_id: clientId,
      code: query.code,
      redirect_uri: redirectUri,
    };

    const options = {
      method: "POST",
      url: `https://${auth0Domain}/oauth/token`,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(exchangeOptions),
    };

    request(options, (error, resp, body) => {
      if (error) {
        logout();
        return reject(error);
      }

      const responseBody = JSON.parse(body);
      accessToken = responseBody.access_token;
      global.accessToken = accessToken;
      refreshToken = responseBody.refresh_token;

      resolve();
    });
  });
}

async function logout() {
  accessToken = null;
  profile = null;
  refreshToken = null;
}

function getLogOutUrl() {
  return `https://${auth0Domain}/v2/logout`;
}

export default {
  getAccessToken,
  getAuthenticationURL,
  getProfile,
  loadTokens,
  logout,
  getLogOutUrl,
  refreshTokens,
};
