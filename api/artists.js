const express = require('express');
const artistsRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

artistsRouter.param('artistId', (req, res, next, artistId) => {
  db.get(`
    SELECT * FROM Artist WHERE Artist.id = $artistId`, {$artistId: artistId}, (error, artist) => {
      if (error) {
        next(error);
      } else if (artist) {
        req.artist = artist;
        next();
      } else {
        res.sendStatus(404);
      }
    });
});

artistsRouter.get('/', (req, res, next) => {
  db.all(
    `SELECT * FROM Artist WHERE Artist.is_currently_employed = 1`,
    (err, rows) => {
      if (err) {
        next(err);
      } else {
        res.status(200).json({artists: rows});
      }
    });
});

artistsRouter.get('/:artistId', (req, res, send) => {
  res.status(200).json({artist: req.artist});
});

artistsRouter.post('/', (req, res, send) => {
  const name = req.body.artist.name;
  const dob = req.body.artist.dateOfBirth;
  const bio = req.body.artist.biography;
  if (!name || !dob || !bio) {
    return res.sendStatus(400);
  }
  const emp = req.body.artist.isCurrentlyEmployed === 0 ? 0 : 1;
  db.run(`
    INSERT INTO Artist (name, date_of_birth, biography, is_currently_employed)
    VALUES ($name, $dob, $bio, $emp)`,
    {
      $name: name,
      $dob: dob,
      $bio: bio,
      $emp: emp
    },
    function(err) {
      if (err) {
        return res.sendStatus(500);
      }
      db.get(`SELECT * FROM Artist WHERE id = ${this.lastID}`,
      (err, row) => {
        if (!row) {
          return res.sendStatus(500);
        }
        res.status(201).json({artist: row})
      });
    });
});

artistsRouter.put('/:artistId', (req, res, next) => {
  const name = req.body.artist.name;
  const dob = req.body.artist.dateOfBirth;
  const bio = req.body.artist.biography;
  const emp = req.body.artist.isCurrentlyEmployed === 0 ? 0 : 1;
  if (!name || !dob || !bio) {
    return res.sendStatus(400);
  }
  db.run(`
    UPDATE Artist
    SET
      name = $name,
      date_of_birth = $dob,
      biography = $bio,
      is_currently_employed = $emp
    WHERE
      Artist.id = $id
    `,
    {
      $name: name,
      $dob: dob,
      $bio: bio,
      $emp: emp,
      $id: req.params.artistId
    },
    function(err) {
      if (err) {
        next(err);
      } else {
        db.get(`SELECT * FROM Artist WHERE Artist.id = ${req.params.artistId}`,
        (err, row) => {
          res.status(200).json({artist: row})
        });
      }
    });
});

artistsRouter.delete('/:artistId', (req, res, next) => {
  db.run(`
    UPDATE Artist
    SET
      is_currently_employed = 0
    WHERE
      Artist.id = $id
    `,
    {$id: req.params.artistId},
    (err) => {
      if (err) {
        next(err);
      } else {
        db.get(`SELECT * FROM Artist WHERE Artist.id = ${req.params.artistId}`,
        (err, row) => {
          res.status(200).json({artist: row})
        });
      }
    });
});


module.exports = artistsRouter;
