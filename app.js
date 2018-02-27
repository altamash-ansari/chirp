var Built = require('built-extension-sdk')

// Initiate application
var app = Built.App('blt3f2adfc6b05abcf1')
.setHost("stag-api.built.io")
.setProtocol("https")
.setMasterKey('blt9291ac481447fcd0')

var extensionSDK = app.Extension({
	secret_key     : 'gochirp',
	extension_key	 : 'blt_ext_default',
	static         : __dirname + '/client',
	routes         : require('./server/routes')
})

return extensionSDK.start(9000)
