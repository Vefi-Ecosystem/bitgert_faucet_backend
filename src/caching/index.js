const { createClient } = require('redis');
const redisClient = createClient();

const cachingKey = '@bitgert_faucet::';

module.exports.initConnection = async function () {
  try {
    await redisClient.connect();
  } catch (err) {
    console.log(err);
  }
};

/**
 *
 * @param {string} ipOrAddress
 * @returns {Promise<number | null>}
 */
module.exports.cacheIpOrAddress = function (ipOrAddress, ttl = 60 * 60 * 24) {
  return new Promise((resolve, reject) => {
    const key = cachingKey.concat(ipOrAddress);
    redisClient
      .set(key, Date.now())
      .then((val) => {
        redisClient
          .expire(key, ttl)
          .then(() => resolve(val))
          .catch(reject);
      })
      .catch(reject);
  });
};

/**
 *
 * @param {string} ipOrAddress
 * @returns {Promise<boolean>}
 */
module.exports.isCached = function (ipOrAddress) {
  return new Promise((resolve, reject) => {
    const key = cachingKey.concat(ipOrAddress);
    redisClient
      .exists(key)
      .then((val) => {
        if (val === 1) resolve(true);
        else resolve(false);
      })
      .catch(reject);
  });
};
