var React        = require('react');
var Reflux       = require('reflux');


module.exports.View = React.createClass({
  componentDidMount: function() {
    var self = this;
    var itemCount  = 3;
    var theImgGallery = $(this.refs.theImgGallery.getDOMNode());
    theImgGallery.owlCarousel({
      slideSpeed: 300,
      paginationSpeed: 400,
      items: itemCount,
      afterInit: function(){
        self.initImageGallery(theImgGallery);
      }
    });

  },
  initImageGallery: function(el){
    var imageDivs = el.find('.owl-item');
    for (var i = 0; i < imageDivs.length; i++) {
      var owlItem = imageDivs.eq(i);
      owlItem.attr('data-src', owlItem.find('img').attr('src'));
    };
    el.find('.owl-wrapper').lightGallery();
  },
  render: function (argument) {
    var images    = this.props.images;
    var authtoken = this.props.user.app.getHeaders().authtoken; 
    return (
      <div ref='theImgGallery' className="owl-carousel c-img-gal">
          {
            images.map(function(image){
              var imageUrl = image.url + "?AUTHTOKEN=" + authtoken;
              return (
                <div className="item c-gal-item" style={{backgroundImage: 'url('+imageUrl+')'}} key={image.uid}>
                  <img className="hide" src={imageUrl}> </img>
                </div>
              )
            })
          }
      </div>
    );
  }
});