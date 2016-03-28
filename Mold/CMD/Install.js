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
			{ PackageInfo : 'Mold.Core.PackageInfo' },
			'Mold.CMD.GetMoldJson',
			'Mold.CMD.CopySeed'
		]
	},
	function(){

		Command.register({
			name : "install",
			description : "Installs a mold package by a given path or name",
			parameter : {
				'-path' : {
					'description' : 'Path to the package directory!',
					'required' : true,
				},
				'-p' : {
					'alias' : '-path'
				},
				'--no-dependencies' : {
					'description' : 'Install the seed without dependencies.'
				},
				'--nd' : {
					'alias' : '--no-dependencies'
				},
				'--without-git-ignore' : {
					'description' : "If set no entrys will be added to the .gitignore"
				},
				'--without-npm' : {
					'description' : 'Install seeds without npm dependencies'
				},
				'--without-sources' : {
					'description' : 'Installs the package without other sources.'
				}
			},
			code : function(args){
				return new Promise(function(resolve, reject){
					var loader = Helper.loadingBar("get package info ");
					var _packageSources = {};
					var _packageDep = {};
					var _collectSource = function(name, source, type){
						_packageSources[name] = _packageSources[name] || [];
						_packageSources[name].push({
							path : source,
							type : type
						})
					}

					Command.getPackageInfo({ '-p' : args.parameter['-path']})
						.then(function(response){
							var repoPromis = new Promise();
							var repos = [];
							var installSteps = [];
							
							//create repositorys
							for(repoName in response.packageInfo.repositories){
								loader.text("create repositories")
								repos.push(Command.createRepo({ '-name' : repoName, '--silent' : true }));
							}

							//add dependecies
							installSteps.push(function(){
								var packageDependencies = [];
								response.packageInfo.linkedPackages.forEach(function(currentPackage){
									loader.text("add dependency " + currentPackage.name)
									if(currentPackage.dependencies){
										_packageDep[currentPackage.name] = _packageDep[currentPackage.name] || [];
										_packageDep[currentPackage.name] = _packageDep[currentPackage.name].concat(currentPackage.dependencies);
									}
									packageDependencies.push(function(){
										return Command.createDependency({ 
											'-name' : currentPackage.name,
											'-path' : currentPackage.path,
											'-version' : currentPackage.version,
											'--silent' : true
										})
									})
								});

								return Promise.waterfall(packageDependencies);
							})

							//install other sources
							if(!args.parameter['--without-sources']){
								var sourcePromises = [];
								installSteps.push(function(){
									response.packageInfo.linkedSources.forEach(function(source){
										loader.text("add source " + source.path)
										if(source.type === 'dir'){
											_collectSource(source.packageName, source.path, 'dir');
										
											//create directory
											sourcePromises.push(Command.createPath({ '-path' : source.path, '--silent' : true }))
										}else if(source.type === 'file'){
											var file = new File(source.filePath);
											_collectSource(source.packageName, source.path, 'file')
											sourcePromises.push(file.copy(source.path))
										}
											
									});
									return Promise.all(sourcePromises)
								})
							
							}

							//install linked npm packages
							if(!args.parameter['--without-npm']){
								var installNpms = [];
								for(var npmName in response.packageInfo.linkedNpmDependencies){
									
									installNpms.push(function(){
										var name = npmName;
										var version = response.packageInfo.linkedNpmDependencies[npmName];
										return function(){
											return NPM.install(name, version, false, true);
										}
									}()) 
								}

								installSteps.push(function() {
									return Promise.waterfall(installNpms).then(function(message){
										loader.text(message.join(" "));
										//Helper.info(message.join("\n")).lb();
									})
								})
							}
							
							//install repositorys
							installSteps.push(function() {
								return repoPromis.all(repos)
							})

							installSteps.push(function(){
								return new Promise(function(resolveCopy, rejectCopy){
									var seeds = [];
									var gitIgnor = [];
									var outputPromise = null;
									//copy seeds
									for(var seedName in response.packageInfo.linkedSeeds){
										var seedPath = response.packageInfo.linkedSeeds[seedName].path;
										if(seedPath){
											//copy seeds
											seeds.push(function(){
												var packageName = response.packageInfo.linkedSeeds[seedName].packageName;
												return Command.copySeed({ 
													'-name' : seedName,
													'-path' : seedPath,
													'--silent' : true
												})
												.then(function(seedArgs){
													loader.text("copy seed " + seedArgs.parameter['-name'].value);
													_collectSource(packageName, seedArgs.parameter['-target'], 'file');
												})
												.catch(rejectCopy)
											}());
											//add to git ignore
											gitIgnor.push(function(){
												var name = seedName;
												return function(){
													return Command.gitIgnore({ 
																'-path' :  '/' + Mold.Core.Pathes.getPathFromName(name, true), 
																'--add' : true, 
																'--silent' : true
															})
															.catch(rejectCopy);
												}
											}())
										}
									}

									Promise
										.all(seeds)
										.then(function(){
											if(args.parameter['--without-git-ignore']){
												resolveCopy(args);
											}else{
												Promise
													.waterfall(gitIgnor)
													.then(function(){
														resolveCopy(args);
													//	Helper.info("Dependencies added to .gitignore!").lb();
													})
											}
										})
										.catch(rejectCopy)
								});

							});
							
							//create mold installation dir
							installSteps.push(function(){
								return Command.createPath({ '-path' : '.mold', '--dir' : true ,'--silent' : true })
							});

							//add source to temp info files
							installSteps.push(function(){
								var setInfos = [];
								for(var packageName in _packageSources){
									setInfos.push(function(){
										var pckName = packageName;
										var pSource =  _packageSources[packageName];
										return function() { return PackageInfo.set(pckName, { 
											sources : pSource,
											dependencies : _packageDep[pckName] || []
										}) }
									}());
								}
								return Promise.waterfall(setInfos)
							})

							
							//execute all steps
							Promise
								.waterfall(installSteps)
								.then(function(result){
									loader.stop(Helper.COLOR_GREEN + "Package '" + response.packageInfo.currentPackage.name + "' successfully installed! " + Helper.COLOR_RESET);
									Helper.lb();
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