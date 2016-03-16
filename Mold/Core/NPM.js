"use strict";
//!info transpiled
/**
 * @module Mold.Core.NPM
 * @description provides methods to manage NPM packages
 */
Seed({
		type : "module",
		include : [
			{ Promise : "Mold.Core.Promise" },
			{ File : "Mold.Core.File" }
		]
	},
	function(modul){

		var npm = require("npm");
		var semver = require("semver");
		
		var NPM = function(){}

		NPM.prototype = {

			extendPath : function(path){
				if(!~path.indexOf('package.json')){
					if(path[path.length -1] !== "/"){
						path += "/";
					}
					path += "package.json";
				}
				return path;
			},

			packageJsonExists : function(path){
				path = this.extendPath(path);
				return Mold.Core.Pathes.exists(path, 'file');
			},

			getPackageJson : function(path){
				path = this.extendPath(path);
				var file = new File(path, 'json');
				return file.load();
			},

			install : function(packageName, version, isGlobal, save){
				var that = this;
				return new Promise(function(resolve, reject){
					if(!packageName){
						reject(new Error("npm packagename is not defined!"))
						return;
					}

					that.exists(packageName, version)
						.then(function(exists){
							if(exists){
								resolve("npm '" + packageName + "' package allready exists.");
								return;
							}else{
								var packages = packageName.split(',');
								
								if(save){
									npm.config.set('save', true);
								}

								npm.commands.install(packages, function (err, data) {
									if(err){
										reject(err);
									}else{
										resolve("npm package '"  + packageName + "' successfully installed!");
									}
								});
							}
						})
						.catch(reject);
				});
			
			},

			exists : function(packageName, version){
				return new Promise(function(resolve, reject){
					npm.load({}, function (err) {
	  					if (err){
	  						reject(err)
	  						return;
	  					}
	  		
	  					npm.commands.list(['--verbose', packageName], true, function(err, data){
	  						if(err){
	  							reject(err);
	  							return; 
	  						}
	  		
	  						if(!data._found){
	  							resolve(false);
	  							return;
	  						}
	  						
	  						if(data.dependencies && data.dependencies[packageName] && version){
		  						if(!semver.satisfies(data.dependencies[packageName].version, version)){
		  							reject(new Error("npm '" + packageName + "' version does not match. Required is " + version + ". Please update npm!"));
		  							return;
		  						}
		  					}
	  						resolve(true);
	  					});
	  				});
	  			});
			},
		}


		modul.exports = new NPM();
	}
)