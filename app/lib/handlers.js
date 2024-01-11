var helpers = require('./helpers');
var config = require('../config');
var _data = require('./data');

//handlers
var handlers = {};

handlers.ping = function(data,callback){
    // Callback a HTTP status code and a payload object
    callback(200);
};

handlers.notFound = function(data,callback){
    callback(404);
};


handlers.users = function(data, callback){
  var acceptableMethods = ['post','get','put','delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data,callback);
  } else {
    callback(405);
  }
};

handlers._users = {};

handlers._users.post = function(data,callback){
  var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? data.payload.tosAgreement : false;
  if (firstName && lastName && phone && password && tosAgreement) {
    _data.read('users',phone,function(err,data){
      if (err) {
        var hashedPassword = helpers.hash(password);
        if (hashedPassword){
          var userObject = {
            'firstName' : firstName,
            'lastName' : lastName,
            'phone' : phone,
            'hashedPassword' : hashedPassword,
            'tosAgreement' : true

          };

          _data.create('users',phone,userObject,function(err){
            if (!err) {
              callback(200);
            } else {
              callback(500, {'Error' : "Could not create a new user"});
            }
          });
        } else {
          callback(500, {'Error' : 'Could not hash password'});
        }

      } else {
        callback(400,{'Error' : 'A user with that phone number already exists'})
      }

    });
  } else {
    callback(400, {'Error' : "Missing required fields"})
  }
};


handlers._users.get = function(data,callback){

  var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
  if (phone) {
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    handlers._tokens.verifyToken(token,phone,function(tokenIsValid){
      if (tokenIsValid) {
        _data.read('users',phone,function(err,data){
          if(!err && data){
            delete data.hashedPassword;
            callback(200,data);
          } else {
            callback(404);
          }
        });
      } else {
        callback(400, {"Error":"Could not verify token in header"});
      }
    })
  } else {
    callback(400, {'Error':'Missing required object'});
  }

};
handlers._users.put = function(data,callback){
  var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;

  var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  if (phone) {
    if (firstName || lastName || password) {
      var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
      handlers._tokens.verifyToken(token,phone,function(tokenIsValid){
        if (tokenIsValid) {
          _data.read('users',phone,function(err,userData){
            if (!err) {
              if(firstName){
                userData.firstName = firstName;
              }
              if(lastName){
                userData.lastName = lastName;
                
              }
              if (password){
                userData.hashedPassword = helpers.hash(password);
              }

              _data.update('users',phone,userData,function(err){
                if (!err) {
                  callback(200);
                } else {
                  console.log(err);
                  callback(500,{'Error': "Could not update user"})
                }
              });
            } else {
              callback(400,{'Error':"Specified user does not exist"});
            }
          });
        } else {
        callback(400, {"Error":"Couldn't verify token in header"});
        }
      });
    } else {
      callback(400, {'Error' : 'Missing fields to update'});
    }
  } else {
    callback(400, {'Error' : 'Missing required fields'});
  }
};
handlers._users.delete = function(data,callback){
  
  var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
  if (phone) {
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    handlers._tokens.verifyToken(token,phone,function(tokenIsValid){
      if (tokenIsValid) {
        _data.read('users',phone,function(err,data){
          if(!err && data){
            _data.delete('users',phone,function(err){
              if (!err) {
                var userChecks = typeof(data.checks) == 'object' && data.checks instanceof Array ? data.checks : [];
                var checksToDelete = userChecks.length
                if (checksToDelete > 0) {
                  var checksDeleted = 0;
                  var deletionErrors = false;
                  userChecks.forEach(function(checkId){
                    _data.delete('checks',checkId,function(err){
                      if(err){
                        deletionErrors = true;
                      }
                      checksDeleted++;
                      if(checksDeleted == checksToDelete){
                        if(!deletionErrors){
                          callback(200);
                        } else {
                          callback(500,{"Errors":"Errors encountered" })
                        }
                      }
                    })
                  })
                } else {
                  callback(200);
                }
              } else {
                callback(500, {"Error":"Could not delete user"});
              }
            })
          } else {
            callback(400, {'Error':"user can't be found"});
          }
        });
      } else {
      callback(400);
      }
    });
  } else {
    callback(400, {'Error':'Missing required object'});
  }
};


handlers.tokens = function(data, callback){
  var acceptableMethods = ['post','get','put','delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data,callback);
  } else {
    callback(405);
  }
};

handlers._tokens = {}

handlers._tokens.post = function(data, callback){
  var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  if (phone && password) {
    _data.read('users',phone,function(err,userData){
      if (!err && userData) {
        var hashedPassword = helpers.hash(password);
        if (hashedPassword == userData.hashedPassword){
          var tokenId = helpers.createRandomString(20);

          var expires = Date.now() + 1000 * 60 * 60
          var tokenObject = {
            'phone' : phone,
            'id' : tokenId,
            'expires' : expires,
          };

          _data.create('tokens',tokenId, tokenObject,function(err){
            if (!err) {
              callback(200,tokenObject); 
            } else {
              callback(500, {"Error":"Could not create the new token"})
            }
          }); 
        } else {
          callback(400, {"Error": "Password did not match the hashed"})
        }
      } else {
        callback(400,{"error": "could not find user"});
      }
    });
  } else {
    callback(400, {'Error': 'Missing required fields'});
  }
}
handlers._tokens.get = function(data, callback){

  var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if (id) {
    _data.read('tokens',id,function(err,tokenData){
      if(!err && data){
        callback(200,tokenData);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, {'Error':'Missing required object'});
  }


}
handlers._tokens.put = function(data, callback){
  var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
  var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? data.payload.extend : false;
  if (id && extend) {
    _data.read('tokens',id,function(err,tokenData){
      if (!err && tokenData) {
        if(tokenData.expires > Date.now()){
          tokenData.expires = Date.now() + 1000 * 60 * 60
          _data.update('tokens',id,tokenData,function(err){
            if (!err) {
              callback(200);
            } else {
              callback(500, {"Error" : "Could not update token expiration"})
            }
          })
        }  else {
          callback(400, {"error" : "token has already expired"})
        }
      } else {
        callback(400,{"Error":"Could not find token"});
      }
    }) 
  } else {
    callback(400, {"Error" : "Missing required fields or fields are invalid"})
  }
}
handlers._tokens.delete = function(data, callback){

  var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if (id) {
    _data.read('tokens',id,function(err,data){
      if(!err && data){
        _data.delete('tokens',id,function(err){
          if (!err) {
            callback(200);
          } else {
            callback(500, {"Error":"Could not delete tokens"});
          }
        })
      } else {
        callback(400, {'Error':"tokens can't be found"});
      }
    });
  } else {
    callback(400, {'Error':'Missing required object'});
  }

}


handlers._tokens.verifyToken = function(id,phone,callback){
  console.log("Verifying token: ", id)
  console.log("Verifying phone: ", phone)
  _data.read('tokens',id,function(err, tokenData){
    if (!err) {
      if (tokenData.phone == phone && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        console.log({"error":"token does not match phone"});
        callback(false);
      }
    } else {
      console.log({"error":"verify token error"})
      callback(false)
    }
  })
}

// SECTION: CHECKS
handlers.checks = function(data, callback){
  var acceptableMethods = ['post','get','put','delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._checks[data.method](data,callback);
  } else {
    callback(405);
  }
};

handlers._checks = {};

handlers._checks.post = function (data, callback) {
  var protocol = typeof(data.payload.protocol.trim()) == 'string' && ['http', 'https'].indexOf(data.payload.protocol.trim()) > -1 ? data.payload.protocol : false;
  var url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
  var method = typeof(data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) ? data.payload.method : false;
  var successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array ? data.payload.successCodes : false;
  var timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds>= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

  if (protocol && url && method && successCodes && timeoutSeconds) {
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    _data.read('tokens',token,function(err,tokenData){
      if(!err && tokenData){
        var userPhone = tokenData.phone;
        _data.read('users',userPhone,function(err,userData){
          if (!err && userData) {
            console.log(userData);
            var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
            if (userChecks.length < config.maxChecks) {
              var checkId = helpers.createRandomString(20);
              var checkObject = {
                'id': checkId,
                'userPhone' : userPhone,
                'protocol' : protocol,
                'url' : url,
                'method': method,
                'successCodes': successCodes,
                'timeoutSeconds' :timeoutSeconds,
              }
              _data.create('checks',checkId,checkObject,function(err){
                if(!err){
                  userData.checks = userChecks;
                  userData.checks.push(checkId);
                  console.log(userData);
                  _data.update('users',userPhone,userData,function(err){
                    if (!err) {
                      callback(200,checkObject);
                    } else {
                      callback(500, {"Error": "Could not update the user with the new check"});
                    }
                  });
                } else {
                  callback(500, {"Error" : "Could not create the new check"});
                }
              })
            } else {
              callback(400, {"Error" : "User has already used max checks"});
            }
          } else {
            callback(403);
          }
        });
      } else {
        callback(403)
      }
    });
  } else {
    callback(400, {"Error" : "Missing required fields" });
  }

}


handlers._checks.get = function(data,callback){
  var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if (id) {
    _data.read('checks',id,function(err,checkData){
      if(!err && checkData){
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        handlers._tokens.verifyToken(token,checkData.userPhone,function(tokenIsValid){
          if (tokenIsValid) {
            callback(200, checkData);
          } else {
            callback(403);
          }
        });
      }   else {
          callback(404);
      }
    })
  } else {
    callback(400, {'Error':'Missing required object'});
  }

};

handlers._checks.put = function(data,callback){
  var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
  console.log(typeof(data.payload.id));
  console.log(data.payload.id.trim().length);
  var protocol = typeof(data.payload.protocol.trim()) == 'string' && ['http', 'https'].indexOf(data.payload.protocol.trim()) > -1 ? data.payload.protocol : false;
  var url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
  var method = typeof(data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) ? data.payload.method : false;
  var successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array ? data.payload.successCodes : false;
  var timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds>= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;
  if (id) {
    if (protocol || url || method || successCodes || timeoutSeconds) {
      _data.read('checks',id,function(err,checkData){
        if (!err && checkData) {
          var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
          console.log(typeof(data.headers.token));
          handlers._tokens.verifyToken(token,checkData.userPhone,function(tokenIsValid){
            if (tokenIsValid) {
              if (protocol){
                checkData.protocol = protocol;
              }
              if (url){
                checkData.url = url;
              }
              if (method){
                checkData.method = method;
              }
              if (successCodes) {
                checkData.successCodes = successCodes;
              }
              if (timeoutSeconds) {
                checkData.timeoutSeconds = timeoutSeconds;
              }
              _data.update("checks",id,checkData,function(err){
                if (!err) {
                  callback(200);
                } else {
                  callback(500);
                }
              })
            } else {
            callback(403);
            }
          });
        } else {
          callback(400, {"Error":"Check ID did not exist"});
        }
      });
    } else {
      callback(400, {'Error' : 'Missing fields to update'});
    }
  } else {
    callback(400, {'Error' : 'Missing required fields'});
  }
};

handlers._checks.delete = function(data,callback){
  var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if (id) {
    _data.read('checks',id,function(err, checkData){
      if (!err && checkData) {
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        handlers._tokens.verifyToken(token,checkData.userPhone,function(tokenIsValid){
          if (tokenIsValid) {

            _data.delete('checks',id,function(err){
              if (!err) {
                _data.read('users',checkData.userPhone,function(err,userData){
                  if(!err && userData){
                    var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                    var checkPosition = userChecks.indexOf(id);
                    if(checkPosition > -1){
                      userChecks.splice(checkPosition,1);
                      console.log(userData)
                      _data.update('users',userData.phone,userData,function(err){
                        if (!err) {
                          callback(200);
                        } else {
                          callback(500, {"Error":"Could not update user","err":err});
                        }
                      })
                    } else {
                      calback(500, {"Error":"Could not find the check on the user object"})
                    }
                  } else {
                    callback(400, {'Error':"user can't be found"});
                  }
                });
              } else {
                callback(500);
              }
            })

          } else {
            callback(403);
          }
      });
      }
    });
  } else {
    callback(400, {'Error':'Missing required object'});
  }
};

module.exports = handlers;
