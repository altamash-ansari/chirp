const rest      = require('rest')
const Built     = require('built.io')
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

function getBuildApp(req){
  return req.builtApp.persistSessionWith(Built.Session.MEMORY);
}

module.exports = {
  "createTweet": {
    "POST": function(req, res) {
      req.logger.log("create Tweet Started")
      
      let that          = this;
      let builtApp      = getBuildApp(req);
      let AppMasterKey  = getMasterApp(builtApp);
      let comment_count = req.payload.data.comment_count; // By default the comment_count is set to undefined so all numeric operations fail
      let post_to       = req.payload.data.post_to;
      let images        = req.payload.data.images;
      let accessToken   = req.payload.access_token;
      let AuthApp       = builtApp.setAccessToken(accessToken);
      let content       = req.payload.data.content || "";
      let userUid       = null;
      let mentions      = [];
      let regex         = /(<([^>]+)>)/ig;
      content           = content.replace(regex, ""); // Code to remove html tags
      let channel       = null;

      if(comment_count === undefined)
        comment_count = 0;

      let usernames = (content.match(/@[a-zA-Z0-9_.]+/g)||[]).filter(function(a, b, c) {
        return (c.indexOf(a, b+1) == -1);
      }).map(function(username) { return username.slice(1, username.length) });
      
      let user_uids = [];
      
      return getMentionedUsersUid(usernames)
      .then(function(mentioned){
        //Retrieve mentions
        mentions = mentioned;
        return mentions;
      })
      .then(function(){
        //Get current logged-in user
        return getUserSession(builtApp, accessToken)
        .then(function(user) {
          userUid = user.get('uid')
          return userUid;
        })
      })
      .then(function(){
        if (post_to) {
          AppMasterKey.Class('channel')
          .Object(post_to)
          .fetch()
          .then(function(channelObj) {
            channel = channelObj;
            return AppMasterKey
              .Class('channel_type')
              .Object()
              .set('uid', channel.get('type')[0])
              .fetch()
          })
          .then(function(typeObj){
            let type    = typeObj.get('type');
            let canPost = channel.get('can_post') || [];
            let admins  = channel.get('admins') || [];
            let canRead = channel.get('members') || [];
            if(isAllowedToPost(userUid, canRead, canPost, admins, type)){
              let read  = channel.get('ACL').roles[0].uid;
              let write = channel.get('ACL').roles[1].uid;
              let ACL   = new Built.ACL();
              if(type == 'private'){
                ACL.setUserReadAccess('anonymous', false)
                ACL.setUserWriteAccess('anonymous', false)
                ACL.setUserDeleteAccess('anonymous', false)
                ACL.setPublicReadAccess(false)
                ACL.setRoleReadAccess(read, true)
                ACL.setRoleReadAccess(write, true)
              }else{
                ACL.setPublicReadAccess('true');
              }
              return ACL;
            }else{
              throw new Error("Access denined");
            }
          })
          .then(function(ACL){
            return constructTweet()
            .setACL(ACL)
            .save()
          })
          .then(function(tweet){
            req.logger.log("create Tweet Ended")
            
            return that.resSuccess(req, res, tweet.toJSON());
          })
          .catch(function(err){
            req.logger.error("create Tweet Error", err)
            
            return that.resError(req, res, "Access denined, You don't have sufficient permissions to post on this channel.");
          })
        }else{
          return constructTweet().save()
          .then(function(tweet){
            req.logger.log("create Tweet Ended")
            
            return that.resSuccess(req, res, tweet.toJSON());
          })
          .catch(function(err){
            req.logger.error("create Tweet Error", err)
    
            return that.resError(req, res, err);
          })
        }
      })
      .catch(function(err){
        req.logger.error("create Tweet Error", err)

        return that.resError(req, res, err);
      })

      //Constructs SDK object
      function constructTweet(){
        return AuthApp // App with current user's authtoken in it
        .Class('tweet')
        .Object({
          comment_count: comment_count,
          post_to : post_to,
          mentions: mentions,
          content : content,
          images  : images
        })
      }

      function isAllowedToPost(userUid, canRead, canPost, admins, type){
        var returnVal = false;
        // Check if is admin if not, check if he/she is a poster
        returnVal     = isUserAllowed(userUid, admins) ? true : isUserAllowed(userUid, canPost)? true : false;
        if(type == 'private' && canPost.length === 0 && !returnVal)
          returnVal = isUserAllowed(userUid, canRead)
        if(type == 'public' && canPost.length === 0 && !returnVal)
          returnVal = true;
        return returnVal;
      }

      function isUserAllowed(currentUsr, allowedUsers){
        var returnVal = false;
        allowedUsers.forEach(function(user){
          if(currentUsr == user)
            returnVal = true;
        })
        return returnVal;
      }
      /*
      Adds users in chirps mentions array
      */
      function getMentionedUsersUid(usernames) {
        var user_uids = [];
        if (usernames.length === 0) {
          return utils.Promise.resolve(user_uids);
        } else {
          return AppMasterKey.Class('built_io_application_user')
          .Query()
          .containedIn('username', usernames)
          .only('uid')
          .exec()
          .then(function(objects) {
            user_uids = user_uids.concat(objects.map(function(obj) {
              return obj.get('uid')
            }));
            return user_uids;
          });
        }
      }
    }
  }
}