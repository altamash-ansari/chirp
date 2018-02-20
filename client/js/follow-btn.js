/* @jsx React.DOM */

var React            = require('react');
var R                = require('ramda');
var Router           = require('react-router');
var Reflux           = require('reflux');
var UserStateActions = require('./user-state').Actions;

module.exports = React.createClass({
  getInitialState: function(){
    return {
      isLoading     : false
    }
  },
  componentWillReceiveProps: function(nextProps){
    var preUser         = this.props.user;
    var postUser        = nextProps.user;
    var preIsFollowing  = this.isFollowing(preUser, this.props.account);
    var postIsFollowing = this.isFollowing(postUser, this.props.account);
    if(postIsFollowing !== preIsFollowing){
      this.setState({
        isLoading : false
      });
    }
  },
  isFollowing: function(user, account){
    return !!R.find(R.eq(account.get('uid')), user.get('follows'));
  },
  activeCSS :function (isFollowing) {
    var account = this.props.account;
    var user    = this.props.user;

    if (user.get('username') !== account.get('username')) {
      if (isFollowing)
        return 'btn btn-success btn-md'
      else
        return 'btn btn-primary btn-md'
    } else {
      return 'hide'
    }
  },
  onClick: function(event){
    event.preventDefault();
    var self           = this;
    var isFollowing    = !!R.find(R.eq(this.props.account.get('uid')), this.props.user.get('follows'));
    this.setState({
      isLoading : true
    });
    if(!isFollowing)
      UserStateActions.follow(self.props.account.get('uid'));
    else{
      UserStateActions.unfollow(self.props.account.get('uid'));
    }
  },
  render: function () {
    var self        = this;
    var custClass   = this.props.custClass;
    var isFollowing = !!R.find(R.eq(this.props.account.get('uid')), this.props.user.get('follows'));
    var followText  = isFollowing? 'Unfollow':'Follow';
    var className   = this.activeCSS(isFollowing);
    if(this.state.isLoading)
      return <button className={'btn-follow ' + className +' '+ custClass} onClick={this.onClick} disabled='disabled'>Please wait</button>
    else
      return <button className={'btn-follow ' + className +' '+ custClass} onClick={this.onClick}>{followText}</button>
  }
});