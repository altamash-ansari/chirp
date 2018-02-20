/** @jsx React.DOM */

var React      = require('react/addons');
var Reflux     = require('reflux');
var R          = require('ramda');
var Router     = require('react-router');
var Utility    = require('./../../utility');
var UserHelper = require('./../user-helper');

var OnlineUserItem = React.createClass({
  componentDidMount : function() {
    $(this.refs.theOnlineUserItem.getDOMNode()).tooltip();
  },
  render: function() {
    var onlineUser = this.props.onlineUser.toJSON();
    return (
      <a ref='theOnlineUserItem' data-toggle="tooltip" data-placement="top" title={onlineUser.username} href={UserHelper.formLink(onlineUser.username)}>
        <img alt="image" src={UserHelper.getProfileImgUrl(onlineUser)} data-holder-rendered="true" />
      </a>
    )
  }
});


module.exports.View = React.createClass({
  getInitialState: function(){
    return ({
      onlineUsers: null
    })
  },
  componentDidMount : function(){
    var onlineUsers = this.extractOnlineUsers(this.props);
    this.setState({
      onlineUsers: onlineUsers
    })
  },
  componentWillReceiveProps: function(nextProps){
    var onlineUsers = this.extractOnlineUsers(nextProps);
    this.setState({
      onlineUsers: onlineUsers
    })
  }, 
  extractOnlineUsers: function(props){
    return props.accounts.filter(function(account){
      var presence = account.get('_presence');
      return (presence && presence.status === 'Online')
    });
  },
  render: function(){
    var onlineUsers      = this.state.onlineUsers;
    var onlineUsersExist = onlineUsers && onlineUsers.length > 0;
    return(
      <div className="wgt-box online-users-wgt">
          <div className="wgt-header">
            <i className="fa fa-laptop mr5"></i> Online {onlineUsersExist? <span className="badge">{onlineUsers.length}</span>:<span className="badge">0</span>}
          </div>
          <div className="wgt-body">
            <div className="ou-wrap clearfix">
              {
                onlineUsersExist
                ?
                 onlineUsers.map(function(user){
                  return <OnlineUserItem onlineUser={user} key={user.get('uid')}> </OnlineUserItem>
                 })
                :
                  <p className ="no-msg">No one is online right now!</p>
              }
            </div>
          </div>
      </div>
    );
  }
});

