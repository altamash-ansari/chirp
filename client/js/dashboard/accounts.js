/** @jsx React.DOM */

var React           = require('react/addons');
var Reflux          = require('reflux');
var R               = require('ramda');
var Router          = require('react-router');
var BuiltApp        = require('./../sdk').ChirpApp;
var Utility         = require('./../utility');

var Actions = module.exports.Actions = Reflux.createActions([
  'fetch'
]);

var AccountChangeStore = module.exports.AccountChangeStore = Reflux.createStore({
  init: function(){
    var self      = this;
    BuiltApp.User.on('update',function(updatedUser){
      self.trigger({
        type : 'updated',
        data : updatedUser
      });
    });
    BuiltApp.User.on('create',function(createdUser){
      self.trigger({
        type :'created',
        data : createdUser
      });
    });
    BuiltApp.User.off('presence')
    .on('presence',function(presence){
      self.trigger({
        type :'presence',
        data : presence
      });
    });
  }
});

module.exports.Store = Reflux.createStore({
  mixins: [Router.Navigation],
  init: function() {
    var self      = this;
    this.accounts = null;
    self.listenToMany(Actions);
    this.listenTo(AccountChangeStore, this.onAccountChange);
  },
  getInitialState: function() {
    return this.accounts;
  },
  onUserPresenceChange: function(presence){
    var builtObj         = BuiltApp.Class('built_io_application_user').Object(presence.getApplicationUser());
    var index            = Utility.findItemIndex(builtObj, this.accounts, 'uid');
    if(index < 0)
      return;
    this.accounts[index] = this.accounts[index].set('_presence', presence.toJSON()) 
    this.change(this.accounts);
  },
  onAccountChange: function(changedUser){
    var accounts = this.accounts;
    if(accounts){
      switch(changedUser.type){
        case 'created':
        this.onProfileCreate(changedUser.data);
        break;
        case 'updated':
        this.onAccountUpdate(changedUser.data);
        break;
        case 'presence':
        this.onUserPresenceChange(changedUser.data)
      }
    }
  },
  onProfileCreate: function(createdUser){
    this.accounts.push(this.extractRequiredProps(createdUser));
    this.change(this.accounts);
  },
  onAccountUpdate: function(updatedAccount){
    var accounts = this.accounts;
    var index    = Utility.findItemIndex(updatedAccount, accounts, 'uid');
      if(index > -1){
        accounts[index] = this.extractRequiredProps(updatedAccount);
        this.change(accounts);
      }
  },
  extractRequiredProps: function(user){
    var avatar       = user.get('avatar');
    var extractedObj =  ({
      username        : user.get('username'),
      uid             : user.get('uid'),
      email           : user.get('email'),
      avatar_random   : user.get('avatar_random'),
      avatar   : {
        uid           : avatar.uid,
        url           : avatar.url
      }
    });
    return BuiltApp.Class('built_io_application_user').Object(extractedObj);
  },
  change: function(accounts){
    this.accounts = accounts;
    this.trigger(accounts);
  },
  append:function(accounts){
    this.accounts = this.accounts.concat(accounts);
    this.trigger(this.accounts);
  },
  onFetch: function() {
    var self = this;
    BuiltApp
    .Class('built_io_application_user')
    .Query()
    .only(['username','uid','email','avatar.url','avatar_random','_presence'])
    .limit(500)
    .exec()
      .then(function(accounts){
        self.change(accounts);
      });
  },
  getAccountForUid: function(uid){
    return R.find(R.propEq('uid',uid),R.map(R.prop('data'),this.accounts))
  }
});

