#Mold.Core.CLI (alpha)
This repository includes the moldjs command line interface and a bunch of commands. Including all commands are needed to manage mold packages.

##requirements
You need nodejs and npm to install the mold clis.

##installation
To install the mold cli use npm and install it global:

```
	npm install mold-js -g
```

##use mold cli
After installation you can use the command ```mold``` on the command line.
For example if you will create a new project/package you can do it with:

```
	mold init
```

if you want to add a package to your current project use:

```
	mold install -path http://path-to-your-mold-package
```

Use ```--help``` to  get info about a command.

##commands
Currently implemented (most importend) commands are:

* **init** - intitalise a new mold app/package creates a mold.json file

* **install** - installs a mold package into the current package possible arguments are:
	*  **-path** - path to the package you wish to install
	*  **-name** - namen of the package you wish to install (currently not implemented cause registry is missing)
	* **--without-sub-packages** - if set dependent packages will be ignored
	* **--without-git-ignore** - if set package dependecies will not added to the git ignore file
	* **--without-npm** - skips installing npm packages
	* **--without-sources** - ingore all sources, only seeds(mold modules) will be copied
	* **--without-adding-dependencies** - if set dependent packages will not added to the mold.json file
	
* **unistall** - uninstalls a package by path or name 
	* **-path** - the path of the package you wish to uninstall
	* **-name** - name of the package
	
* **update**  - updates all or a specific package, if no argument is given all packages will be updated
	* **-path** - if set the package with this path will be updated
	* **-name** - if name is set only the package with this name will be updated
	* **--force** - updates the packages even if the version has not changed
	
* **version** - get/set the version number of your package, if no parameter is set the current version will be displayed
	* **--up** - set the version to the next possible number, 0.0.1 becomes 0.0.2
	* **-set** - set the version to a specific number.
	
* **test** - executes a test for a specific seed (if a test is defined)
	* **-name** - the seed name

	
##using commands programmatically
To use a command in your application import { Command : "Mold.Core.Command"} in your seed. Now you can execute all commands using Command.myCommandName( options ). The command name will be translated to camelcase. Command arguments can be set via a option object. All commands will return a promise.

Example:

```

Command
	.install({ '-path' : 'https://raw.githubusercontent.com/jailkey/MoldJS/master/'})
	.then(function(){
		//do something if the package is successfully installed
	))
	.catch(function(err){
		//something went wrong
	})
	
```

##create your own command
If you wish to create you own command, add a directory called CMD to your Mold repository and create a seed inside. For example Mold/CMD/MyCommand.js . When the mold cli is called, this directory will be scanned and all seeds in it will be loaded.
The seed content should look like this:

```
	Seed({
			type : 'module',
			include : [
				{ Command : 'Mold.Core.Command' },
				{ Promise : 'Mold.Core.Promise' },
				{ Helper : 'Mold.Core.CLIHelper' }
			]
		},
		function(){
			Command.register({
				name : 'my-command',
				description : 'description of the command, it will be shown in the command help',
				parameter : {
					'--switch' : {
						'description' : 'description of the switch',
					},
					'-argument' : {
						'description' : 'description of your argument',
						'required' : true
					}
				},
				code : function(args){
					return new Promise(function(resolve, reject){
						var valueOfTheArgument = args.parameter['-argument'].value;
						
						if(args.parameter['--switch']){
							//do something
						}
						
						
						//resolve with args if command is successfull
						Helper.ok("Everything works fine!");
						resolve(args);
						
					})
				}
			})
		}
	)
```

This are the important parts for registering a command. Don't forget to return a promise in the command code.

Realted seeds are:
Mold.Core.CLIHelper - Helps you to manage the cli output, input, colors, errors etc.
Mold.Core.CLIForm - Create easily a cli form to manage user input
Mold.Core.CLILoadingBar




	



 
