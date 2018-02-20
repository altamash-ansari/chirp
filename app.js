var Built = require('built-extension-sdk')

// Initiate application
var app = Built.App('bltd5a724a244ef9c9c')
.setHost("dev-api.built.io")
.setProtocol("https")
.setMasterKey('blt313e0cb3131a7124')

var extensionSDK = app.Extension({
	secret_key     : 'gochirp',
	extension_key	 : 'blt_ext_default',
	static         : __dirname + '/client',
	routes         : require('./server/routes')
})

return extensionSDK.start(9000)
