// var when      = require('when')
// var rest      = require('rest')
// var env       = 'stag'

// //PROD By Default
// var API_KEY   = 'blt8e18dbdfa4c9182a'
// var masterKey = 'blt9b41ca3ce229a02e'
// var API_URL   = 'api.built.io'

// //DEV
// /**/
// switch(env){
//   case 'dev':
//     API_KEY   = 'blt74f856659dee3292'
//     masterKey = 'blt73275122067fbf70'
//     API_URL   = 'code-bltdev.cloudthis.com'
//     break;
//   case 'stag':
//     API_KEY   = 'bltcda039a7d0793a3a'
//     masterKey = 'blt52ad580c080ef588'
//     API_URL   = 'stag-api.built.io'   
//     break;
// }

// //STAG

// Built.initialize(API_KEY, 'panchi');
// Built.setMasterKey(masterKey); // necessary for our API to work
// Built.setURL(API_URL,'https');

// var BuiltSDK      = require('built.io');
// var App           = BuiltSDK.App(API_KEY)
//                     .setHost(API_URL)
//                     .setProtocol('https');
// var AppMasterKey  = App.setMasterKey(masterKey); 

// function getUserSession(authtoken){
//   var authApp = App.setAuthToken(authtoken);
//   return authApp.User.getSession(true);
// }

// Built.Extension.define('like', function(request, response) {
//   var chirp_uid    = request.body.chirp_uid;
//   var authtoken    = request.headers.authtoken;
//   getUserSession(authtoken)
//   .then(function(user){
//     return user.get('uid');
//   })
//   .then(function(uid){
//     AppMasterKey.Class('tweet')
//       .Object(chirp_uid)
//       .pushValue('upvotes', uid)
//       .timeless()
//       .save()
//       .then(function(tweet){
//         return response.success(tweet.toJSON())
//       },function(error){
//         return response.error(error);
//       });
//   })
// });

// Built.Extension.define('unlike', function(request, response) {
//   var chirp_uid    = request.body.chirp_uid;
//   var authtoken    = request.headers.authtoken;

//   getUserSession(authtoken).then(function(user){
//     return user.get('uid');
//   })
//   .then(function(uid){
//     AppMasterKey.Class('tweet')
//       .Object(chirp_uid)
//       .pullValue('upvotes', uid)
//       .timeless()
//       .save()
//       .then(function(tweet){
//         return response.success(tweet.toJSON())
//       },function(error){
//         return response.error(error);
//       });
//   })
// });

// Built.Extension.define('likeComment', function(request, response) {
//   var comment_uid  = request.body.comment_uid;
//   var authtoken    = request.headers.authtoken;
//   getUserSession(authtoken)
//   .then(function(user){
//     return user.get('uid');
//   })
//   .then(function(uid){
//     AppMasterKey.Class('comment')
//       .Object(comment_uid)
//       .pushValue('upvotes', uid)
//       .timeless()
//       .save()
//       .then(function(comment){
//         return response.success(comment.toJSON())
//       },function(error){
//         return response.error(error);
//       });
//   })
// });

// Built.Extension.define('unlikeComment', function(request, response) {
//   var comment_uid  = request.body.comment_uid;
//   var authtoken    = request.headers.authtoken;

//   getUserSession(authtoken).then(function(user){
//     return user.get('uid');
//   })
//   .then(function(uid){
//     AppMasterKey.Class('comment')
//       .Object(comment_uid)
//       .pullValue('upvotes', uid)
//       .timeless()
//       .save()
//       .then(function(comment){
//         return response.success(comment.toJSON())
//       },function(error){
//         return response.error(error);
//       });
//   })
// });

// Built.Extension.define('addComment', function(request, response) {
//   var chirp_uid     = request.body.chirp_uid;
//   var authtoken     = request.headers.authtoken;
//   var AuthApp       = App.setAuthToken(authtoken);
//   var AuthMasterApp = AuthApp.setMasterKey(masterKey);
//   var comment;

//   AuthMasterApp.Class('tweet').Object(chirp_uid)
//   .assign({
//     comment_preview: [{
//       content   : request.body.content,
//       chirp_uid : chirp_uid
//     }],
//   })
//   .increment('comment_count', 1)
//   .save()
//   .then(function(tweet) {
//     return response.success(tweet.toJSON());
//   },function(error){
//     return response.error(error);
//   });
// });

// Built.Extension.define('deleteComment', function(request, response) {
//   var chirp_uid    = request.body.chirp_uid;
//   var authtoken    = request.headers.authtoken;
//   var AuthApp      = App.setAuthToken(authtoken);

//   AuthApp.Class('comment').Object(request.body.comment_uid)
//   .delete()
//   .then(function(){
//     return AppMasterKey.Class('comment').Query()
//     .limit(1)
//     .descending('created_at')
//     .where('chirp_uid', chirp_uid)
//     .exec()
//   })
//   .then(function(comments){
//     var comment_preview = comments.length ? [comments[0].get('uid')] : [] 
//     return AppMasterKey.Class('tweet').Object(chirp_uid)
//     .decrement('comment_count',1)
//     .assign({
//       comment_preview: comment_preview
//     })
//     .save()
//   })
//   .then(function(tweet){
//     return response.success("Delete successfully")
//   },function(error){
//     return response.error(error);
//   })
// });

// Built.Extension.define('deleteChirp', function(request, response){
//   var chirp_uid = request.body.chirp_uid;
//   var authtoken = request.headers.authtoken;
//   var AuthApp   = App.setAuthToken(authtoken);  
//   var chirp     = {};
//   AuthApp.Class('tweet').Object(chirp_uid)
//   .fetch()
//   .then(function(obj){
//     chirp = obj
//     return chirp.delete()
//   })
//   .then(function(){
//     return rest({
//       path : 'https://api.built.io/v1/classes/comment/objects',
//       headers : {
//         application_api_key: API_KEY,
//         master_key : masterKey
//       },
//       method: 'DELETE',
//       params:{
//         query: JSON.stringify({
//             chirp_uid: chirp_uid
//         })
//       }
//     })
//   })
//   .then(function(){
//     var images   = chirp.get('images') || []
//     return when.all(images.map(function(image){
//       return AppMasterKey.Upload(image.uid).delete()
//     }));
//   })
//   .then(function(){
//     response.success("Chirp deleted");
//   },function(error){
//     response.error(error);
//   })
// });

// Built.Extension.define('createTweet', function(request, response) {
//   var comment_count = request.body.comment_count; // By default the comment_count is set to undefined so all numeric operations fail
//   var post_to       = request.body.post_to;
//   var images        = request.body.images;
//   var authtoken     = request.headers.authtoken;
//   var content       = request.body.content || "";
//   var userUid       = null;
//   var mentions      = [];
//   var AuthApp       = App.setAuthToken(authtoken);
//   var regex         = /(<([^>]+)>)/ig;
//   content           = content.replace(regex, ""); // Code to remove html tags
//   var channel       = null;

//   if(comment_count === undefined)
//     comment_count = 0;

//   var usernames = (content.match(/@[a-zA-Z0-9_.]+/g)||[]).filter(function(a, b, c) {
//     return (c.indexOf(a, b+1) == -1);
//   }).map(function(username) { return username.slice(1, username.length) });
  
//   var user_uids = [];
  
//   getMentionedUsersUid(usernames)
//   .then(function(mentioned){
//     //Retrieve mentions
//     mentions = mentioned;
//     return mentions;
//   })
//   .then(function(){
//     //Get current logged-in user
//     return getUserSession(authtoken)
//     .then(function(user) {
//       userUid = user.get('uid')
//       return userUid;
//     })
//   })
//   .then(function(){
//     if (post_to) {
//       AppMasterKey.Class('channel')
//       .Object(post_to)
//       .fetch()
//       .then(function(channelObj) {
//         channel = channelObj;
//         return AppMasterKey
//           .Class('channel_type')
//           .Object()
//           .set('uid', channel.get('type')[0])
//           .fetch()
//       })
//       .then(function(type){
//         var type    = type.get('type');
//         var canPost = channel.get('can_post') || [];
//         var admins  = channel.get('admins') || [];
//         var canRead = channel.get('members') || [];
//         if(isAllowedToPost(userUid, canRead, canPost, admins, type)){
//           var read  = channel.get('ACL').roles[0].uid;
//           var write = channel.get('ACL').roles[1].uid;
//           var ACL   = new Built.ACL();
//           if(type == 'private'){
//             ACL.setUserReadAccess('anonymous', false)
//             ACL.setUserWriteAccess('anonymous', false)
//             ACL.setUserDeleteAccess('anonymous', false)
//             ACL.setPublicReadAccess(false)
//             ACL.setRoleReadAccess(read, true)
//             ACL.setRoleReadAccess(write, true)
//           }else{
//             ACL.setPublicReadAccess('true');
//           }
//           return ACL;
//         }else{
//           throw new Error("Access denined");
//         }
//       })
//       .then(function(ACL){
//         return constructTweet()
//         .setACL(ACL)
//         .save()
//       })
//       .then(function(tweet){
//         return response.success(tweet.toJSON());
//       })
//       .catch(function(err){
//         return response.error("Access denined, You don't have sufficient permissions to post on this channel.");
//       })
//     }else{
//       constructTweet().save()
//       .then(function(tweet){
//         return response.success(tweet.toJSON());
//       })
//     }
//   })
//   .catch(function(err){
//     return response.error(err);
//   })

//   //Constructs SDK object
//   function constructTweet(){
//     return AuthApp // App with current user's authtoken in it
//       .Class('tweet')
//       .Object({
//         comment_count: comment_count,
//         post_to : post_to,
//         mentions: mentions,
//         content : content,
//         images  : images
//       })
//   }
// });


// function isAllowedToPost(userUid, canRead, canPost, admins, type){
//   var returnVal = false;
//   // Check if is admin if not, check if he/she is a poster
//   returnVal     = isUserAllowed(userUid, admins) ? true : isUserAllowed(userUid, canPost)? true : false;
//   if(type == 'private' && canPost.length === 0 && !returnVal)
//     returnVal = isUserAllowed(userUid, canRead)
//   if(type == 'public' && canPost.length === 0 && !returnVal)
//     returnVal = true;
//   return returnVal;
// }

// function isUserAllowed(currentUsr, allowedUsers){
//   var returnVal = false;
//   allowedUsers.forEach(function(user){
//     if(currentUsr == user)
//       returnVal = true;
//   })
//   return returnVal;
// }
// /*
//  Adds users in chirps mentions array
// */
// function getMentionedUsersUid(usernames) {
//   var user_uids = [];
//   if (usernames.length === 0) {
//     return when(user_uids);
//   } else {
//     return App.Class('built_io_application_user')
//     .Query()
//     .containedIn('username', usernames)
//     .only('uid')
//     .exec()
//     .then(function(objects) {
//       user_uids = user_uids.concat(objects.map(function(obj) {
//         return obj.get('uid')
//       }));
//       return user_uids;
//     });
//   }

// }

// Built.Extension.beforeSave('comment', function(request, response) {
//   var regex   = /(<([^>]+)>)/ig
//   var content = request.object.get('content').replace(regex, ""); // Code to remove html tags
//   request.object.set('content', content);

//   var usernames = (content.match(/@[a-zA-Z0-9_.]+/g)||[]).filter(function(a, b, c) {
//     return (c.indexOf(a, b+1) == -1);
//   }).map(function(username) { return username.slice(1, username.length) });
  
//   var user_uids = [];
  
//   if (usernames.length == 0) {
//     request.object.set('mentions', user_uids);
//     return response.success();
//   } else {
//     var query = new Built.Query('built_io_application_user');
//     query.containedIn('username', usernames);
//     query.only('uid');
//     query.exec()
//     .then(function(objects) {
//       user_uids = user_uids.concat(objects.map(function(obj) {return obj.get('uid')}));
//       request.object.set('mentions', user_uids);
//       return response.success();
//     });
//   }
// });

// Built.Extension.beforeSave('built_io_application_user', function(request, response) {
//   var username      = request.object.get('username')
//   var avatar_random = request.object.get('avatar_random');
//   if(!username)
//     request.object.set('username', request.object.get('email').split('@')[0]);
//   if(!avatar_random)
//     request.object.set('avatar_random', 1); 
 
//   return response.success();
// });

// Built.Extension.beforeSave('channel', function(request, response){
//   var self          = this;
//   var isUpdated     = (request.object.get('created_at') === request.object.get('updated_at'))? false : true; 
//   var members       = request.object.get('members');
//   var admins        = request.object.get('admins');
//   var canPost       = request.object.get('can_post') || [];
//   var channelName   = request.object.get('name');
//   var channelType   = request.object.get('type');
//   // Initialize avatar random to 1 if blank
//   request.object.set('avatar_random', (request.object.get('avatar_random') || 1));
  
//   AppMasterKey
//   .Class('channel_type')
//   .Object()
//   .set('uid', channelType)
//   .fetch()
//   .then(function(type){
//     if (!isUpdated) {
//       createRoles(channelName)
//         .spread(function(readRole, writeRole) {
//           request.object.setACL(createACL(readRole, writeRole, type.get('type')));
//           return response.success();
//         })
//     } else {
//       AppMasterKey
//         .Class('channel')
//         .Object(request.object.get('uid'))
//         .fetch()
//         .then(function(channel) {
//           return channel.get('ACL');
//         })
//         .then(function(ACL) {
//           var roles = ACL.roles;
//           return updateRoles(roles[0].uid, roles[1].uid, channelName);
//         })
//         .then(function(roles) {
//           request.object.setACL(createACL(roles[0], roles[1], type.get('type'))); // We need to do this as extension send ACL as null
//           return response.success();
//         })
//     }
//   })

//   function updateRoles(readRole, writeRole, channelName){
//      var canRead  = AppMasterKey.Role(readRole);
//     var canWrite  = AppMasterKey.Role(writeRole);

//     members.forEach(function(member) {
//       canRead  = canRead.addUser(member);
//     });
//     canPost.forEach(function(user) {
//       canWrite = canWrite.addUser(user);
//     });
//     return when.all([canRead.save(), canWrite.save()])    
//   }

//   function createRoles(channelName){
//     var canRead  = AppMasterKey.Role();
//     var canWrite = AppMasterKey.Role();
//     canRead      = canRead.set('name', channelName + '_can_read');
//     canWrite     = canWrite.set('name', channelName + '_can_write');

//     members.forEach(function(member) {
//       canRead  = canRead.addUser(member);
//     });
//     canPost.forEach(function(user) {
//       canWrite = canWrite.addUser(user);
//     });

//     return when.all([canRead.save(), canWrite.save()])
//   }

//   function createACL(read, write, type){
//     var ACL  = new Built.ACL();
//     switch(type){
//       case "public":
//         ACL.setPublicReadAccess(true);
//         if (canPost.length === 0) 
//           ACL.setPublicWriteAccess(true)
//         break;
//       case "announcement":
//         ACL.setPublicReadAccess(true);
//         break;
//       case "private":
//         ACL.setPublicReadAccess(false);
//         if (canPost.length === 0)
//           ACL.setRoleWriteAccess(read.get('uid'), true)
//         break;
//     }
//     ACL.setUserReadAccess('anonymous', false)
//     ACL.setUserWriteAccess('anonymous', false)
//     ACL.setUserDeleteAccess('anonymous', false)
//     ACL.setRoleReadAccess(read.get('uid'), true)
//     ACL.setRoleReadAccess(write.get('uid'), true)
//     ACL.setRoleWriteAccess(write.get('uid'), true)
//     admins.forEach(function(admin) {
//       ACL.setUserReadAccess(admin, true);
//       ACL.setUserWriteAccess(admin, true);
//       ACL.setUserDeleteAccess(admin, true);
//     })
//     return ACL;
//   }

// });

// function deletePreviousRoles(readRole, writeRole){
//   var canRead   = AppMasterKey.Role();
//   var canWrite  = AppMasterKey.Role();
//   canRead  = canRead.set('uid', readRole)
//   canWrite = canWrite.set('uid', writeRole)
//   return when.all([canRead.delete(), canWrite.delete()]);
// }

// Built.Extension.define('deleteChannel', function(request, response){
//   var channelUid = request.body.channel_uid;
//   var roles      = request.body.roles;
//   AppMasterKey.Class('channel')
//   .Object(channelUid)
//   .delete()
//   .then(function(){
//     return deletePreviousRoles(roles[0], roles[1])
//   })
//   .then(function(){
//     response.success("Channel deleted");
//   },function(error){
//     response.error('Error',JSON.stringify(error));
//   })
// });
