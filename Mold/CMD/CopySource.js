//!info transpiled
Seed({
		type : "action",
		platform : 'node',
		include : [
			{ Command : 'Mold.Core.Command' },
			{ Promise : 'Mold.Core.Promise' },
			{ File : 'Mold.Core.File' },
			{ Helper : 'Mold.Core.CLIHelper' }
		]
	},
	function(){
		Command.register({
			name : "copy-source",
			description : "Copy a seed from the given path to",
			parameter : {
				'-source' : {
					'description' : 'The source!',
					'required' : true,
				},
				'-target' : {
					'description' : "the target",
					'required' : true
				}
			},
			code : function(args){

				return new Promise(function(resolve, reject){
					var source = args.parameter['-source'].value;
					var target = args.parameter['-target'].value;
					var dir = null;
					var filename = null;

					if(~target.indexOf('/')){
						if(target.endsWith('/')){
							dir = target;
						}else{
							dir = target.substring(0, target.lastIndexOf('/'));
							filename = target.substring(target.lastIndexOf('/'), target.length);
							if(!~filename.indexOf('.')){
								dir += filename;
								filename = null;
							}
						}
					}else{
						if(~target.indexOf('.')){
							filename = target;
						}else{
							dir = target;
						}
					}

					var steps = [];
					if(dir){
						steps.push(function(){
							return Command.createPath({ '-path' : dir})
						})
					}
					if(filename){
						steps.push(function(){
							var file = new File(source);
							return file.copy(target).then(function(){
								Helper.ok("File '" + target + "' succesfully copied!").lb()
							})
						})
					}
					
					Promise.waterfall(steps).then(resolve).catch(reject);

				})
			}

		})
	}
)