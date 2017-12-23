const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const errorHandler = require('errorhandler');
const apiRouter = require('./api/api');

const PORT = process.env.PORT || 4001;

app.use('index.html', cors());
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(errorHandler());

app.use('/api', apiRouter);


app.use((err, req, res, next) => {
  if (!err.status) {
    err.status = 500;
  }
  res.status(err.status).send(err.message);
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

module.exports = app;
