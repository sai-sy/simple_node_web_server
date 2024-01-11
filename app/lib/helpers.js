var crypto = require('crypto');
var config = require('../config')

var helpers = {}

helpers.hash = function(str){
  if(typeof(str) == 'string' && str.length > 0){
    var hash = crypto.createHmac('sha256',config.hashingSecret).update(str).digest('hex');
    return hash;
  } else {
    return false;
  }
};

helpers.parseJsonToObject = function(str){
  try {
    var obj = JSON.parse(str);
    return obj;
  } catch (e) {
    console.log(e);
    return {};
  }
};

helpers.createRandomString = function(strLength){
  strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
  if (strLength){
    var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz1234567890';
    var str = '';
    for (let index = 0; index < strLength; index++) {
      var randomChar = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length)); 

      str+=randomChar;
      
    }
    return str;
    
  } else {
    return false;
  }
}

module.exports = helpers;
