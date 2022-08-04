const { default: axios } = require('axios');
const { rpcUrl } = require('../constants');

module.exports = function (method, params = []) {
  return new Promise((resolve, reject) => {
    axios
      .post(rpcUrl, {
        method,
        params,
        jsonrpc: '2.0',
        id: Math.floor(Math.random() * 4)
      })
      .then((res) => {
        const { data } = res;

        if (!!data.result) resolve(data.result);
        else if (!!data.error) reject(data.error);
      })
      .catch(reject);
  });
};
