/** @jsx React.DOM */
var React          = require('react');
var Reflux         = require('reflux');
var Router         = require('react-router');
var R              = require('ramda');
var BuiltApp       = require('./../../sdk').ChirpApp;
var Chirp          = require('./../chirp');
var ChirpView      = Chirp.View;
var InfiniteScroll = require('react-infinite-scroll')(React);
var Actions = module.exports.Actions =  Reflux.createActions([
  'search',
  'clear'
]);

var Store = module.exports.Store = Reflux.createStore({
  init: function() {
    this.chirps = null;
    this.listenToMany(Actions);
    this.listenTo(Chirp.Store, this.onChirpChange);  
  },
  getChirps: function(){
    return this.chirps;
  },
  onChirpChange: function(data){
    var self = this;
    switch(data.type){
      case 'deleted':
        var chirps = this.getChirps(); 
        if(chirps){
          var index = self.findChirpIndex(data.chirp, chirps);
          if(index > -1){
            chirps.splice(index,1)
            self.change(chirps);
          }
        }
        break;
      case 'updated':
        var chirps = this.getChirps();
        if(chirps){
          var index  = self.findChirpIndex(data.chirp, chirps);
          if(index > -1){
            chirps[index] = data.chirp;
            self.change(chirps);
          }
        } 
        break;
    }
  },
  findChirpIndex : function(chirp, chirps){
    var indexFinder = R.compose(R.propEq('uid', chirp.get('uid')),R.prop('data'))
    return R.findIndex(indexFinder, chirps);
  }, 
  getInitialState: function(){
    return this.chirps;
  },
  change: function(newChirps){
    this.chirps = newChirps
    this.trigger(newChirps);
  },
  append: function(newChirps){
    var chirps = this.chirps || [];
    this.change(chirps.concat(newChirps));
  },
  onClear: function(){
    this.change([]);
  },  
  onSearch: function(searchTerm, timestamp){
    var self = this;
    var contentQuery = BuiltApp.Class('tweet').Query()
      .matches('content', searchTerm, 'i');

    var appUserQuery = BuiltApp.Class('built_io_application_user').Query()
      .matches('username', searchTerm, 'i');

    var selectQuery = BuiltApp.Class('tweet').Query()
      .select('app_user_object_uid', appUserQuery, 'uid');

    BuiltApp.Class('tweet').Query()
      .or([contentQuery, selectQuery])
      .includeOwner()
      .include(['comment_preview'])
      .descending('updated_at')
      .lessThan('updated_at',timestamp)
      .limit(12)
      .exec() 
      .then(function(newChirps){
        self.append(newChirps)
    });
  }
});

module.exports.View = React.createClass({
  mixins: [Reflux.ListenerMixin, Router.Navigation],
  getInitialState: function(){
    return {
      chirps  : undefined,
      hasMore : true
    }
  },
  componentDidMount: function(){
    Actions.clear();
    this.listenTo(Store, this.onChirps, this.onChirps);
  },
  componentWillUnmount: function(){
    Actions.clear();
  },
  componentWillReceiveProps: function(nextProps){
    Actions.clear();
    Actions.search(nextProps.searchTerm, new Date()); 
  },
  infiniteScroll: function(){
    var chirps     = this.state.chirps;
    var timestamp  = new Date();
    if(chirps && chirps.length > 0){
      timestamp = new Date(chirps[chirps.length-1].get('updated_at'));
    }
    Actions.search(this.props.searchTerm, timestamp);
  },
  onChirps:function(newChirps){
    var self = this;
    this.setState({
      chirps  : newChirps,
      hasMore : self.setHasMore(newChirps)
    });
  },
  setHasMore: function(newChirps){
    var self   = this;
    var chirps = self.state.chirps;
    
    if(chirps && (newChirps.length - chirps.length) < 12){
      return false;
    }
    else
      return true;
  },
  render: function(){
    var self        = this;
    var chirps      = self.state.chirps;
    var hasMore     = this.state.hasMore;
    var user        = this.props.user; 
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
                            return <ChirpView accounts={self.props.accounts} chirp={chirp} account={user} user={user} key={chirp.get('uid')} />; // here the account is same as current user
                          })
                        :
                          <p className="no-msg"> No chirps to display </p>
                        }
                      </InfiniteScroll>;
    }
    return (
      <div>
        {ChirpsList}
      </div>
    );
  }
});