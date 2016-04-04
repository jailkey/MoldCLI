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
				'--without-sub-packages' : {
					'description' : 'Install the seed without sub packages.'
				},
				'--wsp' : {
					'alias' : '--without-sub-packages'
				},
				'--without-git-ignore' : {
					'description' : "If set no entrys will be added to the .gitignore"
				},
				'--without-npm' : {
					'description' : 'Install seeds without npm dependencies'
				},
				'--without-sources' : {
					'description' : 'Installs the package without other sources.'
				},
				'--without-adding-dependencies' : {
					'description' : 'If set the dependency will not added to mold.json'
				}
			},
			code : function(args){
				return new Promise(function(resolve, reject){
					Helper = Helper.getInstance();
					Helper.silent = args.conf.silent;
					var loader = Helper.loadingBar("get package info ");
					var _packageSources = {};
					var _packageDep = {};
					var _gitIgnorSources = [];

					var _collectSource = function(name, source, type){
						_packageSources[name] = _packageSources[name] || [];
						_packageSources[name].push({
							path : source,
							type : type
						})
					}

					var _addToGitIgnor = function(path){
						if(!~_gitIgnorSources.indexOf(path)){
							_gitIgnorSources.push(path)
						}
					}

					var _isInstalledPackage = function(name){
						var installedDep = Mold.Core.Config.get('dependencies', 'local');
						return !!installedDep.find(function(current){
							return (current.name === name) ? true : false;
						})
					}

					Command.getMoldJson({'-p' : ''}).then(function(moldJson){
						
						if(!moldJson.parameter.source){
							throw new Error("local mold.json not found!");
						}

						var moldJsonFile = moldJson.parameter.source[0].data;
						var currentAppName = moldJsonFile.name;

						Command.getPackageInfo({ '-p' : args.parameter['-path']})
							.then(function(response){
								
								var repoPromis = new Promise();
								var repos = [];
								var installSteps = [];
							
								//if it is null the user tried to install a package into itself
								if(response.packageInfo.currentPackage === null || response.packageInfo.currentPackage.name === currentAppName){
									if(!args.conf.silent){
										reject(new Mold.Errors.CommandError("You can not install a package into it self! [" + currentAppName + "]", "install"))
										return;
									}else{
										resolve(args);
										return;
									}
								}
								if(
									Mold.Core.Config.get("dependencies").find(function(entry){
										return response.packageInfo.currentPackage.name === entry.name
									})
								){
									loader.stop();
									Helper.info("Package " + response.packageInfo.currentPackage.name + " is allready installed!").lb();
									resolve(args)
									return;
								}
								
								//create repositorys
								for(repoName in response.packageInfo.repositories){
									loader.text("create repositories")
									repos.push(Command.createRepo({ '-name' : repoName, '--silent' : true }));
								}

								//add dependencies
								installSteps.push(function(){
									var packageDependencies = [];
									response.packageInfo.linkedPackages.forEach(function(currentPackage){
										loader.text("add dependency " + currentPackage.name)
										if(currentPackage.dependencies){
											_packageDep[currentPackage.name] = _packageDep[currentPackage.name] || [];
											_packageDep[currentPackage.name] = _packageDep[currentPackage.name].concat(currentPackage.dependencies);
										}
									});

									if(args.parameter['--without-adding-dependencies']){
										return new Promise().resolve()
									}else{
										//add only the curent dependency
										return Command.createDependency({ 
											'-name' : response.packageInfo.currentPackage.name,
											'-path' : response.packageInfo.currentPackage.path,
											'-version' : response.packageInfo.currentPackage.version,
											'--silent' : true
										})
									}
								})

								//install other sources
								if(!args.parameter['--without-sources']){
									var sourcePromises = [];
									installSteps.push(function(){
										response.packageInfo.linkedSources.forEach(function(source){
											if(!_isInstalledPackage(source.packageName)){
												loader.text("add source " + source.path)
												if(source.type === 'dir'){
													_collectSource(source.packageName, source.path, 'dir');
													//create directory
													sourcePromises.push(Command.createPath({ '-path' : source.path, '--silent' : true }))
												}else if(source.type === 'file'){

													var file = new File(source.filePath);
													_collectSource(source.packageName, source.path, 'file')
													_addToGitIgnor(source.path);
													sourcePromises.push(file.copy(source.path))
												}
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

								//copy seeds
								installSteps.push(function(){
							
									var seeds = [];
									var outputPromise = null;

									for(var seedName in response.packageInfo.linkedSeeds){
										var seedPath = response.packageInfo.linkedSeeds[seedName].path;
										if(seedPath){
											if(!_isInstalledPackage(response.packageInfo.linkedSeeds[seedName].packageName)){
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
														_addToGitIgnor('/' + seedArgs.parameter['-target']);
													})
												}());
											}
											
										}
									}

									return Promise.all(seeds);
								});

								//add to git ignore
								installSteps.push(function(){
									var gitIgnorAdds = [];
									if(!args.parameter['--without-git-ignore']){
										_gitIgnorSources.forEach(function(path){
											gitIgnorAdds.push(function(){
												return Command.gitIgnore({ 
													'-path' : path,
													'--add' : true,
													'--silent' : true
												});
											});
										})
									}

									return Promise.waterfall(gitIgnorAdds);
								})
								
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

								//install linked depnedencies
								if(!args.parameter['--without-sub-packages']){
									installSteps.push(function(){
										//filter double linked packages and self before
										
										var collectedPackes = {}
										collectedPackes[response.packageInfo.currentPackage.name] = true;
										response.packageInfo.linkedPackages = response.packageInfo.linkedPackages.filter(function(entry){
											if(!collectedPackes[entry.name]){
												collectedPackes[entry.name] = true;
												return true;
											}
											return false;
										})
										var installLinkedPackages = [];
										response.packageInfo.linkedPackages.forEach(function(entry){	
											installLinkedPackages.push(function(){
												var commandArgs = {
													'-p' : entry.path,
													'--without-adding-dependencies' : true,
													'--silent' : true
												}
												loader.text("Install dependent package '" + entry.name + "'")
												return Command.install(commandArgs)
											})
										})
										return Promise.waterfall(installLinkedPackages);
									});
								}

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
						
						})
			
				});
				
			}
		})
	
	}
)