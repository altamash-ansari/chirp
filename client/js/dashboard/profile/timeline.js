/** @jsx React.DOM */

var React                   = require('react/addons');
var Router                  = require('react-router');
var Reflux                  = require('reflux');
var R                       = require('ramda');

var Chirp                   = require('./../chirp');
var ChirpView               = Chirp.View;
var InfiniteScroll          = require('react-infinite-scroll')(React);
var BuiltApp                = require('./../../sdk').ChirpApp;
var UserState               = require('./../../user-state');

var Actions = module.exports.Actions = Reflux.createActions([
  'fetch',
  'clear'
]);

var Store = module.exports.Store = Reflux.createStore({
  init: function() {
    var self    = this;
    this.chirps = null;
    self.listenToMany(Actions);
    self.listenTo(Chirp.Store,self.onChirpChange);
  },
  onChirpChange: function(data){
    var self    = this;
    if(!self.account)
      return; 
    var account = self.account;
    var chirp   = data.chirp;
    //Shouldnt be a channel post  && should be chirp of current account || Should be mentioned in it
    if(!data.chirp.get('post_to') && (chirp.get('_owner').username === account.get('username') || this.isMentionsChirp(chirp))){
      switch(data.type){
        case 'created':
          var chirps = this.chirps || [];
          chirps.unshift(chirp);
          self.change(chirps);
          break;
        case 'deleted':
          if(this.chirps != null){
            var index = self.findChirpIndex(data.chirp, self.chirps);
            if(index > -1){
              self.chirps.splice(index,1)
              self.change(self.chirps);
            }
          }
          break;
        case 'updated':
          var index = self.findChirpIndex(data.chirp, self.chirps);
          if(index > -1){
            self.chirps[index] = data.chirp;
            self.change(self.chirps);
          }
          break;
      }
    }
  },
  isMentionsChirp: function(newChirp){
    if(this.account){
      var mentions = newChirp.get('mentions');
      return !!R.find(R.eq(this.account.get('uid')), mentions);
    }else
      return false;
  },
  findChirpIndex : function(chirp, chirps){
    var indexFinder = R.compose(R.propEq('uid', chirp.get('uid')),R.prop('data'))
    return R.findIndex(indexFinder, chirps);
  },
  getInitialState: function() {
    return this.chirps;
  },
  change: function(chirps){
    this.chirps = chirps;
    this.trigger(chirps);
  },
  append:function(chirps){
    this.chirps = this.chirps? this.chirps.concat(chirps): chirps;
    this.trigger(this.chirps);
  },
  onFetch: function(timestamp, account) {
    var self     = this;
    self.account = account;

    var mentionsQuery = BuiltApp.Class('tweet').Query()
      .containedIn('mentions', account.get('uid'))
    var myChirpsQuery = BuiltApp.Class('tweet').Query()
      .where('app_user_object_uid', account.get('uid'))

    BuiltApp.Class('tweet').Query()
      .includeOwner()
      .limit(12)
      .doesNotExists('post_to')
      .include(['comment_preview'])
      .lessThan('updated_at',timestamp)
      .descending('updated_at')
      .or([mentionsQuery, myChirpsQuery])
      .exec()
      .then(function(chirps){
        self.append(chirps);
      });
  },
  onClear: function(){
    this.change(null);
  }
});


module.exports.View = React.createClass({
  mixins: [Reflux.ListenerMixin, Router.Navigation],
  getInitialState: function(){
    return {
      chirps  : null,
      hasMore : true
    }
  },
  componentDidMount: function() {
    var self        = this;
    this.intervalID = self.startInterval();
    self.listenTo(Store, self.onNewChirps);
    Actions.clear();
  },
  componentWillReceiveProps: function(nextProps){
    if(nextProps.account.get('uid') !== this.props.account.get('uid')){
      Actions.clear();
      Actions.fetch(new Date(), nextProps.account);
    }
  },
  componentWillUnmount: function(){
    Actions.clear();
    window.clearInterval(this.intervalID);
  },
  startInterval: function(){
    var self = this;
    return window.setInterval(function(){
      self.forceUpdate();
    },1000*60);
  },
  infiniteScroll:function(){
    var self       = this;
    var chirps     = self.state.chirps;
    var timestamp  = new Date();
    if(chirps && chirps.length > 0){
      timestamp = new Date(chirps[chirps.length-1].get('updated_at'));
    }
    Actions.fetch(timestamp, self.props.account);
  },
  onNewChirps:function(newChirps){
    if(newChirps === null){
      return this.setState({
        chirps  : newChirps,
        hasMore : false
      })
    }
    this.setState({
      chirps  : newChirps,
      hasMore : this.setHasMore(this.state.chirps ? (newChirps.length-this.state.chirps.length) : newChirps.length)
    });
  },
  setHasMore: function(newChirps){
    return newChirps === 12;
  },
  render: function() {
    var self        = this;
    var chirps      = self.state.chirps;
    var account     = self.props.account;
    var accounts    = self.props.accounts;
    var hasMore     = self.state.hasMore;
    var noMsg       = account.data.username === self.props.user.data.username ? 'You have' : account.data.username + ' has';
    return (
        <InfiniteScroll
          pageStart = '0'
          hasMore   = {hasMore}
          loadMore  = {self.infiniteScroll}
          threshold = '400'
          loader    = {
            <div className="page-loader clearfix">
              <img src="img/page-loader.gif" alt=""></img>
            </div>
          }>
          {
            chirps ? (
              chirps.length === 0 ? 
                <p className="no-msg">{noMsg} not chirped anything yet.</p> : 
                chirps.map(function(chirp){
                  return <ChirpView chirp={chirp} accounts={accounts} account={account} user={self.props.user} key={chirp.get('uid')}/>;
                })
            ) : <div />
          }
        </InfiniteScroll>
    )
  }
});