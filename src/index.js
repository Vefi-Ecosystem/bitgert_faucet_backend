const express = require('express');
const requestIp = require('@supercharge/request-ip');
const { initConnection, cacheIpOrAddress, isCached } = require('./caching');

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

    if (ipIsCached || addressIsCached) return res.status(400).json({});
  } catch (err) {}
});

router.get('/cacheStatus', async (req, res) => {
  const cached = await isCached(req.ip);
  return res.status(200).json({ cached });
});

app.use(express.json());
app.use(
  express.urlencoded({
    extended: false
  })
);
app.use(require('morgan')('combined'));
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
