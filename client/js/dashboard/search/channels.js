/** @jsx React.DOM */
var React           = require('react');
var Reflux          = require('reflux');
var Router          = require('react-router');
var InfiniteScroll  = require('react-infinite-scroll')(React);
var R               = require('ramda');
var UserListItem    = require('./../../user-list-item');
var BuiltApp        = require('../../sdk').ChirpApp;
var ChannelListItem = require('../../channel-list-item'); 

var Actions         = module.exports.Actions =  Reflux.createActions([
  'search',
  'clear'
]);

var Store = module.exports.Store = Reflux.createStore({

  init: function() {
    this.filteredChannels = null;
    this.listenToMany(Actions);
    
  },
  getInitialState: function(){
    return this.filteredChannels;
  },
  change: function(filteredChannels){
    this.filteredChannels = filteredChannels;
    this.trigger(filteredChannels);
  },

  onSearch: function(searchTerm){
    var self = this;
    var publicChannels = BuiltApp.Class('channel_type').Query()
    .where('type', 'public');

    BuiltApp.Class('channel').Query()
    .matches('name', '^'+searchTerm, 'i')
    .select('type', publicChannels, 'uid')
    .exec()
    .then(function(channels){
      self.change(channels);
    })
  },
  onClear: function(){
    this.change(null);
  }
});

module.exports.View = React.createClass({
  mixins: [Reflux.ListenerMixin, Router.Navigation, Router.State],
  getInitialState: function(){
    return{
      filteredChannels: []
    }
  },
  componentDidMount: function(){
    this.listenTo(Store, this.onChannelsFiltered, this.onChannelsFiltered);
    Actions.search(this.props.searchTerm);
  },
  componentWillUnmount: function(){
    Actions.clear();
  },
  componentWillReceiveProps: function(nextProps){
    Actions.clear();
    Actions.search(nextProps.searchTerm);
  },
  onChannelsFiltered: function(filteredChannels){
    if(filteredChannels !== null){
      this.setState({
        filteredChannels: filteredChannels
      })
    }
  },
  render: function(){
    var self            = this;
    var filteredChannels = this.state.filteredChannels;
    var hasMore = true;
    return (
      <div>
        {
          filteredChannels ? (
            filteredChannels.length === 0 ? 
              <p className="no-msg">No matching users found </p> : 
              filteredChannels.map(function(channel){
                return <ChannelListItem  channel={channel} user={self.props.user} key={channel.get('uid')}/>;
              })
          ) : <div />
        }
      </div>
    )
  }
});