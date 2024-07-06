const request = require("request");
const url = require("url");

const redirectUri = `com.nettica.agent://callback/agent`;

let accessToken = null;

let client_id = null;
let state = null;
let server = null;

function getAccessToken() {
  return accessToken;
}

async function getAuthenticationURL(s) {
  // make a http get request to {server}/api/v1.0/auth/oauth2_url
  // the response will be the url to redirect to for oauth2 authentication
  // the response will be in the form of a json object

  return new Promise((resolve, reject) => {
    server = s;

    const authUrl =
      server +
      "/api/v1.0/auth/oauth2_url?redirect_uri=com.nettica.agent://callback/agent";

    console.log("authUrl = ", authUrl);

    const options = {
      method: "GET",
      url: authUrl,
      headers: {
        "content-type": "application/json",
      },
    };

    request(options, (error, resp, body) => {
      if (error) {
        logout();
        return reject(error);
      }

      const responseBody = JSON.parse(body);
      console.log("responseBody = ", responseBody);

      client_id = responseBody.clientId;
      console.log("*** client_id = ", client_id);
      state = responseBody.state;

      resolve(responseBody);
    });
  });
}

function loadNetticaTokens(callbackURL) {
  return new Promise((resolve, reject) => {
    const urlParts = url.parse(callbackURL, true);
    const query = urlParts.query;

    const exchangeOptions = {
      grant_type: "authorization_code",
      clientId: client_id,
      code: query.code,
      state: state,
      redirect_uri: redirectUri,
    };

    console.log("exchangeOptions = ", exchangeOptions);

    const options = {
      method: "POST",
      url: `${server}/api/v1.0/auth/oauth2_exchange`,
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
      console.log("responseBody = ", responseBody);
      accessToken = responseBody;

      resolve();
    });
  });
}

async function logout() {
  accessToken = null;
}

export default {
  getAccessToken,
  getAuthenticationURL,
  loadNetticaTokens,
  logout,
};
