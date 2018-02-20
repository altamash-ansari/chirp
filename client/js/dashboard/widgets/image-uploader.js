// Props
//onCancel => Callback to be invoked when user click on cancel
//onComplete => Callback to be called when upload is complete

var React                   = require('react');
var InfiniteScroll          = require('react-infinite-scroll')(React);
var R                       = require('ramda');
var Router                  = require('react-router');
var Reflux                  = require('reflux');
var ImgResizer              = require('./../image-resizer');
var BuiltApp                = require('../../sdk').ChirpApp;
var UserState               = require('../../user-state');

module.exports = React.createClass({
  getInitialState: function(){
    return {
      //Whether the image is currently being uploaded
      isUploading: false,
      filename: null
    }
  },
  onCancelImageUploadBtnClick: function(){
    this.props.onCancel();
  },
  onFileUpload: function(input){
    var self          = this;
    var fileObj       = input.target.files[0];

    if(fileObj){
      this.setState({
        isUploading : true
      })
    }
    var theCropperBox = $(this.refs.theCropperBox.getDOMNode());
    // To persist the filename on built.io
    self.setState({
      filename: fileObj.name
    });
    if(fileObj.size > 10485760){
      $.notify("The image size should not be greater than 10MB", "error");
    }
    else{
      if (window.FileReader === undefined)
        return;

      var reader = new FileReader();
      reader.onload = (function(theFile) {
        return function(e) {
         theCropperBox.attr("src", e.target.result).width(300).height(300);
         theCropperBox.cropper({
            data: {
              x: 220,
              y: 50
            },
            modal: true,
            resizable: true,
            zoomable: true,
         })
        }
      })(fileObj);
      reader.readAsDataURL(fileObj);
    }
  },
  onSaveImg: function(e){
    var self = this;
    e.preventDefault();
    var self          = this;
    var button        = $(e.currentTarget);
    var theCropperBox = $(this.refs.theCropperBox.getDOMNode());
    var dataURL       = theCropperBox.cropper("getDataURL");
    var image         = new Image();
    image.src         = dataURL;
    var blob          = ImgResizer.resizeImage(image, 250);
    var fd            = new FormData();

    button.button('loading');
    var jpgName = self.state.filename.split('.');
    jpgName[jpgName.length - 1] = 'jpg';
    jpgName     = jpgName.join(".");
    fd.append("upload[upload]", blob, jpgName);
    var upload  = BuiltApp
      .Upload()
      .setFile(fd);
    if (self.props.profile.get('avatar') && self.props.profile.get('avatar').uid) {
      upload
        .setUid(self.props.profile.get('avatar').uid)
        .save()
        .then(function(upload) {
          self.props.onComplete(upload.getUid())
          self.resetImageUpload()
          self.setState({
            isUploading: false
          });
        })
        .finally(function() {
          button.button('reset');
        });
    } else {
      upload
        .save()
        .then(function(upload) {
          self.props.onComplete(upload.getUid());
          self.resetImageUpload();
          self.setState({
            isUploading: false
          });
        }).finally(function() {
          button.button('reset');
        });
    }
  },
  resetImageUpload: function(){
    var cropperImage = $(this.refs.theCropperBox.getDOMNode());
    if(cropperImage.cropper){
      cropperImage.cropper('destroy');
    }
    cropperImage.attr('src','');
    this.refs.theImageUploadForm.getDOMNode().reset();
  },
  render: function(){
    var self = this;
    return (
      <div className="p-image-upload-box" ref='theImageUploadBox'>
        {
          !self.state.isUploading
          ?
            <div className="p-dnd-wrap" ref="theDndWrap">
              <form ref="theImageUploadForm">
                <div title="Choose media files" className="btn btn-primary btn-choose-image file-input-wrapper">
                  <input type="file" ref="theFileInput" onChange={self.onFileUpload} max={1}></input>
                  Choose an image
                </div>
              </form>
            </div>
          :
            null
        }
        <div className="image-crop-wrap" ref="theImageCropWrap">
          <img className='' src ='' ref='theCropperBox'/>
        </div>
        <div className="clearfix button-wrap">
          <button className='btn btn-default pull-left' onClick={self.onCancelImageUploadBtnClick}>Cancel</button>
          <button className='btn btn-primary pull-right' onClick={self.onSaveImg} data-loading-text="Uploading..." disabled={!this.state.isUploading}>Upload</button> 
        </div>
      </div>                     
    )
  }
});