/** @jsx React.DOM */
var React       = require('react/addons');
var Router      = require('react-router');
var Reflux      = require('reflux');
var Follow      = require('./follow-btn');
var UserHelper  = require('./dashboard/user-helper');
module.exports = React.createClass({
  mixins: [Reflux.ListenerMixin, Router.Navigation, Router.State],
  formfollowURL: function(parameter){
    var follow = this.props.follow;
    return '#/dashboard/u/'+follow.get('username')+parameter;
  },
  render: function() {
    var self   = this;
    var user   = this.props.user;
    var follow = this.props.follow;
    return (
      <div className="list-item animated fadeInDown">
        <div className="media">
          <a className = "media-left" href={self.formfollowURL('/timeline')}>
            <img alt="image" className="c-image medium" src={UserHelper.getProfileImgUrl(follow.toJSON())} data-holder-rendered="true" />
          </a>
          <div className="media-body">
            <div className="media">
              <div className="media-right">
                <Follow custClass='pull-right' account={follow} user={user}></Follow>  
              </div>
              <div className="media-body">
                <h4 className="media-heading c-name">
                  <a href={self.formfollowURL('/timeline')}>{follow.get('username')}</a>
                </h4>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
});