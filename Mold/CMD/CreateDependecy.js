//!info transpiled
Seed({
		type : "action",
		platform : 'node',
		include : [
			{ Command : 'Mold.Core.Command' },
			{ Helper : 'Mold.Core.CLIHelper' },
			{ Promise : 'Mold.Core.Promise' },
			{ Version : 'Mold.Core.Version' },
			"Mold.CMD.GetMoldJson",
			"Mold.CMD.UpdateMoldJson"
		]
	},
	function(){

		Command.register({
			name : "create-dependency",
			description : "Creates a new dependency!",
			parameter : {
				'-name' : {
					'description' : 'The dependency name!',
					'required' : true,
				},
				'-n' : {
					'alias' : '-name'
				},
				'-version' : {
					'description' : 'The dependency version!',
					'required' : true,
				},
				'-v' : {
					'alias' : '-version'
				},
				'-path' : {
					'description' : 'The dependency path!',
					'required' : true,
				},
				'-p' : {
					'alias' : '-path'
				},
			},
			code : function(args){
				Helper = Helper.getInstance(args.conf)

				return new Promise(function(resolve, reject){
					
					var configPath = (args.parameter['-config-path']) ? args.parameter['-config-path'].value : '';
					var name = args.parameter['-name'].value;
					var path = args.parameter['-path'].value;
					var version = args.parameter['-version'].value;

					Command.getMoldJson({ '-p' : configPath}).then(function(moldJson){

						if(!moldJson){
							reject(new Error("Config ist not defined! [" + configPath + "]"))
						}

						var currentConf =  moldJson.parameter.source[0].data;
						var createDependency = function(){
							
							currentConf.dependencies = currentConf.dependencies || [];
							currentConf.dependencies.push({
								name : name,
								path : path,
								version : version || '*'
							})
			
							Command.updateMoldJson({
								'-property' : 'dependencies',
								'-value' : currentConf.dependencies,
								
							})
							.then(function(){
								args.parameter.dependencies = currentConf.dependencies
								Helper.ok("Dependency " + name + " successfully added!").lb();
								resolve(args)
							})
							.catch(reject);
						}

						var getDependency = function(name){
							return currentConf.dependencies.find(function(entry){
								return (name === entry.name) ? true : false;
							})
						}

						if(!currentConf.dependencies){
							createDependency();
						}else{
							var dep = getDependency(name);
							if(dep){
								//check existing dep here
								var result = Version.compare(dep.version, version);
								if(result === "smaller"){
									Helper
										.info("Current version of dependency '" + name + " (" + dep.version + ")' is smaller then the available version (" + version + ").")
										.lb()
										.info("Use 'mold update' to update your dependencies!")
										.lb();
								}
								resolve(args)
							}else{
								createDependency();
							}
						};
					})
				}); 
			}
		})
	
	}
)