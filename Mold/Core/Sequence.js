//!info transpiled
Seed({
		type : "class"
	},
	function(){
		var _stepAction = false,
			_state = "start",
			_nextStep = false,
			_previousStep = false,
			_param = null,
			that = this;

		var _next = function(){
			_state = "ready";
			_resolve();
		}

		var _previous = function(){
			var root = null;
			if(_previousStep){
				_previousStep.setState("start")
				_previousStep.resolve();
			}
		}

		var _repeat = function(){
			_state = "start";
			_resolve();
		}

		var _resolve = function(){
			if(_state === "pending"){
				return false;
			}

			if(typeof _stepAction === "function"){

				if(_state === "start"){
					_stepAction.call(null, _next, _previous, _repeat);
					_state = "pending";
				}

				if(_state === "ready"){
					_nextStep.setState("start");
				} 
			}
		}

		var _step = function(callback){
			_stepAction = callback;
			_nextStep = new Mold.Lib.Sequence();
			_nextStep.setState("pending");
			_nextStep.setPrevious(that);
			_resolve();
			return _nextStep;
		}

		this.publics = {
			resolve : _resolve,
			getPrevious : function(){
				return _previousStep;
			},
			setPrevious : function(step){
				_previousStep = step;
			},
			setState : function(state){
				_state = state;
				_resolve();
			},
			step : function(callback){
				return _step(callback);
			}
		}
	}
)