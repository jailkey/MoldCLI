"use strict";
//!info transpiled
/**
 * @module Mold.Core.Logger
 * @description provides methods to show infos and errors in a readable way
 */
Seed({
		type : "module",
		include : [
			{ Helper : "Mold.Core.CLIHelper" }
		],
		test : "Mold.Test.Core.Logger"
	},
	function(module){


		var _extractStackLine = function(line){
			var lineParts = line.split(" ");
			var output = {};
			if(!!~line.indexOf("(")){
				lineParts.shift();
				output.methodName = lineParts[0];
				lineParts.shift();
				var fileInfo = lineParts.join(" ").replace(/[\(|\)]*/g, '');
			}else{
				lineParts.shift();
				var fileInfo = lineParts.join(" ");
			}

			var fileInfoParts = fileInfo.split(":");
			output.charNumber = fileInfoParts.pop();
			output.lineNumber = fileInfoParts.pop();
			output.filePath = fileInfoParts.join(':');
			output.fileName = output.filePath.substring(output.filePath.lastIndexOf("/") + 1, output.filePath.length)
			return output;
		}

		var _getStackInfo = function(stack, lineNumber){
			lineNumber = lineNumber || 0;

			if(!stack){
				return null;
			}
			//remove tabs
			stack = stack.replace(/\t/g, '');
			//remove double spaces
			stack = stack.replace(/  /g, '');
			var stackParts = stack.split("\n");
			var currentLine = stackParts[lineNumber];
			return  _extractStackLine(currentLine);
		}

		var _nodeFilePartReporter = function(filePath, lineNumber, charNumber, displayedLines){

			if(!filePath || !lineNumber){
				return;
			}
			
			displayedLines = displayedLines || 9;
			var file = new Mold.Core.File(filePath);

			var promise = file.load();

			promise.then(function(data){
				var lines = data.split('\n');
				var startAt = lineNumber - (Math.round(displayedLines / 2));
				startAt = (startAt < 0) ? 0 : startAt;

				var endAt = startAt + displayedLines;
				endAt = (endAt > lines.length) ? lines.length : endAt;
				
				lines = lines.slice(startAt, endAt);

				console.log(Helper.COLOR_CYAN + filePath + ":" + lineNumber + ":" + charNumber + Helper.COLOR_RESET);

				for(var i = 0; i < lines.length; i++){

					var hightlightChar = charNumber;
					var line = lines[i].replace(/\r/g, '').replace(/\t/g, function(){
						hightlightChar++;
						return '  ';
					});

					var isEvent = !(i % 2);
					var spaceCount = process.stdout.columns - lines[i].length - 8;
					spaceCount = (spaceCount < 0) ? 0 : spaceCount;
					var space = " ".repeat(spaceCount);
					var lineColor = (!(i % 2)) ? Helper.BGCOLOR_DARKER_GREY : Helper.BGCOLOR_BLACK;

					Helper.write(lineColor);
					Helper.write(Helper.COLOR_CYAN + (i + startAt + 1) + Helper.COLOR_RESET);

					if(i + startAt + 1 === +lineNumber){

						var lineStart = line.substring(0, hightlightChar - 1);
						var lineEnd = line.substring(hightlightChar -1 , line.length);
						Helper.write(lineStart + Helper.BGCOLOR_RED + lineEnd + Helper.BGCOLOR_RESET + lineColor + space  + Helper.BGCOLOR_RESET + "\n");
					}else{
						Helper.write(line + space + Helper.BGCOLOR_RESET + "\n")
					}
					
				}
				Helper.write(Helper.BGCOLOR_RESET).lb();
			});

			return promise;
		}

		var _showFilePart = function(){
			if(Mold.isNodeJS){
				return _nodeFilePartReporter.apply(this, arguments);
			}else{
				throw new Error("_showFilepart for browsers should be implemented!")
			}
		}
		
		//abuse Error object to get file and line informations
		var LogDummy = Error;
		LogDummy.prototype.log = function (args) {
			args = [].concat(args);
			
			var stackInfo = _getStackInfo(this.stack, 3);
			var outputInfo = stackInfo.lineNumber + ":" + stackInfo.charNumber + " (" + stackInfo.fileName + ")";
			args.unshift(outputInfo);
			console.log.apply(console, args);
		}
	
		//add log method to Mold
		var _log = function(){
			LogDummy().log(Array.prototype.slice.call(arguments, 0));
		}

		//add error method to Mold
		var _error = function(error){
			var info = _getStackInfo(error.stack, 1);

			var traceStack = function(){
				console.log("\u001b[31m" + error.stack + "\u001b[39m");
			}

			if(info.filePath){
				_showFilePart(info.filePath, info.lineNumber, info.charNumber)
					.then(traceStack)
					.catch(traceStack)
			}
		}

		//create
		var Logger = function(){}

		Logger.prototype = {
			/**
			 * @method log 
			 * @description logs a message and show it with file and line informations
			 * @param {string} message - the log message
			 */
			log : _log,
			/**
			 * @method error 
			 * @description shows an error with file snippet
			 * @param {error} 
			 */
			error : _error,
			showFilePart : _showFilePart,
			getStackInfo : _getStackInfo
		}

		module.exports = new Logger();
	}
)