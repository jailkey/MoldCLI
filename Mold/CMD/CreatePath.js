//!info transpiled
Seed({
		type : "action",
		platform : 'node',
		include : [
			{ Command : 'Mold.Core.Command' },
			{ Promise : 'Mold.Core.Promise' },
			{ Helper : 'Mold.Core.CLIHelper'}
		]
	},
	function(){

		Command.register({
			name : "create-path",
			description : "Creates all directories and files in a path if they not exists!",
			parameter : {
				'-path' : {
					'description' : 'The path!',
					'required' : true,
				},
				'-p' : {
					'alias' : '-path'
				},
				'-mode' : {
					'description' : 'the mode, default is 0755.'
				},
				'-m' : {
					'alias' : '-mode'
				},
				'-content' : {
					'description' : 'if the last part of the path is file, its content can be set with this parameter.'
				},
				'-c' : {
					'alias' : '-content'
				},
				'--overwrite-file' : {
					'description' : 'if set file will be overwriten!'
				},
				'--of' : {
					'alias' : '--overwrite-file'
				}
			},
			code : function(args){
				var fs = require('fs');
				Helper = Helper.getInstance();
				Helper.silent = args.conf.silent;

				return new Promise(function(resolve, reject){
					var pathParts = args.parameter['-path'].value.split('/');
					var content = "";

					if(args.parameter['-content']){
						if(args.parameter['-content'].file){
							content = args.parameter['-content'].data;
						}else{
							if(args.parameter['-content'].value.data){
								content = args.parameter['-content'].value.data;
							}else{
								content = args.parameter['-content'].value;
							}
						}
					}

					if(args.parameter['-mode']){
						var mode = args.parameter['-mode'];
					}else{
						var mode = 0755;
					}

					var currentPath = "";
					for(var i = 0; i < pathParts.length; i++){
						var path = currentPath + pathParts[i];

						if(!path){
							path += "/";
						}

						var type = 'file';
						if(i + 1 < pathParts.length){
							type = 'dir';
						}else if(!~pathParts[i].indexOf(".")){
							type = 'dir';
						}

						if(!Mold.Core.Pathes.exists(path, type) || (type === 'file' && args.parameter['--overwrite-file'])){
							try {
							
								if(type === 'dir'){
									fs.mkdirSync(path, mode);
									Helper.ok("Directory created: '" + path + "!'").lb()
								}else if(type === 'file'){
									fs.writeFileSync(path, content);
									Helper.ok("File created: '" + path + "!'").lb();
								}
							}catch(e){
								reject(e);
								return;
							}
							
						}
						
						currentPath += pathParts[i] + "/";
					}
					resolve(args);
				}); 
			}
		})
	
	}
)