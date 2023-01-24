module.exports = {
  // models: {
  //   connection: 'postgres',
  //   migrate: 'safe'
  // },
  adminpanel:{
    auth: true
  },
  log: {
    level: 'silent'
  },
  port: process.env.PORT === undefined ? 42772 : process.env.PORT
};
