//!info transpiled
Seed({
		type : "action",
		platform : 'node',
		include : [
			{ Command : 'Mold.Core.Command' },
			{ Promise : 'Mold.Core.Promise' }
		]
	},
	function(){
		var fs = require("fs");

		var _getDirInfo = function(dir){
			var files = [];
			return new Promise(function(resolve, reject){
				 fs.readdir(dir, function(err, list) {
				 	var scanDirs = [];
				 	list.forEach(function(entry){
				 		var fullPath = dir + "/" + entry;
				 		if(Mold.Core.Pathes.exists(fullPath, 'dir')){
				 			scanDirs.push(function(){
				 				var newPath = fullPath;
				 				return _getDirInfo(newPath);
				 			}())
				 		}else if(fullPath.endsWith('.js') && Mold.Core.Pathes.exists(fullPath, 'file')){
				 			files.push(fullPath);
				 		}
				 	})

				 	if(scanDirs.length){
				 		Promise
				 			.all(scanDirs)
				 			.then(function(result){
				 				result.forEach(function(entry){
				 					files = files.concat(entry);
				 				})
				 				resolve(files);
				 			})
				 	}else{
				 		resolve(files);
				 	}
				 })
			})
		}

		Command.register({
			name : "scan-repositories",
			description : "scans all repository for seed and return them",
			parameter : {},
			code : function(args){
				var checkRepos = [];
				return new Promise(function(resolve, reject){
					var repos = Mold.Core.Config.get('repositories');
					for(var name in repos){
						var path = repos[name];
						
						checkRepos.push(function(){ 
							var newPath = path; 
							return _getDirInfo(newPath);
						}())
					}

					Promise
						.all(checkRepos)
						.then(function(result){
							var allRepos = [];
							result.forEach(function(repo){
								allRepos = allRepos.concat(repo);
							})
							args.collected = args.collected || {};
							args.collected.files = args.collected.files || [];
							args.collected.files = allRepos;
							resolve(args);
						})
						.catch(reject)
				})

			}
		})
	}
);