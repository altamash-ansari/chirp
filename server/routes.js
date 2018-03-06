const rest      = require('rest')
const Built     = require('built.io')
const when      = require('when')
const API_KEY   = "blt3f2adfc6b05abcf1"
const masterKey = "blt9291ac481447fcd0"

function getUserSession(builtApp, accessToken){
  return builtApp
  .setAccessToken(accessToken)
  .User
  .getSession(true)
  then(function(data) {
    req.logger.log(data)
  })
  .catch(function(error) {
    req.logger.log(error)
  })
}

function getMasterApp(builtApp){
  return builtApp.setMasterKey(masterKey)
}

function getBuiltApp(req){
  return req.builtApp.persistSessionWith(Built.Session.MEMORY);
}

module.exports = {
  "/v1/functions": {
    "/test": {
      "GET": function(req, res){
        return this.resSuccess(req, res, {
          notice: "test"
        })
      }
    },
    "/getAllTweets" : {
      GET : function(req, res) {
        var chirpUid  = req.body.chirp_uid
        var authtoken = req.headers.authtoken || req.headers.access_token
    
        var bapp      = req.builtApp
        var that      = this
        
        req.logger.log(req.body)

        req.logger.log(authtoken)
        // req.logger.log(req.headers)
        
        // Fetch Built Class Query instance and call exec()
        return bapp.Class("tweet").Query()
        .exec()
        .then(function(tweets) {
           // Fetches all objects from Tweet class
           return that.resSuccess(req, res, {
             tweets : tweets
           })
        })
        .catch(function(err) {
          // Logs any error that occurs while executing this application
          req.logger.log(err)
          return that.resError(req, res, err)
        })
      }
    },
    "/like" : {
      POST : function(req, res) {
        var chirp_uid = req.body.chirp_uid
        var authtoken = req.headers.authtoken
        var that      = this

        var builtApp  = req.builtApp
        req.logger.log("Master Key : " + masterKey)
        builtApp      = builtApp.setMasterKey(masterKey)

        req.logger.log(req.body)
        // req.logger.log(req.headers.authtoken + " " + req.headers.access_token)
        
        return getUserSession(builtApp, authtoken)
        .then(function(userSession) {
          req.logger.log("userSession")
  
          return that.resSuccess(req, res, {
            response : "Success"
          })
        })
        .catch(function(error) {
          req.logger.log(error)

          return that.resError(req, res, "Error")
        })
      }
    }
  }
}