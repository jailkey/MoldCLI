"use strict";
//irgendasein test
(function(global){

/** ERROR TYPES */
	var SeedError = function SeedError (message) {
	    this.name = 'SeedError';
	    this.message = message;
	    this.stack = (new Error()).stack;
	}

	SeedError.prototype = Object.create(Error.prototype);
	SeedError.prototype.constructor = SeedError;


	var CommandError = function CommandError (message, command) {
		if(__Mold && __Mold.getInstanceDescription){
			message += " "+ __Mold.getInstanceDescription();
		}
		this.name = 'CommandError';
		this.message = message;
		this.stack = message + "\n" + (new Error()).stack;
		this.command = command;
	}

	CommandError.prototype = Object.create(Error.prototype);
	CommandError.prototype.constructor = CommandError;


	var DNAError = function DNAError (message) {
		this.name = 'DNAError';
		this.message = message;
		this.stack = (new Error()).stack;
	}

	DNAError.prototype = new Error;

	var SeedTypeError = function SeedTypeError (message) {
		this.name = 'SeedTypeError';
		this.message = message;
		this.stack = (new Error()).stack;
	}

	SeedTypeError.prototype = new Error;

	var _isNodeJS =  (global.global) ? true : false;
	if(!_isNodeJS){
		var _currentScript = document.currentScript || (function() {
			var scripts = document.getElementsByTagName('script');
			return scripts[scripts.length - 1];
		})();
	}

	//load required node modules
	if(_isNodeJS){
		var fs = require('fs');
		var vm = require('vm');
		var request = require('request');
		var url = require('url');
	}



/** MOLD CONTRUCTOR */
	var Mold = function Mold(){
		//create storages
		this.seeds = [];
		this.seedIndex = {};
		this.seedTypeIndex = {};

		this.Errors = {
			SeedError : SeedError,
			DNAError : DNAError,
			SeedTypeError : SeedTypeError,
			CommandError : CommandError
		}

		this.EXIT = '---exit---';

		this.isNodeJS = _isNodeJS;

		this.ready = this._reCreateReadyPromise();
		if(_isNodeJS){
			this.globalProperties = {
				require : require,
				__dirname : __dirname,
				setTimeout : setTimeout,
				process : process,
				Buffer : Buffer
			}
		}

		this.init();
	}

	var __Mold = Mold.prototype;
	
	Mold.prototype = {
		/**
		* @methode getId
		* @desc returns a uinque ID 
		* @return (Object) - returns the uinque ID
		**/
		ident : 0,
		getId : function (){
			this.ident++;
			return this.ident;
		},

		copyGlobalProperties : function(global){
			for(var prop in this.globalProperties){
				global[prop] = this.globalProperties[prop];
			}
		},

		getInstanceDescription : function(){
			return " [instance:" + ((global && global.vmInstance) ? 'vm' : 'origin') + ((global && global.vmInstance) ? ":" + global.vmInstance : '') + "]";
		},

/** SEED HANDLING */
		load : function(name){

			var seed;
			if((seed = this.Core.SeedManager.get(name))){
				return seed.isReady;
			}
	
			seed = this.Core.SeedFactory({
				name : name,
				state : this.Core.SeedStates.NEW
			});

			this.Core.SeedFlow.exec(seed);
			return seed.isReady;
		},

		_reCreateReadyPromise : function (){
			var id = this.getId();
			this.ready = new this.Core.Promise(false, { throwError : true, name : "Mold.ready"}).all([
				this.Core.Config.isReady,
				this.Core.SeedManager.isReady
			])
		},

/**  OBJECT HANDLING  **/
		
		 extend : function(superClass, subClass){
		 	subClass.prototype = Object.create(superClass);
		 	subClass.prototype.constructor = subClass;
		 	return subClass;
		 },


	 	/**
		* @method mixin
		* @desc Adds methods adn properties from one object to another
		* @param {object} target - Expects the target object
		* @param {object} origin - Expects the origin object
		* @param {[array]} selected - Expects an array with the property- and methodnames that will be copied, the parameter is optional, if it is not given, all methodes an parametes will be copied
		* @return {object} - returns the target object with the new methodes an properties
		**/
		mixin : function(target, origin, selected, config){

			for(var property in origin){
				if(selected && selected.length > 0){
					if(selected.indexOf(property) > -1){
						target[property] = origin[property];
					}
				}else{
					if(config && config.protected){
						if(!target[property]){
							target[property] = origin[property];
						}
					}else{
						target[property] = origin[property];
					}
				}
			}
			return target;
		},

		merge : function(target, origin, conf){

			if(Array.isArray(origin)){
				if(conf && conf.concatArrays){
					if(Array.isArray(target)){
						target = target.concat(origin);
					}else{
						target = origin;
					}
				}else{
					for(var i = 0; i < origin.length; i++){
						if(target[i]){
							if(this.isObject(target[i]) || Array.isArray(target[i])){
								target[i] = this.merge(target[i], origin[i], conf);
							}else{
								target[i] = origin[i];
							}
						}else{
							target[i] = origin[i];
						}
					}
				}
			}else if(this.isObject(origin)){
				for(var prop in origin){
					if(conf && conf.without && !!~conf.without.indexOf(prop)){
						continue;
					}

					if(target[prop]){
						if(conf && conf.merger &&  conf.merger[prop]){
							target[prop] = conf.merger[prop](target[prop], origin[prop], conf);
						}else{
							if(this.isObject(target[prop]) || Array.isArray(target[prop])){
								target[prop] = this.merge(target[prop], origin[prop], conf);
							}else{
								target[prop] = origin[prop];
							}
						}
					}else{
						target[prop] = origin[prop];
					}
					
				}
			}
			return target;
		},

		/**
		 * @method diff 
		 * @description compares two objects and returns a new one that only has the datat from target which not apears in source
		 * @param  {object} target - the target object
		 * @param  {object} source - the source object
		 * @return {object} returns a new diff object
		 */
		diff : function(target, source){
			var output = null;
			if(Array.isArray(target)){
				for(var i = 0; i < target.length; i++){
					var skip = false;
					for(var x = 0; x < source.length; x++){
						if(typeof source[x] === "object"){
							var result = this.diff(target[i], source[x]);
							if(!result){
								skip = true;
								break;
							}
						}else{
							if(target[i] === source[x]){
								skip = true;
								break;
							}
						}
					}
					if(!skip){
						output = output || [];
						output.push(target[i]);
					}
					
				}
			}else if(typeof target === "object"){
				for(var targetProp in target){
					if(!source[targetProp]){
						output = output || {};
						output[targetProp] = target[targetProp]
					}else if(typeof source[targetProp] === "object"){
						var result = this.diff(target[targetProp], source[targetProp]);
						if(result){
							output = output || {};
							output[targetProp] = result;
						}
					}
				}
			}
			return output;
		},

		/**
		 * @method clone 
		 * @description clones an given object
		 * @param  {object} target - the object that should be cloned
		 * @return {object} returns the cloned object
		 */
		clone : function(target) {
		    if(!target || typeof(target) != 'object'){
		        return target;
		    }
		    var newObj = target.constructor();
			for(var prop in target){
				newObj[prop] = this.clone(target[prop]);
			}
	
		    return newObj;
		},

		/**
		* @methode wrap
		* @desc Wraps a Class with a second constructor, so you can execute methods in the scope of the targetclass
		* @param (function) targetClass - Expects the class will be wraped
		* @param (function) wrappingMethode - Expects the method that will be executed, as parameter the scope of the instance will transfered
		* @return (function) wrapperClass - Returns a new Class that wrapped the target class
		**/
		wrap : function(targetClass, wrappingMethode){
			var wrapperClass = function() {
				var constructor = targetClass.apply(this, arguments);
				wrappingMethode(this);
				return constructor;
			}
			wrapperClass.prototype = targetClass.prototype;
			return wrapperClass;
		},

		/**
		 * @method watch 
		 * @description watches a property of an object or html element
		 * @param  {object}   obj - the ojbect to watch
		 * @param  {string}   property - the property to watch
		 * @param  {function} callback - the callback wich will be called if the property has changed
		 * @param  {boolean}  [handleAsObject] - if it is set to true the object will handelt like a object even if it is a html element
		 */
		watch : function(obj, property, callback, handleAsObject){

			if(Object.prototype.watch && !__Mold.isNode(obj)){
				obj.watch(property, callback);
			}else{

				var oldval = obj[property];
				var newval = oldval;
				
				/*use mutation observer for HTML elements*/
				if(__Mold.isNode(obj) && !handleAsObject && obj !== window){
		
					if(!!window.MutationObserver){
						var observer = new MutationObserver(function(mutations) {
							__Mold.each(mutations, function(mutation) {
								
								if(
									mutation.target === obj
									&& mutation.type === 'attributes'
									&& mutation.attributeName === property
								){
									callback.call(obj, property,  mutation.oldValue, obj.getAttribute(property));
								}
						  	});    
						});
					
						observer.observe(obj, { 
							attributes: true,
							childList: true,
							characterData: true ,
							attributeOldValue: true,
						});
					}else{
						obj.addEventListener('DOMAttrModified', function(e){
							if(e.attrName === property){
								callback.call(obj, property, e.prevValue, e.newValue);
							}
						})
					}
				}else{
					var getter = function () {
						return newval;
					}
					var setter = function (val) {
						oldval = newval;
						return newval = callback.call(obj, property, oldval, val);
					}
					if (delete obj[property]) { 
						Object.defineProperty(obj, property, {
							  get: getter, 
							  set: setter,
							  enumerable: true,
							  configurable: true
						});
					}
				}
			}
		},

		/**
		 * @method unwatch 
		 * @description unwatches a object property 
 		 * @param  {object}   obj - the object to unwatch
		 * @param  {string}   property - the property to unwatch
		 * @param  {function} callback - the callback that has to be removed
		 */
		unwatch : function(obj, property, callback){
			if(Object.prototype.unwatch) {
				obj.unwatch(property);
			}else{
				Object.defineProperty(obj, "unwatch", {
					enumerable: false,
					configurable: true,
					writable: false,
					value: function (prop) {
						var val = obj[property];
						delete obj[property];
						obj[property] = val;
					}
				});
			}
		},


/** TEST METHODS **/


		/**
		* @namespace Mold
		* @methode isObject
		* @desc checks if the give value is an object
		* @public
		* @return (Boolean) 
		* @param (Object) collection - the value
		**/
		isObject : function(collection){
			if(Object.prototype.toString.call(collection) === "[object Object]"){
				return true;
			}
			return false;
		},

		/**
		* @namespace Mold
		* @methode isNodeList
		* @desc checks if the give value is a NodeListe
		* @public
		* @return (Boolean) 
		* @param (Object) collection - the value
		**/
		isNodeList : function(collection){
			if(
				Object.prototype.toString.call(collection) === "[object NodeList]"
				||  Object.prototype.toString.call(collection) === "[object HTMLCollection]"
			){
				return true;
			}
			return false;
		},

		/**
		 * @method isNode 
		 * @description checks if an object is in a html element node
		 * @param  {object}  element - the node to check
		 * @return {boolean} returns true if the element is a element node otherwise it returns false
		 */
		isNode : function(element){
			
			if(_isNodeJS) { return false; }
			if(!element) { return false; }
			
			if(element === window){ return true }

			return(
				(typeof element === "object") 
				? element instanceof Node 
				: (
					element 
					&& typeof element === "object" 
					&& typeof element.nodeType === "number"
					&& typeof element.nodeName === "string"
				)
			)
				
		},
	}

	__Mold = Mold.prototype;

	//Build-in core modules
	Mold.prototype.Core = {};

	Mold.prototype.Core.Reporter = function(){

		

	}()


/**
	 * @module Mold.Core.Promise 
	 * @description implements a Promise A+
	 * @param {function} 
	 */
	Mold.prototype.Core.Promise = function Promise(setup, config){

		var _state = "pending",
			_value = false,
			_callbacks = [],
			undefined,
			config = config || {};

		var _name = config.name || __Mold.getId();

		var PromiseError = function(message){
			return {
				name : "PromiseError",
				message : message
			}
		}

		var _changeState = function(state, value){
			
			if ( _state === state ) {
				throw Error("can't transition to same state: " + state + " [" + _name + "]");
			}

			if ( 
				_state === "fulfilled" 
				|| _state === "rejeced" 
			) {
				throw Error("can't transition from current (" + _state + ") state: " + state + " [" + _name + "]");
			}

			if (
				state === "fulfilled" 
				&& arguments.length < 2 
			) {
				throw Error("transition to fulfilled must have a non null value."  + " [" + _name + "]");
			}

			if ( 
				state === "rejeced"
				&& value === null 
			) {
				throw Error("transition to rejected must have a non null reason." + " [" + _name + "]");
			}

			_state = state;
			_value = value;
			_resolve();
			return _state;
		};

		var _resolve = function(){

			if ( _state === "pending" ) {
				return false;
			}
		
			_callbacks.eachShift(function(callbackObject){
				var nextCall = (_state === "fulfilled") ? callbackObject.onFulFilled : callbackObject.onRejected;
				if(typeof nextCall !== "function" ){

					callbackObject.promise.changeState(_state, _value);
				}else{

					try {
						var value = nextCall.call(null, _value);
						if (value && typeof value.then === 'function' ){
							value.then(function(value){
								callbackObject.promise.changeState("fulfilled", value);
							}, function(error){
								callbackObject.promise.changeState("rejected", error);
							});

						}else{
							callbackObject.promise.changeState("fulfilled", value);
						}
					}catch(error){
						callbackObject.promise.changeState("rejected", error);
						if(config.throwError){
							throw error;
						}
					}
				}
			});
		
		};

		var _then = function(onFulFilled, onRejected){

			var promise = new Promise(false, config),
				that = this;

			_async(function(){
				_callbacks.push({
					onFulFilled : onFulFilled,
					onRejected : onRejected,
					promise : promise
				});
				_resolve();
			});

			return promise;
		}


		var _fulfill = function(value){
			_changeState("fulfilled", value );
		}

		var _reject = function(reason){
			_changeState( "reject", reason );
		}

		if(setup && typeof setup === "function"){
			setup.call(null, _fulfill, _reject);
		}

		var _async = function(callback) {
			setTimeout(callback, 5);
		};

		return {
			changeState : _changeState,
			async : _async,
		/**
		 * @method state 
		 * @description returns the current state possible values are reject, fulfilled, reject
		 * @return {string} returns a string with current state
		 */
			state : function(){
				return _state;
			},

		/**
		 * @method all 
		 * @description returns a promise wich will be resolved when all promises in the given list are resolved  
		 * @param  {[type]} promises [description]
		 * @return {[type]}          [description]
		 */
			all : function(promises){
				var fullfillCount = 0;
				var result = [];
				var promise = new Promise(function(resolve, reject){
					var fullfillAll = function(data){
						result.push(data);
						fullfillCount++;
						if(fullfillCount === promises.length){
							resolve(result);
						}
					}
					if(!promises.length){
						resolve([]);
					}
					for(var i = 0; i < promises.length; i++){
						if(!promises[i].then){
							
						}
						promises[i].then(
							fullfillAll,
							reject
						);
					}
				}, config);

				return promise;
			},

			waterfall : function(stack){
				var promise = new Promise(function(resolve, reject){
					var results = [];
					var nextFromStack = function(counter){
						
						counter = counter || 0;
						if(counter === stack.length){
							resolve(results);
							return;
						}
						stack[counter]()
							.then(function(result){
								results.push(result);
								nextFromStack(++counter);
							})
							.catch(reject);
					}
					nextFromStack(0);
				});

				return promise;
			},

			/**
			 * @method fail 
			 * @description the given onfail callback will be called when the promise will be rejected
			 * @param  {function} onfail the onfail callback
			 */
			fail : function(onfail){
				return _then(undefined, onfail);
			},

			/**
			 * @method then 
			 * @description executes the given callbacks when the promise will be resolved / rejected
			 * @param  {[type]} onFulFilled  - will be executed if the will resolved
			 * @param  {[type]} onRejected  - will be executed if the will rejected
			 */
			then : function(onFulFilled, onRejected){
				return _then(onFulFilled, onRejected);
			},

			/**
			 * @method success 
			 * @description the give callback will called if the promise will be resolved
			 * @param  {[type]} onsuccess - the onsuccess callback
			 */
			success : function(onsuccess){
				return _then(onsuccess, undefined);
			},

			/**
			 * @method catch
			 * @alias for fail
			 */
			catch : function(onfail){
				return _then(undefined, onfail);
			},

			/**
			 * @method reject 
			 * @description rejects the current promise
			 * @param  {mixed} reason - a error message
			 */
			reject : function(reason) {
				_reject(reason);
			},

			/**
			 * @method resolve 
			 * @description] resolves the given promise
			 * @param  {mixed} value - a value
			 */
			resolve : function(value){
				if(value && typeof value.then === "function"){
					var promise = new Promise(function(resolve, reject){
						value.then(resolve, reject);
					}, config)
					return promise
				}
				_fulfill(value);
				return this;
			}
		}
	};

	//set static methods
	Mold.prototype.Core.Promise.waterfall = Mold.prototype.Core.Promise().waterfall;
	Mold.prototype.Core.Promise.all = Mold.prototype.Core.Promise().all;

	Mold.prototype.Core.Base64 = function(){
		return {
			btoa : function(str){
				if(_isNodeJS){
					return Buffer(str).toString('base64');
				}else{
					return btoa(str);
				}
			}
		}
	}()


	Mold.prototype.Core.VLQ = function VLQ(){
		
		var VLQ_BASE_SHIFT = 5;
		var VLQ_BASE = 1 << VLQ_BASE_SHIFT;
		var VLQ_BASE_MASK = VLQ_BASE - 1;
		var VLQ_CONTINUATION_BIT = VLQ_BASE;


		var _base64 = function(number){
			var intToCharMap = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('');

			if (0 <= number && number < intToCharMap.length) {
			  return intToCharMap[number];
			}
			throw new TypeError("Must be between 0 and 63: " + number);
		}

		var _toVLQSigned = function(aValue) {
			return aValue < 0
			  ? ((-aValue) << 1) + 1
			  : (aValue << 1) + 0;
		}


		var _fromVLQSigned = function(aValue) {
			var isNegative = (aValue & 1) === 1;
			var shifted = aValue >> 1;
			return isNegative ? -shifted: shifted;
		}
		/*
		var _base64Encode = function(value){
			
			return __Mold.Core.Base64.btoa(encodeURIComponent(value).replace(/%([0-9A-F]{2})/g, function(match, p1) {
				return String.fromCharCode('0x' + p1);
			}));
		}*/

		return {
			encode : function base64VLQ_encode(aValue) {
				var encoded = "";
				var digit;

				var vlq = _toVLQSigned(aValue);

				do {
					digit = vlq & VLQ_BASE_MASK;
					vlq >>>= VLQ_BASE_SHIFT;
					if (vlq > 0) {
						digit |= VLQ_CONTINUATION_BIT;
					}
					encoded += _base64(digit);
				} while (vlq > 0);
				//return aValue;
				return encoded;
			},
			
			decode : function base64VLQ_decode(aStr, aIndex, aOutParam) {
				var strLen = aStr.length;
				var result = 0;
				var shift = 0;
				var continuation, digit;

				do {
					if (aIndex >= strLen) {
						throw new Error("Expected more digits in base 64 VLQ value.");
					}

					digit = base64.decode(aStr.charCodeAt(aIndex++));
					if (digit === -1) {
						throw new Error("Invalid base64 digit: " + aStr.charAt(aIndex - 1));
					}

					continuation = !!(digit & VLQ_CONTINUATION_BIT);
					digit &= VLQ_BASE_MASK;
					result = result + (digit << shift);
					shift += VLQ_BASE_SHIFT;
				} while (continuation);

				aOutParam.value = fromVLQSigned(result);
				aOutParam.rest = aIndex;
			}
		}
	}


	/**
	 * @class SourceMap 
	 * @description creates a new source map
	 * @param {} file 
	 * @param {[type]} content
	 */
	
	Mold.prototype.Core.SourceMap = function(file, content){
		this.names = [];
		this.mappings = [];
		this.rawMappings = [];
		this.lastGeneratedLine = 1;
		this.lastOriginalColumn = 0;
		this.lastGeneratedColumn = 0;
		this.lastOriginalLine = 0;
		this.vlq = new __Mold.Core.VLQ();
		this.files = [];
		this.files.push(file);
		this.mapFile = file + ".map";
		this.sourcesContent = [];
		this.sourcesContent.push(content);


		this.addMapping = function(generatedLine, generatedColumn, originalLine, originalColumn, originalFile, name, code){
			var output = "";
			if(this.lastGeneratedLine !== generatedLine){

				while(this.lastGeneratedLine < generatedLine){
					output += ";"
					this.lastGeneratedLine++;
				}
			}
			output += this.vlq.encode(generatedColumn - this.lastGeneratedColumn);
			this.lastGeneratedColumn = generatedColumn;
			
			output += this.vlq.encode(0);
			output += this.vlq.encode(originalLine - 1 - this.lastOriginalLine);		
			this.lastOriginalLine = originalLine - 1;

			output += this.vlq.encode(originalColumn );
			this.lastOriginalColumn = originalColumn;
			if(name){
				this.names.push(name);

				output += this.vlq.encode(this.names.length - 1);
			}

			this.mappings.push(output);
		}
		
		this.createMapping = function(){
			var output = "";
			var len = this.mappings.length;
			for(var i = 0; i < len; i++){
				output += this.mappings[i];
				if((i + 1) < this.mappings.length && this.mappings[i + 1].indexOf(';') < 0){
					output += ",";
				}
			}
			return output;
		}

		this.create = function(){

			return {
				version : 3,
				file : this.mapFile,
				sourceRoot : "",
				sources: this.files,
				names: this.names,
				mappings: this.createMapping(),
				sourcesContent : this.sourcesContent
			}
		}	
	}


	/**
	 * @module Mold.Core.SeedFactory
	 * @description creates a seed object from a configuration
	 * @param  {object} seedConf 
	 *         - the cofiguration object can contain the following properties
	 *         - 'name' the name of the seed including the full object path, this property is mandatory
	 *         - 'type' the seed dna, the dna describes the way how the module will be executed
	 *         - 'code' the code of the seed, this property is mandatory
	 *         
	 * @return {object} seedObject 
	 *         - returns a seed object with the config properties plus the following methods and properties
	 *         - 'state' the current state of the seed
	 */
	Mold.prototype.Core.SeedFactory = function SeedFactory(conf){

		if(!conf){
			throw new Error("seedConf must be defined!" + __Mold.getInstanceDescription());
		}

		if(typeof conf !== 'object'){
			throw new Error("seedConf must be an object!" + __Mold.getInstanceDescription());
		}

		/**
		 * @class Seed 
		 * @description defineds methods and properties of a seed
		 * @param {[type]} properies - properties configuration
		 */
		var Seed = function Seed(properties){
			if(!properties.name){
				throw new Error('A seed needs a name!' + __Mold.getInstanceDescription())
			}
			this.fileMap = [];

			this.path = null;
			this.fileData = null;

			this._sid = __Mold.getId();
			this._isCreatedPromise = new __Mold.Core.Promise(false, { throwError : true });
			this.isReady = new __Mold.Core.Promise(false, { throwError : true });
			this._isReady = false;
			this.dependenciesLoaded = new __Mold.Core.Promise(false, { throwError : true });
			
			this._dependenciesAreLoaded = false;
			var that = this;
			
			this.dependencies = [];
			this.injections = {};
			this._state = properties.state || __Mold.Core.SeedStates.INITIALISING;
			this._addedLines = 0;

			//append propetises
			for(var prop in properties){
				this[prop] = properties[prop];
			}
			
		}

		Seed.prototype = {
			get sid(){
				return this._sid;
			},

			set sid(sid){
				throw new Error("The property 'sid' is not writeable! [Mold.Core.SeedManager]" + __Mold.getInstanceDescription());
			},

			/**
			 * @method state 
			 * @description get for the state property
			 * @return {number} returns the current state
			 */
			get state(){
				return this._state;
			},

			set state(state){
				this._state = state;
				if(state === __Mold.Core.SeedStates.READY && !this._isReady){
					this.isReady.resolve(this);
					__Mold.Core.SeedManager.checkReady();
					this._isReady = true;
				}
			},


			/**
			 * @method  hasDependency 
			 * @description checks if a specific dependency exists
			 * @param  {string}  name - the name of the dependency
			 * @return {boolean} returns true if the seed has the given dependency otherwise it return false
			 */
			hasDependency : function(name){
				return this.dependencies.find(function(value){
					return (value.name === name) ? true : false;
				});
			},

			/**
			 * @method  hasDependencies 
			 * @description checks if the seed has dependcies 
			 * @return {boolean} return true if the seed has dependencies
			 */
			hasDependencies : function(){
				if(this.dependencies && this.dependencies.length){
					return true;
				}
				return false;
			},

			/**
			 * @addDependency 
			 * @description adds a dependency to the seed
			 * @param {string} dependency - the name of the dependency
			 */
			addDependency : function(dependency){
				if(this.hasDependency(dependency)){
					return false;
				}
				if(!this.dependencies){
					this.dependencies = [];
				}
				this.dependencies.push(dependency);
			},

			addInjection : function(injection){
				for(var inject in injection){
					if(!this.injections[inject]){
						this.injections[inject] = injection[inject];
					}
				}
			},

			/**
			 * @property isLoaded 
			 * @description true if the seed is loaded
			 * @return {boolean} 
			 */
			get isLoaded(){
				return (this.state > __Mold.Core.SeedStates.LOADING) ? true : false;
			},

			/**
			 * @method load 
			 * @description loads the seed if it is not loaded
			 * @return {promise}
			 */
			load : function(){
				if(!this.isLoaded){
					this.path = __Mold.Core.Pathes.getPathFromName(this.name);

					var file = new __Mold.Core.File(this.path);
					var promise = file.load();
					var that = this;

					promise
						.then(function(data){
							that.fileData = data;
							that.mapFileData();
						})
						.fail(function(){
							throw new Error("Can not load seed: '" + that.path + "'! [" + that.name + "]" + __Mold.getInstanceDescription());
						})

					return promise;
				}
			},

			/**
			 * @method mapFileData 
			 * @description creates a filemap from the raw file
			 */
			mapFileData : function(){
				if(this.fileData){
					var line = 0, len = this.fileData.length, i = 0;
					var stopCollection = false, collected = "", charNumber = 0, current = "";
					var that = this;

					var addEntry = function(name, line, charNumber){
						that.fileMap.push({
							name : name,
							line : line,
							charNumber : charNumber - name.length
						});
					}

					for(; i < len; i++){
						current = this.fileData[i];

						switch(current){
							case "\n":
								line++;
								addEntry(collected, line, charNumber);
								collected = "";
								charNumber = 1;
								break;
							case " ":
							case "\t":
								addEntry(collected, line, charNumber);
								collected = "";
								break;
							default:
								collected += current;
								stopCollection = false;
						}
						charNumber++;
					}
				}
			},

			/**
			 * @method buildSourceMap 
			 * @description builds a source map from a filemap, used for pre-transpiled seeds debugging
			 * @return {string} returns the source map
			 */
			buildSourceMap : function(){
				var map = new __Mold.Core.SourceMap(this.path, this.fileData);
				var that = this;
				this.fileMap.forEach(function(entry){
					map.addMapping(entry.line + that._addedLines, entry.charNumber, entry.line, entry.charNumber, 0, entry.name, '');
				});

				return "\n//# sourceMappingURL=data:application/json;base64," + __Mold.Core.Base64.btoa(JSON.stringify(map.create())) + "";
			},

			

			/**
			 * @method checkDependencies 
			 * @description checks the seed dependencies
			 * @return {promise} returns a promise wich will be resolved if all dependencies are loaded
			 */
			checkDependencies : function(){
				var that = this;
				__Mold.Core.DependencyManager.checkDependencies(this).then(function(){
					that.dependenciesLoaded.resolve(that.dependencies);
					that._dependenciesAreLoaded = true;
				})
				return this.dependenciesLoaded;
			},

			/**
			 * @method catched 
			 * @description adds catched information to the seed
			 * @param  {object} info - an object with the seed meta informations
			 * @param  {function} code - the seed code
			 * @return {promise} returns the isCreated promise
			 */
			catched : function(info, code){
				
				if(this.code){
					throw new Error("The seed code is already created! [" + this.name + "] " + __Mold.getInstanceDescription());
				}
				
				this.code = code;

				for(var prop in info){
					if(prop !== "name"){
						this[prop] = info[prop];
					}
				}
				this._isCreatedPromise.resolve(this);
			},

			/**
			 * @method create 
			 * @description executes a pre-transpiled seed to catche it's informations
			 * @return {promise} returns a promise which will be resolved if the seed is created
			 */
			create : function(){
				if(!this.fileData){
					throw new Error("Can not created script without file data! [" + this.name + "]");
				}
				
				var fileData = "//" + this.name + " \n";
				fileData += "(function() { var Seed = function(info, code) {  Mold.Core.SeedManager.catchSeed(info, code, " + this.sid + ")}\n" + this.fileData + "})()";
				this._addedLines = this._addedLines + 2; 
				fileData += this.buildSourceMap();
				if(_isNodeJS){
					try{
						var scriptBox = {
							Mold : __Mold,
							console : console
						}

						__Mold.copyGlobalProperties(scriptBox);
						var context = new vm.createContext(scriptBox);

						var script = new vm.Script(fileData);
  						script.runInContext(context, { filename: this.path });

					}catch(e){
						throw e;
					}
					
				}else{
					this.scriptFile = document.createElement('script');
					this.scriptFile.src = 'data:text/javascript,' + encodeURIComponent(fileData)
					document.body.appendChild(this.scriptFile);
				}
				return this._isCreatedPromise;
			},

			/**
			 * @method execute 
			 * @description executes the seed, injects dependencies if defined and add it to the name space
			 * @return {[type]} [description]
			 */
			execute : function(){
				var typeHandler = __Mold.Core.SeedTypeManager.get(this.type);
				if(!typeHandler){
					throw new Error("SeedType '" + this.type + "' not found! [" + this.name + "]" + __Mold.getInstanceDescription());
				}
				if(!this.code){
					throw new Error("Code property is not defined! [" + this.name + "]" + __Mold.getInstanceDescription());
				}

				if(Object.keys(this.injections).length){
					var closure = "//" + this.name + "\n";
					this._addedLines++;
					for(var inject in this.injections){
						closure += "	var " + inject + " = " + this.injections[inject] + "; \n" ;
						this._addedLines++;
					}
					closure += " return " + this.code.toString() + "\n";
					closure += this.buildSourceMap();
	
					if(_isNodeJS){
						try{
							var sandbox = {
								output : function(){},
								Mold : __Mold,
								console : console
							}

							__Mold.copyGlobalProperties(sandbox);
							var context = new vm.createContext(sandbox);

							var script = new vm.Script("var output = function() { " + closure + "\n}()", { filename: this.path, lineOffset : this.fileData.split("\n").length - closure.split("\n").length + 1});
							var test = script.runInContext(sandbox, { filename: this.path });
							this.code = sandbox.output;
						}catch(e){
							throw e;
						}
					}else{
						this.code = new Function(closure)();
					}
				}

				__Mold.Core.NamespaceManager.addCode(this.name, typeHandler.create(this));
			}
		}

		return new Seed(conf);
	
	}


	/**
	 * @module SeedManager 
	 * @description manage all appended seeds
	 */
	Mold.prototype.Core.SeedManager = function(){
		var _seeds = [];
		var _seedIndex = {};
		var _readyPromise = new __Mold.Core.Promise(false, { throwError : true });
		var _isReady = false;

		var _deleteSeedByName = function(name){
			for(var i = 0; i < _seeds.length; i++){
				if(_seeds[i].name === name){
					_seeds.splice(i, 1);
					return true;
				}
			}
			return false;
		}

		return {

			/**
			 * @property {number} len 
			 * @description contains the amount of added seeds
			 */
			get count(){
				return _seeds.length;
			},

			set count(value){
				throw new Error("The property 'count' is not writeable! [Mold.Core.SeedManager]" + __Mold.getInstanceDescription());
			},

			/**
			 * @method getBySid 
			 * @description returns a seed be the given seed id, if no seed is found it returns undefined
			 * @param  {number} sid - the seed id
			 * @return {mixed} returns a seed or undefined
			 */
			getBySid : function(sid){
				return _seeds.find(function(seed){
					return (seed.sid === sid) ? true : false;
				});
			},

			/**
			 * @method catchSeed 
			 * @description catches a seed and ad the catched information to the registerd seed
			 * @param  {object} seedInfo - an object with seed informations
			 * @param  {function} seedCode - the code of the seed
			 * @param  {number} [ident] -  the seed id
			 */
			catchSeed : function(seedInfo, seedCode, ident){
				var seed;
				if(seedInfo.name){
					seed = this.get(seedInfo.name);
					//if no seed found with this name create a new one
					if(!seed){
						seed = __Mold.Core.SeedFactory({
							name : seedInfo.name,
							state : __Mold.Core.SeedStates.PENDING,

						});
						this.add(seed);
						seed.catched(seedInfo, seedCode);
						__Mold.Core.SeedFlow.exec(seed)
						return this;
					}
				}else{
					//if no name is defined get seed by ident
					seed = this.getBySid(ident);
				}
				if(seed){
					seed.catched(seedInfo, seedCode);
				}
				return this;
			},

			/**
			 * @method add 
			 * @description adds a seed to the seedmangaer
			 * @param {object} seed - the seed
			 */
			add : function(seed){
				if(_seedIndex[seed.name]){
					if(seed.overwrite){
						_deleteSeedByName(seed.name);
					}else{
						return false;
					}
				}
				_seeds.push(seed);
				_seedIndex[seed.name] = seed;
				return this;
			},

			/**
			 * @method get 
			 * @description returns a seed by the given name
			 * @param  {string} name - the seed name, expects the full name for example Mold.Core.Test
			 * @return {object | null} returns the selected seed if found
			 */
			get : function(seed){
				var name = (typeof seed === 'object') ? seed.name : seed;
				return _seedIndex[name] || null;
			},

			/**
			 * @method each 
			 * @description iterates through the all added seeds and executes a callback per seed with the as argument
			 * @param  {dunction} callback - a function with the seed as argument
			 */
			each : function(callback){
				for(var name in _seedIndex){
					callback(_seedIndex[name], name)
				}

				return this;
			},

			/**
			 * @method remove 
			 * @description removes a seed 
			 * @param {mixed} seed - expects a seed or a seedname
			 */
			remove : function(seed){
				var name = (typeof seed === 'object') ? seed.name : seed;
				delete _seedIndex[name];
				_deleteSeedByName(name);
				return this;
			},

			/**
			 * @method checkReady 
			 * @description checks if all seeds has the state ready
			 * @return {boolean} returns true if all seeds are ready otherwise it returns false
			 */
			checkReady : function(){
				
				//renew promise if the last check was true;
				if(this._lastReadyState){
					_readyPromise = new __Mold.Core.Promise(false, { throwError : true });
					this.isReady = _readyPromise;
					__Mold._reCreateReadyPromise();
				}

				var i = 0, len = _seeds.length;
				for(; i < len; i++){
					if(_seeds[i].state !== __Mold.Core.SeedStates.READY){
						this._lastReadyState = false;
						return false;
					}
				}

				//resolve promise and create a new one
				_readyPromise.resolve(_seeds);
				
				this._lastReadyState = true;
				return true;
			},

			/**
			 * @properts isReady 
			 * description returns a promise which will resolved if all seeds are ready
			 * @return {Boolean} [description]
			 */
			isReady : _readyPromise
		}
	}();



	/**
	 * @module Mold.Core.NamespaceManger
	 * @description provide methods for creating / validating a
	 */
	Mold.prototype.Core.NamespaceManager = function(){

		return {

			/**
			 * @method validateName
			 * @description checks if the given name is a valid Mold namespace name
			 * @param  {string} name - a string with the name
			 * @return {boolean} returns true if the name is valid and false if not 
			 */
			validate : function(name){
				if(/^[A-Z]{1}[a-z|A-Z]*$/.test(name)){
					return true;
				}else{
					return false;
				}
			},

			/**
			 * @method create 
			 * @description creates a new namespace with the given name
			 * @param  {string} name - the name of the namespace
			 * @param  {object} [root] - an optional root namespace if this parameter is not set the new namespace will be created inside the globale space
			 * @return {object} returns the create namespace
			 */
			create : function(name, root){
				if(!this.validate(name)){
					throw new Error("'" + name + "' is not a valid Namespace name!" + __Mold.getInstanceDescription());
				}
				root = root || global;
				root[name] = {};
				return root[name];
			},

			/**
			 * @method exists
			 * @description checks if a namespace exists
			 * @param  {string} name - a string with the namespace name
			 * @param  {object} [root] - an optional object with the root namepsace
			 * @return {boolean} returns true if the namespace existes otherwise false
			 */
			exists : function(name, root){
				root = root || global;
				if(root[name]){
					return true;
				}
				return false;
			},

			/**
			 * @method addCode 
			 * @description adds code to the end of the given namespace chain, non existing namespaces will be created
			 * @param {string} chainName - a string with the namespaces seperated by .
			 * @param {mixed} code - the code
			 */
			addCode : function(chainName, code){
				var parts = chainName.split('.');
				var root = global;
				for(var i = 0; i < parts.length - 1; i++){
					var part = parts[i];
					if(!this.exists(part, root)){
						root = this.create(part, root);
					}else{
						root = root[part];
					}
				}
				root[parts[parts.length -1]] = code;
			}
		}
	}();

	Mold.prototype.Core.SeedTypeManager = function(){
		var _seedTypeIndex = {};

		return {
			/**
			 * @method validateSeedType 
			 * @description validates a seed type object
			 * @param  {object} type - a seed type object
			 * @throws {SeedTypeError} if the type object miss mandantory properties
			 */
			validate: function(type){
				if(!type.name){
					throw new SeedTypeError('SeedType \'name\' is not defined!' + __Mold.getInstanceDescription());
				}

				if(!type.create){
					throw new SeedTypeError('SeedType \'create\' is not defined! [' + type.name + ']' + __Mold.getInstanceDescription());
				}

				if(typeof type.create !== 'function'){
					throw new SeedTypeError('SeedType \'create\' is not a function! [' + type.name + ']' + __Mold.getInstanceDescription());
				}


			},

			/**
			 * @property {number} count 
			 * @description returns the amount of stored seed types
			 */
			get count(){
				return Object.keys(_seedTypeIndex).length;
			},

			set count(value){
				throw new Error("the property 'len' is not writeable! [Mold.Core.SeedTypeManger]" + __Mold.getInstanceDescription());
			},

			/**
			 * @method addSeedType 
			 * @description adds a new seed type
			 * @param {object} type - expects a seed typ object
			 */
			add : function(type){
				this.validate(type);
				_seedTypeIndex[type.name] = type;
				return this;
			},

			/**
			 * @method removeSeedType 
			 * @description removes a seed type by name
			 * @param  {type} name - the seed type name
			 */
			remove : function(name){
				var type = _seedTypeIndex[name];
				if(type && typeof type.destruct === 'function'){
					type.destruct();
				}
				delete _seedTypeIndex[name];
			},

			/**
			 * @method getSeedType 
			 * @description returns a seed type object by the given name
			 * @param  {string} name - a string with the name
			 * @return {name} returns the seed type obejct or null with no object was found
			 */
			get : function(name){
				return _seedTypeIndex[name] || null;
			}
		}

	}();


	Mold.prototype.Core.DependencyManager = function(){
		var _dependenyPropertys = {};

		var _getRelativeDependencies = function(dep, seed){
			var depParts = dep.split(".");
			var seedName = seed.name;
			
			if(depParts[0] === ""){
				
				var nameParts = seedName.split(".");
				depParts.shift();
				nameParts.pop();
				return nameParts.concat(depParts).join('.');
			}

			return dep;
		}

		return {

			/**
			 * @method find 
			 * @description find all dependecy properties inside the seed and add them as dependencx
			 * @param  {[type]} seed the seed
			 */
			find : function(seed){
				for(var prop in _dependenyPropertys){
					if(seed[prop]){
						if(Array.isArray(seed[prop])){
							for(var i = 0; i < seed[prop].length; i++){

								if(__Mold.isObject(seed[prop][i])){

									for(var injection in seed[prop][i]){
										seed[prop][i][injection] = _getRelativeDependencies(seed[prop][i][injection], seed)
										seed.addInjection(seed[prop][i]);
										seed.addDependency(seed[prop][i][injection]);
									}
								}else{
									seed.addDependency(_getRelativeDependencies(seed[prop][i], seed));
								}
							}
						}
					}
				}
				return this;
			},

			/**
			 * @method checkDependencies 
			 * @description checks if all dependencies are loaded
			 * @param  {Seed} seed - the seed to check
			 * @return {boolean} returns true if all dependecies are loaded, otherwise false
			 */
			checkDependencies : function(seed){
			
				var seedsLoades = [];

				for(var i = 0; i < seed.dependencies.length; i++){
					var depSeed = __Mold.Core.SeedManager.get(seed.dependencies[i]);
					if(depSeed){
						seedsLoades.push(depSeed.isReady);
					}else{
						var promise =  __Mold.load(seed.dependencies[i]);

						seedsLoades.push(promise);
					}
				}
	
				var promise = new __Mold.Core.Promise(false, { throwError : true });
				if(seedsLoades.length){
					promise = promise.all(seedsLoades, { throwError : true });
				}else{
					promise.resolve();
				}
				return promise;
			},

			/**
			 * @method addDependencyProperty 
			 * @description adds a dependency property
			 * @param {string} name - name of the property
			 */
			addDependencyProperty : function(name){
				if(!_dependenyPropertys[name]){
					_dependenyPropertys[name] = true;
				}
				return this;
			},
		}
	}();

	/**
	 * @module Mold.Core.SeedStates 
	 * @description includes all available seed states
	 * @type {enum}
	 */
	Mold.prototype.Core.SeedStates = {
		NEW : 1,
		LOADING : 2,
		LOADED : 2,
		PREPARSING : 3,
		PARSING : 4,
		INSPECTING : 5,
		VALIDATING : 6,
		TRANSPILING : 7,
		INITIALISING : 8,
		PENDING : 9,
		EXECUTING : 10,
		READY : 11, 
		ERROR : 12, 
	}


	/**
	 * @module Mold.Core.SeedFlow 
	 * @static
	 * @description static module provides methods to control the seed flow
	 */
	Mold.prototype.Core.SeedFlow = function(){

		var _stateFlows = {};
		var _afterFlow = {};
		var _executedSeedFlows = {};

		return {
			/**
			 * @method on 
			 * @description adds a flow middleware to the seed flow
			 * @param  {number} state - the state where the middleware should be executed
			 * @param  {function} action - the middleware action
			 * @return {this} returns this for chaining
			 */
			on : function(state, action){
				_stateFlows[state] = _stateFlows[state] || [];
				_stateFlows[state].push(action);
				return this;
			},

			/**
			 * @method onAfter
		 	 * @description adds a after-flow middleware to the seed flow, use this to change the state of a seed
			 * @param  {number} state - the state where the middleware should be executed
			 * @param  {function} action - the middleware action
			 * @return {this} returns this for chaining
			 */
			onAfter : function(state, action){
				_afterFlow[state] = action;
				return this;
			},

			/**
			 * @method exec 
			 * @description starts to execute the seed flow for thegiven seed
			 * @param  {object} seed - the seed
			 * @param  {number} [index] - the index of the current states middleware, this property is optional if not set the index is 0
			 * @return {this} returns this for chaining
			 */
			exec : function(seed, index){
				var index = index || 0;
				if(_executedSeedFlows[seed.name] && _executedSeedFlows[seed.name][seed.state] >= index){
					return;
				}
				if(!_stateFlows[seed.state] || !_stateFlows[seed.state][index]){
					if(_afterFlow[seed.state]){
						index = null;
						var flow = _afterFlow[seed.state];
					}else{
						return;
					}
				}else{
					var flow = _stateFlows[seed.state][index];
				}

				var done = function(){
					var next = (index === null) ? null : index + 1;
					this.exec(seed, next);
				}.bind(this);

				_executedSeedFlows[seed.name] = _executedSeedFlows[seed.name] || {};
				_executedSeedFlows[seed.name][seed.state] = index;
				flow(seed, done);

				return this;
			}
		}
	}();

	/**
	 * @module Mold.Core.Pathes 
	 * @description provides methods to transform an generate pathes
	 */
	Mold.prototype.Core.Pathes = function(){
		var _pathHandler = {};

		return {

			/**
			 * @method on 
			 * @description registers a path parsing function for a specific path type
			 * @param  {string} type - the path type    
			 * @param  {Function} callback - the function that should be executed on this type of pathes 
			 */
			on : function(type, callback){
				_pathHandler[type] = callback;
				return this;
			},

			/**
			 * @method getPathFromName 
			 * @description translite a seed loading string into a path
			 * @param  {string} name - the string to convert
			 * @return {string} returns a seed path
			 */
			getPathFromName : function(name, ignorExistingCheck){
				if(typeof name !== "string"){
					throw new TypeError("Name must be a string. [Mold.Core.Pathes] " + __Mold.getInstanceDescription());
				}
				var type = 'mold';
				if(~name.indexOf(":")){
					var parts = name.split(":");
					type = parts[0];
					name = parts[1];
				}
				
				if(!_pathHandler[type]){
					throw new Error("Path type '" + type + "' is not supported! [Mold.Core.Pathes]" + __Mold.getInstanceDescription());
				}

				return _pathHandler[type](name, ignorExistingCheck);
			},

			/**
			 * @method isMoldPath 
			 * @description checks if a path is a Mold seed-path or not
			 * @param  {type}  path - the path
			 * @return {boolean} returns true if it is a Mold seed-path or not
			 */
			isMoldPath : function(path){
				if(!path || ~path.indexOf("..") || ~path.indexOf("/") || ~path.indexOf("\\")){
					return false;
				}
				var parts = path.split('.');
				for(var i = 0; i < parts.length; i++){
					if(!__Mold.Core.NamespaceManager.validate(parts[i])){
						return false;
					}
				}

				return true;
			},

			/**
			 * @method isHttp 
			 * @description checks if a path is a http or https path
			 * @param  {string}  path - the path to check
			 * @return {boolean} returns true if the path is a http path otherwise it returns false
			 */
			isHttp : function(path){
				if(path.startsWith('http:') || path.startsWith('https:')){
					return true;
				}
				return false;
			},

			/**
			 * @method  isHttps 
			 * @description checks if a path is a https path
			 * @param  {string}  path  - the path to check
			 * @return {boolean}  returns true if the path is a https path otherwise it returns false
			 */
			isHttps : function(path){
				if(path.startsWith('https:')){
					return true;
				}
				return false;
			},

			/**
			 * @method camelToHypen 
			 * @description converts a camelcase to a hypen
			 * @param  {string} camel - the camelcase
			 * @return {string} returns a path with hypens instade of camelcase
			 */
			camelToHypen : function(camel){
				var camel = camel.replace(/\./g, '-');
				var output = "";
				for(var i = 0; i < camel.length; i++){
					output += camel[i].toLowerCase();
				}
				return output;
			},

			/**
			 * @method getMoldPath 
			 * @description returns the current Mols.js path
			 * @return {string} returns a string
			 */
			getMoldPath : function(){
				if(_isNodeJS){
					var pathMod = require("path");
					var currentPath = pathMod.relative(process.cwd(), __dirname);
					return (currentPath) ?  currentPath + "/" : "";
				}else{
					var path = _currentScript.getAttribute('src');
					if(~path.indexOf("/")){
						path = path.substring(0, path.lastIndexOf("/") + 1);
					}else{
						path = "";
					}
					return path;
				}
			},

			/**
			 * @method getCurrentPath 
			 * @description returns the current relative path
			 * @return {string} returns the current relative path
			 */
			getCurrentPath : function(){
				return "";
			},

			cleanPath : function(path){
				var protocol = "";
				if(path.startsWith('http://')){
					protocol = "http://";
				}
				if(path.startsWith('https://')){
					protocol = "https://";
				}
				path = path.replace(protocol, "");
				path = path.replace(/\/\//g, "/");

				return protocol + path;
			},

			/**
			 * @method exists 
			 * @description checks if a path exists
			 * @platform node
			 * @param  {string} path - the path to check
			 * @param  {string} type - the path type to check, possible values are 'file' and 'dir'
			 * @return {boolean} returns true if the path exists otherwise false 
			 */
			exists : function(path, type){
				if(_isNodeJS){
					if(!type){
						throw new Error("No path type given!");
					}

					try{
						var stats = fs.lstatSync(path);
						switch(type){
							case 'file' :
								return stats.isFile();
							case 'dir' :
								return stats.isDirectory();
						}

						return false;
					}catch(e){
						return false;
					}
					return false;
				}
				return true;
			}
		}
	}();

	/**
	 * @module Mold.Core.Config 
	 * @description provides methods to load, set and get configuration file and params
	 * @static
	 */
	Mold.prototype.Core.Config = function(){
		
		var _configValue = {
			local : {
				'config-path' : __Mold.Core.Pathes.getCurrentPath(),
				'config-name' : 'mold.json',
			},
			global : {
				'config-path' : __Mold.Core.Pathes.getMoldPath(),
				'config-name' : 'mold.json',
			}
		}

		var _defaultType = 'local';

		var _isReady = new __Mold.Core.Promise(false, { throwError : true });
		var _readyCallbacks = [];
	
		return {
			switchConfig : function(type){
				_defaultType = type;
			},

			/**
			 * @method set 
			 * @description set a configuration parameter
			 * @param {sting} name - the parameter name
			 * @param {mixed} value - the parameter value
			 */
			set : function(name, value, type){
				type = type || _defaultType;
				_configValue[type] = _configValue[type] || {};
				_configValue[type][name] = value;
				return this;
			},

			/**
			 * @method get 
			 * @description returns a configuration property
			 * @param  {string} name - the parameters name
			 * @return {mixed} returns the parameter value
			 */
			get : function(name, type){
				var undefined;
				type = type || _defaultType;
				if(!_configValue[type]){
					throw new Error("Config type '" + type + "' is not defined!" + __Mold.getInstanceDescription())
				}
				if(!name){
					return _configValue[type];
				}
				return (_configValue[type][name] === undefined) ? null : _configValue[type][name];
			},

			/**
			 * @method search 
			 * @description search a property in all config files
			 * @param  {string} name the property name
			 * @return {mixed} returns the property value or null if nothing was found
			 */
			search : function(name){
				if(_configValue['local'] && _configValue['local'][name]){
					return  _configValue['local'][name]
				}else{
					if(_configValue['global'] && _configValue['global'][name]){
						return _configValue['global'][name];
					}
				}
				return null;
			},

			/**
			 * @method getAll 
			 * @description returns the hole configuration file
			 * @param  {string} [type] - optional the type of configuration possible values are 'local' and 'global' 
			 * @return {[type]}      [description]
			 */
			getAll : function(type){
				if(type){
					return _configValue[type];
				}
				return _configValue;
			},

			overwrite : function(config){
				_configValue = config;
			},

			/**
			 * @method loadConfig 
			 * @description loads a configuration file 
			 * @param  {string} path - path to the configuration file
			 * @param  {string} type - type of the configuration (local/global)
			 * @return {promise} returns a promise which will be resolved when the configuration file ist loaded
			 */
			loadConfig : function(path, type){
				type = type || _defaultType;
				
				var that = this;
				var configFile = new __Mold.Core.File(path);
				var promise = configFile.load();

				return new Promise(function(resolve, reject){
					promise
						.then(function(data){
							data = JSON.parse(data);
							for(var prop in data){
								that.set(prop, data[prop], type);
							}
							resolve(data)
						})
						.catch(function(err){
							reject(new Error("Error in config file [" + path + "] "))
						})
				})
				
			},

			/**
			 * @method init 
			 * @description initialize the config, loads a configuration file
			 * @return {promise} returns a promise 
			 */
			init : function(){
				var that = this;
				var configPath = __Mold.Core.Initializer.getParam('config-path') || this.get('config-path', _defaultType);
				var configName = __Mold.Core.Initializer.getParam('config-name') || this.get('config-name', _defaultType);
				var onlyOneConfig = __Mold.Core.Initializer.getParam('use-one-config') || false;

				if(configPath !== "" && !configPath.endsWith("/")){
					configPath += "/";
				}

				this.set('config-path', configPath);
				this.set('config-name', configName)

				var localPath = configPath + configName;
				var promise = this.loadConfig(localPath);
				
				//use two config files (if exists) only on node
				if(_isNodeJS && !onlyOneConfig){
					//if a global file exists load also the global once
					var globalConfigPath = this.get('config-path', 'global');
					var globalConfigName = this.get('config-name', 'global');
					var globalPath = globalConfigPath + globalConfigName;

					if(__Mold.Core.Pathes.exists(globalPath, 'file') && globalPath !== localPath){

						return new __Mold.Core.Promise(function(resolve, reject){
							var loadGlobal = function(data){
								var globalPromise = that.loadConfig(globalConfigPath + globalConfigName, 'global');
								
								globalPromise.then(function(localData){
									_isReady.resolve([localData, data]);
									resolve([localData, data]);
								}).catch(reject);
							}

							promise.then(function(data){
								loadGlobal(data);
							}).catch(function(){
								loadGlobal();
							});
						}, { throwError : true });
					}
					
				}
				
				promise.then(function(data){
					_isReady.resolve(data);
				}).catch(function(e){
					console.log(e.stack)
				});

				return promise;
			},

			isReady : _isReady

		}
	}();

	/**
	 * @namespace PolyFillManager 
	 * @description handles polyfills, use this to avoid problems with overwriting
	 */
	Mold.prototype.Core.PolyFillManager = function(){
		var _polyFills = {};

		return {
			/**
			 * @method add 
			 * @description adds a polyfill
			 * @param {string} name - name of the pollyfill
			 * @param {code} code - poly fillcode
			 */
			add : function(polyfill){
				if(!polyfill.name){
					throw new Error("Polyfill 'name' is not defined");
				}
				if(!polyfill.code){
					throw new Error("Polyfill 'code' is not defined");
				}
				if(_polyFills[polyfill.name]){
					throw new Error("Polyfill '" + name + "' already exists!");
				}
				_polyFills[polyfill.name] = polyfill;
				if(!polyfill.object || !polyfill.method){
					_polyFills[polyfill.name].code();
				}else{
					if(!polyfill.object.prototype[polyfill.method]){
						_polyFills[polyfill.name].code();
					}
				}
				return this;
			}
		}
	}()

	Mold.prototype.Core.Initializer = function(){
		var _params = ['config-name', 'config-path', 'global-config-name', 'global-config-path', 'root-path', 'use-one-config'];
		var _availableParams = {};
		var _cliCommands= [];

		var _getBrowserParam = function(name){
			var param = document.currentScript.getAttribute(name);
			return param || null;
		}

		var _getNodeParam = function(name){
			var argFound = false, value = null;

			for(var i = 0; i < process.argv.length; i++){
				if(argFound){
					value = process.argv[i];
					break;
				}
				if(process.argv[i] === name){
					argFound = true;
				}
			}
			return value;
		}

		var _isConfigParam = function(name){
			return _params.find(function(paramName){
				return (paramName === name) ? true : false; 
			})
		}

		var _intiCliCommands = function(){
			var command = { name : null, parameter : {} }, getValue = false;
			
			var currentParameter = null;
			for(var i = 2; i < process.argv.length; i++){
				var part = process.argv[i];
				if(_isConfigParam(part)){
					i++;
					continue;
				}
				if(part.startsWith('--')){
					command.parameter[part] = true;
					getValue = false;
				}else if(part.startsWith('-')){
					command.parameter[part] = "";
					currentParameter = part;
					getValue = true;
				}else if(getValue){
					command.parameter[currentParameter] += part;
					getValue = false;
				}else if(part === '+'){
					if(command.name){
						_cliCommands.push(command);
					}
					currentParameter = null;
					command = { name : null, parameter : {} };
					getValue = false;
				}else{
					currentParameter = null;
					command.name = part;
					getValue = false;
				}
			}
			if(command.name) {
				_cliCommands.push(command)
			}
		}

		return {
			/**
			 * @method isCLI 
			 * @description checks if mold is called with CLI commands 
			 * @return {boolean} returns true if mold is called with CLI commands, otherwise it returns false
			 */
			isCLI : function(){
				return (_cliCommands.length) ? true : false;
			},

			/**
			 * @method init 
			 * @description get alls parameters are set to mold at the beginning
			 */
			init : function(){
				_availableParams = this.getInitParams();
				if(_isNodeJS){
					_intiCliCommands();
				}
			},

			/**
			 * @method getParam 
			 * @description returns the specified parameter by name
			 * @param  {string} name - the name of the parameter
			 * @return {mixed} returns the parameter if found, otherwise it returns false
			 */
			getParam : function(name){
				return _availableParams[name] || null;
			},

			/**
			 * @method getCLICommands 
			 * @description returns all CLI command wich are found
			 * @return {array} returns an array with all founded cli commands
			 */
			getCLICommands : function(){
				return _cliCommands;
			},

			/**
			 * @method getInitParams 
			 * @description gets all initializing parameter and returns them
			 * @return {object} returns all initializing parameter
			 */
			getInitParams : function(){
				var output = {};
				_params.forEach(function(entry){
					var result = null;

					if(_isNodeJS){
						result = _getNodeParam(entry);
					}else{
						result = _getBrowserParam(entry);
					}

					if(result){
						output[entry] = result;
					}
				});

				return output;
			}
		}
	}();

	/**
	 * @modul Mold.Core.Preprocessor 
	 * @description provides methods for adding / removing and executing preprozessor scripts
	 */
	Mold.prototype.Core.Preprocessor = function(){
		var _preprocessors = [];

		var _getParams = function(args){
			var output = {};
			args = args.replace(/(\S*?)([\s]*?)(=)([\s]*)(\S*)/gm, function(){
				return arguments[1] + arguments[3] + arguments[5];
			})
			var parts = args.split(" ");
			for(var i = 0; i < parts.length; i++){
				if(parts[i] === ""){
					continue;
				}
				if(~parts[i].indexOf("=")){
					var paramParts = parts[i].split("=");
					output[paramParts[0]] = paramParts[1];
				}else{
					output[parts[i]] = true;
				}
			}
			return output;
		}

		var _getCommandActions = function(command, seed){
			var actions = []
			var regString = "\\/\\/!" + command + "([\\s\\S]*?)$";
			var regExp = new RegExp(regString, "gm");
			seed.fileData.replace(regExp, function(all, params){
				actions.push({ parameter  : _getParams(params) });
				return all;
			});
			return actions;
		}

		var _applyCommand = function(command, actions, seed){
			var count = -1;
			var regString = "\\/\\/!" + command + "([\\s\\S]*?)$";
			var regExp = new RegExp(regString, "gm");
			seed.fileData = seed.fileData.replace(regExp, function(all){
				count++;
				if(actions[count].result){
					return actions[count].result;
				}
				return all;
			});
		}

		var _processCommand = function(command, action, seed, done){
			var regString = "\\/\\/!" + command + "([\\s\\S]*?)$";
			var regExp = new RegExp(regString, "gm");
			var undefined;
			seed.fileData = seed.fileData.replace(regExp, function(all, params){
				var parameter = _getParams(params);
				var result = action(parameter, seed, done);
				if(result === undefined){
					return all;
				}else{
					return result
				}
			})
		}

		return {
			/**
			 * @method add 
			 * @description adds a new preprocessor
			 * @param {string} name - pre processor name
			 * @param {function} code - pre processor script
			 */
			add : function(name, code){
				_preprocessors.push({
					name : name,
					code : code
				});
				return this;
			},

			/**
			 * @method remove 
			 * @description removes a preprocessor by name
			 * @param {string} name - name of the preprocessor
			 */
			remove : function(name){
				for(var i = 0; i < _preprocessors.length; i++){
					if(_preprocessors[i].name === name){
						_preprocessors.splice(i, 1);
						break;
					}
				}
				return this;
			},
			
			/**
			 * @method exec 
			 * @description execute all preprocessors on a seed
			 * @param  {[type]} seed - the seed that should be preprocessed
			 */
			exec : function(seed){
				return new __Mold.Core.Promise(function(resolve){
					var i = 0;
					var next = function(){
						var process = _preprocessors[i] || null;
						if(process){
							var actions = _getCommandActions(process.name, seed);
							var y = 0;
							var nextAction = function(){
								var action = actions[y] || null;
								if(!action){
									_applyCommand(process.name, actions, seed)
									i++;
									next();
									return;
								}

								var done = function(result){
									action.result = result;
									y++
									nextAction();
								}

								process.code(action.parameter, seed, done) 

							}.bind(this)
							nextAction();
						}else{
							resolve(seed);
						}

					}.bind(this);
					next();
				}, { throwError : true });
			}
		}
	}();


	/**
	 * @module Mold.Core.File
	 * @description creates a class calls File wich allows to ready a file on the full stack (node/browser) with the same API
	 * @return {class} returns a File class 
	 */
	Mold.prototype.Core.File = function(filename, format, encoding){

		var _content = null;
		var _encoding = encoding || 'utf8';
		var _isHttp = __Mold.Core.Pathes.isHttp(filename);
		var _isHttps = __Mold.Core.Pathes.isHttps(filename);

		var _ajaxLoader = function(){

			return new __Mold.Core.Promise(function(resolve, reject){
				var xhr;

				if(XMLHttpRequest !== undefined){
				 	xhr = new XMLHttpRequest();
				}else{
					var versions = [
						"MSXML2.XmlHttp.5.0", 
						"MSXML2.XmlHttp.4.0",
						"MSXML2.XmlHttp.3.0", 
						"MSXML2.XmlHttp.2.0",
						"Microsoft.XmlHttp"
					];
					for(var i = 0; i < versions.length; i++) {
						try {
							xhr = new ActiveXObject(versions[i]);
							break;
						}
						catch(e){}
					}
				}

				xhr.onreadystatechange = function(){
					if(xhr.readyState < 4) {
						return;
					}

					switch(xhr.status){
						case 200:
							break;
						case 404:
							reject(new Error("File not found! [" + filename + "]" + __Mold.getInstanceDescription())); 
							break;
						default:
							reject(new Error("Request error " + xhr.status + " [" + filename + "]" + __Mold.getInstanceDescription())); 
					}

					if(xhr.readyState === 4 && xhr.status === 200) {
						_content = _convertData(xhr.response);
						resolve(_content)
					}

					
				}

				xhr.open('GET', filename, true);
				xhr.send();
			});
		}

		var _nodeLoader = function(){

			return new __Mold.Core.Promise(function(resolve, reject){
				if(!_isHttp){
					try {
						var stats = fs.lstatSync(filename);
						if(stats.isFile()) {

							fs.readFile(filename, _encoding, function (err, data) {
								
								if(err){
									reject(err)
								}
								if(data){
									_content = _convertData(data);
								}
								resolve(_content);
								
							})
							
						}else{
							reject(new Error("Path is not a file! [" + filename + "]" + __Mold.getInstanceDescription()));
						}
					}catch(e){

						reject(new Error("File not found! [" + filename + "]" + __Mold.getInstanceDescription()));
					}
				}else{
					request.get(filename , function (error, response, body) {
						if(!response){
							reject(new Error("Unkown response problem! [" + filename + "]" + __Mold.getInstanceDescription()));
							return;
						}

						if(response.statusCode == 404){
							reject(new Error("File not found! [" + filename + "]" + __Mold.getInstanceDescription()));
							return;
						}

						if (!error && response.statusCode == 200) {
							resolve(body);
						}else{
							reject(new Error("HTTP Error (" + response.statusCode  + ")! [" + filename + "]" + __Mold.getInstanceDescription()));
						}
					});
						
				}
			});
		
		}

		var _convertData = function(data, direction){
			if(format){
				var undefined;
				direction = direction || "input";
				if(direction === "input"){
					switch(format.toLowerCase()){
						case "json":
							return JSON.parse(data);
					}
				}else if(direction === "output"){
					switch(format.toLowerCase()){
						case "json":
							return JSON.stringify(data, undefined, '\t')
					}
				}
			}
			return data;
		}

		/**
		 * @method load 
		 * @description loads the specified file
		 * @return {object} returns a thenabel object with
		 */
		this.load = function(){

			if(_isNodeJS){
				return _nodeLoader();
			}else{
				return _ajaxLoader();
			}
		}

		/**
		 * @property {string} content
		 * @description the current file content
		 */
		Object.defineProperty(this, 'content', {
			get: function() { 
				return _content;
			},
			set: function(value) { 
				_content = value; 
			},
			enumerable: true,
			configurable: true
		});

		/**
		 * @method save 
		 * @platform node
		 * @description saves the file with all content changes
		 * @return {promise} returns a promise
		 */
		this.save = function(){
			if(!_isNodeJS){
				throw new Error("The 'save' method is only available on nodejs [Mold.Core.File]")
			}
			return new __Mold.Core.Promise(function(resolve, reject){
				fs.writeFile(filename, _convertData(_content, "output"), function(err) {
					if(err) {
						return reject(err);
					}
					resolve(_content);
				}); 
			});
		}

		this.remove = function(){
			if(!_isNodeJS){
				throw new Error("The 'remove' method is only available on nodejs [Mold.Core.File]")
			}
			return new __Mold.Core.Promise(function(resolve, reject){
				fs.unlink(filename, function(err){
					if(err) {
						return reject(err);
					}
					_content = null;
					resolve(true);
				})
			});
		}

		/**
		 * @method  copy 
		 * @description copys the file to specific target
		 * @param  {string} target the target
		 * @return {promise} returns a promise
		 */
		this.copy = function(target){
			if(!_isNodeJS){
				throw new Error("The 'copx' method is only available on nodejs [Mold.Core.File]")
			}

			return new __Mold.Core.Promise(function(resolve, reject){
				var getWriteStream = function(){
					var writeStream = fs.createWriteStream(target);
					writeStream.on("error", reject);
					writeStream.on("close", function(ready) {
						filename = target;
						resolve(filename);
					});

					return writeStream;
				}

				if(!_isHttp){
					var readStream = fs.createReadStream(filename);
					readStream.on("error", reject);
					readStream.pipe(getWriteStream());
				}else{
					var readStream = request.get(filename)
					readStream.on('error', function(err){
						reject(err);
					})
					readStream.on('response', function(response){
						if(response.statusCode === 200){
							readStream.pipe(getWriteStream());
						}else{
							reject(new Error("file copy error (" + filename + ") status code: '" + response.statusCode + "'! [Mold.Core.File]"))
						}
					})
				}

				
			})
		}
		
	}



/** INIT DEFAULT CONFIGURATION */
	Mold.prototype.init = function(){
		var that = this;
		__Mold = this;

		//add polyfills
		this.Core.PolyFillManager
			.add({
				name : 'String.startsWith',
				code : function(){
					String.prototype.startsWith = function(searchString, position) {
						position = position || 0;
						return this.indexOf(searchString, position) === position;
					};
				},
				object : String,
				method : 'startsWith'
			})

			.add({
				name : 'String.endsWith',
				code : function(){
					String.prototype.endsWith = function(searchString, position) {
						var subjectString = this.toString();
						if(typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
							position = subjectString.length;
						}	
						position -= searchString.length;
						var lastIndex = subjectString.indexOf(searchString, position);
						return lastIndex !== -1 && lastIndex === position;
					};
				},
				object : String,
				method : 'endsWith'
			})

			.add({
				name : 'Array.find',
				code : function(){
					Array.prototype.find = function(predicate) {
						if (this == null) {
							throw new TypeError('Array.prototype.find called on null or undefined');
						}
						if (typeof predicate !== 'function') {
							throw new TypeError('predicate must be a function');
						}
						var list = Object(this);
						var length = list.length >>> 0;
						var thisArg = arguments[1];
						var value;
						for (var i = 0; i < length; i++) {
							value = list[i];
							if (predicate.call(thisArg, value, i, list)) {
								return value;
							}
						}
						return undefined;
					};
				},
				object : Array,
				method : 'find'
			})

			.add({
				name : "Array.includes",
				code : function(){
					if (!Array.prototype.includes) {

						Array.prototype.includes = function(search, index) {
							var current = Object(this);
							var index = index || 0;
							var len = current.length || 0;
							if (len === 0) {
								return false;
							}
							if(index >= len){
								return false;
							}
							for(;index < len; index++){
								if(search === current[index]){
									return true;
								}
							}
							return false;
						}
					}
				},
				object : Array,
				method : 'includes'
			})

			.add({
				name : 'Number.isInteger',
				code  : function(){
					Number.isInteger = Number.isInteger || function(value) {
						return typeof value === "number" && isFinite(value) && Math.floor(value) === value;
					}
				},
				object : Number,
				method : 'isInteger'
			})

			/**
			 * @polyfill eachShift
			 * @description iterates through an array and remove the selected item until the array is empty
			 * @param {array} collection the array
			 * @param  {function} callback  method will called on each entry, given paramter is the entry value           
			 */
			.add({
				name : 'Array.eachShift', 
				code : function(){
					Object.defineProperty(Array.prototype, 'eachShift', {
						value : function(predicate){
							if (this == null) {
								throw new TypeError('Array.prototype.eachShift called on null or undefined');
							}
							if (typeof predicate !== 'function') {
								throw new TypeError('predicate must be a function');
							}
							while(this.length){
								var selected = this.shift();
								predicate.call(this, selected);
							}
							return this;
						},
						enumerable : false
					})
				},
				object : Array,
				method : 'eachShift'
			})
		
		//default seed typs
		this.Core.SeedTypeManager
			.add({
				name : 'action',
				create : function(seed){
					return seed.code();
				}
			})
			.add({
				name : 'static',
				create : function(seed){
					return seed.code();
				}
			})
			.add({
				name : 'data',
				create : function(seed){
					return seed.code;
				}
			})
			.add({
				/**
				 * @deprecated
				 */
				//for compatibility with 0.0.1*, don't use this
				name : 'class',
				preCreating : function(seed){
					return seed;
				},
				create : function(seed){
					if(seed.extend){
						seed = Mold.extend(seed.extend, seed)
					}
				
					return that.wrap(seed.code, function(seedCode){
						if(seedCode.publics){
							for(var property in seedCode.publics){
								seedCode[property] = seedCode.publics[property];
							}
						}
						delete seedCode.publics;
						
						if(seedCode.trigger && typeof seedCode.trigger === "function"){
							seedCode.trigger("after.init");
						}
						
						return constructor;
					});
				}
			});

		this.Core.SeedTypeManager.add({
			name : 'module',
			create : function(seed){
				var module = {
					_exports : null,
					get exports() {
						return this._exports;
					},
					set exports(exported){
						this._exports = exported;
					}
				}

				seed.code.call(seed, module);

				return module.exports;
			}
		});

		//add dependecy properties
		this.Core.DependencyManager
			.addDependencyProperty('include');

		//configurate default path handling
		this.Core.Pathes.on('mold', function(name, ignorExistingCheck){

			var createPath = function(confType){
				var parts = name.split('.');
				var conf = that.Core.Config.get("repositories", confType);
				var packagePath = that.Core.Config.get('config-path', confType);
				var rootPath = __Mold.Core.Initializer.getParam('root-path') || '';

				if(!packagePath.endsWith("/") && packagePath !== ""){
					packagePath += "/";
				}

				if(!conf && confType === "global"){
					throw new Error("No repositiories in " + confType + " config found! [" + name + "] " + __Mold.getInstanceDescription())
				}
				var repos = that.Core.Config.get("repositories", confType);
				
				var selectedRepo = null, repoPath = null;
				for(var repo in repos){
					if(name.startsWith(repo)){
						selectedRepo = repo;
						repoPath = repos[repo];
						break;
					}
				}

				
				if(!repoPath && confType === "global"){
					throw new Error("No path for repository found! [" + name + "] " + __Mold.getInstanceDescription())
				}

				if(selectedRepo === null && confType !== 'global'){	
					return createPath('global');
				}

				var path =  packagePath + repoPath + "/";

				var repoPartLength = selectedRepo.split('.').length;

				for(var i = 0; i < repoPartLength; i++){
					parts.shift();
				}

				if(parts[parts.length -1] === "*"){
					parts[parts.length -1] = "__";
				}

				path += parts.join('/') + '.js';
				path = __Mold.Core.Pathes.cleanPath(path);

				//if path is a http path skip testing and return path
				if(__Mold.Core.Pathes.isHttp(path)){
					return path;
				}

				if(!that.Core.Pathes.exists(path, 'file') && confType !== 'global' && !ignorExistingCheck){
					return createPath('global');
				}
				
				return path;
			}

			return createPath('local');
			
		});

		//add some default preprocessors
		this.Core.Preprocessor
			.add('info', function(parameter, seed, done){
				for(var prop in parameter){
					seed[prop] = parameter[prop];
				}
				done();
			})
			.add('include', function(parameter, seed, done){
				if(parameter.seed){
					that.load(parameter.seed).then(function(loaded){
						var codeString = loaded.code.toString();
						codeString = codeString.substring(codeString.indexOf("{") + 1, codeString.lastIndexOf("}"));
			
						done(codeString);
					})
				}else{
					done();
				}
			});
		
		//configurate seed flow
		this.Core.SeedFlow
			.on(this.Core.SeedStates.NEW, function(seed, done){
				that.Core.SeedManager.add(seed);
				that.Core.Config.isReady.then(function(){
					seed.state = that.Core.SeedStates.LOADING;
					seed.load().then(function(){
						seed.state = that.Core.SeedStates.LOADED;
						done()
					}).catch(function(e){
						console.error(e.stack)
					});
				})
			})
			.on(this.Core.SeedStates.LOADED, function(seed, done){
				done();
			})
			.onAfter(this.Core.SeedStates.LOADED, function(seed, done){
				//console.log("AFTER LOADING");
				seed.state = that.Core.SeedStates.PREPARSING;
				done();
			})
			.on(this.Core.SeedStates.PREPARSING, function(seed, done){
				//console.log("do PREPARSING");
				that.Core.Preprocessor.exec(seed).then(done);
			})
			.onAfter(this.Core.SeedStates.PREPARSING, function(seed, done){
				//if seed is already transpiled skip transpiling step
				if(seed.transpiled){
					seed.state = that.Core.SeedStates.INITIALISING;
				}else{
					seed.state = that.Core.SeedStates.TRANSPILING;
				}
				done();
			})
			.on(this.Core.SeedStates.TRANSPILING, function(seed, done){
				//console.log("do TRANSPILING", seed.name);
				done()
			})
			.onAfter(this.Core.SeedStates.TRANSPILING, function(seed, done){
				seed.state = that.Core.SeedStates.INITIALISING;
				done();
			})
			.on(this.Core.SeedStates.INITIALISING, function(seed, done){
				//console.log("do INITIALISING");
				seed.create().then(function(){
				//	console.log("IS CREATED")
					done()	
				})
				
			})
			.onAfter(this.Core.SeedStates.INITIALISING, function(seed, done){
				seed.state = that.Core.SeedStates.PENDING;
				done()
				
			})
			.on(this.Core.SeedStates.PENDING, function(seed, done){
				//console.log("do PENDING", seed.name);
				__Mold.Core.DependencyManager.find(seed);
				seed.checkDependencies().then(function(){
					done();
				});
			
			})
			.onAfter(this.Core.SeedStates.PENDING, function(seed, done){
				seed.state = that.Core.SeedStates.EXECUTING;
				done();
			})
			.on(this.Core.SeedStates.EXECUTING, function(seed, done){
				//console.log("EXECUTING", seed.name, seed.state)
				seed.execute();
				done()
			})
			.onAfter(this.Core.SeedStates.EXECUTING, function(seed, done){
				seed.state = that.Core.SeedStates.READY;
				done();
			})
			.on(that.Core.SeedStates.READY, function(seed, done){
				//console.log("SEED READY", seed.name)

				done();
			})
			.on(this.Core.SeedStates.ERROR, function(seed, done){
				throw new Error("ERROR: " + ((seed.error) ? seed.error : "") + "[" + seed.name + "]");
				done()
			});
		

		this.Core.Initializer.init();
		this.Core.Config.init().catch(function(err){
			console.log(err.stack)
		});
		//register core seeds 
		this.Core.SeedManager
			.add(
				this.Core.SeedFactory({
					name : "Mold.Core.SeedManager",
					state : this.Core.SeedStates.READY,
					code : this.Core.SeedManager
				})
			)
			.add(
				this.Core.SeedFactory({
					name : "Mold.Core.SeedFactory",
					state : this.Core.SeedStates.READY,
					code : this.Core.SeedFactory
				})
			)
			.add(
				this.Core.SeedFactory({
					name : "Mold.Core.Promise",
					state : this.Core.SeedStates.READY,
					code : this.Core.Promise
				})
			)
			.add(
				this.Core.SeedFactory({
					name : "Mold.Core.File",
					state : this.Core.SeedStates.READY,
					code : this.Core.File
				})
			)
			.add(
				this.Core.SeedFactory({
					name : "Mold.Core.Pathes",
					state : this.Core.SeedStates.READY,
					code : this.Core.Pathes
				})
			)
			.add(
				this.Core.SeedFactory({
					name : "Mold.Core.Initializer",
					state : this.Core.SeedStates.READY,
					code : this.Core.Initializer
				})
			)
			.add(
				this.Core.SeedFactory({
					name : "Mold.Core.Config",
					state : this.Core.SeedStates.READY,
					code : this.Core.Config
				})
			)

			//load main seeds
			var mainSeedPromises = []
			
			this.ready.then(function(){
				var mainSeeds = that.Core.Config.search('mainSeeds');
				if(mainSeeds && mainSeeds.length){
					mainSeeds.forEach(function(seedName){
						mainSeedPromises.push(that.load(seedName));
					})
				}
			});
		
	}

	global._Mold = Mold;

	global.Mold = new Mold();


	if(_isNodeJS){
		//copy to global to avoid problems on lazy loading modules
		global.Mold.copyGlobalProperties(global);

	}

})((typeof global !== 'undefined') ? global : this);
