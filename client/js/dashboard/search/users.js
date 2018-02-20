/** @jsx React.DOM */
var React           = require('react');
var Reflux          = require('reflux');
var Router          = require('react-router');
var InfiniteScroll  = require('react-infinite-scroll')(React);
var Accounts        = require('./../accounts');
var R               = require('ramda');
var UserListItem    = require('./../../user-list-item');

var Actions         = module.exports.Actions =  Reflux.createActions([
  'search',
  'clear'
]);

var Store = module.exports.Store = Reflux.createStore({

  init: function() {
    this.accounts        = null;
    this.filteredAccount = null;
    this.listenToMany(Actions);
    this.listenTo(Accounts.Store,this.onAccountsUpdated)
    
  },
  onAccountsUpdated: function(accounts){
    this.accounts = accounts;
  },
  getInitialState: function(){
    return this.filteredAccount;
  },
  change: function(filteredAccount){
    this.filteredAccount = filteredAccount;
    this.trigger(filteredAccount);
  },
  onSearch: function(searchTerm){
    if(this.accounts){
      this.change(R.filter(function(account) {
        return !!account.get('username').match(searchTerm);
      }, this.accounts));
    }
  },
  onClear: function(){
    this.change(null);
  }
});

module.exports.View = React.createClass({
  mixins: [Reflux.ListenerMixin, Router.Navigation, Router.State],
  getInitialState: function(){
    return{
      filteredAccount: []
    }
  },
  componentDidMount: function(){
    this.listenTo(Store, this.onUserFiltered, this.onUserFiltered);
    Actions.search(this.props.searchTerm);
  },
  componentWillUnmount: function(){
    Actions.clear();
  },
  componentWillReceiveProps: function(nextProps){
    Actions.clear();
    Actions.search(nextProps.searchTerm);
  },
  onUserFiltered: function(filteredAccount){
    if(filteredAccount !== null){
      this.setState({
        filteredAccount: filteredAccount
      })
    }
  },
  render: function(){
    var self            = this;
    var filteredAccount = this.state.filteredAccount;
    var hasMore = true;
    return (
      <div>
        {
          filteredAccount ? (
            filteredAccount.length === 0 ? 
              <p className="no-msg">No matching users found </p> : 
              filteredAccount.map(function(user){
                return <UserListItem  follow={user} user={self.props.user} key={user.get('uid')}/>;
              })
          ) : <div />
        }
      </div>
    )
  }
});