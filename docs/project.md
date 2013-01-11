# project.json

A *project.json* file describes the contents of a Galago IDE project. All valid Galago IDE projects are self-contained inside of a directory which has a *project.json* file at its root. Its contents conform to the JSON spec.

## Elements stored on disk

### name

The name of the project. Since a project's name is also used for its directory name, names may only contain alphanumeric characters, spaces, hyphens, and underscores.


Valid project names:
	
	"name": "gps_test"
	"name": "micro-watch v1"
	
Invalid project names:
	
	"name": "push/pull driver"
	"name": "Herbert's PuzzleBox"
	
### files

A list of file names that belong to the module. The files must all be inside of the module's directory. Although the format allows a module to contain any number of files, **it is strongly advised to only have one file per project.**  Modules created by the development tool will only contain one file named *main.cpp* by default.

File names have the same naming restrictions as project names.

Example:
	
	"files":
	[
		{
			"name": "bar.cpp"
		},
		{
			"name": "derp.cpp",
			"definitions":
			{
				"": "anonymous coward",
				"USER_WAKEUP_DELAY": 7
			}
		}
	]

#### files[ ].definitions

Just like project-wide definitions, but applies only to one file.  If missing, defaults to an empty list.

For the purposes of comparing project and file names (and to guarantee uniqueness) these names are treated as if uppercase letters have been converted to lowercase.  This is required for compatibility across various file systems on supported platforms.  As a result, no two projects may have a name that differs only by the case of letters therein.  Accordingly, no two files in a project may have names with the same similarity.

### compatibleWith

A dictionary of known hardware platforms that this project may be built for.

Example:

	"compatibleWith":
	{
		"Galago-0410",
		"GalagoPro-0602"
	}

### require

A dictionary of modules upon which this module depends.  Names must be absolute: i.e. they must contain the owner and module name joined by a slash ("/").

Example:

	"require":
	{
		"logiblock/gps",
		"tyler/gps-waypoints",
	},

### definitions

C preprocessor definitions, applied to all the files of the module.  Individual definitions can be applied on a per-file basis.

	"definitions":
	{
		"USE_SOFTWARE_SPI": 1,
		"BLINK_LED_ON_FIX": 1,
	},

### parameters

Parameters are variables that are adjustable at runtime via the debugger.  The debugger can inspect these variables to determine their type and value, so only the minimum and maximum values need to be specified in the project file.

	"parameters":
	{
		"$blinkInterval": {"min": 500, "max": 3000},
		"$blinkOnDuration": {"min": 30, "max": 2000}
	},

## Runtime elements
	
### buildStatus

The build status of a project. The values it can take on are:

- *uncompiled* - project has not been built yet
- *compiled* - project has been successfully built without any errors
- *errors* - there was an attempt to compile the project, but there were errors in the process

Example:

	"buildStatus": "uncompiled"
	
Since buildStatus is a run-time property of the project, when a project is first opened, buildStatus is set to *uncompiled*.
	
### runStatus

The run status of a project. The values it can take on are:

- *stopped* - the project is not currently running
- *running* - the project is currently running
- *paused* - the project is in debug mode and is paused on an instruction

Since runStatus is a run-time property of the project, when a project is first opened, runStatus is automatically set to *stopped*.


Example:
	
	"runStatus": "paused"
	
### files

In-memory files have additional properties that they can take on:

- *isOpen* - a boolean value which describes whether the file is currently open and being edited. A file may only be open in one project at a time. A project may only have one file open at a time.
- *contents* - a single string with the entire contents of a file - this field is only set and populated with the *isOpen* is set to true.

Example:

	"files":
	[
		{
			"name": "main.cpp",
			"isOpen": true,
			"contents":
			{
				"#include <cstdio>\n\n\tint main()\n{\n\t\treturn 0;\n}\n"
			}
		}
	]
	
## Complete in-memory project.json file example

	{
		"name": "hello-world",
		"files":
		[
			{
				"name": "main.cpp",
				"isOpen": true,
				"contents":
				{
					"#include <cstdio>\n\n\tint main()\n{\n\t\treturn 0;\n}\n"
				}				
			}
		],
		"buildStatus": "compiled",
		"runStatus": "stopped"
	}