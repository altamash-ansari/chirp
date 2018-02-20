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
    var self     = this;
    this.members = null;
    self.listenToMany(Actions);
  },
  getInitialState: function() {
    return this.members;
  },
  change: function(members){
    this.members = members;
    this.trigger(members);
  },
  onFetch: function(channelUid) {
    var self     = this;
    //We need to fire a query as we want to include members in responses
    BuiltApp.Class('channel').Query()
    .include(['members'])
    .where('uid',channelUid)
    .exec()
    .then(function(channels){
      self.change(channels[0].get('members')); // As we fire a query, response is array
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
      members: null
    }
  },
  componentDidMount: function() {
    Actions.fetch(this.props.channel.get('uid'));
    this.listenTo(Store, this.onmembersFetched, this.onmembersFetched);
  },
  componentWillUnmount: function(){
    Actions.clear();
  },
  onmembersFetched: function(members){
    this.setState({
      members: members
    })
  },
  render: function() {
    var self           = this;
    var members        = this.state.members;
    var channel        = this.props.channel;
    var channelType    = channel.get('type')[0].type;
    var isAnnouncement = channelType === 'announcement';
    var membersLoaded  = !! members; // Checks whether the store is loaded
    var noAdmin        = membersLoaded ? (members.length === 0 ? true : false) : false; //Checks whether the channel exists without a admin  
    var noMsg          = "No members!";
    var contents       = <PageLoader />;

    if(isAnnouncement){
      contents = <p className="no-msg">{"Invalid request, please click on timeline."}</p>
    }else{
      if(membersLoaded){
        if(noAdmin){
          contents = <p className="no-msg">{noMsg}</p>;
        }else{
          contents = members.map(function(admin){
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