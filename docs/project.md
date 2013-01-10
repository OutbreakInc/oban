# project.json

A *project.json* file describes the contents of a Galago IDE project. All valid Galago IDE projects are self-contained inside of a directory which has a *project.json* file at its root. Its contents conform to the JSON spec.

## Elements stored on disk

### name

The name of the project. Since a project's name is also used for its directory name, names may only contain alphanumeric characters, spaces, dashes, and underscores.

Valid project name:
	
	"name": "foo_bar"
	
Invalid project name:
	
	"name": "eugene/servo-stuff"
	
### files

A list of file names that belong to the project. The files must all be inside of the project directory. Although the format allows a project to contain any amount of files, **it is strongly advised to only have one file per project.**

New projects will, by default, have an empty file called *main.cpp*

File names have the same naming restrictions as project names.

Example:
	
	"files":
	[
		{
			"name": "bar.cpp"
		},
		{
			"name": "derp.cpp"
		}
	]

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