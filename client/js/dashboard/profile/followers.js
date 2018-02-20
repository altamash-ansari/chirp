/** @jsx React.DOM */
var React           = require('react/addons');
var Router          = require('react-router');
var Reflux          = require('reflux');
var InfiniteScroll  = require('react-infinite-scroll')(React);

var BuiltApp        = require('./../../sdk').ChirpApp;
var Accounts        = require('./../accounts');
var UserState       = require('./../../user-state');
var UserListItem    = require('./../../user-list-item');
var R               = require('ramda');

var Actions = module.exports.Actions = Reflux.createActions([
  'fetch',
  'clear'
]);

var Store = module.exports.Store = Reflux.createStore({
  init: function() {
    var self    = this;
    this.followers = null;
    self.listenToMany(Actions);
  },
  getInitialState: function() {
    return this.followers;
  },
  change: function(followers){
    this.followers = followers;
    this.trigger(followers);
  },
  append:function(followers){
    this.followers = this.followers? this.followers.concat(followers): followers;
    this.trigger(this.followers);
  },
  onFetch: function(timestamp, user) {
    var self     = this;
    self.user    = user; 
    BuiltApp.Class('built_io_application_user').Query()
      .limit(12)
      .where('follows',user.get('uid'))
      .notEqualTo('uid',user.get('uid'))
      .lessThan('updated_at', timestamp)
      .descending('updated_at')
      .exec()
      .then(function(followers){
        self.append(followers);
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
      followers  : null,
      hasMore : true
    }
  },
  componentDidMount: function() {
    var self        = this;
    self.listenTo(Store, self.onNewfollowers);
  },
  onNewfollowers:function(newfollowers){
    if(newfollowers === null){
      return this.setState({
        followers  : newfollowers,
        hasMore    : false
      })
    }
    this.setState({
      followers  : newfollowers,
      hasMore    : this.setHasMore(this.state.followers ? (newfollowers.length-this.state.followers.length) : newfollowers.length)
    });
  },
  setHasMore: function(newfollowers){
    return newfollowers === 12;
  },
  componentWillUpdate: function(nextProps){
    if(nextProps.account.get('uid') !== this.props.account.get('uid')){
      Actions.clear();
      Actions.fetch(new Date(),nextProps.account);
    }
  },
  componentWillUnmount: function(){
    Actions.clear();
  },
  infiniteScroll:function(){
    var self       = this;
    var followers  = self.state.followers;
    var timestamp  = new Date();
    if(followers && followers.length > 0){
      timestamp = new Date(followers[followers.length-1].get('updated_at'));
    }
    Actions.fetch(timestamp, self.props.account);
  },
  render: function() {
    var self        = this;
    var followers   = self.state.followers;
    var account     = self.props.account;
    var hasMore     = self.state.hasMore;
    var noMsg       = account.data.username === self.props.user.data.username ? 'You are' : account.data.username + ' is';
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
              followers ? (
                followers.length === 0 ? 
                  <p className="no-msg">{noMsg} not followed by anyone yet.</p> : 
                  followers.map(function(follow){
                    return <UserListItem  follow={follow} user={self.props.user} key={follow.get('uid')}/>;
                  })
              ) : <div />
            }
        </InfiniteScroll>
    )
  }
});