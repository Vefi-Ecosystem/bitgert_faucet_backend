const request = require('./rpc');
const { Interface } = require('@ethersproject/abi');
const { AddressZero } = require('@ethersproject/constants');
const { Transaction } = require('@ethereumjs/tx');
const { default: Common } = require('@ethereumjs/common');
const { parseEther, parseUnits } = require('@ethersproject/units');
const faucetAbi = require('../assets/faucetABI.json');
const erc20Abi = require('../assets/erc20ABI.json');
const { faucetAddress, faucetOperator, faucetCreator } = require('../constants');
const { privateKey } = require('../env');

const faucetAbiInterface = new Interface(faucetAbi);
const erc20AbiInterface = new Interface(erc20Abi);

function estimateGas(tx) {
  return new Promise((resolve, reject) => {
    request('eth_estimateGas', [tx, 'latest'])
      .then((val) => resolve(val))
      .catch(reject);
  });
}

function getNonce(address) {
  return new Promise((resolve, reject) => {
    request('eth_getTransactionCount', [address, 'latest'])
      .then((val) => resolve(val))
      .catch(reject);
  });
}

function broadcastTransaction(hex) {
  return new Promise((resolve, reject) => {
    request('eth_sendRawTransaction', [hex])
      .then((val) => resolve(val))
      .catch(reject);
  });
}

/**
 *
 * @param {string} token
 * @param {string} to
 * @param {number} amount
 */
module.exports.dispense = async function (token, to, amount) {
  try {
    let val;

    if (token === AddressZero) {
      val = parseEther(amount.toString()).toHexString();
    } else {
      const data = erc20AbiInterface.getSighash('decimals()');
      let decimals = await request('eth_call', [{ to: token, data }, 'latest']);
      decimals = erc20AbiInterface.decodeFunctionResult('decimals()', decimals);
      [decimals] = decimals;
      val = parseUnits(amount.toString(), decimals).toHexString();
    }
    const data = faucetAbiInterface.encodeFunctionData('dispense(address,address,uint256)', [token, to, val]);
    const nonce = await getNonce(faucetOperator);
    const gasLimit = await estimateGas({
      from: faucetOperator,
      to: faucetAddress,
      value: '0x0',
      data,
      nonce
    });
    const tx = Transaction.fromTxData(
      {
        to: faucetAddress,
        value: '0x0',
        gasLimit,
        gasPrice: parseUnits('30', 'gwei').toHexString(),
        data,
        nonce
      },
      { common: Common.custom({ chainId: 64668 }) }
    );
    const signedTx = tx.sign(Buffer.from(privateKey, 'hex'));
    const hex = '0x'.concat(signedTx.serialize().toString('hex'));
    const hash = await broadcastTransaction(hex);
    return Promise.resolve(hash);
  } catch (error) {
    return Promise.reject(error);
  }
};

/**
 *
 * @param {string} address
 * @param {string} pKey
 */
module.exports.addDispenser = async function (address, pKey) {
  try {
    const data = faucetAbiInterface.encodeFunctionData('addDispenser(address)', [address]);
    const nonce = await getNonce(faucetCreator);
    const gasLimit = await estimateGas({
      from: faucetCreator,
      to: faucetAddress,
      value: '0x0',
      data,
      nonce
    });
    const tx = Transaction.fromTxData(
      {
        nonce,
        data,
        to: faucetAddress,
        value: '0x0',
        gasLimit,
        gasPrice: parseUnits('50', 'gwei').toHexString()
      },
      { common: Common.custom({ chainId: 64668 }) }
    );
    const signedTx = tx.sign(Buffer.from(pKey, 'hex'));
    const hex = '0x'.concat(signedTx.serialize().toString('hex'));
    const hash = await broadcastTransaction(hex);
    return Promise.resolve(hash);
  } catch (error) {
    return Promise.reject(error);
  }
};

/**
 *
 * @param {string} address
 * @param {string} pKey
 */
module.exports.removeDispenser = async function (address, pKey) {
  try {
    const data = faucetAbiInterface.encodeFunctionData('removeDispenser(address)', [address]);
    const nonce = await getNonce(faucetCreator);
    const gasLimit = await estimateGas({
      from: faucetCreator,
      to: faucetAddress,
      value: '0x0',
      data,
      nonce
    });
    const tx = Transaction.fromTxData(
      {
        nonce,
        data,
        to: faucetAddress,
        value: '0x0',
        gasLimit,
        gasPrice: parseUnits('10', 'gwei').toHexString()
      },
      { common: Common.custom({ chainId: 64668 }) }
    );
    const signedTx = tx.sign(Buffer.from(pKey, 'hex'));
    const hex = '0x'.concat(signedTx.serialize().toString('hex'));
    const hash = await broadcastTransaction(hex);
    return Promise.resolve(hash);
  } catch (error) {
    return Promise.reject(error);
  }
};
