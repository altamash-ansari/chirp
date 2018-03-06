var Built = require('built-extension-sdk')

// Initiate application
var app = Built.App('blt7a4972bd733522de')
.setHost("stag-api.built.io")
.setProtocol("https")
.setMasterKey('blte6a5a7825c294717')

var extensionSDK = app.Extension({
	secret_key     : 'gochirp',
	extension_key	 : 'blt_ext_default_chirp',
	static         : __dirname + '/client',
	routes         : require('./server/routes')
})

return extensionSDK.start(9000)
