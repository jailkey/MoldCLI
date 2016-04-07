//!info transpiled
Seed({
		type : "module"
	},
	function(module){

		var COLOR_RED = "\u001b[31m";
		var COLOR_RESET = "\u001b[39m";

		var Sprites = function(){
				var that = this;
				var cQ = COLOR_RED + "◼" + COLOR_RESET;
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
		}


		var LoadingBar = function(time){
			this.stopLoader = false;
			this.timer = null;
			this.time = time || 100;
			this.sprite = Sprites().quat;
			this.currentText = "";
		}


		LoadingBar.prototype.next = function(count){
			if(this.stopLoader){
				return this;
			}

			count = (this.sprite.length === count) ? 0 : count;
			process.stdout.cursorTo(0);
			process.stdout.write(this.sprite[count] + "   " + this.currentText);
			this.timer = setTimeout(function(){ this.next(++count)}.bind(this), this.time);
			return this;
		}

		LoadingBar.prototype.clean = function(){
			process.stdout.cursorTo(0);
			process.stdout.write(" ".repeat(this.sprite[0].length) + " ".repeat(this.currentText.length));
			process.stdout.cursorTo(0);
			return this;
		}

		LoadingBar.prototype.stop = function(text, silent){

			this.stopLoader = true;
			if(this.timer){
				clearTimeout(this.timer);
			}
			if(silent){
				return;
			}

			process.stdout.cursorTo(0);
			if(text){
				var old = this.sprite[0] + "   " + this.currentText;
				if(text.length < old.length){
					var spaceLength = old.length - text.length;
					text += " ".repeat(spaceLength);
				}
				process.stdout.write(text);
			}else{
				this.clean()
			}
			process.stdout.cursorTo(0);
			//process.stdout.write("\n")
			
			return this;
		}

		LoadingBar.prototype.start = function(text, silent){
			if(silent){
				return this;
			}
			this.stopLoader = false;
			if(text){
				this.text(text);
			}
			this.next(0);
			return this;
		}


		LoadingBar.prototype.text = function(text, silent){
			if(silent){
				return this;
			}
			var space = "";
			if(this.currentText.length > text.length){
				var space = " ".repeat(this.currentText.length);
				process.stdout.cursorTo(0);
				process.stdout.write(this.sprite[0] + "   " + space);
				
			}
			this.currentText = text;
			return this;
		}

		module.exports = new LoadingBar();
	}
)