//!info transpiled
Seed({
		type : "action",
		platform : 'node',
		include : [
			{ Command : 'Mold.Core.Command' },
			{ Promise : 'Mold.Core.Promise' },
			{ Helper : 'Mold.Core.CLIHelper' },
			{ Version : 'Mold.Core.Version' },
			{ Logger : 'Mold.Core.Logger' },
			'Mold.CMD.GetMoldJson',
			'Mold.CMD.CopySeed',
			'Mold.CMD.GetPackageInfo',
			{ InstallInfo : 'Mold.Core.InstallInfo' }
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
				},
				'--force' : {
					'description' : 'force an update, even if the version is ok.'
				}
			},
			code : function(args){
				var force = args.parameter['--force'];

				var _getInfoHelper = function(dep, infos, updateDep, collectedDependencies){
					return new Promise(function(resolveDep, rejectDep){
						//get all infos
						Command.getPackageInfo({ '-p' : dep.path }).then(function(info){
							var packageInfo = info.packageInfo;
							var result = Version.compare(packageInfo.currentPackage.version, dep.version);
							collectedDependencies[packageInfo.currentPackage.name] = true;
							if(result === "bigger" || force){
								infos.push(packageInfo);
								updateDep[dep.name] = packageInfo.currentPackage.version;
							}else if(result === "equal"){
								Helper.info(dep.name + " is up to date!").lb();
							}else{
								Helper.warn(dep.name + "(" + packageInfo.currentPackage.version + ") the dependecy version is smaller then the current one, something is very strange! [" + result + "]").lb();
							}

							resolveDep(packageInfo);

						}).catch(rejectDep);

					})
				}

				return new Promise(function(resolve, reject){
					
					var copiedSources = {};
					var collectedSources = {};
					Command.getMoldJson({ '-p' : '' }).then(function(moldJson){
						moldJson =  moldJson.parameter.source[0].data;
						if(!moldJson){
							reject(new Error("Config is not defined!"))
						}

						if(moldJson.dependencies.length){
							var infoPromises = [];
							var infos = [];
							var updateDep = {};
							var updateSteps = [];
							var collectedPackageInfos =  {};
							var collectedDependencies = {};

							//get dependencies
							moldJson.dependencies.forEach(function(dep){
								infoPromises.push(_getInfoHelper(dep, infos, updateDep, collectedDependencies));
							});

							updateSteps.push(function(){
								return Promise.all(infoPromises)
							});

							//get sub dependencies
							updateSteps.push(function(){
								var collectedSubDependencies = {};
								var subInfosPromises = [];
								infos.forEach(function(dep){
									//console.log("DEP", dep.linkedPackages)
									dep.linkedPackages.forEach(function(linkedPackage){
										if(!collectedDependencies[linkedPackage.name]){
											collectedSubDependencies[linkedPackage.name] = linkedPackage;
										}
									})
									
								});
						
								for(var name in collectedSubDependencies){
									subInfosPromises.push(_getInfoHelper(collectedSubDependencies[name], infos, updateDep, collectedDependencies))
								}

								return Promise.all(subInfosPromises);
							})
							

							var mergedDeps = {};
							updateSteps.push(function(){
								//merge all dependencies
								
								infos.forEach(function(dep){
									mergedDeps = Mold.merge(mergedDeps, dep);
								});

								//create repositorys first to copy seeds correctly		
								var repos = [];
								for(repoName in mergedDeps.repositories){
									repos.push(Command.createRepo({ '-name' : repoName }));
								}

								return Promise.all(repos)
							});

							updateSteps.push(function(){
								
								var seeds = [];
								//overwrite all seeds
								for(var seedName in mergedDeps.linkedSeeds){
									var seedPath =  mergedDeps.linkedSeeds[seedName].path;
									if(seedPath){
										seeds.push(function(){
											var packageName = mergedDeps.linkedSeeds[seedName].packageName;
											return Command
													.copySeed({ '-name' : seedName, '-path' : seedPath, '--o' : true })
													.then(function(seedArgs){
														collectedPackageInfos[packageName] = collectedPackageInfos[packageName] || {
															sources : [],
															dependencies : []
														}
														collectedPackageInfos[packageName].sources.push({
															path : seedArgs.parameter['-target'],
															type : 'file'
														})
													})

										}());
									}
								}

								//create repositorys if needed
								return Promise.all(seeds);
							});


							//copy linkedSources
							updateSteps.push(function(){
								var sourcePromises = [];
								infos.forEach(function(info){
									//collect lkinked package depednecies
									info.linkedPackages.forEach(function(selectedPackage){

										collectedPackageInfos[selectedPackage.name] = collectedPackageInfos[selectedPackage.name] || {
											sources : [],
											dependencies : []
										}
										collectedPackageInfos[selectedPackage.name].dependencies = selectedPackage.dependencies;

									});
									if(info.linkedSources && info.linkedSources.length){
										info.linkedSources.forEach(function(source){
											if(source.type === 'file'){
												if(!copiedSources[source.filePath]){
													sourcePromises.push(Command.copySource({ '-source' : source.filePath, '-target' : source.path}));
													copiedSources[source.filePath] = true;

												}
											}else{
												if(!copiedSources[source.path]){
													Command.createPath({ '-path' : source.path})
													copiedSources[source.path] = true;
												}
											}
											if(!collectedSources[source.path]){
												collectedPackageInfos[source.packageName].sources.push({
													path : source.path,
													type : source.type
												})
												collectedSources[source.path] = true;
											}
										})
									}
								})

								return new Promise(function(resolveSources, rejectSoures){
									if(!sourcePromises.length){
										resolveSources()
										return;
									}else{
										Promise.all(sourcePromises).then(resolveSources).catch(rejectSoures);
									}
								})
							})
									
							updateSteps.push(function(){
								return new Promise(function(resolveJsonUpdate, rejectJsonUpdate){
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

											resolveJsonUpdate(args);
										})
										.catch(rejectJsonUpdate)
									}else{
										resolveJsonUpdate(args);
									}
								});
							})
							
							//update package-info.json
							updateSteps.push(function(){
								var setPackageInfos = [];
								for(var currentPackageName in collectedPackageInfos){
									setPackageInfos.push(function(){
										var currentName = currentPackageName;
										return function() {
											console.log("SET", collectedPackageInfos)
											return InstallInfo.set(currentName, collectedPackageInfos[currentName]);
										}
									}());
								}

								return Promise.waterfall(setPackageInfos);
							})

							Promise
								.waterfall(updateSteps)
								.then(resolve)
								.catch(reject)

						}else{
							Helper.info("No dependencies found!").lb();
						}
					}).catch(reject)
				});
				
			}
		})
	
	}
)