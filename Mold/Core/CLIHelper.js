//!info transpiled
/**
 * @module Mold.Core.ClIHelper
 * @description static object provides methods to handle the command line interface
 */
Seed({
		type : "static",
		platform : 'node',
		include : [
			{ Promise : "Mold.Core.Promise" },
			"Mold.Core.CLIForm"
		]
	},
	function(){
		var _instances = [];
		var _reader = null;
		var readline = require('readline');

		var _initReader = function(onclose, completer){
			if(_reader){
				_reader.close();
			}
			_reader = readline.createInterface({
				input: process.stdin,
				output: process.stdout,
				completer : completer,
			});
			
			return _reader;
		}

		return {

			getInstance : function(config){
				config = config || {};
				var instance = Object.create(this);
				instance.silent = config.silent;
				return instance;
			},

			silent : false,

			stopAllInstances : function(){
				_instances.forEach(function(instance){
					if(instance.__loadingBar){
						instance.__loadingBar.stop(" ");
					}
				})
			},
		/**
		 * @method showError
		 * @description shows an errormessage
		 * @param  {string} error a string with a message
		 */
			error : function(error){
				this.write(this.COLOR_RED + error + this.COLOR_RESET).lb();
				return this;
			},
			warn : function(warn){
				this.write(this.COLOR_YELLOW + warn + this.COLOR_RESET);
				return this;
			},
			fail : this.error,
		/**
		 * @method write 
		 * @description show message 
		 * @param  {string} message [description]
		 * @return {[type]}         [description]
		 */
			write : function(message){
				if(!this.silent){
					process.stdout.write(message)
				}
				return this;
			},

			lb : function(){
				if(!this.silent){
					process.stdout.write('\n')
				}
				return this;
			},
		/**
		 * @method ok 
		 * @description show ok message 
		 * @param  {string} message [description]
		 * @return {[type]}         [description]
		 */
			ok : function(message){
				if(!this.silent){
					process.stdout.write(this.COLOR_GREEN + message + this.COLOR_RESET)
				}
				return this;
			},

			info : function(message){
				if(!this.silent){
					process.stdout.write(this.COLOR_CYAN + message + this.COLOR_RESET)
				}
				return this;
			},
		/**
		 * @method read
		 * @description read standard in
		 * @param  {Function} callback will be executed if the user press Enter
		 * @return {object} this
		 */
			read : function(question, callback, completer){
				
				question = question || "";
				var reader = _initReader(function(){
					//console.log("on close")
				}, completer)

				reader.question(question, function(data){
					callback(data, reader)

				})
				
				return this;
			},
		/**
		 * @method  createForm 
		 * @description creates a cli form
		 * @param  {array} fields an array with the field definition
		 * @return {object}  returns an instace of Mold.Core.CLIForm
		 * @description 
		 *
	     *	[{
		 *    	label : "some question?:",
		 *     	input : {
		 *      	name : 'path',
		 *       	type : 'filesystem',
		 *        	validate : 'required',
		 *         	messages : {
		 *          	error : "Is not valid!",
		 *           	success : function(data){
		 *           		if(data === 1){
		 *           			return "yuhu one!"
		 *           		}
		 *           	}
		 *          }
		 *      }
		 *   }]
		 */
			createForm : function(fields){
				return new Mold.Core.CLIForm(this, fields);
			},

		/**
		 * @method  table 
		 * @description shows data in a table
		 * @param  {[type]} data - a two dimensional array, first dimension is the row second the column
		 * @return {[type]}      [description]
		 */
			table : function(data, conf){
				var that = this;
				//calculate column width
				var columns = [];
				data.forEach(function(row){
					row.forEach(function(column, index){
						columnInfo = columns[index] || { width : 0 };
						if(columnInfo.width < column.length){
							columnInfo.width = column.length;
						}
						columns[index] = columnInfo;
					});
				});
		
				data.forEach(function(row){
					row.forEach(function(column, index){
						var value = column + " ".repeat(columns[index].width - column.length)
						if(conf.columnFormat && conf.columnFormat[index] && typeof conf.columnFormat[index] == 'function'){
							value = conf.columnFormat[index](value);
						}
						//console.log(value)
						that.write(value);
					});
					that.lb();
				});
			},
		/**
		 * @method  exit
		 * @description exits the cli
		 * @return {[type]} [description]
		 */
			exit : function(){
				process.exit(0);
				return this;
			},
		/**
		 * complete
		 * @description a set off auto complete functions
		 * @type {Object}
		 */
			completer : {
				default : function(line){
					return [[], line];
				},
				yesno :  function(line){
					var completions = ['yes', 'no'];
					var hits = completions.filter(function(c) { return c.indexOf(line) == 0 });

  					return [hits.length ? hits : completions, line]
				},
				filesystem : function(line){
					line = Mold.trim(line);
					if(line !== ""){

						var path = Mold.trim(line.substr(0, line.lastIndexOf("/"))),
							lineParts = line.split("/"),
							searchString = lineParts[lineParts.length -1],
							searchPath = path,
							hits = [];

						if(!Mold.startsWith(line, "/")){
							searchPath = process.cwd() + "/" + path;
						}else{
							searchPath = "/" + path;
						}
						if(fs.existsSync(searchPath)){
							var result = fs.readdirSync(searchPath);
							hits = result.filter(function(entry) {  
								return Mold.startsWith(entry, searchString) 
							});

							if(Mold.startsWith(line, "/")){
								Mold.each(hits, function(value, index){
									hits[index] = "/" + value;
								});
							}
							
							if(path != "" ){
								Mold.each(hits, function(value, index){
									if(Mold.endsWith(path, "/") || Mold.startsWith(value, "/")){
										hits[index] = path + value;
									}else{
										hits[index] = path + "/" + value;
									}
								})
							}
							if(!hits.length){
								hits = result;
							}
						}
						
						return  [hits, line];
					}else{
						return  [[], line];
					}
				}
			},
		/**
		 * @method  addCompleter
		 * @description adds a custome completer
		 * @param {string}   name of the completer
		 * @param {Function} callback completer function
		 */
			addCompleter : function(name, callback){
				this.completer[name] = callback;
			},

			scrollRight : function(str, time){
				var that = this;
				var time = time || 20;
				return new Promise(function(resolve){
					var next = function(count){
						var count = count || 0;
						var current = str[count];
						that.write(current);
						if(str.length > count + 1){
							setTimeout(function(){ next(++count) }, time);
						}else{
							resolve();
						}

					}
					next(0)
				});
			},

			sprites :  function(){
				var that = this;
				var cQ = this.COLOR_RED + "◼" + this.COLOR_RESET;

				return {

					quat : [
						cQ + " ▭ ▭ ▭ ▭ ▭ ▭ ▭ ▭",
						"▭ " + cQ + " ▭ ▭ ▭ ▭ ▭ ▭ ▭",
						"▭ ▭ " + cQ + " ▭ ▭ ▭ ▭ ▭ ▭",
						"▭ ▭ ▭ " + cQ + " ▭ ▭ ▭ ▭ ▭",
						"▭ ▭ ▭ ▭ " + cQ + " ▭ ▭ ▭ ▭",
						"▭ ▭ ▭ ▭ ▭ " + cQ + " ▭ ▭ ▭",
						"▭ ▭ ▭ ▭ ▭ ▭ " + cQ + " ▭ ▭",
						"▭ ▭ ▭ ▭ ▭ ▭ ▭ " + cQ + " ▭",
						"▭ ▭ ▭ ▭ ▭ ▭ ▭ ▭ " + cQ,
					]
				}
				
				
			},
			__loadingBar : null,
			loadingBar : function(text, time){
				if(this.silent){
					this.__loadingBar = {
						stop : function(){},
						text : function(){}
					}

					return this.__loadingBar;
				}
				var stop = false;
				var time = time || 100;
				var sprite = this.sprites().quat;
				var _text = text;

				var next = function(count){
					if(stop){
						return;
					}

					count = (sprite.length === count) ? 0 : count;
					process.stdout.cursorTo(0);
					process.stdout.write(sprite[count] + "   " + _text);
					setTimeout(function(){ next(++count) }, time);
				}

				next(0);

				this.__loadingBar = {
					stop : function(text){
						process.stdout.cursorTo(0);
						if(text){
							var old = sprite[0] + "   " + _text;
							if(text.length < old.length){
								var spaceLength = old.length - text.length;
								text += " ".repeat(spaceLength);
							}
							process.stdout.write(text);
						}else{
							process.stdout.write(sprite[0] + "   " + _text);
						}
						process.stdout.write("\n")
						stop = true;
					},
					text : function(text){
						var space = "";
						if(_text.length > text.length){
							var space = " ".repeat(_text.length);
							process.stdout.cursorTo(0);
							process.stdout.write(sprite[0] + "   " + space);
							
						}
						_text = text;
					}
				}

				return this.__loadingBar;
			},
		/**
		 * @description colors and symboles you could use to format your cli output
		 * @type {String}
		 */
			COLOR_RESET : "\u001b[39m", //"\033[0m",
			COLOR_BLACK : "\033[0;30m",
			COLOR_RED : "\u001b[31m",//"\033[0;31m",
			COLOR_GREEN : "\u001b[32m",
			COLOR_YELLOW : "\033[0;33m",
			COLOR_BLUE : "\033[0;34m",
			COLOR_PURPLE : "\033[0;35m",
			COLOR_CYAN : "\u001b[36m",//"\033[0;36m",
			COLOR_WHITE : "\033[0;37m",

			BRIGHT_COLOR_BLACK : "\033[0;90m",

			BGCOLOR_RESET : "\x1b[0m",
			BGCOLOR_BLACK : "\x1b[40m",
    		BGCOLOR_RED : "\x1b[41m",
   			BGCOLOR_GREEN : "\x1b[42m",
 			BGCOLOR_YELLOW : "\x1b[43m",
 			BGCOLOR_BLUE : "\x1b[44m",
    		BGCOLOR_MAGENTA : "\x1b[45m",
    		BGCOLOR_CYAN : "\x1b[46m",
   			BGCOLOR_WHITE : "\x1b[47m",


   			BGCOLOR_DARK_GREY : "\x1b[100m",
   			BGCOLOR_DARKER_GREY : "\x1b[48;5;234m",

			SYMBOLE_TRUE : "\u001b[32m" + "✓" + "\u001b[39m",
			SYMBOLE_FALSE : "✗",
			SYMBOLE_ARROW_RIGHT : "▹",
			SYMBOLE_STAR : "★"
		}
		
	}
)