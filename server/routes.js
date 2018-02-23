const fnRoutes = require('./index')

module.exports = {
  "/v1/functions": {
    "/test": {
      "GET": function(req, res){
        return this.resSuccess(req, res, {
          notice: "test"
        })
      }
    },
    "/createTweet": fnRoutes.createTweet
  },
  "/v1/application/users": {
    "POST": {
      "_pre": function(req, res){
        var username      = req.bobjekt.get('username')
        var avatar_random = req.bobjekt.get('avatar_random');
        if(!username)
          req.bobjekt.set('username', req.bobjekt.get('email').split('@')[0]);
        if(!avatar_random)
          req.bobjekt.set('avatar_random', 1); 
      
        return this.resSuccess(req, res);
      }
    }
  }
}