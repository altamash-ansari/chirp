const fnRoutes = require('./index')

module.exports = {
  "/v1/functions": {
    "/greetings": {
      "GET": function(req, res){
        return this.resSuccess(req, res, {
          notice: "Hello from chirp"
        })
      }
    },
    "/createTweet": fnRoutes.createTweet
  }
}