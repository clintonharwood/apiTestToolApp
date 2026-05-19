const axios = require('axios');
const qs = require('qs');

const TIMEOUT = 15000;

exports.getTokenAuthCode = async (code, endpoint, clientConfig) => {
  const data = qs.stringify({
    grant_type: "authorization_code",
    code: code,
    client_id: clientConfig.client_id,
    client_secret: clientConfig.client_secret,
    redirect_uri: clientConfig.redirect_uris[0]
  });

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded"
  };

  const response = await axios.post(endpoint, data, { headers, timeout: TIMEOUT });
  return response.data;
};

exports.getTokenClientCreds = async (endpoint, clientConfig) => {
  const data = qs.stringify({
    grant_type: "client_credentials",
    client_id: clientConfig.client_id,
    client_secret: clientConfig.client_secret,
  });

  const response = await axios.post(endpoint, data, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    timeout: TIMEOUT
  });
  return response.data;
};

exports.publishPlatformEvent = async (accessToken) => {
  const url = "https://clintoxsupport.my.salesforce.com/services/data/v63.0/sobjects/Clintox_Test_Event__e/";
  const data = { Order_id__c: "123456" };
  const response = await axios.post(url, data, {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken,
    },
    timeout: TIMEOUT
  });
  return response.data;
};

exports.createAccount = async (accessToken, accountData) => {
  const url = "https://clintoxsupport.my.salesforce.com/services/data/v60.0/sobjects/Account";
  const response = await axios.post(url, accountData, {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken,
    },
    timeout: TIMEOUT
  });
  return response.data;
};

exports.downloadReport = async (accessToken) => {
  const url = "https://clintoxsupport.my.salesforce.com/services/data/v60.0/analytics/reports/00O5K000000XecLUAS";
  const response = await axios.get(url, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      Authorization: "Bearer " + accessToken,
    },
    timeout: TIMEOUT
  });
  return response.data;
};

exports.headlessPasswordReset = async (username, captchaToken) => {
  const requestBody = {
    username: username,
    recaptcha: captchaToken
  }
  const response = await axios.post(
      `https://clintoxsupport.my.site.com/complaintsnew/services/auth/headless/forgot_password`,
      requestBody,
      {
          headers: {
              'Content-Type': 'application/json'
          },
          timeout: TIMEOUT
      }
  );
  return response.data;
};

exports.headlessPasswordSet = async (username, otp, password, recaptcha) => {
  const requestBody = {
    username: username,
    otp: otp,
    newpassword: password,
    recaptcha: recaptcha
  }
  const response = await axios.post(
      `https://clintoxsupport.my.site.com/complaintsnew/services/auth/headless/forgot_password`,
      requestBody,
      {
          headers: {
              'Content-Type': 'application/json'
          },
          timeout: TIMEOUT
      }
  );
  return response.data;
};

exports.webToCase = async () => {
  const requestBody = {
    orgid: '00D5j00000CvOSL',
		name: 'Donald',
		email: 'clinto_is@hotmail.com',
		phone: '0432202726',
		subject: 'Help Me with clintox website',
		description: 'Getting an ISE'
  }

  const response = await axios.post(
    `https://webto.salesforce.com/servlet/servlet.WebToCase?encoding=UTF-8&orgId=00D5j00000CvOSL&debug=1&debugEmail=clinto_is%40hotmail.com`,
    qs.stringify(requestBody),
    {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: TIMEOUT
    }
  );

  //requestModule.get('https://webto.salesforce.com/servlet/servlet.WebToCase?encoding=UTF-8&orgId=00D5j00000CvOSL&orgid=00D5j00000CvOSL&retURL=http%3A%2F%2F&name=Donald&email=clinto_is%40hotamil.com&phone=0323202928&subject=Test&description=Test&submit=Submit&debug=1&debugEmail=clinto_is%40hotmail.com');
  
  return response.data;
}
