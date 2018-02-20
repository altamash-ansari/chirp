/** @jsx React.DOM */
var React       = require('react/addons');
var Router      = require('react-router');
var Reflux      = require('reflux');
var Utils       = require('./utility.js');

module.exports = React.createClass({
  mixins: [Reflux.ListenerMixin, Router.Navigation, Router.State],
 
  render: function() {
    var channel    = this.props.channel;
    var channelUrl = Utils.channels.getUrl(channel.get('uid'),channel.get('name'));
    var authtoken  = this.props.user.app.getHeaders().authtoken;
    return (
      <div className="list-item animated fadeInDown">
        <div className="media">
          <a className = "media-left" href={channelUrl}>
            <img alt="" className="c-image medium" src={Utils.channels.getProfileImgUrl(channel, authtoken)} data-holder-rendered="true" />
          </a>
          <div className="media-body">
            <div className="media">
              <div className="media-right">
                
              </div>
              <div className="media-body">
                <h4 className="media-heading c-name">
                  <a href={channelUrl}>{channel.get('name')}</a>
                </h4>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
});