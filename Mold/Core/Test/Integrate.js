//!info transpiled
Seed({
		type : "module",
		include : [
			{ Tester : "Mold.Core.Test.Tester" },
			{ Reporter : "Mold.Core.Test.ConsoleReporter" },
		]
	},
	function(module){
		Mold.test = function(seedName){
			Mold
				.load(seedName)
				.then(function(seed){
					if(!seed.test){
						throw new Error("No test specified for [" + seed.name + "]")
					}
					Mold.load(seed.test).then(function(testSeed){
						var tester = new Tester();
						tester.addReporter(new Reporter())
						tester.test(testSeed, seed)
						tester.run();
					})
					
				})
		}
	}
)