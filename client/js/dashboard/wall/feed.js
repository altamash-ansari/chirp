/** @jsx React.DOM */

var React           = require('react/addons');
var Reflux          = require('reflux');
var Router          = require('react-router');
var R               = require('ramda');
var BuiltApp        = require('./../../sdk').ChirpApp;
var Chirp           = require('./../chirp');
var UserState       = require('./../../user-state');

var Actions = module.exports.Actions = Reflux.createActions([
  'fetch',
  'clear'
]);

module.exports.Store = Reflux.createStore({
  init: function() {
    var self    = this;
    this.chirps = null;
    self.listenToMany(Actions);
    self.listenTo(Chirp.Store,self.onChirpChange);
    self.listenTo(UserState.Store,self.onUserStateChange);
  },
  getChirps: function(){
    return this.chirps || [];
  },
  onChirpChange: function(data){
    var self = this;
    if(!data.chirp.get('post_to')){
      switch(data.type){
        case 'created':
          if(this.isFollowerChirp(data.chirp) || this.isMentionsChirp(data.chirp)){
            var chirps = self.getChirps();
            chirps.unshift(data.chirp);
            self.change(chirps);
          }
          break;
        case 'deleted':
          var chirps = this.getChirps(); 
          var index = self.findChirpIndex(data.chirp, chirps);
          if(index > -1){
            chirps.splice(index,1)
            self.change(chirps);
          }
          break;
        case 'updated':
          var chirps = this.getChirps(); 
          var index = self.findChirpIndex(data.chirp, chirps);
          if(index > -1){
            chirps[index] = data.chirp;
            self.change(chirps);
          }
          break;
      }
    }
  },
  findChirpIndex : function(chirp, chirps){
    var indexFinder = R.compose(R.propEq('uid', chirp.get('uid')),R.prop('data'))
    return R.findIndex(indexFinder, chirps);
  }, 
  isFollowerChirp: function(newChirp){
    var userFollowers = this.user.get('follows').concat(this.user.get('uid')); // add your own user uid so that we can see our own chirps
    return !! R.find(R.eq(newChirp.get('app_user_object_uid')), userFollowers);
  },
  isMentionsChirp: function(newChirp){
    if(this.user){
      var mentions = newChirp.get('mentions');
      return !!R.find(R.eq(this.user.get('uid')), mentions);
    }else
      return false;
  },
  onUserStateChange:function(user){
    // when a user state is changed we need to refresh the chirps
    if(user){
      this.change(null);             
      this.onFetch(user, new Date());
    }
  },
  getInitialState: function() {
    return this.chirps;
  },
  change: function(chirps){
    this.chirps = chirps;
    this.trigger(chirps);
  },
  append:function(chirps){
    var newChirp = this.chirps?this.chirps.concat(chirps):chirps;
    this.change(this.unique(newChirp));
  },
  onFetch: function(user, timestamp) {
    var self    = this;
    self.user   = user;

    var mentionsQuery = BuiltApp.Class('tweet').Query()
      .containedIn('mentions', user.get('uid'))
    var followsQuery = BuiltApp.Class('tweet').Query()
      .containedIn('app_user_object_uid', user.get('follows').concat(user.get('uid')));

    var hasNotPostTo = BuiltApp.Class('tweet').Query()
      .doesNotExists('post_to');

    BuiltApp.Class('tweet').Query()
      .includeOwner()
      .include(['comment_preview'])
      .doesNotExists('post_to')
      .limit(12)
      .lessThan('updated_at', timestamp)
      .descending('updated_at')
      .or([mentionsQuery, followsQuery])
      .and([hasNotPostTo])
      .exec()
      .then(function(chirps) {
        self.append(chirps);
      });   
  },
  onClear: function(){
    this.change(null);
  },
  unique: function(chirps){
    return chirps.reduce(function(sofar, current, index, array) {
      var indexFinder = R.compose(R.propEq('uid', current.get('uid')), R.prop('data'));
      if (R.findLastIndex(indexFinder, array) === index)
        return sofar.concat(current)
      else
        return sofar
    }, [])
  }
});