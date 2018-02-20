/** @jsx React.DOM */

var React = require('react');

module.exports = React.createClass({
  render: function() {
  	var elClass = 'page-loader clearfix ' + this.props.extraClass || '';
    return (
      <div className={elClass}>
        <img src="img/page-loader.gif" alt=""></img>
      </div>
    )
  }
})