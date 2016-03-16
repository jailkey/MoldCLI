"use strict";
//!info transpiled
/**
 * @module Mold.Core.Version
 * @description provides methods and property to manage versions
 */
Seed({
		type : "module",
	},
	function(modul){
		
		var Version = function(){

		}

		Version.prototype = {
			validate : function(version){
				if(!version){
					throw new Error("Version is not defined!")
				}
				if(typeof version !== "string"){
					throw new Error("Version is not a string! ['" + version + "']")
				}
				var parts = version.split(".");
				if(parts.length !== 3){
					throw new Error("Version needs parts! ['" + version + "']")
				}
				for(var i = 0; i < parts.length; i++){
					
				}
			},
			next : function(current){

			},
			compare : function(target, source){
				this.validate(target);
				this.validate(source);
				if(target === source){
					return "equal";
				}
				var sourceParts = source.split('.');
				var targetParts = target.split('.');

				for(var i = 0; i < sourceParts.length; i++){
					if(+sourceParts[i] > +targetParts[i]){
						return "smaller";
					}else if(+sourceParts[i] < +targetParts[i]){
						return "bigger";
					}
				}
			}
		}


		modul.exports = new Version();
	}
)