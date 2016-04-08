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
					throw new Error("Version number is not defined!")
				}
				if(typeof version !== "string"){
					throw new Error("Version number is not a string! ['" + version + "']")
				}
				var parts = version.split(".");
				if(parts.length !== 3){
					throw new Error("Version number needs 3 parts! ['" + version + "']")
				}
				for(var i = 0; i < parts.length; i++){
					var part = Number(parts[i]) 
					if(isNaN(part) || part === ""){
						throw new Error("Part " + ( i +1 ) + " of the version number is not a number! ['" + version + "']")
					}
				}
			},

			next : function(current){
				this.validate(current);
				var parts = current.split('.');
				return parts[0] + "." + parts[1] + "." + (Number(parts[2]) + 1);
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