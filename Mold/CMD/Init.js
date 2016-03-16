//!info transpiled
Seed({
		type : "action",
		platform : 'node',
		include : [
			{ Command : 'Mold.Core.Command' },
			{ Promise : 'Mold.Core.Promise' },
			{ Helper : 'Mold.Core.CLIHelper' },
			'Mold.CMD.GetMoldJson'
		]
	},
	function(){

		Command.register({
			name : "init",
			description : "Creates a new  mold project.",
			parameter : {},
			code : function(args){
				
				var configName = 'mold.json';
				var readmeName = 'README.md';

				return new Promise(function(resolve, reject){
					
					if(Mold.Core.Pathes.exists(configName, 'file')){
						reject(new Mold.Errors.CommandError("mold.json allready exists!", "init"));
						return;
					}

					var cliform = [
						{
							label : "name your application (Mold.Lib.Peter):",
							input : {
								name : 'name',
								type : 'default',
								validate : 'required',
								messages : {
									error : "Is not valid!",
								},
								onsuccess : function(data){
									this.next()
								}
							}
						},
						{
							label : "version (0.0.1):",
							input : {
								name : 'version',
								type : 'default',
								validate : 'required',
								messages : {
									error : "It's not valid version number!"
								},
								onsuccess : function(data){
									this.next()
								}
							}
						},
						{
							label : "name of the repository (Mold):",
							input : {
								name : 'reponame',
								type : 'default',
								validate : 'required',
								messages : {
									error : "It's not a valid repository name!"
								},
								onsuccess : function(data){
									this.next()
								}
							}
						},
						{
							label : "path to the repository (Mold/):",
							input : {
								name : 'repopath',
								type : 'default',
								validate : 'required',
								messages : {
									error : "It's not a valid repository name!"
								},
								onsuccess : function(data){
									this.next()
								}
							}
						}
					]

					var cliForm = Helper.createForm(cliform);
					
					cliForm.then(function(collected){
						try {
							var pathesToCreate = [];
							
							var moldJsonData = {
								name : collected.name,
								version : collected.version,
								dependencies : [],
								repositories : {}
							}

							moldJsonData.repositories[collected.reponame] = collected.repopath;

							pathesToCreate.push(function(){
								return Command
									.createPath({ '-path' : configName, '-content' : JSON.stringify(moldJsonData, undefined, '\t'), '--silent' : true})
									.then(function(){
										Helper.ok(configName + " successfully created!").lb();
									})
							})

							if(!Mold.Core.Pathes.exists('.gitignore', 'file')){
								pathesToCreate.push(function(){
									return Command
										.createPath({ '-path' : '.gitignore', '-content' : '', '--silent' : true})
										.then(function(){
											Helper.ok(".gitignore successfully created!").lb();
										})
								})
							}

							if(!Mold.Core.Pathes.exists(collected.repopath, 'dir')){
								pathesToCreate.push(function(){
									return Command
										.createPath({ '-path' : collected.repopath, '--silent' : true})
										.then(function(){
											Helper.ok("repository '" + collected.repopath + "' successfully created!").lb();
										})
								})
							}

							if(!Mold.Core.Pathes.exists(readmeName, 'file')){
								pathesToCreate.push(function(){
									return Command
										.createPath({ '-path' : readmeName, '--silent' : true})
										.then(function(){
											Helper.ok("README.md successfully created!").lb();
										})
								})
							}
						
							Promise.waterfall(pathesToCreate)
								.then(function(){
									cliForm.exit();
									resolve(args);
								})
								.catch(function(err){
									cliForm.exit();
									reject(args);
								})
							
						}catch(err){
							reject(err);
						}
					})
					
					cliForm.catch(reject);

					cliForm.start();

				});
				
			}
		})
	
	}
)