const express = require('express');
const issuesRouter = express.Router({mergeParams: true});

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

issuesRouter.param('issueId', (req, res, next, issueId) => {
  db.get(`
    SELECT * FROM Issue WHERE Issue.id = $issueId`, {$issueId: issueId}, (error, issue) => {
      if (error) {
        next(error);
      } else if (issue) {
        req.issue = issue;
        next();
      } else {
        res.sendStatus(404);
      }
    });
});

issuesRouter.get('/', (req, res, next) => {
  db.all(
    `SELECT * FROM Issue WHERE Issue.series_id = $seriesId`,
    {$seriesId: req.params.seriesId},
    (err, rows) => {
      if (err) {
        next(err);
      } else {
        res.status(200).json({issues: rows});
      }
    });
});

issuesRouter.get('/:issueId', (req, res, send) => {
  res.status(200).json({issue: req.issueId});
});

issuesRouter.post('/', (req, res, send) => {
  const name = req.body.issue.name;
  const issNo = req.body.issue.issueNumber;
  const pubDate = req.body.issue.publicationDate;
  const artistId = req.body.issue.artistId;
  if (!name || !issNo || !pubDate || !artistId) {
    return res.sendStatus(400);
  }
  db.run(`
    INSERT INTO Issue (name, issue_number, publication_date, artist_id)
    VALUES ($name, $issNo, $pubDate, $artistId)`,
    {
      $name: name,
      $issNo: issNo,
      $pubDate: pubDate,
      $artistId: artistId
    },
    function(err) {
      if (err) {
        return res.sendStatus(500);
      }
      db.get(`SELECT * FROM Issue WHERE id = ${this.lastID}`,
      (err, row) => {
        if (!row) {
          return res.sendStatus(500);
        }
        res.status(201).json({issue: row})
      });
    });
});

issuesRouter.put('/:issueId', (req, res, next) => {
  const name = req.body.issue.name;
  const issNo = req.body.issue.issueNumber;
  const pubDate = req.body.issue.publicationDate;
  const artistId = req.body.issue.artistId;
  db.get(`
    SELECT * FROM Artist WHERE Artist.id = $artistId`,
    {$artistId: artistId},
    (error, artist) => {
    if (error) {
      next(error);
    } else {
      if (!name || !issNo || !pubDate || !artistId) {
        return res.sendStatus(400);
      }
      db.run(`
        UPDATE Issue
        SET
          name = $name,
          issue_number = $issNo,
          publication_date = $pubDate,
          artist_id = $artistId
        WHERE
          Issue.id = $issueId
        `,
        {
          $name: name,
          $issNo: issNo,
          $pubDate: pubDate,
          $artistId: artistId,
          $issueId: req.params.issueId
        },
        function(err) {
          if (err) {
            next(err);
          } else {
            db.get(`SELECT * FROM Issue WHERE Issue.id = ${req.params.issueId}`,
            (err, row) => {
              res.status(200).json({issue: row})
            });
          }
        });
      }
    });
});

issuesRouter.delete('/:issueId', (req, res, next) => {
  db.run(`
    DELETE
    FROM Issues
    WHERE Issues.id = $id
    `,
    {$id: req.params.issueId},
    (err) => {
      if (err) {
        next(err);
      } else {
        res.status(204).send();
      }
    });
});

module.exports = issuesRouter;
