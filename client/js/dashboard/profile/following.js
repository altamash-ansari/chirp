/** @jsx React.DOM */
var React           = require('react/addons');
var Router          = require('react-router');
var Reflux          = require('reflux');
var InfiniteScroll  = require('react-infinite-scroll')(React);
var R               = require('ramda');

var BuiltApp        = require('./../../sdk').ChirpApp;
var Accounts        = require('./../accounts');
var UserState       = require('./../../user-state');
var UserListItem    = require('./../../user-list-item');

var Actions = module.exports.Actions = Reflux.createActions([
  'fetch',
  'clear'
]);

var Store = module.exports.Store = Reflux.createStore({
  init: function() {
    var self    = this;
    this.following = null;
    this.user      = null;
    self.listenToMany(Actions);
    self.listenTo(UserState.Store,this.onUserChange,this.onUserChange)
  },
  getInitialState: function() {
    return this.following;
  },
  change: function(following){
    this.following = following;
    this.trigger(following);
  },
  append:function(following){
    this.following = this.following? this.following.concat(following): following;
    this.trigger(this.following);
  },
  onUserChange: function(user){
    this.user = user;
  },
  onFetch: function(timestamp, account) {
    var self     = this;
    self.account = account; 
    BuiltApp.Class('built_io_application_user').Query()
      .limit(12)
      .containedIn('uid',R.reject(R.eq(this.user.get('uid')),account.get('follows')))
      .lessThan('updated_at',timestamp)
      .descending('updated_at')
      .exec()
      .then(function(following){
        self.append(following);
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
      following  : null,
      hasMore : true
    }
  },
  componentDidMount: function() {
    var self        = this;
    self.listenTo(Store, self.onNewfollowing);
  },
  onNewfollowing:function(newfollowing){
    if(newfollowing === null){
      return this.setState({
        following  : newfollowing,
        hasMore : false
      })
    }
    this.setState({
      following  : newfollowing,
      hasMore    : this.setHasMore(this.state.following ? (newfollowing.length-this.state.following.length) : newfollowing.length)
    });
  },
  setHasMore: function(newfollowing){
    return newfollowing === 12;
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
    var following  = self.state.following;
    var timestamp  = new Date();
    if(following && following.length > 0){
      timestamp = new Date(following[following.length-1].get('updated_at'));
    }
    Actions.fetch(timestamp, self.props.account);
  },
  render: function() {
    var self        = this;
    var following   = self.state.following;
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
              following ? (
                following.length === 0 ? 
                  <p className="no-msg">{noMsg} not following anyone yet</p> : 
                  following.map(function(follow){
                    return <UserListItem  follow={follow} user={self.props.user} key={follow.get('uid')}/>;
                  })
              ) : <div />
            }
        </InfiniteScroll>
    )
  }
});