//!info transpiled
Seed({
		type : "action",
		platform : 'node',
		include : [
			{ Command : 'Mold.Core.Command' },
			{ Promise : 'Mold.Core.Promise' },
			{ Helper : 'Mold.Core.CLIHelper' },
			{ File : 'Mold.Core.File' },
		]
	},
	function(){

		Command.register({
			name : "merge",
			description : "Merges a local and a remote file.",
			parameter : {
				'-local' : {
					'description' : 'The local file.',
					'required' : true
				},
				'-l' : {
					'alias' : '-local'
				},
				'-remote' : {
					'description' : 'The remote file.',
					'required' : true
				},
				'-r' : {
					'alias' : '-remote'
				}
			},
			code : function(args){
				Helper = Helper.getInstance();
				Helper.silent = args.conf.silent;

				return new Promise(function(resolve, reject){
					var local = args.parameter['-local'].value;
					var remote = args.parameter['-remote'].value;

					var copy = function(ready){
						var file = new File(remote);
						file.copy(local).then(function(){
							ready();
						}).catch(reject);
					}

					var form = [
						{
							label : "Do you want to replace the local [" + local + "] file with the remote file [" + remote + "]? (yes/no)",
							input : {
								name : 'replace',
								type : 'default',
								validate : 'yesno',
								messages : {
									error : "Please answer with yes or no!",
									success : function(data){
										if(data === "yes"){
											return Helper.COLOR_GREEN + "The local file [" + local + "] will be replaced with the remote file [" + remote + "]." + Helper.COLOR_RESET
										}else{
											return Helper.COLOR_GREEN + "The local file [" + local + "] will not be overwritten." + Helper.COLOR_RESET
										}
									}
								},
								onsuccess : function(data){
									if(data === "yes"){
										copy(this.next)
									}else{
										this.next();
									}
								}
							}
						},
					]

					var cliForm = Helper.createForm(form);

					cliForm.then(function(collected){
						args.collected = collected;
						cliForm.close();
						resolve(args);
						
					});

					cliForm.catch(function(err){
						reject(err)
					})

					cliForm.start();
				});
			}
		})
	
	}
)