var fs = require('fs');
var helpers = require('./helpers')
var path = require('path');

var lib = {};

lib.baseDir = path.join(__dirname,'/../.data/')

lib.create = function(dir,file,data,callback){
  fs.open(lib.baseDir+dir+'/'+file+'.json','wx',function(err,fileDescriptor){
    if (!err && fileDescriptor) {
      var stringData = JSON.stringify(data);
      fs.writeFile(fileDescriptor, stringData, function(err){
        if (!err) {
          fs.close(fileDescriptor, function(err){
            if (!err) {
              callback(false);
            } else {
              callback('Error closing new file');
            }
          });
        } else {
          callback('Error writing to new file');
        }
      });

    } else {
      callback('Could not create new file, it may already exist')
    }
  });
}


lib.read = function(dir,file,callback){
  fs.readFile(lib.baseDir+dir+'/'+file+'.json','utf8',function(err,data){
    if (!err) {
      console.log("unparsed data: ")
      console.log(data);
      var parsedData = helpers.parseJsonToObject(data);
      console.log("parsed data: ")
      console.log(parsedData);


      callback(false, parsedData);
    } else {
      callback(err,data);
    }
  });
}

lib.update = function(dir,file,data,callback){
  fs.open(lib.baseDir+dir+'/'+file+'.json','r+',function(err,fileDescriptor){
    if (!err && fileDescriptor) {
      var stringData = JSON.stringify(data);

      fs.truncate(fileDescriptor, function(err){
        if(!err){
          fs.writeFile(fileDescriptor, stringData, function(err){
            if (!err) {
              callback(false);
            } else {
              callback('error closing the file')
            }
          });
        } else {
          callback('Error truncating file')
        }
      })

    } else {
      callback("could not open the file for updating, it maybe not exist yet");
    }
  });
};




lib.delete = function(dir,file,callback){
  fs.unlink(lib.baseDir+dir+'/'+file+'.json',function(err){
    if (!err) {
      callback(false);
    } else {
      callback('having trouble deleting file');
    }
  })
}


module.exports = lib;


