//!info transpiled
Seed({
		type : "action",
		platform : 'node',
		include : [
			{ Command : 'Mold.Core.Command' },
			{ Promise : 'Mold.Core.Promise' },
			{ Helper : 'Mold.Core.CLIHelper'},
			"Mold.CMD.GetMoldJson"
		]
	},
	function(){

		Command.register({
			name : "update-mold-json",
			description : "Updates the local mold.json file!",
			parameter : {
				'-property' : {
					'description' : 'The property to update',
					'required' : true,
				},
				'-value' : {
					'description' : 'The property value',
					'required' : true,
				},
				'-pr' : {
					'alias' : '-property'
				},
				'-v' : {
					'alias' : '-value'
				}
			},
			code : function(args){
				Helper = Helper.getInstance(args.conf);
				return new Promise(function(resolve, reject){
					

					var undefined;
					var value = args.parameter['-value'].value;
					var property = args.parameter['-property'].value;

					if(typeof value === "string"){
						//if value has brackets try to parse it as json
						if(~value.indexOf('[') || ~value.indexOf('{')){
							value = JSON.parse(value);
						}	
					}
			
					Command.execute('get-mold-json', { '-p' : '' })
						.then(function(response){
							var config = response.parameter.source[0].data;
							var path = response.parameter.source[0].file;
							if(config[property] !== undefined){
								//do something when property is defined?
							}
							config[property] = value;
							var fs = require('fs');
							fs.writeFile(path, JSON.stringify(config, undefined, '\t'), function(err) {
								if(err) {
									reject(err);
									return;
								}

								Helper.ok(path + " successfully modified!").lb();
								resolve();
							}); 
						})
						.catch(reject);


				}); 
			}
		})
	
	}
)