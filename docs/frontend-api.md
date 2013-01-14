# IDE frontend API interface

There is only one socket.io connection for each IDE client instance. Each client is part of a global channel that contains IDE state shared across all instances. Each client also gets their own private channel, which contains IDE window-specific information, like the contents of a specific open file.

Various components are split into separate namespaces, with socket events automatically propagated to the namespace. Clients are encouraged to use the namespaced object, rather than the underlying socket.

## ProjectCollection (shared)

### Events:

`list (projects)` - a list of all projects.

`add (project)` - when a new project was added.

`remove (project)` - when a project was removed.

## Project

### Events:

`addFile (file)`

`removeFile (file)`

`rename (newName)` - when a project's name has been changed.

`open` - when a project was opened.

`close` - when a project was closed. 

### Actions:

`project.open(callback)`

`callback: (err)`

Open a project. A project must be opened before any changes to it can be made.

`project.close(callback)`

`callback: (err)`

Close a project.

`project.addFile(fileName, callback)`

`callback: (err, file)`

Adds an empty file to a project. File name can only contain alphanumeric characters, spaces, hyphens, and underscores. File names must be unique within the project.

`project.removeFile(fileName, callback)`

`callback: (err)`

Removes a file from a project.

`project.openFile(fileName, callback)`

`callback: (err, contents)`

Opens a file in a project. Only one file can be open in a project at a time. A file can only be open in one IDE instance at a time.

## File

### Events:

`rename (newName)`

`change (newContents)`

### Actions:

`file.setContents(newContents, callback)`

`callback: (err)`

Sets the contents of a file. The file must be open in order for its contents to be changed.
