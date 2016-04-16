//!info transpiled
Seed({
		type : "action",
		platform : 'node',
		include : [
			{ Command : 'Mold.Core.Command' },
			{ Promise : 'Mold.Core.Promise' },
			{ InstallInfo : 'Mold.Core.InstallInfo'},
			{ Helper : 'Mold.Core.CLIHelper'}
		]
	},
	function(){

		var _hasFile = function(path, info){
			for(var packageName in info.packages){
				var currentPackage = info.packages[packageName];
				for(var i = 0; i < currentPackage.sources.length; i++){
					if(currentPackage.sources[i].path === path){
						return true;
					}
				}
			}
			return false;
		}



		Command.register({
			name : "find-project-seeds",
			description : "returns all seeds which are not related to other packages",
			parameter : {},
			code : function(args){
				return new Promise(function(resolve, reject){
					Command
						.scanRepositories()
						.then(function(result){
							InstallInfo.getFile().then(function(infos){
								var filterd = [];
								result.collected.files.forEach(function(path){
									if(!_hasFile(path, infos)){
										filterd.push(path);
									}
								})
								
								args.collected = result.collected;
								args.collected.files = filterd;

								//ask if foundent seeds should be added
								var cliForm = Helper.createForm([
									{
										label : "Do you want to add the " + (result.collected.files.length) + " founded files to mold.json? (yes/no)",
										input : {
											name : 'replace',
											type : 'default',
											validate : 'yesno',
											messages : {
												error : "Please answer with yes or no!",
												success : function(data){
													if(data === "yes"){
														return Helper.COLOR_GREEN + "The founded files would be added to mold.json."+ Helper.COLOR_RESET
													}else{
														return Helper.COLOR_GREEN + "The founded files would be ignored." + Helper.COLOR_RESET
													}
												}
											},
											onsuccess : function(data){
												if(data === "yes"){
													var that = this;
													//add files to mold.json
													Command
														.getMoldJson({ '-p' : ''})
														.then(function(moldJsonResult){
															var data = moldJsonResult.parameter.source[0];
															data.seeds = data.seeds || [];
															filterd.forEach(function(entry){
																if(!~data.seeds.indexOf(entry)){
																	data.seeds.push(Mold.Core.Pathes.getNameFromPath(entry));
																}
															})

															Command
																.updateMoldJson({ '-property' : 'seeds', '-value' : data.seeds})
																.then(that.next)
																.catch(reject);
														})
														.catch(reject)
												}else{
													this.next();
												}
											}
										}
									},
								]);

								cliForm.then(function(collected){
									cliForm.close();
									resolve(args);
									
								})
								.catch(reject)

								cliForm.start();
							});
						})
						.catch(reject)
				});
			}
		})
	}
)