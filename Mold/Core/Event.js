 //!info transpiled
 "use strict";
Seed({
		type : "class",
		author : "Jan Kaufmann",
		description : "",
		test : "Mold.Test.Lib.Event",
		include : [
			{ EventStore : "Mold.Core.EventStore" }
		],
		version : 0.1
	},
	function(element){
		var _element = element;
		var that = this;
		
		var _isHTMLElement =  Mold.isNode(element);
		
		var _elementEvents = [
			"blur", "change", "contextmenu", "copy", "cut", "dblclick", "error",
			"focus", "focusin", "focusout", "hashchange", "keydown", "keypress", "keyup", 
			"load",  "paste", "reset", "resize", "scroll",
			"select", "submit", "textinput", "transitionend", "unload",
			"touchstart", "touchend", "touchcancel", "touchleave", "touchmove",
			"animationstart", "animationiteration", "animationend",
			"DOMAttrModified", "DOMSubtreeModified", "DOMNodeInserted", "DOMNodeRemoved", "DOMCharacterDataModified"
		];
		
		var _mouseEvents = [
			"click", "mousedown", "mouseenter", "mouseleave", "mousemove", "mouseout",
			"mouseover", "mouseup", "mousewheel", "wheel"
		];
		
		var _translateEvents = {
			"transitionend" : [ "msTransitionEnd", "webkitTransitionEnd", "oTransitionEnd" ],
			"animationstart" : [ "msAnimationStart", "webkitAnimationStart", "oAnimationStart"],
			"animationiteration" : [ "msAnimationInteration", "webkitAnimationIteration", "oAnimationIteration"],
			"animationend" : [ "msAnimationEnd", "webkitAnimationEnd", "oAnimationEnd"]
		};
		
		_elementEvents = _elementEvents.concat(_mouseEvents);
		
		var _isElementEvent = function(event){
			if(_elementEvents.indexOf(event) > -1){
				return true;
			}else{
				return false;
			}
		}
		
		var _initEvent = function(event){
			if(_mouseEvents.indexOf(event) > -1){
				var evt = document.createEvent("MouseEvents");
				evt.initMouseEvent(event, true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
				return evt;
			}
			
			return false;
		}
		
		var _isEventSupported = function(eventName) {
			eventName = eventName;
			var isSupported = ('on'+eventName in _element);
			if (!isSupported) {
				
				_element.setAttribute(eventName, 'return;');
				isSupported = typeof _element[eventName] == 'function';
				_element.removeAttribute(eventName, 'return;');
			}
			if(!isSupported){
				if(
					eventName.indexOf("webkit") > -1 
					&& navigator 
					&& navigator.userAgent.indexOf("WebKit") > -1
				){
					//Woraground for Webkit Browser
					return true;
				}
			}
			return isSupported;
		}
		
		var _getEventName = function(event){
			if(_translateEvents[event]){
				for(var i = 0; i < _translateEvents[event].length; i++){
					if(_isEventSupported(_translateEvents[event][i])){
						return _translateEvents[event][i];
					}
				}
				return event;
			}else{
				return event;
			}
		}
		
		var _firedActions = {};
		var _eid = Mold.getId();


		this.publics = {
			_eid : _eid,
			when : function(event, callback){
				var executeOn  = function(callback){
					_firedActions[event] = _firedActions[event] || {};
					var trigger = EventStore.getElementTrigger(_element, event);

					if(trigger.length > 0){
						
						callback();
					}else{
						var delayedCall = function(){
							callback();
							that.off(event, delayedCall);
						};
						that.on(event, delayedCall);
					}
				};

				if(callback){
					executeOn(callback);
				}
				
				_element.then = function(callback){
					executeOn(callback);
					return _element;
				};
				
				return _element;
			},
			
			at : function(event, callback, config){
				var trigger = EventStore.getElementTrigger(_element, event);
				_firedActions[event] = _firedActions[event] || {};
				if(!_firedActions[event][callback]){
				
					for(var i = 0; i < trigger.length; i++){
						if(config && config.triggerElement){
							config.triggerElement.trigger(trigger[i].event, trigger[i].data);
						}else{
							callback.call(this, trigger[i].data);
						}
						
						_firedActions[event][callback] == true;
					}
				}
				this.on(event, callback, config);
				return _element;
								
			},
			delegate : function(event){
				return {
					to : function(triggerElement){
						that.on(event, function(e){
							triggerElement.trigger(event, e.data || false);
						});
					}
				};
			},
			bubble : function(event, data){
				if(_element.hasParents && _element.hasParents()){
					_element.eachParent(function(parent){
						parent.trigger(event, data);
					});
				}
			},
			once : function(event, callback, config){
				var element = EventStore.getElementEvent(_element,  event);
				if(!element || element.toString() !== callback.toString()){
					this.on(event, callback, config);
				}
			},
			on : function(event, callback, config){
				var executeOn  = function(callback){
					if(_isHTMLElement && _isElementEvent(event)){
						_element.addEventListener(_getEventName(event), callback);
					}
					EventStore.addElementEvent(_element,  event, callback);
					
					_firedActions[event] = true;
				};
				
				if(callback){
					executeOn(callback);
				}
				
				_element.then = function(callback){
					executeOn(callback);
					return _element;
				};
				
				return this;
			},
			off : function(event, callback){
				if(_isHTMLElement && _isElementEvent(event)){
					if(callback){
						_element.removeEventListener(_getEventName(event), callback);
					}else{
						var elementEvents = EventStore.getElementEvent(_element, event);
						var i = 0, len = elementEvents.length;
						for(; i < len; i++){
							_element.removeEventListener(_getEventName(event), elementEvents[i]);
						}
					}
				}
				if(event){
					EventStore.removeElementEvent(_element, event, callback);
				}else{
					
					EventStore.removeEvents(_element);
				}
				
				return _element;
			},
			trigger : function(event, data, config){

				var output = false,
					config = config || {},
					events = [];

				if(!data || !data.id || data.id !== "event"){
					var eventData = {
						data : data || false,
						event : event,
						id : "event",
						config : config || false
					};
				}else{
					var eventData = data;
				}
			
				if(config && config.exclude && config.exclude.indexOf(event) > -1){
					
				}else{
					events = EventStore.getElementEvent(_element,  event) || [];
					var all = EventStore.getElementEvent(_element, "all");
					if(all){
						events = events.concat(all);
					}
				}

				var i = 0, 
					eventsLen = events.length,
					eventObject = {};
				
				for(; i < eventsLen;  i++){
					if(_isHTMLElement && _isElementEvent(event)){
						eventObject = _initEvent(event);
						if(eventObject){
							
							_element.dispatchEvent(eventObject);
						}
					}else{
						if(events[i]){
							output = events[i].call(((config && config.context) ? config.context : this), eventData) || output;
						}
					}
				}
				if(!config.disableSaveTrigger){
					EventStore.saveTrigger(_element, event, data);
				}
				var undefined;
				return (output !== undefined) ? output : _element;

			}

		}
		
		
		return this;
	}
);