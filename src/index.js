const express = require('express');
const requestIp = require('@supercharge/request-ip');
const { initConnection, cacheIpOrAddress, isCached } = require('./caching');
const { dispense, addDispenser, removeDispenser } = require('./helpers/tx');

const app = express();
const router = express.Router();
const port = parseInt(process.env.PORT || '14000');

router.get('/', (req, res) =>
  res.status(200).json({
    message: 'healthy'
  })
);

router.post('/dispense', async (req, res) => {
  try {
    const { ip, body } = req;
    const ipIsCached = await isCached(ip);
    const addressIsCached = await isCached(body.to);

    if (ipIsCached || addressIsCached)
      return res.status(400).json({
        error: 'You have been greylisted. You must wait for 24 hours to make another request.'
      });

    const hash = await dispense(body.token, body.to, body.amount);
    await cacheIpOrAddress(ip);
    await cacheIpOrAddress(body.to);
    return res.status(200).json({
      result: `Deposit has been made for ${body.to}. Hash: ${hash}`
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/addDispenser', async (req, res) => {
  try {
    const { pk, address } = req.body;
    const result = await addDispenser(address, pk);
    return res.status(200).json({
      result
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/removeDispenser', async (req, res) => {
  try {
    const { pk, address } = req.body;
    const result = await removeDispenser(address, pk);
    return res.status(200).json({
      result
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.use(express.json());
app.use(
  express.urlencoded({
    extended: false
  })
);
app.use(require('morgan')('combined'));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
app.use((req, res, next) => {
  const ip = requestIp.getClientIp(req);
  req.ip = ip;
  next();
});
app.use('/', router);

app.listen(port, () => {
  console.log(`Server running on ${port}`);
  initConnection();
});
