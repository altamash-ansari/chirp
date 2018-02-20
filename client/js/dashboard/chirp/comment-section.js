/** @jsx React.DOM */
var React         = require('react');
var Reflux        = require('reflux')
var R             = require('ramda');
var Utility       = require('./../../utility');
var CommentList   = require('./comment-list');
var Comment       = require('./comment');
var BuiltApp      = require('./../../sdk').ChirpApp;
var CommentView   = Comment.View;
var AccountsStore = require('./../accounts').Store;

module.exports =  React.createClass({
  mixins: [Reflux.ListenerMixin],
  getInitialState: function(){
    return{
      comments     : null,
      commentCount : 0
    }
  },
  componentDidMount: function(){
    this.listenTo(Comment.Store, this.onCommentChange);
  },
  componentWillMount: function(){
    var self            = this;
    var comment_count   = this.props.chirp.get('comment_count');
    var comment_preview = this.props.chirp.get('comment_preview');
    if(comment_preview && comment_preview[0]){
      var comment_preview = this.wrapObjNIncOwner();
      this.updateCommentState([comment_preview], comment_count);
    }else{
      this.updateCommentState(this.state.comments, comment_count);
    }
  },
  componentWillReceiveProps: function(nextProps){
    var comment_count   = nextProps.chirp.get('comment_count');
    this.updateCommentState(this.state.comments, comment_count);
  },
  wrapObjNIncOwner: function(){
    var comment_preview = this.props.chirp.get('comment_preview')[0]; // Wrapping comment_preview object with BuiltObject and including _owner
    comment_preview     = BuiltApp.Class('tweet')
    .Object(comment_preview)
    .assign({
      _owner: AccountsStore.getAccountForUid(comment_preview.app_user_object_uid)
    });
    return comment_preview;
  },
  onCommentChange: function(data){
    var self = this;
    if(data.chirp_uid === this.props.chirp.get('uid')){
      switch(data.type){
        case 'created':
          var comments = this.getComments();
          comments.unshift(data.comment)
          this.updateCommentState(comments, ++this.state.commentCount);
          break;
        case 'deleted':
          var comments = this.getComments(); 
          var index    = Utility.findItemIndex(data.comment, comments, 'uid');
          if(index > -1){
            comments.splice(index,1)
            this.updateCommentState(comments, --this.state.commentCount);
          }
          break;
        case 'updated':
          var comments = this.getComments(); 
          var index    = Utility.findItemIndex(data.comment, comments, 'uid');
          if(index > -1){
            comments[index] = data.comment;
            self.updateCommentState(comments, this.state.commentCount)
          }
          break;
        case 'fetched':
          var comments = this.getComments().concat(data.comments);; 
          if(this.state.comments && this.state.comments.length){
            data.count = this.state.commentCount;
          }
          this.updateCommentState(comments, data.count);
          break;
      }
    }
  },
  updateCommentState: function(comments, totalCommentCount){
    this.setState({
      comments     : comments,
      commentCount : totalCommentCount
    })
  },
  getComments: function(){
    return this.state.comments || [];
  },
  formName: function(owner){
    return '#/dashboard/u/'+owner.username+'/timeline';
  },
  onViewPreviousComments: function(e){
    e.preventDefault();
    var comments  = this.getComments();
    var timestamp = new Date();
     if(comments.length > 0){
      timestamp = new Date(comments[comments.length-1].get('created_at'));
    }
    Comment.Actions.fetch(this.props.chirp.get('uid'), timestamp);
  },
  render: function () {
    var self              = this;
    var comments          = this.state.comments;
    var commentCount      = this.state.commentCount;
    var commentsExist     = (self.getComments().length > 0) ? true : false;
    var user              = this.props.user;
    var chirp             = this.props.chirp;
    var remainingComments = commentCount - self.getComments().length;

    return(
      <div className="comments-wrap">
        <div>
          {
            (remainingComments > 0)
              ?
                <p className="previous-comments-bar">
                  <a href="#" onClick={this.onViewPreviousComments} >  
                      {
                        remainingComments > 1 ? "View " + remainingComments + " more comments" : "View "+remainingComments + " more comment" 
                      }
                  </a>
                  <i className="ml5 fa fa-chevron-down"></i>
                </p>
              :
                <div/>
          }
        </div>
        <div>
          {
            (commentsExist)
            ?
            <CommentList accounts={this.props.accounts} comments={comments} user={user} chirp={chirp}></CommentList>
            :
            <div/>
          }
        </div>          
      </div>  
    )
  }
});
