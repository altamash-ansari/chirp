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
    }
  }
}