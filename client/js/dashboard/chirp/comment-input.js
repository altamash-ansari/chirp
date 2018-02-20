var React        = require('react');
var Comment      = require('./comment');

module.exports =  React.createClass({
  getInitialState: function(){
    return({
      canComment: false
    });
  },
  componentDidMount: function() {
    var theCommentBox  = $(this.refs.theCommentBox.getDOMNode());
    var accounts       = this.props.accounts;
    theCommentBox.mentionsInput({ //mentions input
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
    this.refs.theCommentBox.getDOMNode().focus(); // Text area should be in focus
  },
  addComment: function(e){
    e.preventDefault()
    var self = this;
    var theCommentBox = this.refs.theCommentBox.getDOMNode();;
    if (theCommentBox.value.trim() === "") {
      $.notify("Cannot post a blank comment","info");
      return 
    }
    Comment.Actions.add({
      content   : theCommentBox.value.trim(),
      chirp_uid : self.props.chirp_uid
    });
    theCommentBox.value = '';
    this.setState({
      canComment : false
    });
    self.props.hideCommentBox();
  },
  cancelComment: function(e){
    e.preventDefault();
    this.props.hideCommentBox();
  },
  onKeyUp: function(){
    var commentBoxDom = this.refs.theCommentBox.getDOMNode(); 
    if(commentBoxDom.value.length > 0){
      this.setState({
        canComment : true
      });
    }else{
      this.setState({
        canComment: false
      })
    }
  },
  render:function(){
    var userProfileLink   = this.props.userProfileLink;
    var username          = this.props.username;
    var profileImageLink  = this.props.profileImageLink;
    return (
      <div className="media">
        <a className = "media-left" href={userProfileLink}>
          <img alt="image" className="c-image xsmall" src={profileImageLink} data-holder-rendered="true" />
        </a>
        <div className="media-body">
          <div className="form-group">
            <textarea className="form-control mb10 mention" ref='theCommentBox'  placeholder="Write a comment..." rows="3" onKeyUp={this.onKeyUp} onChange={this.onKeyUp}></textarea>      
            <div>
              <button className="btn btn-success btn-sm" disabled={!this.state.canComment} onClick={this.addComment}>
                Post Comment
              </button>
              <button className="btn btn-default btn-sm ml10" onClick={this.cancelComment}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
})