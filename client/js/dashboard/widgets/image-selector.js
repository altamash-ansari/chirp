var React         = require('react');
var when          = require('when');
var whenCallback  = require('when/callbacks');
var R             = require('ramda');

var App           = require('./../../sdk').ChirpApp;
var ImgResizer    = require('./../image-resizer');
var Utility       = require('./../../utility');

var image_size = 800;

var UploadItem = React.createClass({
  onRemove: function (e) {
    e.preventDefault();
    this.props.onRemoveImage(this.props.image);
  },
  bytesToSize: function(bytes) {
  if (isNaN(bytes))
    return bytes;

  var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
  },
  render: function(){
    var name        = this.props.image.name;
    var size        = this.bytesToSize(this.props.image.size);
    var progress    = this.props.progress;
    
    var styleObj = {
      width: Math.ceil(progress) + "%"
    }

    var apItemStatus = '';

    switch (this.props.uploadState){
      case 'ready':
      apItemStatus = (
                      <div className="ap-default">
                        Ready to upload
                      </div>
                     )
      break;

      case 'uploading':
      apItemStatus = (
                      <div className="progress progress-striped active ap-progress">
                        <div className="progress-bar progress-bar-success"  role="progressbar" ariaValuemin="0" ariaValuemax="100" style={styleObj}></div>
                      </div>
                     )
      break;

      case 'success':
      apItemStatus = (
                      <div className="ap-success">
                        Complete
                      </div>
                     )
      break;

      case 'error':
      apItemStatus = (
                      <div className="ap-error">
                        Error
                      </div>
                     )
      break;
    }

    return (
      <div className="media ap-item">
        {
          !this.props.startUpload 
          ?
          <button type="button" className="close" onClick={this.onRemove} aria-hidden="true">×</button>
          :
          <div/>
        }
        <div className="ap-thumb media-left"></div>
        <div className="media-body">
          <p className="text-ellipsis ap-name">{name}</p>
          <p className="ap-size">{size}</p>
          {apItemStatus}
        </div>
      </div>
    )
  }
})

module.exports.View = React.createClass({
  getInitialState: function(){
    return {
      uploadImages   : []
    }
  },
  onCancel: function(e){
    e.preventDefault();
    this.props.onCancelUpload();
  },
  componentWillReceiveProps: function (nextProps) {
    var uploadPromises = R.map(function (upload) { //extracts promises from deferred object
      return upload.deferred.promise;
    },this.state.uploadImages);

    if(this.props.startUpload === false &&  nextProps.startUpload === true){
      if(nextProps.startUpload){
        if(this.state.uploadImages.length === 0){
          nextProps.onImageUpload([]);
        }else{
          this.setupOnCompleteListener(uploadPromises);
          this.startUpload();
        }
      }
    }
  },
  componentDidMount: function(){
    this.setUpListenerForDragNDrop()
  },
  setUpListenerForDragNDrop: function(){
    var self = this;
    var theDragDropZone = $(this.refs.theDragDropZone.getDOMNode());
    $(theDragDropZone).off('dragover dragenter dragleave').on('dragover dragenter dragleave', function(e) {
      e.preventDefault();
      e.stopPropagation();
    });

    $(theDragDropZone).off('drop').on('drop', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var dataTransfer = e.originalEvent.dataTransfer;
      if (dataTransfer && dataTransfer.files.length) {
          var fileObjs       = dataTransfer.files;
          var fileArray      = self.state.uploadImages.concat(); // clone 
          self.processSelectedImages(fileObjs, fileArray);
      }
    });
  },
  setupOnCompleteListener: function (promiseArray) { // notifies parent component that image uploading is done
    var self = this;
    if(promiseArray.length > 0){
      when.all(promiseArray)
      .then(function (array) {
        self.props.onImageUpload(array);
      });
    }
  },
  onImageSelected: function(input){
    var self = this;
    var fileObjs       = input.target.files;
    var fileArray      = this.state.uploadImages.concat(); // clone 
    this.processSelectedImages(fileObjs, fileArray);
  },
  processSelectedImages: function(fileObjs, fileArray) {
    for (var i = fileObjs.length -1; i >=0; i--) {
      var deferred = when.defer();
      fileArray.push({
        image          : fileObjs[i],
        deferred       : deferred,
        progress       : 0,
        uploadPromises : 'ready'
      })
    };
    this.setState({
      uploadImages   : fileArray
    });
  },
  onRemoveImage:function (image) {
    var self             = this;
    var uploadImages     = self.state.uploadImages;
    var index            = self.findUploadIndex(image)
    uploadImages.splice(index, 1);

    this.setState({
      uploadImages   : uploadImages
    });
  },
  findUploadIndex: function(image){
    var uploadImages = this.state.uploadImages;
    return R.findIndex(R.eq(image))(R.map(R.prop('image'),uploadImages))
  },
  startUpload: function() {
    var self         = this;
    var uploadImages = this.state.uploadImages;
    var tasks = uploadImages.map(function(upload) {
      return function() {
        var uploadIndex = self.findUploadIndex(upload.image);
        return self.convertNUpload(upload, uploadIndex);
      }
    });           
    Utility.sequence(tasks, when()); // resizes the images synchronously
  },
  convertNUpload: function(upload, uploadIndex){
    var self = this;
    return this.convertNResize(upload.image)
            .then(function(formData) {
              return self.uploadImage(formData, uploadIndex);
            })
  },
  convertNResize: function(file){
    var self = this;
    return this.convertToDataURI(file)
      .then(function(dataURI){
        var fd     = new FormData();
        var image  = new Image();
        image.src  = dataURI;
        fd.append("upload[upload]", ImgResizer.resizeImage(image, image_size), self.convertFileName(file.name));
        return fd;
      })
  },
  uploadImage: function (image, uploadIndex) {
    var self         = this;
    var uploadImages = this.state.uploadImages;  
    var upload       = uploadImages[uploadIndex]; 

    return App.Upload()
    .setFile(image)
    .save()
    .progress(function(data){
      var progress              = ((data.bytesUploaded/data.bytesTotal)*100);
      upload.progress           = progress;
      upload.uploadState        = 'uploading';
      uploadImages[uploadIndex] = upload;

      self.setState({
        uploadImages : uploadImages
      })
    })
    .then(function(image){
      upload.deferred.resolve(image.getUid())
      upload.uploadState    = 'success';
      uploadImages[uploadIndex] = upload;      
      self.setState({
        uploadImages : uploadImages
      })

    },function(){
      upload.deferred.reject()
      upload.uploadState    = 'error';
      uploadImages[uploadIndex] = upload;      
      self.setState({
        uploadImages : uploadImages
      });
    })
  },
  convertFileName: function (filename) {
    var jpgName = filename.split(".");
    jpgName[jpgName.length - 1] = 'jpg';
    return jpgName.join(".");
  },
  convertToDataURI: function(file){
    var reader = new FileReader();
    var deferred = when.defer();
    reader.readAsDataURL(file);

    reader.onload = (function(fileObj) {
      return function(e) {
        deferred.resolve(e.target.result);
      }
    })(file);
    return deferred.promise;
  },
  render: function (argument) {
    var self          = this;
    var startUpload   = this.props.startUpload;
    var uploadImages  = this.state.uploadImages;
    return (
      <div>
        <div className='image-selector' ref='theDragDropZone'>
          {
            (uploadImages.length> 0)

            ?
            
            <div className="clearfix is-upload-mode">
              {
                uploadImages.map(function(upload) {
                  return <UploadItem image={upload.image} uploadState={upload.uploadState} deferred={upload.deferred} progress={upload.progress} startUpload={startUpload} onRemoveImage={self.onRemoveImage} key={Math.random()}></UploadItem>
                })
              }
            </div>
            
            :
            
            <div className="clearfix is-default-mode">
              <p className="center-align">
                Drag and drop photos here 
              </p>
              <p className="bold-text center-align">
                OR
              </p>
              <p className="center-align">
                click on "Add photos" button to upload photos.
              </p>
            </div>
          }

        </div>
        <div className="btn-wrap">
          <div title="Choose media files" className="btn btn-success file-input-wrapper btn-sm">
            <input type="file" disabled={this.props.postingChirp} ref="theFileInput" onChange={this.onImageSelected} multiple accept="image/*"></input> Choose photos
          </div>
          <button type="button" disabled={this.props.postingChirp} className="btn btn-default btn-sm ml5" onClick={this.onCancel}>Cancel</button>
        </div>
    </div>
    );
  }
});