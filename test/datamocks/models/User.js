// myApp/api/models/User.js
// A user may have many pets
module.exports = {
  attributes: {
    id: {
      type: "string"
    },
    firstName: {
      type: 'string',
      required: true
    },
    lastName: 'string',
    age: {
      type: 'number',
      autoIncrement: true
    },
    email: {
      type: 'string',
      unique: true
    },

    // Add a reference to Pet
    pets: {
      collection: 'pet',
      via: 'owners'
    },

    home: {
      model: 'home'
    }
  },
  primaryKey: "id"
};
