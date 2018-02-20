/** @jsx React.DOM */

var React         = require('react');
var Router        = require('react-router');
var Reflux        = require('reflux');
var R             = require('ramda');
var Chirp         = require('../chirp');
var BuiltApp      = require('../../sdk').ChirpApp;
var ImageSelector = require('./image-selector').View;

module.exports = React.createClass({
  mixins: [Reflux.ListenerMixin, Router.Navigation],
  
  getInitialState: function(){
    return {
      canPost           : false,
      charCount         : 420,
      showImageSelector : false,
      startUpload       : false,
      postingChirp      : false // This is flag which specifies whether the chirp is getting posted on built.io      
    }
  },
  componentDidMount: function() {
    var postbox  = $(this.refs.thePostbox.getDOMNode());
    var accounts = this.props.accounts;
    //mentions input
    postbox.mentionsInput({
      elastic     : false,
      minChars    : 1,
      onDataRequest: function(mode, query, callback) {
        var matching = accounts.filter(function(account) {
          return account.get('username').search(new RegExp('^' + query)) >= 0;
        });
        matching = matching.splice(0, 5);
        matching.sort(function(a, b) {
          return a.get('username').length > b.get('username').length
        });

        callback.call(this, matching.map(function(account) {
          var url = './../../img/profile-icon.png';
          if(account.get('avatar'))
            url = account.get('avatar').url? account.get('avatar').url : url;
          return {
            id     : account.get('uid'),
            name   : '@' + account.get('username')+' ',
            avatar : url,
            type   : 'contact'
          }
        }));
      }
    });
  },
  onPost: function(event){
    event.preventDefault();
    var postbox  = this.refs.thePostbox.getDOMNode();
    if (postbox.value.trim() === "") {
      $.notify("Cannot post a blank chirp","info");
      return 
    }
    this.setState({
      startUpload   : true,
      postingChirp  : true,
      canPost       : false
    })
    if(!this.state.showImageSelector){ //no images are to be uploaded
      this.postChirp();
    }
  },
  onImageUpload: function(array){
    this.postChirp(array);
  },
  onCancelUpload: function(){
    this.setState({
      charCount         : 420,
      showImageSelector : false,
      startUpload       : false,
      postingChirp      : false
    });
  },
  postChirp: function(array){
    var postbox  = this.refs.thePostbox.getDOMNode();
    var jPostBox = $(postbox);
    Chirp.Actions.addNewChirp(postbox.value.trim(), (array || []), this.props.post_to);
    this.resetPostBox();
    jPostBox.mentionsInput('reset');
  },
  resetPostBox: function(){
    this.setState({
      charCount         : 420,
      showImageSelector : false,
      startUpload       : false,
      postingChirp      : false,
      canPost           : false     
    });
  },
  getProfileUrl:function(user){
    if(user)
      return '#/dashboard/u/'+user.get('username')+'/timeline';
    else
      return 'Logged-in user'
  },
  getProfileImg: function(user){
    if(user && user.get('avatar')){
      return user.get('avatar').url+'?r='+user.get('avatar_random');
    }
    else
      return './../../img/profile-icon.png';
  },
  onKeyUp: function(e){
    var self        = this;
    var postboxDom  = self.refs.thePostbox.getDOMNode(); 
    var remaining   = 420 - postboxDom.value.length; 
    var state       = {
      charCount : remaining,
      canPost   :true
    }
    if(remaining < 0 || remaining === 420){ // reset the charter count to
      state.canPost = false;  
    }

    self.setState(state);
  },
  openImageSelector: function(e){
    e.preventDefault();
    var theImageUploader = $(this.refs.theImageUploader.getDOMNode());
    this.setState({
      showImageSelector: true
    });
  },
  render: function() {
    var self         = this;
    var user         = self.props.user;
    var uploadImages = this.state.uploadImages;
    return (
      <div className="well postbox"> 
         <form className="form-horizontal" role="form">
            <div className="media">
              <a className="media-left " href={self.getProfileUrl(user)}>
                  <img alt="image" className="c-image medium" src={self.getProfileImg(user)} data-holder-rendered="true"/>
              </a>
              <div className="media-body">
                <h4 className="media-heading c-name">
                  <a href={self.getProfileUrl(user)}>{user? user.get('username'): ''}</a>
                </h4>
              </div>
            </div>
            <div className="form-group post-body">
              <textarea className="form-control mention" disabled={self.state.postingChirp} placeholder="Compose a new chirp.." rows="3" ref='thePostbox' onKeyUp={self.onKeyUp} onChange={self.onKeyUp}></textarea>
              {
                (this.state.showImageSelector)?
                  <ImageSelector startUpload={this.state.startUpload} onImageUpload={self.onImageUpload} onCancelUpload={self.onCancelUpload} postingChirp={this.state.postingChirp} > </ImageSelector>  
                  :
                  <div className="btn-wrap">
                    <a className="btn btn-success btn-sm" ref='theImageUploader' onClick={self.openImageSelector}>
                      <i className='fa fa-camera mr5'></i> Add Photos
                    </a>
                  </div>
              }
              <div className="clearfix btn-wrap">
                <div className="pull-left tweet-length">{self.state.charCount} character(s) remaining</div>
                <button className="btn btn-primary pull-right" type="button" disabled = {!self.state.canPost} ref='theChirpButton' onClick={self.onPost}>Chirp</button>
              </div>
            </div>
        </form>
      </div>
    )
  }
});

