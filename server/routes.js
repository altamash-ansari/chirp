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