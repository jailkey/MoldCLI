//!info transpiled
/**
 * @module Mold.Core.ClI
 * @description static object provides methods to create CLI commands
 */
Seed({
		type : "static",
		platform : 'node',
		include : [
		//	'Mold.Lib.Event',
		//	'Mold.Tools.CLIForm',
			{ Promise : 'Mold.Core.Promise' },
			{ CLIHelper : 'Mold.Core.CLIHelper' },
			{ Command : 'Mold.Core.Command' },
			{ Logger : 'Mold.Core.Logger' }
		]
	},
	function(){

		var _loadedCommandSeeds = {};
		var fs = require('fs');
		
		var _isLoaded = new Mold.Core.Promise();

		if(!Mold.isNodeJS){
			throw Error("You can use Mold.Core.CLI only with NodeJS!");
		}

		var _loadCommands = function(repo, commandSpace, packagePath){
			commandSpace = commandSpace || 'CMD';
		
			return new Mold.Core.Promise(function(resolve, reject){
				var name = repo.name + "." + commandSpace + ".";
				var path = packagePath + repo.path + "/" + commandSpace + "/";

				if(Mold.Core.Pathes.exists(path, 'dir')){
					var dirValue = fs.readdirSync(path);
				
					var loadingSeeds = [];
					dirValue.forEach(function(entry){
						var seedName = name + entry.replace(".js", "");
						var seedPath = path + entry.replace(".js", "") + ".js";
						if(Mold.Core.Pathes.exists(seedPath, 'file') && !_loadedCommandSeeds[seedName]){
							loadingSeeds.push(Mold.load(seedName))
						}
					})

					var testPromise = new Mold.Core.Promise().all(loadingSeeds);
					testPromise.then(function(){
						resolve()
					})
				}else{
					resolve()
				}
				
			}, { throwError : true });
		}

		var _loadRepositorys = function(type){
			var repos = Mold.Core.Config.get("repositories", type);
			var packagePath = Mold.Core.Config.get("config-path", type);
			var count = 0;

			var next = function(){
				if(!repos || !Object.keys(repos)[count]){
					if(type === 'local'){
						_loadRepositorys('global');
					}else{
						_isLoaded.resolve()
					}

					return null;
				}
				var repo = {
					name : Object.keys(repos)[count],
					path : repos[Object.keys(repos)[count]]
				}
				count++;
				_loadCommands(repo, repos.commandSpace || null, packagePath).then(function(){
					next()
				});
			}
			next();
			
		}

		var _validate = function(task){
			if(!task.name){
				throw new Error("Command name is not defined!");
			}

			if(!task.code){
				throw new Error("Command code is not defined! [" + task.name + "]");
			}
		}


		var _getCommandHelp = function(cmd){
			CLIHelper.lb();
			var help = "Mold command help '\033[1;35m" + cmd.name + "\033[0m'\n";
			
			if(cmd.description){
				help += cmd.description + "\n";
			}
			var commandHelpTable = [];

			for(var name in cmd.parameter){
				commandHelpTable.push([
					name,
					(cmd.parameter[name].description) ? cmd.parameter[name].description : (cmd.parameter[name].alias) ? "Alias for " + cmd.parameter[name].alias : ''
				])
			}

			console.log(help)

			CLIHelper.table(commandHelpTable, {
				columnFormat : [
					function(value){
						return "    "+ CLIHelper.COLOR_CYAN + value + "    " + CLIHelper.COLOR_RESET;
					}
				]
			})

			CLIHelper.lb();
			
		}

		var _getCommandList = function(){
			CLIHelper.lb();
			CLIHelper.write("Mold cli commands:").lb()
			var commandList = [];
			var commands = Command.get();
			for(command in commands){
				commandList.push([
					commands[command].name,
					commands[command].description || ''
				])
			}

			CLIHelper.table(commandList, {
				columnFormat : [
					function(value){
						return "    "+ CLIHelper.COLOR_CYAN + value + "    " + CLIHelper.COLOR_RESET;
					}
				]
			})
			CLIHelper.lb();
		}


		var _execCommands = function(count, data){
			count = count || 0;
			var commandLineParameter = Mold.Core.Initializer.getCLICommands();
			var currentCommand = commandLineParameter[count];

			return new Promise(function(resolve, reject){
				if(currentCommand){
				
				 	Command.execute(currentCommand.name, currentCommand.parameter, data)
				 		.then(function(result){
				 			count++;
				 			_execCommands(count, result).catch(reject);
			 			})
			 			.catch(reject);
				}else{
					resolve();
			
				}
			});
		}

		_loadRepositorys('local');
		
			_isLoaded.then(_execCommands).catch(function(e){
				if(e instanceof Mold.Errors.CommandError){
					CLIHelper.lb();
					CLIHelper.warn(e.message).lb();
					if(e.command){
						_getCommandHelp(Command.get(e.command))
					}else{
						_getCommandList();
					}
					return;
				}else{
					CLIHelper.stopAllInstances();
					Logger.error(e);
				}
			})

		

		return {
			commandList : _getCommandList,
		}
	}
)