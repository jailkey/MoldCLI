//!info transpiled
Seed({
		type : "action",
		platform : 'node',
		include : [
			{ Command : 'Mold.Core.Command' },
			{ Promise : 'Mold.Core.Promise' },
			{ Helper : 'Mold.Core.CLIHelper' },
			{ Version : 'Mold.Core.Version' },
			'Mold.CMD.GetMoldJson',
			'Mold.CMD.CopySeed',
			'Mold.CMD.GetPackageInfo'
		]
	},
	function(){

		Command.register({
			name : "update",
			description : "Updates all package dependencies.",
			parameter : {
				'-dependency' : {
					'description' : 'Name of the dependency to update, if not given all dependencies will be updated!',
				},
				'-d' : {
					'alias' : '-dependency'
				}
			},
			code : function(args){

				return new Promise(function(resolve, reject){
		
					Command.getMoldJson({ '-p' : '' }).then(function(moldJson){
						moldJson =  moldJson.parameter.source[0].data;
						if(!moldJson){
							reject(new Error("Config is not defined!"))
						}

						if(moldJson.dependencies.length){
							var infoPromises = [];
							var infos = [];
							var updateDep = {};

							moldJson.dependencies.forEach(function(dep){
								infoPromises.push(new Promise(function(resolveDep, rejectDep){
									//console.log("dependencies", dep)
									//get all infos
									Command.getPackageInfo({ '-p' : dep.path }).then(function(info){
										packageInfo = info.packageInfo;
										var result = Version.compare(packageInfo.currentPackage.version, dep.version);
										if(result === "bigger"){
											infos.push(packageInfo);
											updateDep[dep.name] = packageInfo.currentPackage.version;
										}else if(result === "equal"){

											Helper.info(dep.name + " is up to date!").lb();
										}else{
											Helper.warn(dep.name + "(" + packageInfo.currentPackage.version + ") the dependecy version is smaller then the current one, something is very strange! [" + result + "]").lb();
										}
										
										resolveDep(packageInfo);
									}).catch(rejectDep);

								}));
							})

							var depPromise = new Promise().all(infoPromises);

							depPromise.then(function(){
								//merge all dependencies
								var mergedDeps = {};
								infos.forEach(function(dep){
									mergedDeps = Mold.merge(mergedDeps, dep);
								});

								//create repositorys first to copy seeds correctly		
								var repos = [];
								for(repoName in mergedDeps.repositories){
									repos.push(Command.createRepo({ '-name' : repoName }));
								}

								new Promise().all(repos).then(function(){
									var seeds = [];
									//overwrite all seeds
									for(var seedName in mergedDeps.linkedSeeds){
										var seedPath =  mergedDeps.linkedSeeds[seedName].path;
										if(seedPath){
											seeds.push(Command.copySeed({ '-name' : seedName, '-path' : seedPath, '--o' : true }));
										}
									}

									//create repositorys if needed
									var copyPromise = new Promise().all(seeds);
									copyPromise
										.then(function(){
											var updateMoldJson = false;
											//if everything is copied, change package versions
											for(var i = 0; i < moldJson.dependencies.length; i++){
												var depName = moldJson.dependencies[i].name;
												if(updateDep[depName]){

													 moldJson.dependencies[i].version = updateDep[depName]; 
													 args.updatedDependencies =  args.updatedDependencies || [];
													 args.updatedDependencies =  moldJson.dependencies[i];
													 updateMoldJson = true;
												}
											}
											if(updateMoldJson){
												Command.updateMoldJson({
													'-property' : 'dependencies',
													'-value' : moldJson.dependencies,
												})
												.then(function(){
													for(var name in updateDep){
														Helper.ok(name + " updated to version " + updateDep[name] + "!").lb();
													}

													resolve(args);
												})
												.catch(reject)
											}else{
												resolve(args);
											}
											
										})
										.catch(reject);
								})
								.catch(reject);
							})
							.catch(reject);

						}else{
							Helper.info("No dependencies found!").lb();
						}
					}).catch(reject)
				});
				
			}
		})
	
	}
)