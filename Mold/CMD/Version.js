//!info transpiled
Seed({
		type : "action",
		platform : 'node',
		include : [
			{ Command : 'Mold.Core.Command' },
			{ Promise : 'Mold.Core.Promise' },
			{ Helper : 'Mold.Core.CLIHelper' },
			{ Version : 'Mold.Core.Version' },
			'Mold.CMD.GetMoldJson'
		]
	},
	function(){

		Command.register({
			name : "version",
			description : "get / set the version of the current package.",
			parameter : {
				'-dependency' : {
					'description' : 'Name of the dependency to update, if not given all dependencies will be updated!',
				},
				'-d' : {
					'alias' : '-dependency'
				}
			},
			code : function(args){

				return new Promise(function(resolve, reject){
					Command.getMoldJson({ '-p' : ''}).then(function(moldJson){
						moldJson = moldJson.parameter.source[0].data;
						if(!Object.keys(args.parameter).length){
							Helper.info("Version: " + moldJson.version).lb();
							resolve(args);
						}
					})
					.catch(reject)
				});
				
			}
		})
	
	}
)