// jest-mongodb-config.js
module.exports = {
  mongodbMemoryServerOptions: {
    instance: {
      dbName: 'jest'
    },
    binary: {
      version: '6.0.6', // Match your MongoDB version or use latest stable
      skipMD5: true
    },
    autoStart: false
  }
};
