var express = require('express');
var router = express.Router();
var fs = require('fs');
var easyimg = require('easyimage');
var path = require('path');
var appRoot = require('app-root-path');
var multer = require('multer');
var async = require('async');

var FileControl = function(){
	this.original_name = '',
	this.old_file_path = '',
	this.new_file_path = ''
};

FileControl.prototype.set_init = function(original_name, old_file_path, new_file_path){
	var _this = this;
	
	_this.original_name = original_name;
	_this.old_file_path = old_file_path;
	_this.new_file_path = new_file_path;
};

FileControl.prototype.rename_file = function(callback){
	var return_object = {};
	
	var _this = this;
	
	fs.rename(_this.old_file_path, _this.new_file_path, function(err){
		if(err){
			return_object = {
				code:500,
				message:err.message,
				original_name:_this.original_name
			};
			
			callback(new Error(return_object.message), return_object);
		}else{
			return_object = {
				code:200,
				message:'success',
				original_name:_this.original_name
			}
			
			callback(null, return_object);
		}
	});
};
/*
var rename_file = function(original_name, old_file_path, new_file_path, callback){
	
};
*/

FileControl.prototype.get_file_info = function(callback){
	var _this = this;
	easyimg.info(_this.new_file_path).then(
		function(file){
			return_object = {
				code:200,
				message:'success',
				original_name:_this.original_name,
				file_info:file
			};
			
			callback(null, return_object);
		},
		function(err){
			return_object = {
				code:500,
				message:err.message,
				original_name:_this.original_name
			};
			
			callback(new Error(return_object.message), return_object);
		}
	);
};

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/imageUpload', multer({
	dest:path.join(appRoot.path,'/public/images/')
}).any(), function(req, res, next){
	
	var return_object_list = [];
	
	var file_list = req.files;
	
	var file_control = new FileControl();
	
	async.each(file_list, function(file, callback){
		async.waterfall([
      		function(callback){
      			var old_file_path = file.path;
  				var new_file_path = path.join(appRoot.path,'/public/images/', file.originalname);
  				
  				file_control.set_init(file.originalname, old_file_path, new_file_path);				
  				file_control.rename_file(callback);
      		},
      		function(return_object, callback){
      			file_control.get_file_info(return_object, callback);
      		},
      		function(return_object, callback){
      			console.log(return_object);
      			callback(null, return_object);
      		}
      	],function(err, return_object){
 			return_object_list.push(return_object);
 			callback(null);
      	});
	}, function(err){
		res.json(return_object_list);
	});
});

/*
var get_file_info = function(object, callback){
	easyimg.info(object.original_image_path).then(
		function(file){
			return_object = {
				code:200,
				original_image_path:object.original_image_path,
				file_info:file
			};
			
			callback(null, return_object);
		},
		function(err){
			return_object = {
				code:500,
				message:err.message,
				original_name:object.original_name
			};
			
			callback(new Error(return_object.message), return_object);
		}
	);
};
*/

var create_thumbnail = function(original_image_path, callback){
	var thumbnail_max_width = [130, 200, 300];
	
	var return_object = {};
	
	easyimg.info(original_image_path).then(
		function(file){
			for(var i in thumbnail_max_width){
				var thumbnail_max_height = thumbnail_max_width[i] * (file.height / file.width);
				var file_name_split = file.name.split('.');
				var original_file_name = file_name_split[0];
				var file_ext = file_name_split[1];
				var new_file_name = original_file_name + '_' + thumbnail_max_width[i] + '-thumbnail.' + file_ext;
				
				easyimg.thumbnail({
					src:original_image_path,
					dst:path.join(appRoot.path,'/public/images/thumbnail/' + new_file_name),
					width:thumbnail_max_width[i],
					height:thumbnail_max_height
				}).then(
					function(image){
						return_object = {
							code:200,
							message:image.name,
							image_path:'http://bettyvelvet.me:3001/images/thumbnail/' + new_file_name
						};
						
						return return_object;
					},function(err){
						return_object = {
							code:500,
							message:err.message
						};
						
						return return_object;
					}
				);
			}
		},function(err){
			return_object = {
				code:500,
				message:err.message
			};
			
			return return_object;
		}
	);
};

module.exports = router;
