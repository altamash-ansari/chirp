var React        = require('react');
var UserListItem = require('./user-list-item');

module.exports.View = React.createClass({
  componentDidMount: function(){
    var overlay = $(this.refs.theOverlay.getDOMNode())
    overlay.modal({
      show:'true',
      backdrop:'static'
    })
  },
  render: function (argument) {
    var upvoters = this.props.upvoters;
    var user     = this.props.user;
    return (
      <div className="modal fade" ref={'theOverlay'} role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <button type="button" className="close" onClick={this.props.hideOverlayCallback} data-dismiss="modal"><span aria-hidden="true">&times;</span><span className="sr-only">Close</span></button>
              <h4 className="modal-title">Likes</h4>
            </div>
            <div className="modal-body">
              {
                upvoters.map(function(account){
                  return <UserListItem  follow={account} user={user} key={account.get('uid')}/>
                })
              }
            </div>
          </div>
        </div>
      </div>
    );
  }
});
