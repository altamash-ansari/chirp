var when = require('when');
var R    = require('ramda');

var whenDone = module.exports.whenDone = function(val, cb) {
	return when(val).then(cb)
}

module.exports.sequence = function(tasks, initial) {
	return tasks.reduce(whenDone, initial)
}

module.exports.findItemIndex = function(item, collection, property) {
	var indexFinder = R.compose(R.propEq(property, item.get(property)), R.prop('data'))
	return R.findIndex(indexFinder, collection);
}

module.exports.findItem = function(item, collection, property) {
	var indexFinder = R.compose(R.propEq(property, item.get(property)), R.prop('data'))
	return R.find(indexFinder, collection);
}

module.exports.channels = {
	getUrl: function(uid, name) {
		return '#/dashboard/channel/'+uid+'/'+name+'/'+'timeline';
	},
	getProfileImgUrl: function(channel, authtoken){
  var avatar_random = channel.get('avatar_random') || 0;
  if(channel.get('avatar'))
    return channel.get('avatar').url+'?r='+ (avatar_random + 1)+'&AUTHTOKEN='+authtoken;
  else
    return './img/profile-icon.png';
  },

}