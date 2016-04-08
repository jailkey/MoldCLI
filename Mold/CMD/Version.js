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
			'Mold.CMD.UpdateMoldJson'
		]
	},
	function(){

		Command.register({
			name : "version",
			description : "get / set the version of the current package.",
			parameter : {
				'--up' : {
					'description' : 'Set the current version number to the next possible, for example 0.0.1 becomes 0.0.2',
				},
				'-set' : {
					'description' : 'Set the current version number.'
				}
			},
			code : function(args){

				return new Promise(function(resolve, reject){
					Command.getMoldJson({ '-p' : ''}).then(function(moldJson){
						moldJson = moldJson.parameter.source[0].data;
						if(!Object.keys(args.parameter).length){
							Helper.info("Version: " + moldJson.version).lb();
							resolve(args);
							return;
						}
						
						if(args.parameter['--up']){
							var newVersion = Version.next(moldJson.version);
						}

						if(args.parameter['-set']){
							var newVersion = args.parameter['-set'].value;
							try {
								Version.validate(newVersion);
							}catch(e){
								reject(new Mold.Errors.CommandError(e.message, 'version'))
								return;
							}
						}

						if(newVersion){
							Command
								.updateMoldJson({ '-property' : 'version', '-value' : String(newVersion), '--silent' : true})
								.then(function(){
									Helper.ok("Version updated to: " + newVersion).lb();
									resolve(args);
								}).catch(reject)
						}else{
							Helper.error("No version defined!");
							resolve(args);
						}
					})
					.catch(reject)
				});
				
			}
		})
	
	}
)