//!info transpiled
Seed ({
		type : "static",
		author : "Jan Kaufmann",
		description : "",
		version : 0.1
	},
	function(){
		
		var _elementList = [];
		var _savedTrigger = [];
		var _referenzList = {};

		return {
			addElementEvent : function(element, event, value){

				var item = this.getElement(element);
				if(!item){
					_elementList.push({
						element : element,
						events : {}
					});
					item = _elementList[_elementList.length -1];
					if(element._eid){
						_referenzList[element._eid] = item;
					}
					
				}
				
				item.events[event] = item.events[event] || [];
				item.events[event].push(value);
			
			},
			removeElementEvent : function(element, event, value){
				var item = this.getElement(element);
				if(item && item.events[event]){
					if(value){
						for(var i = 0; i < item.events[event].length; i++){
							if(item.events[event][i] === value){
								item.events[event].splice(i, 1);
								break;
							}
						}
					}else{
						delete item.events[event];
					}
				}
			},
			removeEvents : function(element){
				if(element){
					if(element._eid){
						delete _referenzList[element._eid]; 
					}
					var i = 0, len = _elementList.length;
					this.removeElementTrigger(element);
					for(; i < len; i++){
						if(_elementList[i] && _elementList[i].element === element){
							delete _elementList.splice(i, 1);
						}
					}
				}
			},
			getElementEvent : function(element, event) {
				var selectedElement = this.getElement(element);
				if(selectedElement && selectedElement.events[event]){
					return selectedElement.events[event];
				}
				return false;
			},
			getElement : function(element){
				if(element._eid){
					return _referenzList[element._eid]; 
				}
				var i = 0, len =_elementList.length;
				for(; i < len; i++){
				
					if(_elementList[i].element === element){
						return _elementList[i];
					}
				}
				return false;
			},
			getEventStore : function(){
				return _elementList;
			},
			removeTrigger : function(element, event){
				var i = 0, len = _savedTrigger.length;

				for(; i < len; i++){
					if(_savedTrigger[i] && _savedTrigger[i].element === element && _savedTrigger[i].event === event){
						_savedTrigger.splice(i, 1);
					}
				}
			},
			removeElementTrigger : function(element){
				for(var i = 0; i < _savedTrigger.length; i++){
					if(_savedTrigger[i].element === element){
						_savedTrigger.splice(i, 1);
					}
				};
			},
			saveTrigger : function(element, event, data){
				this.removeTrigger(element, event);
				_savedTrigger.push({
					element : element,
					event : event,
					data : data
				})
			},

			getElementTrigger : function(element, event){
				var trigger = [];
				for(var i = 0; i < _savedTrigger.length; i++){
					if(event === "all"){
						if(_savedTrigger[i].element === element){
							trigger.push(_savedTrigger[i]);
						}
					}else{
						if(_savedTrigger[i].element === element && _savedTrigger[i].event === event){
							trigger.push(_savedTrigger[i]);
						}
					}
				}
				return trigger;
			}
		}
	}
);