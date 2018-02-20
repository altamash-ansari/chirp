/** @jsx React.DOM */

var React        = require('react/addons');
var Reflux       = require('reflux');
var R            = require('ramda');
var Router       = require('react-router');
var Utility      = require('../../utility');
var Link         = Router.Link;
var BuiltApp     = require('../../sdk').ChirpApp;
var ChannelItem  = require('../../channel-list-item.js');

var Actions = Reflux.createActions([
  'fetch'
]);

var Store = Reflux.createStore({
  init: function(){
    this.channels = null;
    this.listenToMany(Actions);
  },
  getInitialState: function() {
    return this.channels;
  },
  onFetch: function(interestedChannels) {
    var self = this;
    BuiltApp
    .Class('channel')
    .Query()
    .containedIn('uid', interestedChannels)
    .exec()
    .then(function(channels) {
      self.change(channels);
    })
  },
  change: function(channels) {
    this.channels = channels;
    this.trigger(channels);
  }
});

module.exports.View = React.createClass({
  mixins: [Reflux.ListenerMixin],
  getInitialState: function() {
    return ({
      channels: null
    })
  },
  componentDidMount: function() {
    this.listenTo(Store, this.onFetch, this.onFetch);
    var channels = this.props.user.get('channels') || [];
    Actions.fetch(channels);
  },
  onFetch: function(channels) {
    this.setState({channels: channels});
  },
  render: function() {
   var self     = this;    
   var channels = this.state.channels;
   var content;

   var emptyError    = (
     <p className ="no-msg">You are not following any channels yet!</p>
   )

   var pageLoader    = (
     <div className="page-loader rel-pl clearfix">
       <img src="img/page-loader.gif" alt=""></img>
     </div>
   )
   
   if(channels === null) {
     content = pageLoader;
   } else {
     if(channels.length) {
       content =  channels.map(function(channel){
         return <ChannelItem channel={channel} user={self.props.user} key={channel.get('uid')} />;
       })
     } else {
       content = emptyError;
     }
   }

    return(
      <div className="wgt-box channels-widget">
          <div className="wgt-header clearfix">
            <i className="fa fa-volume-up mr5"></i> Public Channels
            <Link to="channel-view" query={{q:""}} className="wgt-h-link">View All</Link>
          </div>
          <div className="wgt-body">
            {content}
          </div>
      </div>
    );
  }
});

