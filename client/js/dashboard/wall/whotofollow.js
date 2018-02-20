/** @jsx React.DOM */

var React                   = require('react/addons');
var Router                  = require('react-router');
var Reflux                  = require('reflux');

var BuiltApp        = require('./../../sdk').ChirpApp;
var UserListItem    = require('./../../user-list-item');

var Actions = module.exports.Actions = Reflux.createActions([
  'fetch'
]);

var Store = module.exports.Store = Reflux.createStore({
  init: function() {
    var self         = this;
    this.whotofollow = null;
    self.listenToMany(Actions);
  },
  getInitialState: function() {
    return this.whotofollow;
  },
  change: function(whotofollow){
    this.whotofollow = whotofollow;
    this.trigger(whotofollow);
  },
  onFetch: function(user) {
    var self = this;
    BuiltApp.Class('built_io_application_user').Query()
          .notContainedIn('uid',user.get('follows').concat(user.get('uid')))
          .include(['follows'])
          .limit(5)
          .exec()
          .then(function(whotofollow){
            self.change(whotofollow);
          });
      
  }
});

module.exports = React.createClass({
  mixins: [Reflux.ListenerMixin, Router.Navigation],
  getInitialState: function(){
    return {
      whotofollow  : null
    }
  },
  componentDidMount: function() {
    this.listenTo(Store, this.onFetch, this.onFetch);
    Actions.fetch(this.props.user);
  },
  onFetch:function(newWhoToFollow){
    if(newWhoToFollow !== null){
      this.setState({
        whotofollow  : newWhoToFollow
      });
    }
  },
  render: function() {
    var self             = this;
    var whotofollow      = self.state.whotofollow;
    var whotofollowExist = !!whotofollow;

    var content;
    var emptyError = (
      <p className="no-msg">There is no one to follow right now.</p>
    )
    var pageLoader = (
      <div className="page-loader rel-pl clearfix">
        <img src="img/page-loader.gif" alt=""></img>
      </div>
    )
    
    if(!whotofollowExist){
      content = pageLoader;
    } else {
      if(whotofollow.length){
        content =  whotofollow.map(function(follow){
          return <UserListItem  follow={follow} user={self.props.user} key={follow.get('uid')}/>;
        })
      } else {
        content = emptyError;
      }
    }

    return (
      <div className="wgt-box">
          <div className="wgt-header">
            <i className="fa fa-group mr5"></i> Who to follow
          </div>
          <div className="wgt-body">
            {content}
          </div>
      </div>
    );
  }
});