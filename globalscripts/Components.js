// NOTE: unusable unless pyrogenesis engine allows Engine.ReadFile in simulation mode

// const _Components = function() {};
// 
// // parses a schema by the given name, found in simulation/components/schemas/<SCHEMA>.xsd
// // evaluates code contained between double brackets (i.e. {{ Resources.BuildSchema("nonNegativeInteger") }} )
// //
// // @param schemaName	(str)		name of schema file (.xsd will be appended later)
// // @return						(str)		contents of schema file with code between double brackets evaluated
// _Components.prototype.ParseSchema = function(schemaName)
// {
// 	const schemaDir = 'simulation/components/schemas';
// 	const filename = sprintf('%(schemaDir)s/%(schemaName)s.xsd', {
// 		schemaDir,
// 		schemaName
// 	});
// 	if (!Engine.FileExists(filename))
// 	{
// 		throw new Error(sprintf("Could not parse schema %s; file %s does not exist", schemaName, filename));
// 	}
// 	return Engine.ReadFile(filename).replace(/\{\{.*?\}\}/g, (match) => eval(match.substring(2, match.length - 2)));
// };
// 
// const Components = new _Components();
