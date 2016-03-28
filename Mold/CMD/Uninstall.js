//!info transpiled
Seed({
		type : "action",
		platform : 'node',
		include : [
			{ Command : 'Mold.Core.Command' },
			{ Promise : 'Mold.Core.Promise' },
			{ Helper : 'Mold.Core.CLIHelper' },
			{ File : 'Mold.Core.File' },
			{ Logger : 'Mold.Core.Logger' },
			'Mold.CMD.GetMoldJson',
			{ PackageInfo : 'Mold.Core.PackageInfo' }
		]
	},
	function(){

		Command.register({
			name : "uninstall",
			description : "uninstalls a mold package by a given path or name",
			parameter : {
				'-path' : {
					'description' : 'package path'
				},
				'-p' : {
					'alias' : '-path'
				},
				'-name' : {
					'description' : 'package name',
				},
				'-n' : {
					'alias' : '-name'
				}
			
			},
			code : function(args){
				return new Promise(function(resolve, reject){
					var path = (args.parameter['-path']) ? args.parameter['-path'].value : null;
					var name = (args.parameter['-name']) ? args.parameter['-name'].value : null;
					
					if(!name && !path){
						reject(new Mold.Errors.CommandError("Unistall needs a package- name or path!", "uninstall"))
						return;
					}

					if(name && path){
						reject(new Mold.Errors.CommandError("Unistall can only used with package- name or a path!", "uninstall"))
						return;
					}

					Command
						.getMoldJson({'-p' : ''})
						.then(function(result){
							if(result.parameter.source[0].data.dependencies && result.parameter.source[0].data.dependencies.length){
								var dependencies = result.parameter.source[0].data.dependencies;
								var selected = null;
								var others = [];
								for(var i = 0; i < dependencies.length; i++){
									if(name && dependencies[i].name === name){
										selected = dependencies[i];
										break;
									}else if(path && dependencies[i].path === path){
										selected = dependencies[i];
										break;
									}
								}

								if(!selected){
									reject(new Mold.Errors.CommandError("Package not found!", "uninstall"));
									return;
								}
								var diffSteps = [];
								var sourceDiff = [];
								diffSteps.push(function(){

									return PackageInfo.get(name).then(function(packageInfo){
										Logger.log("current pack", packageInfo.source)
										PackageInfo.get().then(function(allPackage){
											allPac
										})
									});
								});

								try {
									Promise
										.waterfall(diffSteps)
										.then(function(){
											//console.log("DIF", diff)
										})
										.catch(reject);
								}catch(err){
									reject(err)
								}
							}else{
								reject(new Mold.Errors.CommandError("No dependencies found!", "uninstall"))
							}

								/*
								Command.getPackageInfo({ '-p' : path})
									.then(function(response){			
										reps

									})*/
						})
					
			
				});
				
			}
		})
	
	}
)