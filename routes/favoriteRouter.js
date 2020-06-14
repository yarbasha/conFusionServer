const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authenticate = require('../authenticate');
const cors = require('./cors');

const Favorites = require('../models/favorite');
const user = require('../models/user');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
  .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
  .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id })
      .populate('user').populate('dishes')
      .then((favorites) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorites);
      }, (err) => next(err))
      .catch((err) => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id })
      .then((favorites) => {
        if (favorites != null) {
          let favoriteDishes = [];
          favorites.dishes.forEach(item => { favoriteDishes = [...favoriteDishes, item._id.toString()] });
          const dishes = new Set([...favoriteDishes, ...req.body]);
          favorites.dishes = [...dishes];
          favorites.save()
            .then((favorites) => {
              Favorites.findById(favorites._id)
                .populate('user').populate('dishes')
                .then((favorites) => {
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.json(favorites);
                }, (err) => next(err));
            }, (err) => next(err));
        }
        else if (favorites == null) {
          const dishes = new Set(req.body);
          Favorites.create({ user: req.user._id, dishes: [...dishes] })
            .then((favorites) => {
              console.log('Favorites Created ', favorites);
              Favorites.findById(favorites._id)
                .populate('user').populate('dishes')
                .then((favorites) => {
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.json(favorites);
                }, (err) => next(err));
            }, (err) => next(err));
        }
      }, (err) => next(err))
      .catch((err) => next(err));
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites');
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOneAndRemove({ user: req.user._id })
      .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
      }, (err) => next(err))
      .catch((err) => next(err));
  });

favoriteRouter.route('/:dishId')
  .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
  .get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id })
      .then((favorites) => {
        if (!favorites) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          return res.json({ exists: false, favorites: favorites });
        }
        else {
          if (favorites.dishes.indexOf(req.params.dishId) < 0) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.json({ exists: false, favorites: favorites });
          }
          else {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.json({ exists: true, favorites: favorites });
          }
        }
      }, (err) => next(err))
      .catch((err) => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id })
      .then((favorites) => {
        if (favorites != null && favorites.dishes.indexOf(req.params.dishId) < 0) {
          favorites.dishes.push(req.params.dishId);
          favorites.save()
            .then((favorites) => {
              Favorites.findById(favorites._id)
                .populate('user').populate('dishes')
                .then((favorites) => {
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.json(favorites);
                }, (err) => next(err));
            }, (err) => next(err));
        }
        else if (favorites == null) {
          Favorites.create({ user: req.user._id, dishes: [req.params.dishId] })
            .then((favorites) => {
              console.log('Favorites Created ', favorites);
              Favorites.findById(favorites._id)
                .populate('user').populate('dishes')
                .then((favorites) => {
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.json(favorites);
                }, (err) => next(err));
            }, (err) => next(err));
        }
        else {
          err = new Error('Dish ' + req.params.dishId + ' already in the favorites!');
          err.status = 404;
          return next(err);
        }
      }, (err) => next(err))
      .catch((err) => next(err));
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites/' + req.params.dishId);
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id })
      .then((favorites) => {
        if (favorites != null && favorites.dishes.indexOf(req.params.dishId) !== -1) {
          favorites.dishes.splice(favorites.dishes.indexOf(req.params.dishId), 1);
          if (favorites.dishes.length > 0) {
            favorites.save()
              .then((favorites) => {
                Favorites.findById(favorites._id)
                  .populate('user').populate('dishes')
                  .then((favorites) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorites);
                  })
              }, (err) => next(err));
          }
          else {
            Favorites.remove({})
              .then((resp) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(resp);
              }, (err) => next(err))
              .catch((err) => next(err));
          }
        }
        else if (favorites == null) {
          err = new Error('Favorites for User ' + req.user._id + ' not found');
          err.status = 404;
          return next(err);
        }
        else {
          err = new Error('Dish ' + req.params.dishId + ' not found');
          err.status = 404;
          return next(err);
        }
      }, (err) => next(err))
      .catch((err) => next(err));
  });

module.exports = favoriteRouter;