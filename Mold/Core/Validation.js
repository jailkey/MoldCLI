"use strict";
//!info transpiled
/**
 * @module Mold.Core.Validation
 * @description provides methods and property to manage versions
 */
Seed({
		type : "module",
	},
	function(modul){

		var _validations = {};

		var ValidationError = function CommandError (message, validationType) {
			message += " " + Mold.getInstanceDescription();
		    this.name = 'ValidationError';
		    this.message = message;
		    this.stack = message + "\n" + (new Error()).stack;
		    this.type = type;
		}


		
		var Validation = function(){

		}

		Validation.prototype = {
			validate : function(value, type){
				if(this.exists(type)){
					var validator = this.get(type);
					if(validator(value)){
						return this;
					}else{
						throw new ValidationError("Value '" + value + "' is not valid! [" + type + "]", type);
					}
				}
				return this;
			},
			isValidationSequenz : function(sequenz){

			},
			exists : function(type){
				return (_validations[type]) ? true : false;
			},
			get : function(type){
				return _validations[type] || null;
			},
			add : function(type, validation){
				if(!type){
					throw new Error("validation type must be given!");
				}
				
				if(!validation){
					throw new Error("validation method must be given!");
				}
				
				if(_validations[type]){
					throw new Error("validation type [" + type + "] currently exists!")
				}

				_validations[type] = validation;
			},
			remove : function(type){
				delete _validations[type];
			}
		}
		
		var validator = new Validation();

		//add default validations
		validator.add('required', function(value){
			if(value === undefined || value === null){
				return false;
			}
			return true;
		})

		modul.exports = validator;
	}
)