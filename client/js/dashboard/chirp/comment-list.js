/** @jsx React.DOM */
var React        = require('react');
var Reflux       = require('reflux')
var Comment      = require('./comment');
var CommentView  = Comment.View;
var R            = require('ramda');

module.exports =  React.createClass({
  render: function () {
    var accounts     = this.props.accounts
    var comments = this.props.comments;
    var user     = this.props.user;
    var chirp    = this.props.chirp;
    return(
      <div>
        {
          R.reverse(comments).map(function(comment){
            return <CommentView accounts={accounts} comment={comment} user={user} key={comment.get('uid')} chirp={chirp} ></CommentView>
          })
        }
      </div>
    )
  }
});