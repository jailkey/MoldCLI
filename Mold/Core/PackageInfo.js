//!info transpiled
Seed({
		type : "module",
		include : [
			{ File : "Mold.Core.File" },
			{ Promise : "Mold.Core.Promise" },
			{ Command : "Mold.Core.Command" }
		]
	},
	function(module){

		var PackageInfo = function(){
			this.infoDir = ".mold/";
			this.packageInfoFile = "package-info.json";

		}

		PackageInfo.prototype = {
			getFile : function(){
				var file = new File(this.infoDir + this.packageInfoFile, "json");
				return file.load();
			},
			get : function(packageName, recursive){
				var that = this;
				return new Promise(function(resolve, reject){
					
					this.getFile()
						.then(function(data){
							if(data && data.packages){
								if(packageName && data.packages[packageName]){
									if(recursive){
										var depSteps = [];
										for(var i = 0; i < data.packages[packageName].dependencies.length; i++){
											var currentDep = data.packages[packageName].dependencies[i];
											depSteps.push(that.get(currentDep.name, recursive))
										}
										Promise
											.all(depSteps)
											.then(function(results){
												var output = data.packages[packageName];
												for(var i = 0; i < results.length; i++){
													output.dependencies =  output.dependencies || [];
													output.sources =  output.sources  || [];
													for(var y = 0; y < results[i].dependencies.length; y++){
														if(!output.dependencies.find(function(entry){
																return entry.name === results[i].dependencies[y].name;
															})
														){
															output.dependencies.push(results[i].dependencies[y]);
														}
													}
													for(var y = 0; y < results[i].sources.length; y++){
														if(!output.sources.find(function(entry){
																return entry.path === results[i].sources[y].path;
															})
														){
															output.sources.push(results[i].sources[y]);
														}
													}
													
												}
												resolve(output);
											}).catch(function(err){
												reject(reject)
											})
									}else{
										resolve(data.packages[packageName]);
									}
								}else if(!packageName){
									resolve(data.packages);
								}else{
									resolve(null);
								}
							}else{
								resolve(null);
							}
							
						}.bind(this))
						.catch(reject)

				}.bind(this))
			},
			set : function(packageName, data){
				return new Promise(function(resolve, reject){
					if(!packageName){
						reject(new Error("Package name not given! [Mold.Core.PackageInfo]"));
						return;
					}
					var path = this.infoDir + this.packageInfoFile;
					Command.createPath({ '-p' : path, '--silent' : true})
						.then(function(){
							var file = new File(path, "json");
							file.load()
								.then(function(infoData){
									if(!infoData){
										infoData = {
											packages : {}
										}
									}else if(!infoData.packages){
										infoData.packages = {};
									}

									infoData.packages[packageName] = data;
									file.content = infoData;
									file.save()
										.then(resolve)
										.catch(reject)
								})
								.catch(reject)
						})
						.catch(reject)
				}.bind(this))
			},
			remove : function(packageName){
				if(!packageName){
					reject(new Error("Package name not given! [Mold.Core.PackageInfo]"));
					return;
				}
			}
		}


		module.exports = new PackageInfo();	
	}
)