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
									}else{
										others.push(dependencies[i]);
									}
								}

								if(!selected){
									reject(new Mold.Errors.CommandError("Package not found! [" + ((path) ? path : ' ') + ((name) ? name : '') + "]", "uninstall"));
									return;
								}
								
								var diffSteps = [];
								var sourceDiff = [];
								var packageInfoDiff = {};
								name = selected.name;

								//get current
								diffSteps.push(function(){
									
									return PackageInfo.get(name, true).then(function(packageInfo){
										packageInfoDiff = packageInfo;
									});
								});

								//compare with other packages and get the differenz
								diffSteps.push(function(){
									var compareSteps = [];
									dependencies.forEach(function(currentDep){
										if(currentDep.name === selected.name){
											return false;
										}
										compareSteps.push(function(){
											var currentName = currentDep.name;
											return function(){
												return PackageInfo
														.get(currentName)
														.then(function(selectedPackage){

															//compare sources
															packageInfoDiff.sources = packageInfoDiff.sources.filter(function(selected){
																if(selectedPackage && selectedPackage.sources){
																	for(var i = 0; i < selectedPackage.sources.length; i++){
																		if(selected.path === selectedPackage.sources[i].path){
																			return false;
																		}
																	}
																}
																return true;
															})

															//compare dependencies
															packageInfoDiff.dependencies = packageInfoDiff.dependencies.filter(function(selected){
																if(selectedPackage && selectedPackage.dependencies){
																	for(var i = 0; i < selectedPackage.dependencies.length; i++){
																		if(selected.name === selectedPackage.dependencies[i].name){
																			return false;
																		}
																	}
																}
																if(selected.name === currentName){
																	return false;
																}
																return true;
															})
														});
											}
										}())
									})
									return Promise.waterfall(compareSteps);
								});
								
								//delete sources 
								diffSteps.push(function(){
									var remover = [];
									packageInfoDiff.sources.forEach(function(source){
										if(Mold.Core.Pathes.exists(source.path, 'file')){
											var file = new Mold.Core.File(source.path);
											remover.push(file.remove())
										}
									})
									return Promise.all(remover);
								});

								//remove related dependecies
								diffSteps.push(function(){
									var uninstalls = [];
									packageInfoDiff.dependencies.forEach(function(dep){
										uninstalls.push(function() { return PackageInfo.remove(dep.name) });
									});
									return Promise.waterfall(uninstalls);
								})

								//remove from package info
								diffSteps.push(function(){
									return PackageInfo.remove(selected.name);
								})

								//remove from mold.json (if defined)
								diffSteps.push(function(){
									var filterdDependencies = dependencies.filter(function(currentDep){
										return (currentDep.name === selected.name) ? false : true;
									})
									return Command.updateMoldJson({ '-property' : 'dependencies', '-value' : filterdDependencies, '--silent' : true})
								})

								try {
									Promise
										.waterfall(diffSteps)
										.then(function(){
											Helper.ok("Package '" + name + "' successfully uninstalled!").lb()
										})
										.catch(reject);
								}catch(err){
									reject(err)
								}
							}else{
								reject(new Mold.Errors.CommandError("No dependencies found!", "uninstall"))
							}
						})
					
			
				});
				
			}
		})
	
	}
)