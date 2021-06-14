# Contributing
Mare Nostrum is a young project, and I would love for more people to help develop it. I'd especially love some artists to join the team, as I have limited graphic design skills and no idea how to use Blender.

## Notice
Mare Nostrum is free and open source software, made available under the GNU General Public License and the Creative Commons Attribution International Public License (see [LICENSE\_AND\_ATTRIBUTIONS](./LICENSE_AND_ATTRIBUTIONS.txt)).
By committing your code or artwork to this repository, you agree to make it available free of charge both to the creators of Mare Nostrum and to the public at large, so long as they provide proper attribution and release any derived works under the same or compatible licenses.

## Implementing Features and Bugfixes
A list of unresolved bugs and features requests can be found on the [issues page](./issues) or in [TODO.md](./TODO.md). If you are looking at a feature request in issues, please make sure it has been approved by the repo owner before working on it.

When opening a pull request, please make sure the title refers to the relevant issue by number and includes a brief restatement of what if implements (i.e. "#42 Reduce killer bunny attack interval").

If you would like to implement a new feature, or modify an existing one, please open a Feature Request in issues first so we can discuss whether or not it should be implemented.

## Developer Tools
I do most of the work on Mare Nostrum on a branch of the 0AD development repository, cloned from [https://github.com/0ad/0ad](https://github.com/0ad/0ad). This allows me to frequently rebase onto the development version of 0AD to nip compatibility issues in the bud, and also makes it easier to access existing game files. When I'm ready to commit changes, I use the shell utils in [dev/parent/utils.sh](./dev/parent/utils.sh) to copy the relevant files over to this repository and commit the same message simultaneously in both repositories. I also store a copy of every commit on the development repository in [dev/patch](./dev/patch) so it can be reconstructed easily by any other developer. I recommend other developers set up their workspace this way as well.

To set up your workspace in this manner, run ./dev/setup-parent.sh \<YOUR 0AD REPOSITORY\>. If you haven't cloned the 0AD repo into \<YOUR 0AD REPOSITORY\> yet, the script will do it for you. The script will create a mare\_nostrum branch and apply the commits in dev/patch, starting from the commit stored in [dev/git\_base.txt](./dev/git_base.txt). It will then copy the script(s) stored in dev/parent to \<YOUR 0AD REPOSITORY\>/dev and append a few system-specific variables to dev/utils.sh. You can then add dev/ to your new branch and source dev/utils before you start developing.

## Third-party Content
Any third-party content integrated into Mare Nostrum must also be available under the same or compatible licenses. THIS MEANS ABSOLUTELY NO CLOSED-SOURCE OR MONETIZED CONTENT.
Any media or code should be distributed with a copy of (or link to) the GNU General Public License or the Creative Commons Attribution-ShareAlike International Public License, or a more permissive variant of either of those two licenses. If you cannot find any such license attached, assume the content is not available for our use.

Any third party content included in your work must be documented in LICENSE\_AND\_ATTRIBUTIONS.txt, including the following information:

- Name of the content provider (i.e. "Wikimedia Commons")
- Name of the author, either their real name or the pseudonym under which they shared their work (i.e. "hopeless-ponderer at Github.com")
- The url where you accessed the content
- A brief summary of how the content was utilized, including the file(s) that use it
- Any other information required by the attached license

## Coding Conventions
For the most part, obey the same coding conventions as Wildfire Games, outlined [here](https://trac.wildfiregames.com/wiki/Coding_Conventions). However, there are a few exceptions I'd like to follow, outlined below. Don't modify pre-existing 0AD code to fit these coding conventions, these only apply to new code.

### JavaScript
- Multi-line strings should be written as template literals, which are contained within back ticks (``). This allows you to interpolate values using curly braces (${}) This is particularly useful for new component schemas in simulation/components/.
```javascript
		Foobar.prototype.Schema = 
		`<a:help>Sample component</a:help>
		<element name="Cost" a:help="Sample element to show how to interpolate resources into a multi-line string">
			${ Resources.BuildSchema("positiveInteger") }
		</element>`;
```
- Document functions with at least one sentence explaining what it does, as well as a breakdown of each parameter and the return value(s).
```javascript
		// Gets the square of the distance between two entities.
		// @param entityA		Number					ID of the first entity
		// @param entityB		Number					ID of the second entity
		// @return				Number||undefined		The square of the distance between the two entities, or undefined if the position of one or both entities cannot be determined.
		function getSquareVectorDistance(entityA, entityB)
```
- If one of a function's parameters is an object whose properties are known beforehand, destructure the properties in the parameter declaration.
```javascript
		Foobar.prototype.OnEntityRenamed = function({ entity, newentity })
```

### XML
- Certain components allow you to create elements with any name (i.e. City/ValueModifiers). When creating a new arbitrary element, add at least one line of comments explaining what the element does.
```xml
		<ValueModifiers>
			<PopulationDecay>
				<!-- Increase the population decay rate per every 250 citizens, to make it increasingly more difficult to grow the population. -->
				<Paths datatype="tokens">City/Population/Growth/DecayAmount</Paths>
				<Add>2</Add>
				<PerPop>250</PerPop>
			</PopulationDecay>
		</ValueModifiers>
```

### Other
- Use Commonwealth (British) English spelling and vocabulary when naming templates, components, and classes. However, U.S. spelling and vocabulary should be used for variable names and documentation, except when referencing template, component, and class names.
