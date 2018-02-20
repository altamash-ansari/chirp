 /*@jsx React.DOM */

var React                   = require('react');
var InfiniteScroll          = require('react-infinite-scroll')(React);
var R                       = require('ramda');
var Router                  = require('react-router');
var Reflux                  = require('reflux');
var when                    = require('when');
var Link                    = Router.Link;
var RouteHandler            = Router.RouteHandler;

var BuiltApp                = require('./../../sdk').ChirpApp;
var Follow                  = require('./../../follow-btn');
var UserState               = require('./../../user-state');
var AccountChangeStore      = require('./../accounts').AccountChangeStore;
var UserHelper              = require('./../user-helper');

var ImagesUploader          = require('../widgets/image-uploader');

var Actions = module.exports.Actions = Reflux.createActions([
  'fetch',
  'clear',
  'clearAndFetch'
]);

var Store = module.exports.Store = Reflux.createStore({
  getInitialState: function() {
    return this.account;
  },
  init: function(){
    this.account = null;
    this.listenToMany(Actions);
    this.listenTo(AccountChangeStore, this.onAccountChange);
    this.listenTo(UserState.Store,this.onUserChange);
  },
  onAccountChange: function(changedUserData){
    var changedUser = changedUserData.data;
    if(this.account && (changedUserData.type === 'updated') && (changedUser.get('uid') === this.account.get('uid'))){ 
      this.change(changedUser);
    } 
  },
  change: function(account){
    this.account = account;
    this.trigger(account);
  },
  onUserChange: function(user){
    if(user && this.account){
      if((user.get('uid')) === this.account.get('uid')){
        this.change(user);
      }
    }
  },
  onFetch: function(username){
    var self = this;
    BuiltApp
    .Class('built_io_application_user')
    .Query()
    .where('username',username)
    .exec()
    .then(function(account){
      self.change(account[0]);
    })
  },
  onClear: function(){
    this.account = null;
  },
  clearAndFetch:function(username){
    this.account = [];
    this.onFetch(username);
  }
});

module.exports.View = React.createClass({
  mixins: [Reflux.ListenerMixin, Router.Navigation, Router.State],
  getInitialState: function(){
    return {
      account: null,
      uploadMode: false
    }
  },
  componentDidMount: function(){
    var self = this;
    self.listenTo(Store,this.onProfileFetch);
    Actions.fetch(this.getParams().username);
  },
  componentWillReceiveProps: function(nextProps){
    if(this.state.account.get('username') !== nextProps.params.username){
      Actions.fetch(nextProps.params.username);
    }
  },
  shouldComponentUpdate: function(nextProps, nextState){
    if(this.state.account === null)
        return true;
    if(nextState.account.get('username') === nextProps.params.username){
      return true;
    }
    else
      return false;
  },
  onProfileFetch: function(account){
    this.setState({
      account : account
    });
  },
  onImageUploadBtnClick: function(){
    this.setState({
      uploadMode: true
    })
  },
  onComplete: function(uploadUid){
    UserState.Actions.updateAvatarObject(uploadUid);
    this.setState({
      uploadMode: false
    })
  },
  onCancel: function(){
    this.setState({
      uploadMode: false
    })
  },
  render: function() {
    var self       = this;
    var user       = this.props.user;
    var account    = this.state.account;
    var accounts   = this.props.accounts;
    var uploadMode = this.state.uploadMode;
    var changeProfileCSS = function(){
      if(user.get('uid') !== account.get('uid')){
        return ' hidden'
      }
    };
    if(!account){
      return (
        <div className="page-loader clearfix">
          <img src="img/page-loader.gif" alt=""></img>
        </div>
      )
    }else{
      return (
        <div className="container">
          <div className="row">
              <div className="col-md-4">
                <div className="list-group border-radius">
                  <div>
                    <Link to="timeline" params={{username:account.get('username')}} className='list-group-item'>Chirps</Link>
                    <Link to="following" params={{username:account.get('username')}} className='list-group-item'>Following</Link>
                    <Link to="followers" params={{username:account.get('username')}} className='list-group-item'>Followers</Link>
                  </div>
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
                          <img alt="{'@'+account.get('username')}" className="profile-image" src={UserHelper.getProfileImgUrl(account.toJSON())} data-holder-rendered="true" />
                          <p className={"btn-change-pic "+changeProfileCSS()}  onClick={self.onImageUploadBtnClick}>change profile image</p>
                        </div>
                      </div>
                      <div className="media-body">
                        <h4 className="media-heading c-name">
                          {'@'+account.get('username')}
                        </h4>
                        <Follow account={account} user={user}></Follow>
                      </div>
                    </div>
                  : 
                    <ImagesUploader profile={user} onComplete={self.onComplete} onCancel={self.onCancel}></ImagesUploader>            
                  }
              </div>
                <div>
                  <RouteHandler account={account} user={user} accounts={accounts}/>
                </div>
              </div>
          </div>
        </div>
      );
    }
  }
});
