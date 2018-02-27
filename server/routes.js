const rest      = require('rest')
const Built     = require('built.io')
const when      = require('when')
const API_KEY   = "bltd5a724a244ef9c9c"
const masterKey = "blt313e0cb3131a7124"

function getUserSession(builtApp, accessToken){
  return builtApp
  .setAccessToken(accessToken)
  .User
  .getSession(true);
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
        
        req.logger.log(chirpUid + " " + authtoken)
        
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
    }
  }
}

Built.Extension.define('like', function(request, response) {
  var chirp_uid = request.body.chirp_uid;
  var authtoken = request.headers.authtoken;
  getUserSession(authtoken)
  .then(function(user){
    return user.get('uid');
  })
  .then(function(uid){
    AppMasterKey.Class('tweet')
      .Object(chirp_uid)
      .pushValue('upvotes', uid)
      .timeless()
      .save()
      .then(function(tweet){
        return response.success(tweet.toJSON())
      },function(error){
        return response.error(error);
      });
  })
});