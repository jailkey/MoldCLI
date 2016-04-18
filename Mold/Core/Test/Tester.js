Seed({
		type : "class",
		include : [
			{ Sequence : "Mold.Core.Sequence"},
			{ Event : "Mold.Core.Event" }
		],
		test : "Mold.Test.Core.Tester"
	},
	function(test){
		"use strict";
		var _rootTest = {
			type : "root",
			description : "test root",
			action : function(){},
			parent : false,
			error : false,
			success : false,
			children : []
		}

		var _parent = null,
			_reporter = [],
			_that = this,
			_timeOut = 1000;

		Mold.mixin(this, new Event(this));

		var _now = function(){
			if(typeof performance !== "undefined"){
				return performance.now();
			}else{
				if(Date.now){
					return Date.now();
				}else{
					return Date().getTime();
				}
			}
		}

		/**
		 * _hasFunctionParameter
		 * @description checks if a function has parameter
		 * @param  {function}  func the function
		 * @return {Boolean} return true or false
		 */
		var _hasFunctionParameter = function(func){

			func = func.toString();
			func = func.substring(0, func.lastIndexOf("}")+1);

			var pattern = new RegExp("function\\s*\(([\\s\\S]*?)\)\\s*\{([\\s\\S]*?)\}$", "g"),
				matches = pattern.exec(func);

			if(matches){
				var parameter = matches[2];

				parameter = parameter.replace("(", "").replace(")", "").trim();
				
				if(parameter){
					return true;
				}
			}
			return false;
		}

		/**
		 * [_addTest description]
		 * @param {object} test [description]
		 * {
		 * 	type : "describe/it",
		 * 	caller : "func",
		 * 	description : "descripton",
		 * 	error : "description"
		 * 	success : "descripion"
		 * 	children : [],
		 * 	parent : object,
		 * }
		 */
		var _testCounter = 0;
		var _addTest = function(type, description, action, parent){
			_testCounter++;
			var test = {
				type : type,
				description : description,
				action : action,
				parent : parent || false,
				error : false,
				success : false,
				children : []
			}
			if(parent){
				parent.children.push(test);
			}else{
				_rootTest.children.push(test)
			}
		}

		var _spys = {};
		var _spyOn = function(object, method){

			var spyApi = {
				name : "spy",
				hasBeenCalled : false,
				arguments : [],
				object : object,
				method : method,
				returnValue : null
			}

			var oldFunc = object[method];

			object[method] = function(getspy){
				if(getspy === "--getspy"){
					return spyApi;
				}
				spyApi.hasBeenCalled = true;
				spyApi.arguments.push(arguments);
				if(spyApi.returnValue !== null){
					return spyApi.returnValue;
				}
				return oldFunc.apply(null, arguments);
			}
			return _expect(object[method]);
		}

		var _describe = function(description, action){
			_addTest("describe", description, action, _parent);
		}

		var _it = function(description, action){
			_addTest("it", description, action, _parent);
		}

		var _before = function(description, action){
			if(typeof description === "function"){
				action = description
				description = '';
			}
			_addTest("before", description, action, _parent);
		}

		

		var _beforeEach = function(description, action){
			if(typeof description === "function"){
				action = description
				description = '';
			}
			_addTest("beforeEach", description, action, _parent);
		}

		var _after = function(description, action){
			if(typeof description === "function"){
				action = description
				description = '';
			}
			_addTest("after", description, action, _parent);
		}

		var _afterEach = function(description, action){
			if(typeof description === "function"){
				action = description
				description = '';
			}
			_addTest("afterEach", description, action, _parent);
		}

		var _getTestByType = function(type, children){
			for(var i = 0; i < children.length; i++){
				if(children[i].type === type){
					return children[i];
				}	
			}
			return null;
		}

		/**
		 * _execAsync
		 * @description executes a test ansychonous
		 * @param  {object}   test
		 * @param  {object}   context 
		 * @param  {function} callback 
		 * @return {void} 
		 */
		
		var _timeoutList = {};
		var _clearTimeout = function(test){
			var timeout = test.type + test.description;
			if(_timeoutList[timeout]){
				clearTimeout( _timeoutList[timeout]);
				delete _timeoutList[timeout];
			}
		}

		var _execAsync = function(test, context, callback){
			_timeoutList[test.type + test.description] = setTimeout(function(){
				test.success = false;
				test.error = "Timeout in '" + (test.description ? test.description : test.type )+  "'!";
				if(callback){
					callback.call(context);
				}
			}, _timeOut);

			var withTimeout = function(){
				if(callback){
					callback.call(context);
				}
				callback = null;
				_clearTimeout(test);
			}

			test.action.call(context, withTimeout);
		}

		var _isTestContext = function(test){
			var contexts = ["it", "describe"];
			return ~contexts.indexOf(test.type);
		}

		/**
		 * _nextChild
		 * @description 
		 * @param  {object} parent     [description]
		 * @param  {number} level      [description]
		 * @param  {object} context    [description]
		 * @param  {function} testsReady [description]
		 * @return {void}            [description]
		 */
		var _nextChild = function(parent, level, context, testsReady){
			
			if(!parent.children[level]){
				return;
			}
			level = level || 0;

			var currentTest = parent.children[level],
				sequence = new Sequence();

			sequence
				.step(function(next){
					if(level === 0){
						var before = _getTestByType("before", parent.children);

						if(before){
							_execute(before, parent, context, next, testsReady);
							return;
						}else{
							next();
						}
					}else{
						next();
					}
				})
				.step(function(next){
					var beforeEach = _getTestByType("beforeEach", parent.children);
					if(beforeEach && _isTestContext(currentTest)){
						_execute(beforeEach, parent, context,  next, testsReady );
						return;
					}else{
						next();
					}
				})
				.step(function(next){
					if(_isTestContext(currentTest)){
		
						_execute(parent.children[level], parent, context, next, testsReady);
						return;
					}else{
						next();
					}
				})
				.step(function(next){
					var afterEachValue = _getTestByType("afterEach", parent.children);
					if(afterEachValue && _isTestContext(currentTest)){
						_execute(afterEachValue, parent, context, next, testsReady, false);
						//return;
					}else{
						next();
					}
				})
				.step(function(next){
					if(parent.children.length -1 === level){
						var after = _getTestByType("after", parent.children);
						if(after && _isTestContext(currentTest)){
							_execute(after, parent, context, function(){}, testsReady);
						}
					}
					level++;
					_nextChild(parent, level, context, testsReady);	
				});

		}


		/**
		 * _execute
		 * @description executes a test
		 * @param  {[type]} test       [description]
		 * @param  {[type]} parent     [description]
		 * @param  {[type]} context    [description]
		 * @param  {[type]} ready      [description]
		 * @param  {[type]} testsReady [description]
		 * @return {[type]}            [description]
		 */
		var _executeCounter = 0;
		var _startExecutionCounter = 0;
		var _execute = function(test, parent, context, ready, testsReady, stopCheckingChilds){

			_parent = test;
			//if describe renew context
			if(test.type === "describe"){
				context = {};
			}
			_startExecutionCounter++;
			context = context || {};
			var startTime = _now();

			//check childs after execution
			var execReady = function(){
				var endTime = _now();
				test.executionTime = endTime - startTime;
				if(_parent && _parent.children.length && !stopCheckingChilds){
					_nextChild(_parent, 0, context, testsReady)
				}
				
				ready();
				_executeCounter++;
				if(_executeCounter >= _startExecutionCounter){
					_that.trigger("tests.ready", { count : _testCounter });
				}
			}

			try {
				var result = true;
				test.success = true;

				//exex async
				if(_hasFunctionParameter(test.action)){
					_execAsync(test, context, execReady);
				}else{
				//exec sync
					var result = test.action.call(context);
					if(result && typeof result.then === "function"){
						result.then(execReady);
					}else{
						execReady();
					}
					
				}

			}catch(e){
				//if error occurs write it to result;
				result = e;
				test.success = false;

				test.error = e;
				_clearTimeout(test)
				execReady();
			}

		}

		/**
		 * _run run test
		 * @return {void} [description]
		 */
		var _run = function(){
			_that.on("tests.ready", function(){
				_report(_rootTest);
			});
			_nextChild(_rootTest, 0, {});
		}
		/**
		 * _objectEqual 
		 * @description compares two objects
		 * @param  {object} input  [description]
		 * @param  {object} target [description]
		 * @return {boolean} return true if both objects are equal
		 */
		var _objectEqual = function(input, target){
			var output = true, inputName;
			if(input === target){
				return true;
			}

			for(inputName in input){
				var inputValue = input[inputName];
				var targetValue = target[inputName];
				if(Array.isArray(inputValue) || Mold.isObject(inputValue)){

					output = _objectEqual(inputValue, targetValue);
				}else{
					
					if(typeof inputValue === "function"){

						if(inputValue.toString() !== targetValue.toString()){
							
							output = false;
							return Mold.EXIT;
						}
					}else{
						if(inputValue !== targetValue){
							output = false;
							return Mold.EXIT;
						}
					}
				}
				
			
			};

			return output;
		}

		/**
		 * _expect 
		 * @description liste of expections
		 * @param  {mixed} input
		 * @param  {boolean} negate
		 * @return {object} retuns the api methodes
		 */
		var _expect = function(input, negate){
			var undefined;
			var api =  {
				toBe : function(value){
			
					if(
						!negate && input === value
						|| negate && input !== value
					){
						return _expect(input);
					}else{
						throw new Error(input + " is " +((negate) ? "not " : "")+ "not to be " + value);
					}
				},
				toBeObject : function(){
					if(	
						!negate && Mold.isObject(input)
						|| negate && !Mold.isObject(input)
					){
						return _expect(input);
					}else{
						throw new Error(input + " is " +((negate) ? "not " : "")+ "not an object!")
					}
				},
				toBeArray : function(){
					if(	
						!negate && Mold.isObject(input)
						|| negate && !Mold.isObject(input)
					){
						return _expect(input);
					}else{
						throw new Error(input + " is " +((negate) ? "not " : "")+ "not an array!")
					}
				},
				toEqual : function(value){
					if(typeof value === "function"){
						if(
							!negate && input.toString() === value.toString()
							|| negate && input.toString() !== value.toString()
						){
							return _expect(input);
						}else{
							throw new Error("'" + input + "' is" +((negate) ? " not" : "")+ " not equal " + value);
						}
					}

					if(typeof value === "object"){
						if(
							!negate && _objectEqual(input, value)
							|| negate && !_objectEqual(input, value)
						){
							return _expect(input);
						}else{
							throw new Error("'" + input.toString() + "' is" +((negate) ? " not" : "")+ " not equal " + value.toString());
						}
					}
					return api.toBe(value);
				},
				toMatch : function(match){
					if(Mold.isString(match)){
						match = new RegExp(match, "g");
					}
					if(
						(!negate && match.test(input))
						|| (negate && !match.test(input))
					){
						return _expect(input);
					}else{
						throw new Error("'" +input + "' does" +((negate) ? " not" : "")+ " match " + match);
					}
				},
				toBeDefined : function(){
					if(
						(!negate && input !== undefined)
						|| (negate && input === undefined)
					){
						return _expect(input);
					}else{
						throw new Error("'" +input + "' is" +((negate) ? " not" : "")+ " not defined!");
					}
				},
				toBeUndefined : function(){
					if(
						(!negate && input === undefined)
						|| (negate && input !== undefined)
					){
						return _expect(input);
					}else{
						throw new Error("'" +input + "' is" +((negate) ? " not" : "")+ " defined!");
					}
				},
				toBeNull : function(){
					if(
						(!negate && input === null)
						|| (negate && input !== null)
					){
						return _expect(input);
					}else{
						throw new Error("'" +input + "' is" +((negate) ? " not" : "")+ " defined!");
					}
				},
				toBeFalsy : function(){
					if(
						(!negate && !input)
						|| (negate && input)
					){
						return _expect(input);
					}else{
						throw new Error("'" +input + "' is" +((negate) ? " not" : "")+ " defined!");
					}
				},
				toBeTruthy  : function(){
					if(
						(!negate && input)
						|| (negate && !input)
					){
						return _expect(input);
					}else{
						throw new Error("'" +input + "' is" +((negate) ? " not" : "")+ " defined!");
					}
				},
				toBePromise : function(){
					if(
						(!negate && typeof input.then === "function")
						|| (negate && typeof input.then !== "function")
					){
						return _expect(input);
					}else{
						throw new Error("'" +input + "' is" +((negate) ? " not" : "")+ " a promise!");
					}
				},
				toBeInstanceOf : function(value){
					if(typeof value === "string" && Mold.startsWith(value, "Mold.")){
						if(
							(!negate && input.instanceOf && input.instanceOf === value)
							|| (!negate && input.className && input.className === value)
							|| (negate && input.instanceOf && input.instanceOf !== value)
							|| (negate && input.className && input.className !== value)
						){
							return _expect(input);
						}else{
							throw new Error("'" +input + "' is" +((negate) ? " not" : "")+ " a instanceof " + value + " !");
						}
					}else{
						if(
							(!negate && input instanceof value)
							|| (negate && !input instanceof value)
						){
							return _expect(input);
						}else{
							throw new Error("'" +input + "' is" +((negate) ? " not" : "")+ " a instanceof " + value + " !");
						}
					}

				},
				toContain : function(value){
					if(
						(!negate && ~input.indexOf(value))
						|| (negate && !~input.indexOf(value))
					){
						return _expect(input);
					}else{
						throw new Error("'" +input + "' " +((negate) ? " not" : "")+ " contains " + value +  "!");
					}
				},
				toBeLessThan : function(value){
					if(
						(!negate && (+input < value))
						|| (negate && (+input >= value))
					){
						return _expect(input);
					}else{
						throw new Error("'" +input + "' " +((negate) ? " not" : "")+ " contains " + value +  "!");
					}
				},
				toBeGreaterThan : function(value){
					if(
						(!negate && (+input > value))
						|| (negate && (+input <= value))
					){
						return _expect(input);
					}else{
						throw new Error("'" +input + "' " +((negate) ? " not" : "")+ " contains " + value +  "!");
					}
				},
				toBeCloseTo : function(value, precision){
					input = +input;
					value = +value;
					if(
						(
							!negate && Math.abs(input - value) < precision
						)
						|| (
							negate && Math.abs(input - value) > precision
						)
					){
						return _expect(input);
					}else{
						throw new Error("'" +input + "' is " +((negate) ? " not" : "")+ " not close to " + value +  "!(" + precision + ")");
					}

				},
				toThrow : function(){

					if(!negate){
						try {
							input.call();
							throw new Error("'" +input + "' do not throw an error " +  "!");
						}catch(e){
							return _expect(input);
						}
					}
					if(negate){
						try {
							input.call();
						}catch(e){
							throw new Error("'" +input + "' throw an error " +  "!");
						}finally{
							return _expect(input);
						}
					}
				},
				toThrowError : function(){

					if(!negate){
						try {
							input.call();
							throw new Error("'" +input + "' do not throw an error " +  "!");
						}catch(e){
							if(e instanceof Error){
								return _expect(input);
							}else{
								throw new Error("'" +input + "' do not throw an error " +  "!");
							}
						}
					}
					if(negate){
						try {
							input.call();
						}catch(e){
							if(e instanceof Error){
								throw new Error("'" +input + "' throw an error " +  "!");
							}else{
								return _expect(input);
							}
						}finally{
							return _expect(input);
						}
					}
				},
				toHaveBeenCalled : function(){
					var spy = false;
					if((spy = input.call(null, "--getspy"))){
						if(spy.name === "spy"){
							if(
								(!negate && spy.hasBeenCalled)
								|| (negate && !spy.hasBeenCalled)
							){
								return _expect(input);
							}else{
								throw new Error("'" +spy.method + "'  has " + (negate ? "" : "not ") + "been called!");
							}
							
						}
					}
					throw new Error("Use a spy to spy method execution!");
					
				},
				toHaveBeenCalledWith : function(){
					var spy = false;
					if((spy = input.call(null, "--getspy"))){
						if(spy.name === "spy"){

							var argumentTest = true;
							var argumentsArray = [];
							var testArgs = arguments;

							for(var i = 0; i < spy.arguments.length; i++){
								var spyargs = spy.arguments[i];
								argumentTest = true;
								for(var y = 0; y < testArgs.length; y++){
									var args = testArgs[y];
									if(spyargs[y] !== args){
										argumentTest = false;
									}
									argumentsArray.push(args);
								}
								if(argumentTest){
									break;
								}

							}
							
							if(
								(!negate && spy.hasBeenCalled && argumentTest)
								|| (negate && !argumentTest)
							){
								return _expect(input);
							}else{

								throw new Error("'" +spy.method + "'  has " + (negate ? "" : "not ") + "been called with arguments '" + argumentsArray.join(", ") + "'!");
							}
						}
					}
					throw new Error("Use a spy to spy method execution!");
				},
				returnValue : function(value){
					var spy = false;
					if((spy = input.call(null, "--getspy"))){
						spy.returnValue = value;
						return _expect(input);
					}
					throw new Error("Use a spy to spy method execution!");
				}
				
			}
			if(!negate){
				api.not = _expect(input, true);
			}

			Object.defineProperty(api, 'and', {
				get: function() {
					return _expect(input, negate);;
				}
			});

			return api;
		}

		/**
		 * _reporte
		 * @description adds the report to all reporters
		 * @return {[type]} [description]
		 */
		var _report = function(){
			for(var i = 0; i < _reporter.length; i++){
				_reporter[i].addResult(_rootTest);
			}
		}
		/**
		 * _addReporter
		 * @description  adds a reporter
		 * @param {object} a reporter object
		 */
		var _addReporter = function(report){
			_reporter.push(report);
		}

		/**
		 * _test
		 * @description adds a complete testsuit
		 * @param  {function} testFunction 
		 * @return {void} 
		 */
		var _test = function(testSeed, target){
			
			var interfaceString = "",
				args = [];
			
			for(var i = 1; i < arguments.length; i++){
				args.push(arguments[i]);
			}

		
			for(var name in this){
				interfaceString += "var " + name + " = this['" + name +"']; \n";
			}
	
			var theTest = new Function(interfaceString + "\n; (" + testSeed.code + "(Mold.Core.SeedManager.get('" + target.name + "').executedValue))")
			
			//var theTest = Mold.injectBefore(testFunction, interfaceString)
			theTest.apply(this, args);
		}

		this.publics = {
			timeout : function(timeout){
				_timeOut = timeout;
			},
			addExpect : function(name, value){
				_expect[name] = value;
			},
			before : _before,
			spyOn : _spyOn,
			beforeEach : _beforeEach,
			after : _after,
			afterEach : _afterEach,
			test : _test,
			addTest : _addTest,
			describe : _describe,
			xdescribe : function(){},
			it : _it,
			now : _now,
			xit : function(){},
			run : _run,
			expect : _expect,
			addReporter : _addReporter
		}
	}
)