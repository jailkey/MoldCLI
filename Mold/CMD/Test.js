//!info transpiled
"use strict";
Seed({
		type : "action",
		platform : 'node',
		include : [
			{ Command : 'Mold.Core.Command' },
			{ Tester : 'Mold.Core.Test.Tester' },
			{ Helper : 'Mold.Core.CLIHelper' },
			{ Promise : 'Mold.Core.Promise' },
			{ Reporter : 'Mold.Core.Test.CLIReporter'}
		]
	},
	function(){

		Command.register({
			name : "test",
			description : "Test a single seed or all seeds in a package!",
			parameter : {
				'-seed' : {
					'description' : 'Path to seed, if not given the hole package will be tested!',
				},
				'-s' : {
					'alias' : '-seed'
				}
			},
			code : function(args){
				return new Promise(function(resolve, reject){
					var targetSeed = (args.parameter['-seed']) ? args.parameter['-seed'].value : null;
					if(targetSeed){
						Mold.load(targetSeed).then(function(seed){
							if(!seed.test){
								Helper.error("No test specified for [" + seed.name + "]").lb();
							}else{
								Mold.load(seed.test).then(function(testSeed){
									var tester = new Tester();
									tester.addReporter(new Reporter(Helper))
									tester.test(testSeed, seed)
									tester.run();
								})
							}
							
						})
					}else{
						console.log("test package")
					}
				})
			}
		})
	}
);
