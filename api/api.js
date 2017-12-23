// cd projects/xpressPublishing
const express = require('express');
const app = express();
const apiRouter = express.Router();
const artistsRouter = require('./artists');

apiRouter.use('/artists', artistsRouter);

module.exports = apiRouter;
