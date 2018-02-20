/** @jsx React.DOM */

var React           = require('react');
var Router          = require('react-router');
var Reflux          = require('reflux');
var Link            = Router.Link;
var UserState       = require('./user-state');

module.exports = React.createClass({
  mixins: [Reflux.ListenerMixin, Router.Navigation],

  componentDidMount: function() {
    this.listenTo(UserState.Store, this.onUserStateChange, this.onUserStateChange);
    $('body').addClass('landing-page');
  },
  componentWillUnmount:function(){
    $('body').removeClass('landing-page');
  },
  onUserStateChange: function(user) {
    if (user) {
      this.transitionTo('dashboard');
    }
  },
  authLogin : function(){

    var e = function(u) {return encodeURIComponent(u);}
    var base = 'https://accounts.google.com/o/oauth2/auth';
    var response_type = e('token');
    var client_id = e('96587558306-qei7l6qq5d9mfcsgk45kjhkdg4e9frml.apps.googleusercontent.com');
    var redirect_uri = e(document.URL.split("/#")[0] + '/google_oauth_callback.html');
    var scope = e('https://www.googleapis.com/auth/userinfo.email');
    var state = e('lollalal');
    var approval_prompt = e('auto');
    var hd = 'raweng.com';
    base = base +
      '?response_type=' + response_type +
      '&client_id=' + client_id +
      '&redirect_uri=' + redirect_uri +
      '&scope=' + scope +
      '&state=' + state +
      '&approval_prompt=' + approval_prompt + 
      '&hd=' + hd;

    window.location.href = value = base;
    return false;
   },
  render: function() {
    return (
      <div className="container">
        <h1>Chirp <i className="fa fa-bullhorn"></i></h1>
        <h3 className="tag-line"> Share your opinions, ideas and cool stuff with the raw engineering team -- <b className="animated lightSpeedIn">in real time</b>.</h3>
        <p className="text-center">
          <button className="btn btn-danger btn-lg" onClick={this.authLogin}>
            <i className="fa fa-google-plus-square mr5"></i> <i className="mr5 seperator"> </i> Sign In With Google
          </button>
        </p>
      </div>
    )
  }
});