#Mold.Core.CLI (alpha)
This repository includes the moldjs command line interface and a bunch of commands. Including all commands are needed to manage mold packages.

###requirements
You need nodejs and npm to install the mold clis.

###installation
To install the mold cli use npm and install it global:

```
	npm install mold-js -g
```

###use mold cli
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

###commands
Currently implemented commands are:

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
	* **-up** - 
	



 
