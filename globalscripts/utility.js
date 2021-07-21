/**
 * "Inside-out" implementation of Fisher-Yates shuffle
 */
function shuffleArray(source)
{
	if (!source.length)
		return [];

	let result = [source[0]];
	for (let i = 1; i < source.length; ++i)
	{
		let j = randIntInclusive(0, i);
		result[i] = result[j];
		result[j] = source[i];
	}
	return result;
}

/**
 * Generates each permutation of the given array and runs the callback function on it.
 * Uses the given clone function on each item of the array.
 * Creating arrays with all permutations of the given array has a bad memory footprint.
 * Algorithm by B. R. Heap. Changes the input array.
 */
function heapsPermute(array, cloneFunc, callback)
{
	let c = new Array(array.length).fill(0);

	callback(array.map(cloneFunc));

	let i = 0;
	while (i < array.length)
	{
		if (c[i] < i)
		{
			let swapIndex = i % 2 ? c[i] : 0;
			let swapValue = cloneFunc(array[swapIndex]);
			array[swapIndex] = array[i];
			array[i] = swapValue;

			callback(array.map(cloneFunc));

			++c[i];
			i = 0;
		}
		else
		{
			c[i] = 0;
			++i;
		}
	}
}

/**
 * Removes prefixing path from a path or filename, leaving just the file's name (with extension)
 *
 * ie. a/b/c/file.ext -> file.ext
 */
function basename(path)
{
	return path.split("/").pop();
}

/**
 * Returns the directories of a given path.
 *
 * ie. a/b/c/file.ext -> a/b/c
 */
function dirname(path)
{
	return path.split("/").slice(0, -1).join("/");
}

/**
 * Returns names of files found in the given directory, stripping the directory path and file extension.
 */
function listFiles(path, extension, recurse)
{
	return Engine.ListDirectoryFiles(path, "*" + extension, recurse).map(filename => filename.slice(path.length, -extension.length));
}

/**
 * Returns info for a given civ
 * @param civCode: The code of the given civ (i.e. athen, brit)
 */
function getCivInfo(civCode)
{
	if (civCode === 'gaia' || civCode === 'skirm')
		return undefined;
	let civFileName = sprintf('simulation/data/civs/%s.json', civCode);
	return Engine.ReadJSONFile(civFileName);
}

/**
 * parses a template for a particular civ
 * @param templateName (str) unparsed template name (i.e. "{civ}_building")
 * @param subPattern (regex) pattern to replace in templateName (i.e. /\{civ\}/)
 * @param civCode (str) code of civ in question (i.e. "athen")
 * @return (str/undefined) valid, parsed template name; undefined if no valid template found
 */
function parseCivTemplate(templateName, subPattern, civCode)
{
	let codes = [civCode];
	let civInfo = getCivInfo(civCode);
	if (civInfo && civInfo.Culture)
		codes = codes.concat(civInfo.Culture);
	codes.push('generic');
	let cmpTemplateManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_TemplateManager);
	for (let i in codes) {
		let code = codes[i];
		let parsedTemplateName = templateName.replace(subPattern, code);
		if (cmpTemplateManager && cmpTemplateManager.TemplateExists(parsedTemplateName))
			return parsedTemplateName;
	}// end for i
	return undefined;
}// end parseCivTemplate

/*
 * parses tokens with relation to an entity and returns a list of valid template names
 * @param entity: entity number
 * @param tokenlist: array of template names, possibly including {civ} and {native}
 */
function parseEntityTokens(entity, tokenList)
{
	let cmpPlayer = QueryOwnerInterface(entity);
	if (!cmpPlayer)
		return [];
	let playerCivCode = cmpPlayer.GetCiv();
	let playerCivInfo = getCivInfo(playerCivCode);
	let playerCodes = [playerCivCode];
	if (playerCivInfo && playerCivInfo.Culture)
		playerCodes = playerCodes.concat(playerCivInfo.Culture);
	playerCodes.push('generic');

	let nativeCodes = (() => {
		let cmpIdentity = Engine.QueryInterface(entity, IID_Identity);
		if (!cmpIdentity)
			return undefined;
		let nativeCivCode = cmpIdentity.GetCiv();
		let nativeCivInfo = getCivInfo(nativeCivCode);
		let nativeCodes = [nativeCivCode];
		if (nativeCivInfo && nativeCivInfo.Culture)
			nativeCodes = nativeCodes.concat(nativeCivInfo.Culture);
		nativeCodes.push('generic');
		return nativeCodes;
	})();

	let cmpTemplateManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_TemplateManager);
	let disabledTemplates = cmpPlayer.GetDisabledTemplates();

	let entities = [];

	for (let i in tokenList) {
		let token = tokenList[i];
		if (token.indexOf('{civ}') != -1 && playerCodes) {
			for (let c in playerCodes) {
				let code = playerCodes[c];
				let parsedToken = token.replace(/\{civ\}/g, code);
				if (cmpTemplateManager.TemplateExists(parsedToken)) {
					token = parsedToken;
					break;
				}
			}// end for code of playerCodes
		}
		if (token.indexOf('{native}') != -1 && nativeCodes) {
			for (let c in nativeCodes) {
				let code = nativeCodes[c];
				let parsedToken = token.replace(/\{native\}/g, code);
				if (cmpTemplateManager.TemplateExists(parsedToken)) {
					token = parsedToken;
					break;
				}
			}// end for code of nativeCodes
		}
		if (cmpTemplateManager.TemplateExists(token) && !disabledTemplates[token])
			entities.push(token);
	}// end for i

	return entities;
}// end parseEntityTokens

// logs a warning message formatted via sprintf
function warnf(fmt, ...args)
{
	warn(sprintf(fmt, ...args));
}

// logs an error message formatted via sprintf
function errorf(fmt, ...args)
{
	error(sprintf(fmt, ...args));
}

// formats a number with commas every three digits
// @param num		Number		number to format
// @return			String		comma-formatted string
// example: fmtNum(13200) => "13,200"
function fmtNum(num)
{
	if (typeof num !== 'number')
		throw new Error(sprintf('%s is not a number!', num))
	let [integer, remainder] = ("" + num).split('.');
	let outputIntegerCharsReversed = [];
	let idx = 0;
	for (let ch of integer.split('').reverse())
	{
		if (idx === 3)
		{
			outputIntegerCharsReversed.push(',');
			idx = 1;
		} else {
			idx += 1;
		}
		outputIntegerCharsReversed.push(ch);
	}
	return [outputIntegerCharsReversed.reverse().join(''), remainder].filter(n => n).join('.');
}

function pickRandomWeighted(weightedItems)
{
	if (!weightedItems || !weightedItems.length)
		return undefined;
	const weightsTotal = weightedItems.reduce((sum, [_, weight]) => sum + weight, 0);
	let randomValue = weightsTotal * Math.random();
	for (let [item, weight] of weightedItems)
	{
		randomValue -= weight;
		if (randomValue < 0)
			return item;
	}
	return weightedItems[weightedItems.length - 1][0];
}
