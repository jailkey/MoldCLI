//!info transpiled
Seed({
		type : "action",
		platform : 'node',
		include : [
			{ Command : 'Mold.Core.Command' },
			{ Helper : 'Mold.Core.CLIHelper' },
			{ Promise : 'Mold.Core.Promise' }
		]
	},
	function(){

		Command.register({
			name : "create-repo",
			description : "Creates a repository by name!",
			parameter : {
				'-name' : {
					'description' : 'The repository name!',
					'required' : true,
				},
				'-n' : {
					'alias' : '-name'
				}
			},
			code : function(args){

				Helper = Helper.getInstance(args.conf)

				return new Promise(function(resolve, reject){
					var name = args.parameter['-name'].value;
					if(!Mold.Core.Pathes.isMoldPath(name)){
						throw new Error("Name is not a valid repository name! [" + name + "]")
					}

					var existingRepositories = Mold.Core.Config.get('repositories');
					var isExisting = false;
					for(var repoName in existingRepositories){
						if(name.startsWith(repoName)){
							isExisting = true;
						}
					}

					if(!isExisting){
						var promise = new Promise();
						existingRepositories[name] = name.replace(/\./g, '/') + '/';
						Mold.Core.Config.set('repositories', existingRepositories);
						
						promise
							.all([
								Command.execute('create-path', { '-p' : existingRepositories[name] }),
								Command.execute('update-mold-json', { '-pr' : 'repositories', '-v' : existingRepositories})
							])
							.then(function(){
								Helper.ok('Repository successfully created! [' + name + '] \n');
								resolve(args)
							})
							.catch(reject)
						
					}else{
						Helper.info('Repository already exists! [' + name + '] \n');
						resolve(args)
					}
					
				}); 
			}
		})
	
	}
)