/** @jsx React.DOM */
/*
TO DO
*/
var React        = require('react');
var Reflux       = require('reflux');
var R            = require('ramda');
var when         = require('when');
var OverlayUI    = require('../../overlay').View;
var BuiltApp     = require('../../sdk').ChirpApp;
var ExtensionApp = require('../../sdk').ExtensionApp;
var UserHelper   = require('../user-helper');
var Utility      = require('../../utility');

var Actions = module.exports.Actions =  Reflux.createActions([
  'fetch',
  'add',
  'delete',
  'like',
  'unlike'
]);

var Store = module.exports.Store = Reflux.createStore({
  init: function() {
    var self = this;
    self.listenToMany(Actions);

    BuiltApp.Class('comment').Object
      .on('create',function(comment){
      self.trigger({
        type      : 'created',
        chirp_uid : comment.get('chirp_uid')[0],
        comment   : comment
      });
    });
    BuiltApp.Class('comment').Object
      .on('delete',function(comment){
      self.trigger({
        type      : 'deleted',
        chirp_uid : comment.get('chirp_uid')[0],
        comment   : comment
      });
    });
    BuiltApp.Class('comment').Object
      .on('update',function(comment){
        self.trigger({
          type      : 'updated',
          chirp_uid : comment.get('chirp_uid')[0],
          comment   : comment
        });
    });  
  },
  onFetch: function(chirp_uid, timestamp){
    var self = this;
    BuiltApp.Class('comment').Query()
    .includeOwner()
    .includeCount()
    .limit(3)
    .lessThan('created_at', timestamp)
    .descending('created_at')
    .where('chirp_uid',chirp_uid)
    .exec()
    .spread(function(comments, count){
      self.trigger({
        type      : 'fetched',
        chirp_uid : chirp_uid,
        comments  : comments,
        count     : count
      });
    })
  },
  onDelete: function(uid, chirp_uid){
    var self = this;
    BuiltApp.Extension.execute('deleteComment', {
      comment_uid : uid,
      chirp_uid   : chirp_uid
    });
  },
  onAdd: function(comment){
    var self = this;
    BuiltApp.Extension.execute('addComment',comment)
  },
  onLike: function(comment_uid) {
    BuiltApp.Extension
      .execute('likeComment', {
        comment_uid: comment_uid
      });
  },
  onUnlike:function(comment_uid){
    BuiltApp.Extension
      .execute('unlikeComment', {
        comment_uid: comment_uid
      });
  }
});

var likeStates = {
  unliked : 0,
  liked   : 1,
  loading : 2
}

module.exports.View = React.createClass({
  getInitialState:function(){
    return {
      liked                 : likeStates.unliked,
      showOverlay           : false,
      upvotes               : this.props.comment.get('upvotes') || []
    }
  }, 
  componentDidMount: function(){
    if(this.doesCurrentUserLikeTheComment(this.props)){
      this.setState({
        liked : likeStates.liked
      })
    }
  },
  componentWillReceiveProps: function(nextProps){
    var updatedLike  = this.doesCurrentUserLikeTheComment(nextProps);
    var updatedState = {
      upvotes : nextProps.comment.get('upvotes'),
      liked: updatedLike ? likeStates.liked : likeStates.unliked
    }
    this.setState(updatedState);
  },
  doesCurrentUserLikeTheComment : function(props){
    var upvotes = props.comment.get('upvotes');
    var user    = props.user;
    return upvotes ? ((upvotes.indexOf(user.get('uid')) === -1) ? false : true) : false;
  },
  formName: function(user){
    return '#/dashboard/u/'+user.username+'/timeline';
  },
  onCommentDelete: function(e){
    var self = this;
    e.preventDefault();
    var shouldDelete = confirm("Do you really want to delete?")
    if(!shouldDelete){
      return;
    }
    var ref = $(this.refs.theComment.getDOMNode());
    ref.removeClass('fadeIn').addClass('fadeOut');
    Actions.delete(this.props.comment.get('uid'), self.props.chirp.get('uid'));
  },
  findMatchingAccount: function(owner){
    return Utility.findItem(BuiltApp.Class('built_io_application_user').Object(owner), this.props.accounts, 'uid').toJSON();
  },
  onLike: function(e){
    e.preventDefault();
    var uid       = this.props.comment.get('uid');
    var user_uid  = this.props.user.get('uid');
    
    if(this.state.liked === likeStates.liked)
      Actions.unlike(uid);
    else 
      Actions.like(uid);

    this.setState({
      liked    : likeStates.loading
    });
  },
  getUpvotersAccounts: function(upvotes){
    var self             = this;
    var indexOf          = function(uid) {return upvotes.indexOf(uid) >= 0}
    var indexFinder      = R.compose(indexOf, R.prop('uid'), R.prop('data'))

    return R.filter(indexFinder, self.props.accounts);
  },
  hideLikeOverlay: function(){
    this.setState({
      showOverlay:false
    });
  },
  showLikeOverlay: function(e){
    e.preventDefault();
    $(this.refs.theComment.getDOMNode())
      .removeClass('animated fadeIn');
    $(this.refs.theComment.getDOMNode()).closest('.chirp-panel').removeClass('animated fadeInDown');
    this.setState({
      showOverlay : true,
    });
  },
  render: function() {
    var self         = this;
    var comment      = this.props.comment;
    var user         = this.props.user;
    var owner        = this.findMatchingAccount(comment.get('_owner'));
    var commentOwner = (owner.uid === user.get('uid'))? true : false;
    var upvotes      = this.state.upvotes || [];
    var getLikeState = function(){
      if(self.state.liked === likeStates.liked){
        return 'Unlike';
      } else if (self.state.liked === likeStates.unliked){
        return 'Like';
      } else {
        return <i className="fa fa-spin fa-circle-o-notch"></i>
      }
    }
    
    return ( 
      <div className="list-item animated fadeIn" ref="theComment">
        <div className="media">
          <a className = "media-left" href={self.formName(owner)}>
            <img alt="image" className="c-image xsmall" src={UserHelper.getProfileImgUrl(owner)} data-holder-rendered="true" />
          </a>
          <div className="media-body">
            <h4 className="media-heading c-name">
              <a href={self.formName(owner)}>{owner.username}</a>
              {commentOwner ? <a title="Delete comment" className="btn-delete-chirp fa fa-remove" onClick ={self.onCommentDelete} > </a> : null}
            </h4>
            <span title={UserHelper.formatDate(comment.get('created_at'))} className="c-dtime"><i className="fa fa-clock-o mr5"></i>{UserHelper.getMomentFromNow(comment)}</span>
            <a className={"btn btn-link btn-comment-like" + (this.state.liked === likeStates.loading ? ' disabled' : '')} onClick={this.onLike}>
              {getLikeState()}
            </a>
            <span>
              {
                (upvotes.length > 0)
                ?
                <a href="#" onClick={self.showLikeOverlay}>
                  {upvotes.length} <i className={'mr5 fa fa-thumbs-o-up'}></i> 
                </a>
                : null
              }
              </span>
            <p className="msg" dangerouslySetInnerHTML={{__html: UserHelper.linkTags(comment.get('content'))}}></p>
          </div>
      </div>
      {
        (this.state.showOverlay)? <OverlayUI upvoters={self.getUpvotersAccounts(upvotes)} user={user} hideOverlayCallback={self.hideLikeOverlay}/>: <div/>
      }
    </div>
    );
  }
});

