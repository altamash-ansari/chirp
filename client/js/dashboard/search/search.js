var React        = require('react');
var Reflux       = require('reflux');
var Router       = require('react-router');
var RouteHandler = Router.RouteHandler;
var Link         = Router.Link;

var View = module.exports.View = React.createClass({
  mixins: [Reflux.ListenerMixin, Router.Navigation, Router.State],
  render: function () {
    var self = this;
    return (
      <div className="container">
          <div className="row">
              <div className="col-md-4">
                <div className="list-group border-radius">
                  <div>
                    <Link to="chirp-view"   query={this.getQuery()} className='list-group-item'>Chirps</Link>
                    <Link to="user-view"    query={this.getQuery()} className='list-group-item'>Users</Link>
                    <Link to="channel-view" query={this.getQuery()} className='list-group-item'>Channels</Link>
                  </div>
                </div>
              </div>
              <div className="col-md-8">
                <div>
                  <RouteHandler accounts={this.props.accounts} searchTerm={this.getQuery().q} user={this.props.user} account={this.props.user}/>
                </div>
              </div>
          </div>
      </div>
    )
  }
});