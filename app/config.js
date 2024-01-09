/*
 * Create and export config vars
 */

// Container 

var environments = {};

// Staging (default) environments
environments.staging = {
  'httpPort' : 3000,
  'httpsPort': 3001,
  'envName' : 'staging',
  'hashingSecret':'thisIsASecret',
};

environments.production = {
  'httpPort': 5000,
  'httpsPort': 5001,
  'envName': 'production',
  'hashingSecret':'thisIsAlsoASecret',
};

// Determine which env was passed as a command line argument

var currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

var environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

module.exports = environmentToExport;
