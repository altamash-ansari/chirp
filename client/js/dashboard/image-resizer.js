var when = require('when');

module.exports.resizeQueue = [];

var dataURLToBlob = module.exports.dataURLToBlob = function(dataURL) {
  var BASE64_MARKER = ';base64,';
  if (dataURL.indexOf(BASE64_MARKER) == -1) {
    var parts = dataURL.split(',');
    var contentType = parts[0].split(':')[1];
    var raw = parts[1];

    return new Blob([raw], {type: contentType});
  }

  var parts       = dataURL.split(BASE64_MARKER);
  var contentType = parts[0].split(':')[1];
  var raw         = window.atob(parts[1]);
  var rawLength   = raw.length;

  var uInt8Array  = new Uint8Array(rawLength);

  for (var i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], {type: contentType});
}

var createCanvas = module.exports.createCanvas = function(){
   var canvas = document.createElement("Canvas");
    canvas.setAttribute("height",'0');
    canvas.setAttribute("width",'0');
    canvas.setAttribute("display",'none');
    document.body.appendChild(canvas);
    return canvas;
}

var resizeImage = module.exports.resizeImage = function(image, max_size){
  var max_size = max_size;
  var width    = image.width;
  var height   = image.height;
  if(max_size < width || max_size < height){
    if (width > height) {
      var ratio   = width / height
      width   = Math.round(ratio*max_size)
      height  = max_size
    } else {
      var ratio   = height / width
      height      = Math.round(ratio*max_size)
      width       = max_size
    }
  }
  var canvas = createCanvas();
  canvas.width  = width;
  canvas.height = height;
  canvas.getContext('2d').drawImage(image, 0, 0, width, height);
  var dataUrl   = canvas.toDataURL('image/jpeg');
  var result = dataURLToBlob(dataUrl);
  canvas.remove();
  return result;
}


module.exports.whenDone = function(val, cb) {
 return when(val).then(cb)
}

module.exports.asyncResizeImage = function(image, max_size, canvas){
  var deferred = when.defer();
  resizeQueue.push({
    deferred : deferred,
    image    : image,
    max_size : max_size,
    canvas   : canvas
  });
  return deferred.promise;
}

module.exports.startResizing = function(){
  var tasks = resizeQueue.map(function(obj){
    return function(){
      return resizeImage(obj.image, obj.max_size, obj.canvas) 
    }
  });
  return tasks.reduce(whenDone, when());
}