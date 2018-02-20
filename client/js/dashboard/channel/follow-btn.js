/* @jsx React.DOM */
/*
Props:
User    : Currently loggedin user
Channel : Public channel you are on now 
*/
var React            = require('react');
var R                = require('ramda');
var Router           = require('react-router');
var Reflux           = require('reflux');
var UserStateActions = require('../../user-state').Actions;

module.exports = React.createClass({
  getInitialState: function(){
    return {
      isLoading     : false
    }
  },
  componentWillReceiveProps: function(nextProps){
    var preUser         = this.props.user;
    var postUser        = nextProps.user;
    var preIsFollowing  = this.isFollowing(preUser, this.props.channel);
    var postIsFollowing = this.isFollowing(postUser, this.props.channel);
    if(postIsFollowing !== preIsFollowing){
      this.setState({
        isLoading : false
      });
    }
  },
  isFollowing: function(user, channel){
    return !!R.find(R.eq(channel.get('uid')), user.get('channels'));
  },
  activeCSS :function (isFollowing) {
    var channel = this.props.channel;
    var user    = this.props.user;

    // if (user.get('username') !== channel.get('_owner').username) {
      if (isFollowing)
        return 'btn btn-success btn-md'
      else
        return 'btn btn-primary btn-md'
   /* } else {
      return 'hide'
    }*/
  },
  onClick: function(event){
    event.preventDefault();
    var self         = this;
    var channels     = this.props.user.get('channels') || [];
    var isFollowing  = !!R.find(R.eq(this.props.channel.get('uid')), channels);
    this.setState({
      isLoading : true
    });
    if(!isFollowing)
      UserStateActions.followChannel(self.props.channel.get('uid'));
    else{
      UserStateActions.unfollowChannel(self.props.channel.get('uid'));
    }
  },
  render: function () {
    var self        = this;
    var custClass   = this.props.custClass;
    var channels    = this.props.user.get('channels') || [];
    var isFollowing = !!R.find(R.eq(this.props.channel.get('uid')), channels);
    var followText  = isFollowing? 'Unfollow':'Follow';
    var className   = this.activeCSS(isFollowing);
    if(this.state.isLoading)
      return <button className={'btn-follow ' + className +' '+ custClass} onClick={this.onClick} disabled='disabled'>Please wait</button>
    else
      return <button className={'btn-follow ' + className +' '+ custClass} onClick={this.onClick}>{followText}</button>
  }
});