var API_KEY    = 'blt8e18dbdfa4c9182a';
var API_URL    = 'api.built.io';
var RT_API_URL = 'realtime.built.io';
var env        = 'dev';
//DEV
/**/
switch(env){
  case 'dev':
    API_KEY     = 'bltd5a724a244ef9c9c';
    API_URL     = 'dev-api.built.io';
    RT_API_URL  = 'dev-realtime.built.io';
    break;
  case 'stag':
    API_KEY     = 'bltcda039a7d0793a3a';
    API_URL     = 'stag-api.built.io';
    RT_API_URL  = 'stag-realtime.built.io'; 
    break;
}

var Built  = require('built.io-browserify');
console.log(API_KEY, API_URL);
var app    = Built.App(API_KEY)
              .setHost(API_URL)
              .setRtHost(RT_API_URL)
              .persistSessionWith(Built.Session.LOCAL_STORAGE)
              .enableRealtime()
              .setAdaptor(Built.Adaptor.HTTP);

module.exports.ChirpApp     = app;
module.exports.ExtensionApp = app;
module.exports.Built        = Built;

