//!info transpiled
Seed({
		type : "action",
		platform : 'node',
		include : [
			{ Command : 'Mold.Core.Command' },
			{ Promise : 'Mold.Core.Promise' }
		]
	},
	function(){

		Command.register({
			name : "get-mold-json",
			description : "gets a mold.json file from a external repo",
			parameter : {
				'-path' : {
					'description' : 'Path to the repositiory dir.',
					'required' : true,
					'extendpath' : 'mold.json',
					'type' : 'source',
					'format' : 'json'
				},
				'-p' : {
					'alias' : '-path'
				}
			},
			code : function(args){
				return new Promise(function(resolve, reject){
					//console.log("resolve get file", parameter)
					resolve(args);
				}); 
			}
		})
	
	}
)