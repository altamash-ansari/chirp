var moment = require('moment');

module.exports.formLink = function(username){
    return '#/dashboard/u/'+username+'/timeline';
}

module.exports.getMomentFromNow = function(chirp){
    return moment(new Date(chirp.get('created_at'))).fromNow();
}

module.exports.getProfileImgUrl = function(owner){  
  if(owner.avatar)
    return owner.avatar.url+'?r='+owner.avatar_random;
  else
    return './img/profile-icon.png';
}


module.exports.formatDate = function(currentdate){
    var currentdate = new Date(currentdate);
    var month = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    var hours = currentdate.getHours();
    return currentdate.getDate() + "-"
           + (month[currentdate.getMonth()])  + "-" 
           + currentdate.getFullYear() + " at "  
           + ((hours > 0)? ((hours < 9)? "0"+hours : hours) + ":" : "00:") 
           + currentdate.getMinutes() + ":" 
           + currentdate.getSeconds();
}

module.exports.linkTags = function(content) {
  var exp = /(\b(www|bmp|http|https)[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
  content = content.replace(exp, function(match) {
    if (match.indexOf('http') == 0)
      return "<a href='" + match + "' target='_blank'>" + match + "</a>";
    else
      return "<a href='http://" + match + "' target='_blank'>" + match + "</a>";
  });
  content = content.replace(/\B@([a-zA-Z0-9_.]+)/g, '<a href="#/dashboard/u/$1/timeline">@$1</a>');

  return content.replace(/\B#([a-zA-Z0-9]+)/g, '<a href="#/dashboard/search/chirps?q=%23$1">#$1</a>')
}