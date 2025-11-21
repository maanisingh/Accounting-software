/**
 * Artillery processor for ZirakBook load testing
 * Provides custom functions for generating test data
 */

module.exports = {
  // Generate random numbers for unique IDs
  generateRandomNumber: function(requestParams, context, ee, next) {
    context.vars.randomNumber = Math.floor(Math.random() * 1000000);
    return next();
  },

  // Log response for debugging
  logResponse: function(requestParams, response, context, ee, next) {
    console.log('Response status:', response.statusCode);
    return next();
  }
};
