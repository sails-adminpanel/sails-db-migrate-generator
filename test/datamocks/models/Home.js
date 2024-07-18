// myApp/api/models/Home.js
// A home can have many user and many pets
module.exports = {
  attributes: {
    id: {
      type: 'number',
      autoIncrement: true
    },
    address: {
      type: 'string',
    },
    location: {
      type: 'json',
      columnName: 'geo_position'
    },
    livingSpace: {
      type: 'number',
      columnType: 'real'
    },

    // Add a reference to Pet
    pets: {
      collection: 'pet',
      via: 'home'
    },

    // Add a reference to User
    tenants: {
      collection: 'user',
      via: 'home'
    },

    owner: {
      model: 'user'
    },

    dependents: {
      collection: "home",
      via: "dependencies"
    },
    dependencies: {
      collection: "home",
      via: "dependents"
    }
  },
  primaryKey: 'id'
};
