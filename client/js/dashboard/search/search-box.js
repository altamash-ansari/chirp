/** @jsx React.DOM */

var React     = require('react');
var Reflux    = require('reflux');
var Router    = require('react-router');

module.exports = React.createClass({
  mixins: [Router.State],
  onSearch: function(e){
    e.preventDefault();
    var theSearchInput = this.refs.theSearchInput.getDOMNode();
    var searchTerm = theSearchInput.value;
    searchTerm = this.extractSearchTerm(searchTerm);
    if(window.location.hash.match(".*\/users\?")){
      window.location.hash='#/dashboard/search/users?q='+searchTerm
      return;
    }
    window.location.hash='#/dashboard/search/chirps?q='+searchTerm
  },
  extractSearchTerm: function(searchTerm){
    if (searchTerm.match('@')){
      searchTerm = this.search_delim('@', searchTerm, 0);
    }
    if(searchTerm.match('#')){
     searchTerm = this.search_delim('#', searchTerm, 0); 
    }
    return searchTerm;
  },
  search_delim: function(delim, searchTerm, length) {
    if (searchTerm.indexOf(delim, length) >= 0) {
      if (length == 0)
        var begin = searchTerm.slice(0, searchTerm.indexOf(delim, length));
      else
        begin = '';
      var start = searchTerm.indexOf(delim, length) + 1;
      var end = start;
      if (searchTerm.substr(start).search(/[^a-zA-Z]/) > 0)
        end = searchTerm.substr(start).search(/[^a-zA-Z]/) + start;
      else
        end = searchTerm.length;
      return (begin.concat(searchTerm.slice(start, end))).concat(this.search_delim(delim, searchTerm, end));
    } else {
      return [];
    }
  },
  render: function() {
    var self = this;
    var user = this.props.user;    
    return (
      <form className="navbar-form navbar-right" onSubmit={this.onSearch}>
        <div className="form-group">
          <input className="form-control search-box" defaultValue={this.getQuery().q} type="text" name="Search" placeholder="Search.." ref='theSearchInput'></input>
        </div>
      </form>
    );
  }
});
