"use strict";
//!info transpiled
/**
 * @module Mold.Core.Command
 * @description static object provides methods to create CLI commands
 */
Seed({
		type : "static",
		include : [
			{ Promise : "Mold.Core.Promise" },
			{ File : "Mold.Core.File" }
		]
	},
	function(){

		var _commands = {};
		var _cache = {};

		var _globaleParams = ['--silent', '--help'];
		
		var _getCamelCase = function(name){
			var newName = "";
			for(var i = 0; i < name.length; i++){
				var current = name[i];
				if(current === "-"){
					i++;
					current = name[i].toUpperCase();
				}
				newName += current;
			}

			return newName;
		}

		return {
			/**
			 * @method get 
			 * @description returns a comman object by a given name
			 * @param  {string} name - the command name, if not given all commands will be returned
			 * @return {object} returns a command object or null
			 */
			get : function(name){
				if(!name){
					return _commands;
				}
				return _commands[name] || null;
			},

			/**
			 * @method validate 
			 * @description validates a command object
			 * @param  {[type]} cmd - the command object
			 * @return {[type]} returns true or throws an Error
			 */
			validate : function(cmd){
				if(!cmd.name){
					throw new Error("Command needs a name!");
				}
				if(!cmd.code){
					throw new Error("Command needs a method! [" + cmd.name + "]");
				}
				if(!cmd.description){
					throw new Error("Command needs a description! [" + cmd.name + "]");
				}

				return true;
			},

			/**
			 * @method register 
			 * @description registers a command 
			 * @param  {object} cmd - the command object
			 * @return {this} returns this
			 */
			register : function(cmd){
				this.validate(cmd);

				if(_commands[cmd.name]){
					throw new Mold.Errors.CommandError("Command '" + cmd.name + "' already exists!", cmd.name);
				}

				_commands[cmd.name] = cmd;

				//add command to the Command object
				if(!this[_getCamelCase(cmd.name)]){
					this[_getCamelCase(cmd.name)] = function(parameter){
						return this.execute(cmd.name, parameter);
					}.bind(this);
				}else{
					throw new Mold.Errors.CommandError("Command method '" + cmd.name + "' already exists!", cmd.name);
				}

				return this;
			},


			findAliasParameter : function(cmd, parameter){
				var undefined;
				for(var param in parameter){
					if(cmd.parameter[param].alias){
						var aliasName = cmd.parameter[param].alias;
						var originalData = Mold.clone(parameter[param]);
						delete parameter[param];
						var extended = cmd.parameter[aliasName];
						for(var prop in extended){
							originalData = (originalData === undefined) ? {} : originalData;
							if(!originalData[prop]){
								originalData[prop] = extended[prop];
							}
						}
						parameter[aliasName] = originalData;
						delete parameter[aliasName]["alias"];
					}
				}
				return parameter;
			},

			getParameterInfo : function(cmd, paramName){
				return cmd.parameter[paramName] || null;
			},
			extendParameterInfo : function(cmd, parameter){
				for(var param in parameter){
					var info = this.getParameterInfo(cmd, param);

					if(info){
						for(var prop in info){
							parameter[param][prop] = info[prop];
						}
					}
				}
				return parameter;
			},
			initFileParams : function(cmd, parameter, data){
				var files = [];
				return new Promise(function(resolve, reject){

					for(var param in parameter){
						if(parameter[param].type === 'source' && !parameter[param].alias){
							var path = parameter[param].value;

							if(parameter[param].extendpath && !path.endsWith(parameter[param].extendpath)){
								path += parameter[param].extendpath;
							}

							var file = new File(path);
							var loader = file.load();
							var loaded = new Promise();
							files.push(loaded);
							loader.then(function(){
									var format = parameter[param].format;
									var currentLoaded = loaded;
									return function(fileData){
										try {
											if(format && format === "json"){
												try {
													fileData = JSON.parse(fileData);
												}catch(e){
													throw new Error(e.message + " file is not a valide JSON file! ")
												}
											}
											parameter.source = parameter.source || [];
											parameter.source.push({
												file : path,
												data : fileData
											});
											
											currentLoaded.resolve(parameter.source);
										}catch(e){
											e.message += " [" + path + "]";
											currentLoaded.reject(e);
										}
									}
								}())
						}
					}
					if(files.length){
						new Promise().all(files).then(function(){
							resolve(parameter);

						}).catch(reject)
					}else{
						resolve(parameter);
					}
				})
			},

			/**
			 * @method setValue 
			 * @description creates value objectes for each parameter
			 * @param {object} parameter - the parameter object
			 */
			setValue : function(cmd, parameter){
				var undefined;
				for(param in parameter){
					
					if(typeof parameter[param] !== "object" || !parameter[param].value){
						parameter[param] = {
							value : parameter[param]
						}
					}

					if((parameter[param] === undefined || parameter[param].value === undefined) && !param.startsWith('--')){
						throw new Mold.Errors.CommandError("Parameter '" + param + "' must not be empty! ", cmd.name)
					}
				}
				return parameter;
			},
			
			/**
			 * @method checkRequired 
			 * @description checks if a parameter is required
			 * @param  {[type]} cmd       [description]
			 * @param  {[type]} parameter [description]
			 * @return {[type]}           [description]
			 */
			checkRequired : function(cmd, parameter){
				for(var param in cmd.parameter){
					if(cmd.parameter[param].required && !parameter[param]){
						throw new Mold.Errors.CommandError("Command '" + cmd.name + "' requires parameter '" + param + "'!", cmd.name)
					}
				}
			},

			/**
			 * @methdod parameterExists 
			 * @description checks if a parameter exists
			 * @param  {onject} cmd - command object
			 * @param  {string} name - parameter name
			 * @return {boolean} returns true if the parameter exists, otherwise false
			 */
			parameterExists : function(cmd, name){
				return (cmd.parameter[name]) ? true : false;
			},
			getInvalidParameter : function(cmd, parameter){
				for(var param in parameter){
					if(!this.parameterExists(cmd, param) && !~_globaleParams.indexOf(param)){
						return param;
					}
				}
				return null;
			},

			handleGlobaleParameter : function(cmd, parameter, conf){
				var newParameter = {};
				for(var param in parameter){
					if(param === '--silent'){
						conf.silent = true;
					}
					if(param === '--help'){
						throw new Mold.Errors.CommandError("Help requested", cmd.name)
					}
					if(!~_globaleParams.indexOf(param)){
						newParameter[param] = parameter[param];
					}
				}
				return newParameter;
			},

			execute : function(name, parameter, data){
				var conf = {
					silent : false
				}

				if(!_commands[name]){
					throw new Mold.Errors.CommandError("Command '" + name + "' not found!");
				}

				var cmd = this.get(name);
				parameter = this.handleGlobaleParameter(cmd, parameter, conf);
				
				var invalid = this.getInvalidParameter(cmd, parameter);

				if(invalid){
					throw new Mold.Errors.CommandError("Parameter '" + invalid + "' is not a valid parameter!", name)
				}
				
				parameter = this.setValue(cmd, parameter);
				parameter = this.findAliasParameter(cmd, parameter);
				parameter = this.extendParameterInfo(cmd, parameter);

				var that = this;
				return new Promise(function(resolve, reject){
					that.initFileParams(cmd, parameter, data)
						.then(function(parameter){

							that.checkRequired(cmd, parameter);
							try {
								cmd.code({ parameter : parameter, name : name, conf : conf }).then(function(result){
									resolve(result);
								}).catch(reject)
							}catch (e){
								reject(e);
							}
						})
						.catch(reject)
				})
			}
		}
	}
)