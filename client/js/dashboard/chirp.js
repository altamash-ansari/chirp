/** @jsx React.DOM */
/*
TO DO
Indentify user using his authtoken on extension
Fetch the chirp before updating
*/
var React           = require('react');
var Reflux          = require('reflux');
var R               = require('ramda');
var when            = require('when');
var BuiltApp        = require('./../sdk').ChirpApp;
var ExtensionApp    = require('./../sdk').ExtensionApp;
var OverlayUI       = require('./../overlay').View;
var ImgSlider       = require('./img-slider').View;
var CommentInput    = require('./chirp/comment-input');
var CommentSection  = require('./chirp/comment-section');
var Utility         = require('./../utility');
var UserHelper      = require('./user-helper');

var likeStates = {
  unliked : 0,
  liked   : 1,
  loading : 2
}

var Actions = module.exports.Actions =  Reflux.createActions([
  'addNewChirp',
  'deleteChirp',
  'like',
  'unlike'
]);

var Store = module.exports.Store = Reflux.createStore({
  init: function() {
    var self = this;
    self.listenToMany(Actions);
    BuiltApp.Class('tweet').Object
      .on('create',function(chirp){
      self.trigger({
        type: 'created',
        chirp: chirp
      });
    });
    BuiltApp.Class('tweet').Object
      .on('delete',function(chirp){
      self.trigger({
        type: 'deleted',
        chirp: chirp
      });
    });
    BuiltApp.Class('tweet').Object
      .on('update',function(chirp){
        var comment_preview = chirp.get('comment_preview');
        if(comment_preview && comment_preview[0]){
          BuiltApp.Class('comment').Object(comment_preview[0])
          .fetch()
          .then(function(comment){
            self.trigger({
              type: 'updated',
              chirp: chirp.set('comment_preview',[comment.toJSON()])
            });
          })
        }else{
          self.trigger({
              type: 'updated',
              chirp: chirp
            });
        }
    });  
  },
  onDeleteChirp: function(chirp){
    var self     = this;
    BuiltApp.Extension.execute('deleteChirp',{
      chirp_uid : chirp.get('uid')
    });
  },
  onAddNewChirp: function(content, images, post_to){
    var self    = this;
   // We keep the post_to property undefined if its not a channel post
   var requestBody = {
    content: content,
    images : images  
   }
   if(post_to)
    requestBody["post_to"] = post_to;
    
   BuiltApp.Extension.execute('createTweet',requestBody)
    .catch(function(error){
      var error = "Notice:  "+error.entity.error_message+"\n Error(s): \t"+ JSON.stringify(error.entity.errors.error);
      $.notify(error, JSON.stringify(error))
    })
  },
  onLike: function(chirp_uid) {
    BuiltApp.Extension
      .execute('like', {
        chirp_uid: chirp_uid
      });
  },
  onUnlike:function(chirp_uid){
    BuiltApp.Extension
      .execute('unlike', {
        chirp_uid: chirp_uid
      });
  }
});


module.exports.View = React.createClass({
  mixins: [Reflux.ListenerMixin],

  getInitialState:function(){
    return {
      liked                 : likeStates.unliked,
      showOverlay           : false,
      upvotes               : this.props.chirp.get('upvotes') || [],
      shouldShowCommentBox  : false
    }
  },
  componentDidMount: function(){
    if(this.doesCurrentUserLikeThePost(this.props)){
      this.setState({
        liked : likeStates.liked
      })
    }
  },
  componentWillReceiveProps: function(nextProps){
    var updatedLike  = this.doesCurrentUserLikeThePost(nextProps);
    var updatedState = {
      upvotes : nextProps.chirp.get('upvotes'),
      liked: updatedLike ? likeStates.liked : likeStates.unliked
    }
    this.setState(updatedState);
  },
  doesCurrentUserLikeThePost : function(props){
    var upvotes = props.chirp.get('upvotes');
    var user    = props.user;
    return upvotes ? ((upvotes.indexOf(user.get('uid')) === -1) ? false : true) : false;
  }, 
  getUserLink: function(username){
    return <a href={UserHelper.formLink(username)}>{username.replace('.', ' ')}</a>;
  },
  onChirpDelete: function(event){
    event.preventDefault();
    var shouldDelete = confirm("Do you really want to delete?")
    if(!shouldDelete){
      return;
    }
    var ref = $(this.refs.theChirpPanel.getDOMNode());
    ref.removeClass('fadeInDown').addClass('fadeOutRight');
    Actions.deleteChirp(this.props.chirp);
  },
  onLike: function(e){
    e.preventDefault();
    var uid       = this.props.chirp.get('uid');
    var user_uid  = this.props.user.get('uid');
    
    if(this.state.liked === likeStates.liked)
      Actions.unlike(uid);
    else 
      Actions.like(uid);

    this.setState({
      liked    : likeStates.loading
    });
  },
  removeUpvoter: function(user_uid){
    var upvotes = this.state.upvotes;
    upvotes.splice(upvotes.indexOf(user_uid),1);
    return upvotes;
  },
  formToolTip: function(usernames){
    return (usernames.length > 3) ? usernames.slice(0, 3).join(' , ') + ' and ' + (usernames.length - 3) + ' more' : usernames.join(' , ');
  },
  getUpvotersAccounts: function(upvotes){
    var self             = this;
    var indexOf          = function(uid) {return upvotes.indexOf(uid) >= 0}
    var indexFinder      = R.compose(indexOf, R.prop('uid'), R.prop('data'))
    return R.filter(indexFinder, self.props.accounts);
  },
  getUsernames: function(upvotes){
    var self = this;
    var upvotes         = this.props.chirp.get('upvotes') || [];
    var extractUsername = R.compose(R.prop('username'), R.prop('data'));  
    return R.map(extractUsername, self.getUpvotersAccounts(upvotes));
  },
  hideLikeOverlay: function(){
    this.setState({
      showOverlay:false
    });
  },
  showLikeOverlay: function(e){
    e.preventDefault();
    $(this.refs.theChirpPanel.getDOMNode())
    .removeClass('animated fadeInDown');
    this.setState({
      showOverlay : true,
    });
  },
  showCommentBox: function(e){
    e.preventDefault();
    this.setState({
      shouldShowCommentBox: true
    })
  },
  hideCommentBox: function(){
    this.setState({
      shouldShowCommentBox: false
    });
  },
  getLikeString: function() {
    var self       = this;
    var usernames  = this.getUsernames(this.state.upvotes);
    var youInLikes = R.contains(this.props.user.get('username'), usernames);
    if(youInLikes)
      usernames.unshift(usernames.splice(usernames.indexOf(this.props.user.get('username')), 1)[0]);

    var getFirstPart = function() {
      return <span>{ youInLikes ? 'You' : self.getUserLink(usernames[0])}</span>
    }
    
    var getMidPart = function() {
      if(usernames.length === 2)
        return <span> and {self.getUserLink(usernames[1])}</span>

      if(usernames.length > 2)
        return <span>, {self.getUserLink(usernames[1])} and <a href="#" onClick={self.showLikeOverlay}> {usernames.length -2} more</a></span>
    }

    var getLastPart = function() {
      if(usernames.length === 1)
        return <span>{youInLikes ? ' like this' : ' likes this'}</span>
      else
        return <span>like this</span>
    }

    return (
      <div className="c-like-string">{getFirstPart()} {getMidPart()} {getLastPart()}</div>
    )
  },
  findMatchingAccount: function(owner){
    return Utility.findItem(BuiltApp.Class('built_io_application_user').Object(owner), this.props.accounts, 'uid').toJSON();
  },
  render: function() {
    var self                 = this;
    var chirp                = this.props.chirp;
    var user                 = this.props.user;
    var owner                = this.findMatchingAccount(chirp.get('_owner'));
    var chirpOwner           = (user.get('uid') === chirp.get('_owner').uid)? true : false;
    var upvotes              = this.state.upvotes;
    var images               = chirp.get('images') || [];
    var comment_count        = chirp.get('comment_count');
    var usernames            = self.getUsernames(upvotes);
    var likeBtnClass         = this.state.liked ? "fa-thumbs-up":"fa-thumbs-o-up";
    var shouldShowCommentBox = this.state.shouldShowCommentBox;
    var likeString           = upvotes && upvotes.length ? this.getLikeString() : <span></span>;

    var getLikeState = function(){
      if(self.state.liked === likeStates.liked){
        return 'Unlike';
      } else if (self.state.liked === likeStates.unliked){
        return 'Like';
      } else {
        return <i className="fa fa-spin fa-circle-o-notch"></i>
      }
    }

    if(chirpOwner){
      owner = user.toJSON()
    }
    return ( 
      <div className="panel panel-default chirp-panel animated fadeInDown" ref='theChirpPanel'>
        <div className="panel-body">
            <div className="media">
              <a className = "media-left" href={UserHelper.formLink(owner.username)}>
                <img alt="image" className="c-image medium" src={UserHelper.getProfileImgUrl(owner)} data-holder-rendered="true" />
              </a>
              <div className="media-body">
                <h4 className="media-heading c-name">
                  <a href={UserHelper.formLink(owner.username)}>{owner.username}</a>
                  {chirpOwner ? <a title="Delete chirp" className="btn-delete-chirp fa fa-remove" onClick ={self.onChirpDelete} > </a> : null}
                </h4>
                <p title={UserHelper.formatDate(chirp.get('created_at'))} className="c-dtime"><i className="fa fa-clock-o mr5"></i>{UserHelper.getMomentFromNow(chirp)}</p>
                <p className="msg" dangerouslySetInnerHTML={{__html: UserHelper.linkTags(chirp.get('content'))}}></p>
              </div>
              <div>
                {
                  (images.length > 0)?<ImgSlider images={images} user={user}> </ImgSlider>:<div />
                }
              </div>
              
              {likeString}

              <div className="mt10">
                <div className="input-group">
                  <div className="input-group-btn">
                    <button className={"btn btn-default btn-like " + (this.state.liked === likeStates.loading ? ' disabled' : '')} onClick={this.onLike}>
                      <i className={'mr5 fa ' + likeBtnClass}></i>
                      {getLikeState()}
                    </button>
                  </div>
                  {
                   (!comment_count && !shouldShowCommentBox)
                   ? 
                    <input type="text" className="form-control" onFocus={self.showCommentBox} placeholder="Write a comment.."></input>
                   :
                    <div/> 
                  }
                </div>
              </div>
              {
                comment_count
                ?
                  <CommentSection accounts={this.props.accounts} user={user} chirp={chirp}></CommentSection>
                : ""
              }
              {
               (comment_count && !shouldShowCommentBox)
               ? 
                <input type="text" className="form-control" onFocus={self.showCommentBox} placeholder="Write a comment.."></input>
               :
                <div/> 
              }
            </div>
            {
              shouldShowCommentBox
              ?
                <CommentInput accounts={this.props.accounts} hideCommentBox={this.hideCommentBox} userProfileLink={UserHelper.formLink(user.get('username'))} chirp_uid={chirp.get('uid')} username={user.get('username')} profileImageLink={UserHelper.getProfileImgUrl(user.toJSON())}></CommentInput>
              :
                <div/>  
            }
        </div>
        {
          (this.state.showOverlay)? <OverlayUI upvoters={self.getUpvotersAccounts(upvotes)} user={user} hideOverlayCallback={self.hideLikeOverlay}/>: <div/>
        }
      </div>
    );
  }
});
