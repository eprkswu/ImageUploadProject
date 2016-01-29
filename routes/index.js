var express = require('express');
var router = express.Router();
var fs = require('fs');
var easyimg = require('easyimage');
var path = require('path');
var appRoot = require('app-root-path');
var multer = require('multer');
var async = require('async');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/imageUploadPopup', function(req, res, next){
	res.render('imageUploadPopup');
});

router.post('/imageUpload', multer({
	dest:path.join(appRoot.path,'/public/images/')
}).any(), function(req, res, next){
	
	var return_object_list = [];
	
	var file_list = req.files;
	
	async.each(file_list, function(file, callback){
		async.waterfall([
      		function(callback){
      			switch(file.mimetype){
      				case 'image/jpeg':
      				case 'image/pjpeg':
      				case 'image/gif':
      				case 'image/png':
      				case 'image/bmp':
      				case 'image/x-windows-bmp':
      					var old_file_path = file.path;
      	  				var new_file_path = path.join(appRoot.path,'/public/images/', file.originalname);
      	  				rename_file(file.originalname, old_file_path, new_file_path, callback);
      	  				break;
      				default:
      					return_object = {
      						code:500,
      						message:'No Image File',
      						desc:'rename_file error',
      						original_image_path:'',
      						original_name:''
      					};
      					fs.unlink(file.path, function(err){
      						if(err){
      							callback(new Error(err.message), return_object);
      						}else{
      							callback(new Error(return_object.message), return_object);
      						}
      					});
      			}
      		},
      		function(return_object, callback){
      			get_file_info(return_object, callback);
      		},
      		function(return_object, callback){
      			create_thumbnail(return_object, callback);
      		}
      	],function(err, return_object){
			if(return_object.original_image_path != ''){
				return_object.original_image_path = '/images/' + return_object.file_info.name;
			}
			delete return_object['file_info'];
 			return_object_list.push(return_object);
 			callback(null);
      	});
	}, function(err){
		res.render('imageUploadSuccess', {return_object_list:JSON.stringify(return_object_list)});
	});
});

var rename_file = function(original_name, old_file_path, new_file_path, parent_callback){
	var return_object = {};
	
	fs.rename(old_file_path, new_file_path, function(err){
		if(err){
			return_object = {
				code:500,
				message:err.message,
				desc:'rename_file error',
				original_image_path:'',
				original_name:original_name
			};
			
			parent_callback(new Error(return_object.message), return_object);
		}else{
			return_object = {
				code:200,
				message:'success',
				desc:'',
				original_image_path:new_file_path,
				original_name:original_name
			}
			
			parent_callback(null, return_object);
		}
	});
};

var get_file_info = function(object, parent_callback){
	easyimg.info(object.original_image_path).then(
		function(file){
			return_object = {
				code:200,
				message:'success',
				desc:'',
				original_image_path:object.original_image_path,
				original_name:object.original_name,
				file_info:file
			};
			
			parent_callback(null, return_object);
		},
		function(err){
			return_object = {
				code:500,
				message:err.message,
				desc:'get_file_info error',
				original_image_path:'',
				original_name:object.original_name,
				file_info:{}
			};
			
			parent_callback(new Error(return_object.message), return_object);
		}
	);
};

var create_thumbnail = function(object, parent_callback){
	var thumbnail_max_width = [130, 200, 300];
	
	var original_image_path = object.original_image_path;
	
	var file = object.file_info;
	
	object.thumbnail_result = [];
	
	async.each(thumbnail_max_width, function(max_width, callback){
		var thumbnail_max_height = max_width * (file.height / file.width);
		var file_name_split = file.name.split('.');
		var original_file_name = file_name_split[0];
		var file_ext = file_name_split[1];
		var new_file_name = original_file_name + '_' + max_width + '-thumbnail.' + file_ext;
		
		var return_object = {};
		
		easyimg.thumbnail({
			src:original_image_path,
			dst:path.join(appRoot.path,'/public/images/thumbnail/' + new_file_name),
			width:max_width,
			height:thumbnail_max_height
		}).then(
			function(image){
				return_object = {
					code:200,
					message:'success',
					image_thumbnail_name:image.name,
					image_thumbnail_path:'/images/thumbnail/' + new_file_name
				};
				
				object.thumbnail_result.push(return_object);
				callback(null);
			},function(err){
				return_object = {
					code:500,
					message:err.message,
					image_thumbnail_name:'',
					image_thumbnail_path:''
				};
				
				object.thumbnail_result.push(return_object);
				callback(null);
			}
		);
	},function(err){
		parent_callback(null, object);
	});
};

module.exports = router;
