/** @jsx React.DOM */
var React            = require('react/addons');
var Router           = require('react-router');
var Reflux           = require('reflux');
var R                = require('ramda');

var Chirp            = require('./../chirp');
var ChirpView        = Chirp.View;
var InfiniteScroll   = require('react-infinite-scroll')(React);
var BuiltApp         = require('./../../sdk').ChirpApp;
var PageLoader       = require('../../page-loader');         
var UserListItem     = require('../../user-list-item');

var Actions = module.exports.Actions = Reflux.createActions([
  'fetch',
  'clear'
]);

var Store = module.exports.Store = Reflux.createStore({
  init: function() {
    var self    = this;
    this.admins = null;
    self.listenToMany(Actions);
  },
  getInitialState: function() {
    return this.admins;
  },
  change: function(admins){
    this.admins = admins;
    this.trigger(admins);
  },
  onFetch: function(channelUid) {
    var self     = this;
    //We need to fire a query as we want to include admins in responses
    BuiltApp.Class('channel').Query()
    .include(['admins'])
    .where('uid',channelUid)
    .exec()
    .then(function(channels){
      self.change(channels[0].get('admins')); // As we fire a query, response is array
    });
  },
  onClear: function(){
    this.change(null);
  }
});

module.exports.View = React.createClass({
  mixins: [Reflux.ListenerMixin],
  getInitialState: function(){
    return {
      admins: null
    }
  },
  componentDidMount: function() {
    Actions.fetch(this.props.channel.get('uid'));
    this.listenTo(Store, this.onAdminsFetched, this.onAdminsFetched);
  },
  componentWillUnmount: function(){
    Actions.clear();
  },
  onAdminsFetched: function(admins){
    this.setState({
      admins: admins
    })
  },
  render: function() {
    var self         = this;
    var channel         = this.props.channel;
    var channelType     = channel.get('type')[0].type;
    var isAnnouncement  = channelType === 'announcement';
    var admins          = this.state.admins;
    var adminsLoaded    = !! admins; // Checks whether the store is loaded
    var noAdmin         = adminsLoaded ? (admins.length === 0 ? true : false) : false; //Checks whether the channel exists without a admin  
    var noMsg           = "No admins! Somethings went wrong there can't exist a channel without admin. Please report this issue";
    var contents        = <PageLoader />;

    // Admin details are kept hidden in announcement class
    if(isAnnouncement){
      contents = <p className="no-msg">{"Invalid request, please click on timeline. "}</p>
    }else{
      if(adminsLoaded){
        if(noAdmin){
          contents = <p className="no-msg">{noMsg}</p>;
        }else{
          contents = admins.map(function(admin){
                      admin = BuiltApp.Class('built_io_application_user').Object(admin); // Converting into a SDK object
                      return <UserListItem  follow={admin} user={self.props.user} key={admin.get('uid')}/>;
                    })
        }
      }
    }    
    return(
    <div>
      {contents}
    </div> 
    )
  }
});