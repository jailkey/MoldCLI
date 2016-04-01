//!info transpiled
Seed({
		type : "action",
		platform : 'node',
		include : [
			{ Command : 'Mold.Core.Command' },
			{ Promise : 'Mold.Core.Promise' },
			{ VM : 'Mold.Core.VM' },
			{ NPM : 'Mold.Core.NPM' }
		]
	},
	function(){

		Command.register({
			name : "get-package-info",
			description : "returns infos about a package!",
			parameter : {
				'-path' : {
					'description' : 'Path to the package dir.',
					'required' : true,
				},
				'-p' : {
					'alias' : '-path'
				},
				'--no-dependencies' : {
					'description' : 'If the options is choosen, only the info of the current package will be return. Dependent packages will be ignored!'
				},
				'--nd' : {
					'alias' : '--no-dependencies'
				}

			},
			code : function(args){
				var currentPath = args.parameter['-path'].value;

				var _getAllDependencies = function(vm, seed, response, dep){
					var dep = dep || {};
					seed.dependencies.forEach(function(seedName){
						var dependedSeed = vm.Mold.Core.SeedManager.get(seedName);
						dep[dependedSeed.name] = {
							path : dependedSeed.path,
							packageName : response.parameter.source[0].data.name,
							packageVersion : response.parameter.source[0].data.version
						}
						dep = _getAllDependencies(vm, dependedSeed, response, dep);
					});
					dep[seed.name] = {
						path : seed.path,
						packageName : response.parameter.source[0].data.name,
						packageVersion : response.parameter.source[0].data.version
					}
					return dep;
				}

				var _addCurrentVersion = function(seeds, version){
					for(var name in seeds){
						seeds[name].currentVersion = version;
					}
					return seeds;
				}

				return new Promise(function(resolve, reject){
					
					Command.execute('get-mold-json', { '-p' : args.parameter['-path']})
						.then(function(response){
							if(!response.parameter.source || !response.parameter.source[0]){
								throw new Error("Source is not defined")
							}

							
							var collected = {
								currentPackage : response.parameter.source[0].data,
								linkedSeeds : {},
								repositories : {},
								linkedPackages : [],
								linkedNpmPackages : [],
								linkedNpmDependencies : {},
								linkedSources : [],
							}

							if(response.parameter.source[0].data.name === Mold.Core.Config.get('name')){
								collected.currentPackage = null;
								args.packageInfo = collected;
								resolve(args);
								return;
							}


							var path =  args.parameter['-path'].value;
							var currentPath = path;
							var currentPackageName = response.parameter.source[0].data.name;
							var waterfall = [];
							var getRepoVM = new VM({
								configPath : path
							});


							if(response.parameter.source[0].data.sources){
								response.parameter.source[0].data.sources.forEach(function(source){
									//if it is a directory add only the path
									
									if(source.endsWith('/')){
										collected.linkedSources.push({
											packageName : currentPackageName,
											path : source,
											type : 'dir'
										})
									}else{
										//if it is a file get the data and add it
										if(currentPath !== '' && !currentPath.endsWith('/')){
											currentPath += '/';
										}
										var filePath = currentPath + source;
										collected.linkedSources.push({
											packageName : currentPackageName,
											path : source,
											filePath : filePath,
											type : 'file'
										})
									}
								})
							}

							if(NPM.packageJsonExists(path)){
								waterfall.push(function(){
									return NPM.getPackageJson(path).then(function(data){
										collected.linkedNpmPackages.push(data);
										if(data.dependencies){
											collected.linkedNpmDependencies = data.dependencies;
										}
									})
								});
							}

							waterfall.push(function(){
								return new Promise(function(resolveDep, rejectDep){

									getRepoVM.Mold.Core.Config.isReady.then(function(){
										var loadSeeds = [];
										var linkedSeeds = response.parameter.source[0].data.seeds;
										var responsData = response.parameter.source[0].data;
										var linkedDependencies = [];

										if(!args.parameter['--no-packages'] && !args.parameter['--no-dependencies']){
											linkedDependencies = responsData.dependencies || [];
										}
										responsData.path = path;
										collected.linkedPackages.push(responsData);
										if(responsData.repositories){
											for(var repoName in responsData.repositories){
												collected.repositories[repoName] =  responsData.repositories[repoName];
											}
										}
										if(linkedSeeds){
											linkedSeeds.forEach(function(name){
												loadSeeds.push(getRepoVM.Mold.load(name));
											});

											Promise.all(loadSeeds).then(function(result){
												if(!args.parameter['--no-dependencies']){
													result.forEach(function(seed){
														collected.linkedSeeds = _getAllDependencies(getRepoVM, seed, response);
													})
												}else{
													result.forEach(function(seed){
														collected.linkedSeeds[seed.name] = { 
															path : seed.path,
															packageName : responsData.name,
															packageVersion : responsData.version
														};
													})
												}

												if(linkedDependencies.length){
													var depWaterfall = [];
													linkedDependencies.forEach(function(currentDep){
														var packageInfoPath = (Mold.Core.Pathes.isHttp(currentDep.path)) ? currentDep.path : currentPath + currentDep.path;
														depWaterfall.push(function(){
															return Command
																		.execute('get-package-info', { '-p' : packageInfoPath })
																		.then(function(foundInfo){
																			foundInfo.packageInfo.linkedSeeds = _addCurrentVersion(foundInfo.packageInfo.linkedSeeds, currentDep.currentVersion)
																			collected = Mold.merge(collected, foundInfo.packageInfo, { concatArrays : true, without : [ 'currentPackage'] });
																		});
														})
													});

													Promise
														.waterfall(depWaterfall)
														.then(function(){
															args.packageInfo = collected;
															resolveDep(args);
														})
														.catch(rejectDep)

												}else{
													args.packageInfo = collected;
													resolveDep(args);
												}

											}).catch(rejectDep)

										}else{
											rejectDep(new Error("No linked Seeds found in " + path.value + "!"))
										}
									
									})
									.catch(rejectDep);
								})
							
							});

							Promise
								.waterfall(waterfall)
								.then(function(){
									resolve(args);
								})
								.catch(reject)
						
						})
						.catch(reject);
				}); 
			}
		})
	
	}
)