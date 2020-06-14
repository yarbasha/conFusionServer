const mongoose = require('mongoose');
const { schema } = require('./user');
const Schema = mongoose.Schema;

const favoriteSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  dishes: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Dish'
    }
  ]
}, {
  timestamps: true
});

var Favorites = mongoose.model('Favorites', favoriteSchema);

module.exports = Favorites;