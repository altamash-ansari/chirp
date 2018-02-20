/** @jsx React.DOM */

var React        = require('react');
var Router       = require('react-router');
var Reflux       = require('reflux');
var RouteHandler = Router.RouteHandler;

var UserState   = require('./user-state');
var Accounts    = require('./dashboard/accounts');

var PageLoader  = require('./page-loader');

module.exports = React.createClass({
  mixins: [Reflux.ListenerMixin, Router.Navigation, Router.State],
  getInitialState: function(){
    return {
      user     : undefined,
      accounts : null
    }
  },
  componentDidMount: function() {
    this.listenTo(UserState.Store, this.onUserLoggedIn, this.onUserLoggedIn);
    this.listenTo(Accounts.Store, this.onAccountFetch, this.onAccountFetch);
  },
  onUserLoggedIn: function(user) {
    if (user === null) {
      this.transitionTo('app');
    }else{
      this.setState({
        user: user
      });
    }
  },
  onAccountFetch: function(accounts){
    this.setState({
      accounts: accounts
    }); 
  },
  render: function() {
    var self     = this;
    var user     = this.state.user;
    var accounts = this.state.accounts;
    if(user && accounts){
      return (
        <RouteHandler params={this.props.params} query={this.props.query} user={user} accounts={accounts} />
      )
    }
    else {
      return (
        <div className="container">
            <PageLoader />
        </div>
      );
    }
  }
})