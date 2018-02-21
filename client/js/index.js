/* @jsx React.DOM */
/*
 TO DO
 extension method for add comment and delete comment
 timeout for moment causes re-render so in comment section write code in componentShouldUpdate
 Once comment button is clicked it should show loading till comments are fetched
*/
/*
Login issue in iphone
Trying to upload images without image payload
*/
/*
  Accounts fetch call should be moved to store which is currently in dashboard's componentDidMount method
*/

// loading jQuery
// $ = jQuery = require('jquery');
jQuery.event.props.push('dataTransfer'); // This is to inform JQuery that dataTransfer is supported

_          = require('underscore');
// notify     = require('./../libraries/notify.min.js');
// textntags  = require('./../libraries/mentions/jquery.mentionsInput.js');
// loading bootstrap

//cropper plugin
// require('./../libraries/cropper/cropper.js');

//owl-graphics
// require('./../libraries/owl-graphics/owl-carousel/owl.carousel.min.js');

//Light gallery
// require("./../libraries/light-gallery/js/lightGallery.min.js");

// loading our own css
// TODO: minify these
// 
var React         = require('react');
var Router        = require('react-router');
var Route         = Router.Route;
var Routes        = Router.Routes;
var DefaultRoute  = Router.DefaultRoute;
  
var App             = require('./app');
var SignUp          = require('./signUp');
var About           = require('./about');
var Dashboard       = require('./dashboard');
var Wall            = require('./dashboard/wall');
var UserState       = require('./user-state');
var Profile         = require('./dashboard/profile');
var Timeline        = Profile.Timeline;
var Following       = Profile.Following;
var Followers       = Profile.Followers;
var Search          = require('./search');
var Channel         = require('./dashboard/channel/channel').View;
var Admins          = require('./dashboard/channel/admins').View;
var Members         = require('./dashboard/channel/members').View;
var ChannelTimeline = require('./dashboard/channel/timeline').View;

var routes = 
  (
      <Route name="app" path="/" handler={App}>
        <Route name="google_login" path="/google_login" handler={UserState.View} />
        <Route name="dashboard"    path="/dashboard" handler={Dashboard}>
          <Route name="user" path="u/:username" handler={Profile}>
            <Route name="timeline"  path="timeline"  handler={Timeline} />
            <Route name="followers" path="followers" handler={Followers} />
            <Route name="following" path="following" handler={Following} />
          </Route>
          <Route name="channel" path="channel/:uid/:name" handler={Channel}>
            <Route name="channel_timeline" path="timeline" handler={ChannelTimeline} />
            <Route name="admins"   path="admins"   handler={Admins} />
            <Route name="members"  path="members"  handler={Members} />
          </Route>
          <Route name="search" path="search" handler={Search.View}>
            <Route name="chirp-view"   path="chirps"   handler={Search.Chirps}/>
            <Route name="user-view"    path="users"    handler={Search.Users}/>
            <Route name="channel-view" path="channels" handler={Search.Channels}/>
          </Route>
          <DefaultRoute handler={Wall} />
        </Route>
        <DefaultRoute handler={SignUp} />
      </Route>
  );

Router.run(routes, function (Handler, state) {
  React.render(<Handler params={state.params} query={state.query}/>, document.body);
});
