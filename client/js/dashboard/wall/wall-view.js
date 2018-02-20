/** @jsx React.DOM */

var React                        = require('react/addons');
var Router                       = require('react-router');
var Reflux                       = require('reflux');
var InfiniteScroll               = require('react-infinite-scroll')(React);

var PostView                     = require('./../widgets/postbox-view');
var ChirpView                    = require('./../chirp').View;
var Feed                         = require('./feed');
var WhoToFollow                  = require('./whotofollow');
var OnlineUsers                  = require('./online-users').View; 
var PublicChannelsWidget         = require('../widgets/public-channels').View;
var PrivateChannelsWidget        = require('../widgets/private-channels').View;
var AnnouncementChannelsWidget   = require('../widgets/announcements').View;

module.exports = React.createClass({
  mixins: [Reflux.ListenerMixin, Router.Navigation],
  getInitialState: function(){
    return {                                                                                                                                                                                      
      chirps  : undefined,
      hasMore : true
    }
  },
  componentDidMount: function() {
    var self        = this;
    this.intervalID = self.startInterval();
    self.listenTo(Feed.Store, self.onChange, self.onChange);
  },
  componentWillUnmount: function(){
    window.clearInterval(this.intervalID);
  },
  startInterval: function(){
    var self = this;
    return window.setInterval(function(){
      self.forceUpdate();
    },1000*60);
  },
  infiniteScroll:function(){
    var self       = this;
    var chirps     = self.state.chirps;
    var timestamp  = new Date();
    if(chirps && chirps.length > 0){
      timestamp = new Date(chirps[chirps.length-1].get('updated_at'));
    }
    Feed.Actions.fetch(self.props.user, timestamp);
  },
  onChange:function(newChirps){
    var self = this;
    if(newChirps !== null){
      this.setState({
        chirps  : newChirps,
        hasMore : self.setHasMore(newChirps)
      });
    }else{
      // As the user state is changed we need to inform infinite scrolling to fetch new chirps
      this.setState({
        hasMore: true
      })
    }
  },
  setHasMore: function(newChirps){
    var self   = this;
    var chirps = self.state.chirps;
    
    if(chirps && chirps.length > 0 && (newChirps.length - chirps.length) < 12){
      return false;
    }
    else
      return true;
  },
  render: function() {
    var self        = this;
    var chirps      = self.state.chirps; 
    var user        = self.props.user;
    var accounts    = self.props.accounts;
    var hasMore     = self.state.hasMore;
    var chirpsExist = !!chirps;
    var ChirpsList  = <div className="page-loader rel-pl clearfix">
                        <img src="img/page-loader.gif" alt=""></img>
                      </div>

    if(chirpsExist){
      ChirpsList = <InfiniteScroll
                          pageStart = '0'
                          loadMore  = {self.infiniteScroll}
                          threshold = '400'
                          hasMore   = {hasMore}
                          loader    = {
                            <div className="page-loader clearfix">
                              <img src="img/page-loader.gif" alt=""></img>
                            </div>
                          }>
                            {
                            chirps.length > 0
                            ?
                              chirps.map(function(chirp){
                                return <ChirpView chirp={chirp} accounts={accounts} account={user} user={user} key={chirp.get('uid')} />; // here the account is same as current user
                              })
                             
                            :
                              <p className="no-msg"> No chirps to display </p>
                            }
                        </InfiniteScroll>;      
    }
    return (
      <div className="container">
        <div className="row">
          <div className="col-md-4">
            <PostView accounts={accounts} user={user} post_to={null}/>
            <AnnouncementChannelsWidget user={user}/>
            <PrivateChannelsWidget user={user}/>
            <PublicChannelsWidget user={user}/>
            <OnlineUsers accounts={accounts}/>
            <WhoToFollow user={user}></WhoToFollow>
            <div className= "well well-sm powered-box"> 
              <a href="http://built.io" target="_blank">
                <img src="img/powered.png" alt=""></img>
              </a>
            </div>
          </div>
          <div className="col-md-8">
            <div>
              {ChirpsList}
            </div>
          </div>
        </div>
      </div>
    )
  }
});