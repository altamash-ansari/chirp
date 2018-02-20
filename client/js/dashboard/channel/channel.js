/** @jsx React.DOM */

/** 
props => user (currently logged in user)
*/

var React          = require('react');
var Router         = require('react-router');
var Reflux         = require('reflux');
var RouteHandler   = Router.RouteHandler;
var Link           = Router.Link;

var PageLoader     = require('../../page-loader');
var ImagesUploader = require('../widgets/image-uploader');
var BuiltApp       = require('../../sdk').ChirpApp;
var PostView       = require('../widgets/postbox-view');
var Follow         = require('./follow-btn');

var Actions = module.exports.Actions = Reflux.createActions([
  'fetch',
  'clear',
  'clearAndFetch',
  'updateAvatarObject'
]);

var Store = module.exports.Store = Reflux.createStore({
  getInitialState: function() {
    return this.channel;
  },
  init: function(){
    this.channel = null;
    this.listenToMany(Actions);
    
  },
  change: function(channel){
    this.channel = channel;
    this.trigger(channel);
  },
  onFetch: function(channelUid){
    var self = this;
    BuiltApp
    .Class('channel')
    .Query()
    .where('uid', channelUid)
    .include(['type'])
    .includeOwner()
    .exec()
    .then(function(channels){
      if(channels.length > 0)
        self.change(channels[0]);
      else
        self.change(null);
    })
  },
  onClear: function(){
    this.channel = null;
  },
  onClearAndFetch:function(channelUid){
    this.channel = null;
    this.onFetch(channelUid);
  },
  onUpdateAvatarObject: function(uploadUid){
    var self         = this;
    var avatarRandom = this.channel.get('avatar_random') || 0;
    var channel      = this.channel.set('avatar', uploadUid).set('avatar_random', avatarRandom + 1);
    channel.save();      
  }
});

module.exports.View = React.createClass({
  mixins: [Reflux.ListenerMixin, Router.Navigation, Router.State],
  getInitialState: function(){
    return({
      channel: null,
      uploadMode: false
    });
  },
  componentDidMount: function() {
    this.listenTo(Store, this.onChannelFetched);
    Actions.fetch(this.getParams().uid);
  },
  onChannelFetched: function(channel){
    this.setState({
      channel: channel
    })
  },
  onImageUploadBtnClick: function(){
    this.setState({
      uploadMode: true
    })
  },
  onComplete: function(uploadUid){
    Actions.updateAvatarObject(uploadUid);
    this.changeUploadState(false);
  },
  onCancel: function(){
    this.changeUploadState(false);
  },
  getImageUrl: function(channel){
  var avatar_random = channel.avatar_random || 0;
  var authtoken     = this.props.user.app.getHeaders().authtoken;
  if(channel.avatar)
    return channel.avatar.url+'?r='+ (avatar_random + 1)+'&AUTHTOKEN='+authtoken;
  else
    return './img/profile-icon.png';
  },
  changeUploadState: function(isUploading){
    this.setState({
      uploadMode: isUploading
    }) 
  },
  isUserAllowed: function(currentUsr, allowedUsers){
    var returnVal = false;
    allowedUsers.forEach(function(user){
      if(currentUsr == user)
        returnVal = true;
    })
    return returnVal;
  },
  canUserPost: function(){
    var channel     = this.state.channel;
    var userUid     = this.props.user.get('uid');
    var canRead     = channel.get('members') || [];
    var canPost     = channel.get('can_post') || [];
    var admins      = channel.get('admins') || [];
    var channelType = channel.get('type')[0].type;
    
    var returnVal = false;
    // Check if is admin if not, check if he/she is a poster
    returnVal = this.isUserAllowed(userUid, admins) ? true : this.isUserAllowed(userUid, canPost) ? true : false;
    if (channelType === 'private' && canPost.length === 0 && !returnVal)
      returnVal = this.isUserAllowed(userUid, canRead)
    if (channelType === 'public' && canPost.length === 0 && !returnVal)
      returnVal = true;
    return returnVal;
  },
  render: function() {
    var self          = this;
    var user          = this.props.user;
    var channel       = this.state.channel;
    var uploadMode    = this.state.uploadMode;
    var channelExist  = channel !== null? true: false;

    if(!channelExist){
      return <PageLoader/>
    }
    else{
      var channelType     = channel.get('type')[0].type;
      var isPublicChannel = channelType === 'public';
      var isAnnouncement  = channelType === 'announcement';
      var params        = {
        uid:channel.get('uid'),
        name:channel.get('name')
      };
      return(
        <div className="container">
          <div className="row">
              <div className="col-md-4">
                {
                  self.canUserPost()
                  ?
                    <PostView accounts={this.props.accounts} user={user} post_to={channel.get('uid')}/>
                  :
                    null
                }
                <div className="list-group border-radius">
                  <div>
                    <Link to="channel_timeline" params={params} channel={channel} className='list-group-item'>Timeline</Link>
                  </div>
                    {
                      !isAnnouncement
                      ?
                        <div>
                          <Link to="admins"  params={params} channel={channel} className='list-group-item'>Admins</Link>
                          <Link to="members" params={params} channel={channel} className='list-group-item'>Members</Link>
                        </div>
                      :
                        null
                    }                      
                </div>
              </div>
              <div className="col-md-8">
                <div className="panel panel-default panel-body profile-box">
                  {
                  !uploadMode
                  ?
                    <div className="media" ref='theProfileBox'>
                      <div className="media-left">
                        <div className="p-image-wrap">
                          <img alt="Channel Image" className="profile-image" src={self.getImageUrl(channel.toJSON())} data-holder-rendered="true" />
                          <p className="btn-change-pic " onClick={self.onImageUploadBtnClick}>Change image</p>
                        </div>
                      </div>
                      <div className="media-body">
                        <h4 className="media-heading c-name">
                          {channel.get('name')}
                        </h4>
                        <p className="p-meta">
                          {
                            !isAnnouncement
                            ?
                              <span>
                                <span>
                                  <i className="fa fa-users mr5"></i>
                                  <span>
                                    {channel.get('members').length} members
                                  </span>
                                </span>
                                <span className="sep">|
                                </span>
                              </span>
                            : null
                          }
                          <span>
                            {
                              channelType === 'private'
                              ?
                              <span><i className="fa fa-lock mr5"></i><span>Private channel</span></span>
                              :
                              <span>{channelType.charAt(0).toUpperCase() + channelType.slice(1)} channel</span>
                            }
                          </span>
                        </p>
                        <p className="p-sub-title">{channel.get('sub_title')}</p>
                        {
                          isPublicChannel
                          ?
                            <Follow user={user} channel={channel}></Follow>
                          :
                            null
                        }
                      </div>
                    </div>
                  : 
                    <ImagesUploader profile={channel} onComplete={self.onComplete} onCancel={self.onCancel}></ImagesUploader>            
                  }
              </div>
                <div>
                  <RouteHandler accounts ={self.props.accounts} channel={channel} user={user}/>
                </div>
              </div>
            </div>
        </div>
      )
    }
  }
})