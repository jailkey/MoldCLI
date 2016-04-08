//!info transpiled
Seed({
		type : "action",
		platform : 'node',
		include : [
			{ Command : 'Mold.Core.Command' },
			{ Promise : 'Mold.Core.Promise' },
			{ Helper : 'Mold.Core.CLIHelper' }
		]
	},
	function(){

		Command.register({
			name : "git-ignore",
			description : "Adds/removes a path to/from the .gitignor files",
			parameter : {
				'-path' : {
					description : 'The path you want to add!',
					required : true
				},
				'-p' : {
					alias : '-path'
				},
				'--add' : {
					description : "Adds the given path to the .gitignore file"
				},
				'--remove' : {
					description : "Removes the given path from the .gitignore file"
				},
			},
			code : function(args){
				var filename = ".gitignore";
				var add = (args.parameter['--add']) ? args.parameter['--add'].value : false;
				var remove = (args.parameter['--remove']) ? args.parameter['--remove'].value : false;

				Helper = Helper.getInstance();
				Helper.silent = args.conf.silent;

				if(!add && !remove){
					throw new Mold.Errors.CommandError("No operation defined, you have to use --add or --remove to modify the .gitignore file!")
				}

				var _entryExists = function(content, entry){
					if(!content){
						return false;
					}
					var lines = content.split('\n');
					for(var i = 0; i < lines.length; i++){
						var line = lines[i];
						if(entry === line){
							return true;
						}
					}
					return false;
				}

				var _removeEntry = function(content, entry){
					if(!content){
						return "";
					}
					var lines = content.split('\n');
					var outputContent = "";
					for(var i = 0; i < lines.length; i++){
						var line = lines[i];
						if(entry !== line){
							outputContent += line + "\n";
						}
					}
					return outputContent;
				}

				return new Promise(function(resolve, reject){
					
					var file = new Mold.Core.File(filename);
					file.load()
						.then(function(){
							if(add){
								if(_entryExists(file.content, args.parameter['-path'].value)){
									Helper.info("Entry currently exists in " + filename + "! [" + args.parameter['-path'].value + "]").lb();
									resolve(args);
								}else{

									file.content += "\n" + args.parameter['-path'].value;
									file.save()
										.then(function(){
											Helper.ok("Entry added to " + filename + " [" + args.parameter['-path'].value + "]").lb();
											resolve(args);
										})
										.catch(reject);
								}
							}else if(remove){
								file.content += _removeEntry(file.content, args.parameter['-path'].value);
								file.save()
									.then(function(){
										Helper.ok("Entry removed from " + filename + " [" + args.parameter['-path'].value + "]").lb();
										resolve(args);
									})
									.catch(reject);
							}
						})
						.catch(reject)

				});
			}
		})
	
	}
)