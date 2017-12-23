const express = require('express');
const app = express();
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const artistsRouter = express.Router();
module.exports = artistsRouter;

artistsRouter.get('/', (req, res, next) => {
  db.all(
    `SELECT * FROM Artist WHERE Artist.is_currently_employed = 1`,
    (err, rows) => {
      if (err) {
        next(err);
      } else {
        res.sendStatus(200).send({artists: rows});
      }
    }
  );
});
