const express = require('express');
const seriesRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const issuesRouter = require('./issues');

seriesRouter.param('seriesId', (req, res, next, seriesId) => {
  db.get(`
    SELECT * FROM Series WHERE Series.id = $id`,
    {$id: seriesId},
    (error, series) => {
      if (error) {
        next(error);
      } else if (series) {
        req.series = series;
        next();
      } else {
        res.sendStatus(404);
      }
    });
});

seriesRouter.use('/:seriesId/issues', issuesRouter);

seriesRouter.get('/', (req, res, next) => {
  db.all(
    `SELECT * FROM Series`,
    (err, rows) => {
      if (err) {
        next(err);
      } else {
        res.status(200).json({series: rows});
      }
    });
});

seriesRouter.get('/:seriesId', (req, res, send) => {
  res.status(200).json({series: req.series});
});

seriesRouter.post('/', (req, res, send) => {
  const name = req.body.series.name;
  const des = req.body.series.description;
  if (!name || !des) {
    return res.sendStatus(400);
  }
  db.run(`
    INSERT INTO Series (name, description)
    VALUES ($name, $des)`,
    {
      $name: name,
      $des: des
    },
    function(err) {
      if (err) {
        return res.sendStatus(500);
      }
      db.get(`SELECT * FROM Series WHERE id = ${this.lastID}`,
      (err, row) => {
        if (!row) {
          return res.sendStatus(500);
        }
        res.status(201).json({series: row})
      });
    });
});

seriesRouter.put('/:seriesId', (req, res, next) => {
  const name = req.body.series.name;
  const des = req.body.series.description;
  if (!name || !des) {
    return res.sendStatus(400);
  }
  db.run(`
    UPDATE Series
    SET
      name = $name,
      description = $des,
    WHERE
      Series.id = $seriesId
    `,
    {
      $name: name,
      $des: des,
      $seriesId: req.params.seriesId
    },
    (err) => {
      if (err) {
        next(err);
      } else {
        db.get(`SELECT * FROM Series WHERE Series.id = ${req.params.seriesId}`,
        (err, row) => {
          res.status(200).json({series: row})
        });
    }
  });
});

seriesRouter.delete('/:seriesId', (req, res, next) => {
  db.get(`
    SELECT *
    FROM Issue
    WHERE Issue.series_id = $seriesId`,
    {$seriesid: req.params.seriesId},
    (error, row) => {
      if (row) {
        res.sendStatus(400);
      } else if (error) {
        next(error);
      } else {
        db.run(`
          DELETE
          FROM Series
          WHERE Series.id = $seriesId`,
        {$seriesId: req.params.seriesId},
        (err) => {
          if (err) {
            next(err);
          } else {
            res.status(204).send();
          }
        });
      }
  });
});

module.exports = seriesRouter;
