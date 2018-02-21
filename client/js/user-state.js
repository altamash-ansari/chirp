/** @jsx React.DOM */

var React              = require('react/addons');
var Reflux             = require('reflux');
var Router             = require('react-router');
var when               = require('when');
var R                  = require('ramda');
var BuiltApp           = require('./sdk').ChirpApp;
var Accounts           = require('./dashboard/accounts');
var AccountChangeStore = Accounts.AccountChangeStore;

var Actions = module.exports.Actions = Reflux.createActions([
    'login',
    'logout',
    'follow',
    'unfollow',
    'followChannel',
    'unfollowChannel',
    'uploadProfileImg',
    'updateAvatarObject'
]);

module.exports.Store = Reflux.createStore({
  mixins: [Router.Navigation],
  init: function() {
    var self  = this;
    self.listenToMany(Actions);
    this.listenTo(AccountChangeStore, this.onAccountChange);
    this.getCurrentUserSession()
  },
  getCurrentUserSession: function(){
    var self = this;
    BuiltApp.User
    .getSession(true)
      .then(function(user){
        if(user.data){
          self.change(user);
          self.updateUserPresence(user)
        }
      },function(error){
        self.change(null);
      });
    Accounts.Actions.fetch();
  },
  getInitialState: function() {
    return this.user;
  },
  change: function(user){
    if(user){
      user = user.set('follows', user.get('follows') ? user.get('follows') : []);
    }
    this.user = user;
    this.trigger(user);
  },
  onLogin: function(access_token) {
    var self = this;
    if(this.user) // User is already logged in.
      return;
    BuiltApp.User()
      .loginWithGoogle(access_token)
        .then(function(user){
          self.change(user);
        })
  },
  updateUserPresence: function(user){
    return BuiltApp.User.getPresence()
    .then(function(presence){
      return presence
              .setPublic(true)
              .save()
    })
  },
  onAccountChange: function(changedUserData){
    var changedUser = changedUserData.data;
    // Current user profile is updated
    if(this.user && (changedUserData.type === 'updated') && (changedUser.get('uid') === this.user.get('uid'))){ 
      if(!BuiltApp.getHeaders().access_token){
        return
      }
      changedUser = changedUser.set('access_token', BuiltApp.getHeaders().access_token)
      BuiltApp.User.setSession(changedUser.toJSON()); // updates the session with user updates
      this.change(changedUser);
    } 
  },
  onLogout: function(){
    var self = this;
    var user = BuiltApp.User();
    user.logout()
      .then(function(res){
        self.change(null);
      });
  },
  onFollow: function(uid){
    var self     = this;
    var user     = this.user;
    var follows  = user.get('follows') || [];
    this.user
    .updateUserProfile({
      'follows' : {
        PUSH:{
          data:[uid]
        }
      }
    })
    .then(function(updatedUser){
      self.change(updatedUser);
    });
  },
  onUnfollow:function(uid){
    var self = this;
    this.user
    .updateUserProfile({
      'follows' :{
        PULL:{
          data:[uid]
        }
      }
    })
    .then(function(updatedUser){
      self.change(updatedUser);
    });
  },
  onFollowChannel: function(uid){
    var self     = this;
    this.user
    .updateUserProfile({
      'channels' : {
        PUSH:{
          data:[uid]
        }
      }
    })
    .then(function(updatedUser){
      self.change(updatedUser);
    });
  },
  onUnfollowChannel:function(uid){
    var self    = this;
    this.user
    .updateUserProfile({
      'channels' :{
        PULL:{
          data:[uid]
        }
      }
    })
    .then(function(updatedUser){
      self.change(updatedUser);
    });
  },
  onUpdateAvatarObject: function(uid){
    var self = this;
    var avatarRandom = self.user.get('avatar_random') || 0;
    this.user.updateUserProfile({
      avatar        : uid,
      avatar_random : avatarRandom+1
    }).then(function(updatedUser){
      self.change(updatedUser);
    })
  }
});

module.exports.View = React.createClass({
  mixins: [React.addons.LinkedStateMixin, Reflux.ListenerMixin, Router.Navigation, Router.State],
  componentDidMount: function() {
    var self = this;
    this.listenTo(module.exports.Store, this.redirect, this.redirect);
    Actions.login(self.getQuery().google_token);
    $('body').addClass('landing-page');
  },
  componentWillUnmount:function(){
    $('body').removeClass('landing-page');
  },
  redirect: function(user) {
    if (user) {
      this.transitionTo('dashboard');
    }
  },
  render: function() {
    return (
      <div className="container">
        <h1>Chirp <i className="fa fa-bullhorn"></i></h1>
        <h3 className="tag-line"> Share your opinions, ideas and cool stuff with the raw engineering team -- <b className="animated lightSpeedIn">in real time</b>.</h3>
        <p className="text-center">
          <button className="btn btn-danger btn-lg" disabled>
            <i className="fa fa-google-plus-square mr5"></i> <i className="mr5 seperator"> </i> Signing in via google...
          </button>
        </p>
      </div>
    );
  }
});