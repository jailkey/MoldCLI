//!info transpiled
Seed({
		type : "action",
		platform : 'node',
		include : [
			{ Command : 'Mold.Core.Command' },
			{ Promise : 'Mold.Core.Promise' },
			{ Helper : 'Mold.Core.CLIHelper' },
			{ NPM : 'Mold.Core.NPM' },
		]
	},
	function(){

		Command.register({
			name : "install-npm-package",
			description : "Installs a mold package by a given path or name",
			parameter : {
				'-name' : {
					'description' : 'The npm package name.',
					'required' : true,
				},
				'-n' : {
					'alias' : '-name'
				},
				'-version' : {
					'description' : 'The package version.'
				},
				'--global' : {
					'description' : 'Installs the packge global.'
				},
				'--save' : {
					'description' : 'Saves the package to the package.json'
				}
			},
			code : function(args){

				var name = args.parameter['-name'].value
				var version  = (args.parameter['-version']) ? args.parameter['-version'].value : null;
				var global = (args.parameter['--global']) ? true : false;
				var save = (args.parameter['--save']) ? true : false;

				return new Promise(function(resolve, reject){
					NPM.install(name, version, global, save)
						.then(function(message){
							Helper.info(message).lb();
							resolve();
						})
						.catch(reject)
				})
				
			}
		})
	
	}
)