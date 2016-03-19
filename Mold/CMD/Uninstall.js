//!info transpiled
/**
 * @todo install npm packages
 * @todo install extra files an directories
 */
Seed({
		type : "action",
		platform : 'node',
		include : [
			{ Command : 'Mold.Core.Command' },
			{ Promise : 'Mold.Core.Promise' },
			{ VM : 'Mold.Core.VM' },
			{ Helper : 'Mold.Core.CLIHelper' },
			{ NPM : 'Mold.Core.NPM' },
			{ File : 'Mold.Core.File' },
			'Mold.CMD.GetMoldJson',
			'Mold.CMD.CopySeed'
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
								console.log("DEPS")
								for(var i = 0; i < dependencies.length; i++){
									if(name && dependencies[i].name === name){
										selected = dependencies[i];
									}else if(path && dependencies[i].path === path){
										selected = dependencies[i];
									}else{
										others.push(dependencies[i]);
									}
								}

								if(!selected){
									reject(new Mold.Errors.CommandError("Package not found!", "uninstall"));
									return;
								}

								var diffSteps = [];
								var diff = null;

								diffSteps.push(function(){
									console.log("GET PACKAGEINFO", selected.path)
									return Command
												.getPackageInfo({ '-p' : selected.path})
												.then(function(selectedInfo){
													diff = selectedInfo.packageInfo;
													console.log("DIFF STEPS", selected.path)
												})
								})

								others.forEach(function(dep){
									diffSteps.push(function(){
										console.log("GET", dep.path)
										return Command
													.getPackageInfo({ '-p' : dep.path})
													.then(function(depInfo){
														
														diff = Mold.diff(diff, depInfo.packageInfo);
													})
									})
								});

								Promise
									.waterfall(diffSteps)
									.then(function(){
										console.log("DIF", diff)
									})
									.catch(reject);

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