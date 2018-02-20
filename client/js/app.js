/** @jsx React.DOM */
var React           = require('react');
var Router          = require('react-router');
var Reflux          = require('reflux');
var Link            = Router.Link;
var RouteHandler    = Router.RouteHandler;

var UserState       = require('./user-state');
var BuiltApp        = require('./sdk').ChirpApp;
var SearchBox       = require('./search').SearchBox;

var UserMenu = React.createClass({
  userName: function() {
    var user = this.props.user;

    if (user.fname && user.lname) {
      return user.fname + ' ' + user.lname;
    }

    return this.props.user.email;
  },
  onLogout: function(e) {
    e.preventDefault();
    UserState.Actions.logout();
  },
  render: function() {
    return (
      <ul className="nav navbar-nav navbar-right">
        <li className="dropdown">
          <a href="#" className="dropdown-toggle" data-toggle="dropdown">{this.userName()} <span className="caret"></span></a>
          <ul className="dropdown-menu" role="menu">
            <li><a href="" onClick={this.onLogout}>Logout</a></li>
          </ul>
        </li>
      </ul>
    )
  }
});

module.exports = React.createClass({
  mixins: [Reflux.ListenerMixin],
  getInitialState: function() {
    return {user: undefined};
  },
  componentDidMount: function() {
    this.listenTo(UserState.Store, this.onUserStateChange, this.onUserStateChange);
  },
  onUserStateChange : function(user){
    if(user)
      this.setState({user: user.toJSON()});
    else
      this.setState({user: user});
  },
  render: function() {
    var loggedin = this.state.user;
    var content  = '';
    var dashboardWrapper = (
      <div className="container-wrap">
        <nav className="navbar navbar-fixed-top header">
          <div className="col-md-12">
            <div className="navbar-header">
              <a className="navbar-brand" href="/#/dashboard">Chirp</a>
              <button type="button" className="navbar-toggle" data-toggle="collapse" data-target="#navbar-collapse1" aria-expanded="false" aria-controls="navbar">
                <span className="sr-only">Toggle navigation</span>
                <span className="icon-bar"></span>
                <span className="icon-bar"></span>
                <span className="icon-bar"></span>
              </button>
            </div>
            <div className="collapse navbar-collapse" id="navbar-collapse1">
              <UserMenu user={this.state.user} />
              <SearchBox user={this.state.user}></SearchBox>
            </div>  
         </div> 
        </nav>

        <RouteHandler params={this.props.params} query={this.props.query}/>

        <div className="footer">
          <div className="container">
            <p className="text-muted text-center">© 2015 raweng</p>
          </div>
        </div>
      </div>
    )

    var landingPage = (
      <RouteHandler params={this.props.params} query={this.props.query}/>
    )

    if(loggedin){ // Logged in
      content = dashboardWrapper;
    }else if(loggedin === null){ //logged out
      content = landingPage;
    } else{   // We don't know whether its logged-in or no so waiting for onUserStateChange to trigger
      content = <p className="no-msg">Please wait..</p>
    }

    return (
      content
    )
  }
})