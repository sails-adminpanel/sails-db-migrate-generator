module.exports = {
  // models: {
  //  connection: 'postgres'

  // },
  log: {
    level: 'silent'
  },
  port: process.env.PORT === undefined ? 42772 : process.env.PORT,
};
