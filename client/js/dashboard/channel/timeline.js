var React                   = require('react/addons');
var Router                  = require('react-router');
var Reflux                  = require('reflux');
var R                       = require('ramda');

var Chirp                   = require('./../chirp');
var ChirpView               = Chirp.View;
var InfiniteScroll          = require('react-infinite-scroll')(React);
var BuiltApp                = require('./../../sdk').ChirpApp;
var PageLoader              = require('../../page-loader');

var Actions = module.exports.Actions = Reflux.createActions([
  'fetch',
  'clear',
  'clearNFetch'
]);

var Store = module.exports.Store = Reflux.createStore({
  init: function() {
    var self    = this;
    this.chirps = null;
    self.listenToMany(Actions);
    self.listenTo(Chirp.Store,self.onChirpChange);
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
  onChirpChange: function(data){
    var self    = this;
    if(!self.channel)
      return; 
    var channel = self.channel;
    var chirp   = data.chirp;
    if(R.map(R.eq(channel.get('uid')), chirp.get('post_to'))){
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
  findChirpIndex : function(chirp, chirps){
    var indexFinder = R.compose(R.propEq('uid', chirp.get('uid')),R.prop('data'))
    return R.findIndex(indexFinder, chirps);
  },
  onFetch: function(timestamp, channel) {
    var self     = this;
    this.channel = channel;
    BuiltApp.Class('tweet').Query()
    .includeOwner()
    .limit(12)
    .include(['comment_preview'])
    .lessThan('updated_at',timestamp)
    .descending('updated_at')
    .where('post_to', channel.get('uid'))
    .exec()
    .then(function(chirps){
      self.append(chirps);
    });
  },
  onClear: function(){
    this.change(null);
  },
  onClearNFetch: function(timestamp, channel){
    this.chirps = null;
    this.onFetch(timestamp, channel);
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
    if(nextProps.channel.get('uid') !== this.props.channel.get('uid')){
      Actions.clear();
      Actions.fetch(new Date(), nextProps.channel);
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
    Actions.fetch(timestamp, self.props.channel);
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
    var accounts    = self.props.accounts;
    var hasMore     = self.state.hasMore;
    var noMsg       = "No chirps posted in this channel"
    return (
        <InfiniteScroll
          pageStart = '0'
          hasMore   = {hasMore}
          loadMore  = {self.infiniteScroll}
          threshold = '400'
          loader    = {
            <PageLoader />
          }>
          {
            chirps ? (
              chirps.length === 0 ? 
                <p className="no-msg">{noMsg}</p> : 
                chirps.map(function(chirp){
                  return <ChirpView chirp={chirp} accounts={accounts} account={self.props.user} user={self.props.user} key={chirp.get('uid')}/>;
                })
            ) : <div />
          }
        </InfiniteScroll>
    )
  }
});