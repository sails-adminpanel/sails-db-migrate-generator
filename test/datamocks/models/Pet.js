// myApp/api/models/Pet.js
// A pet may have many owners
module.exports = {
  attributes: {
    breed: {
      type: 'string'
    },
    type: {
      type: 'string'
    },
    name: {
      type: 'string',
      required: true
    },

    // Add a reference to User
    owners: {
      collection: 'user',
      via: 'pets'
    },

    home: {
      model: 'Home'
    }
  }
};
