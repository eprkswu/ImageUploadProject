var express = require('express');
var router = express.Router();
var fs = require('fs');
var easyimg = require('easyimage');
var path = require('path');
var appRoot = require('app-root-path');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/imageUpload', function(req, res, next){
	var upload_path = appRoot.path;
	
	var return_object = {};
	
	fs.readFile(req.files.uploadFile.path, function(error, data){
		var file_path = path.join(appRoot.path,'/public/images/'+req.files.uploadFile.name);
		
		fs.writeFile(filePath, data, function(err){
			if(err){
				return_object = {
					code:500,
					message:err.message
				};
				
				return return_object;
			}else{
				return_object = create_thumbnail(file_path);
				
				return return_object;
			}
		});
	})
});

var create_thumbnail = function(original_image_path){
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
					width:thumbnail_max_width,
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
