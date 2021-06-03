function CityNameManager() {}

// City names are stored in simulation/data/cities/<CIV>.json files
// Each <CIV>.json file should contain an object mapping city name codes to either a string containing a city name
// or an object of the format { "Name": String, "Properties": [String ...] }
// Each city name code should be the city's name in modern English, lowercase, without diacritics, and with spaces replaced with underscores (_)
// The purpose of this is to prevent situations where two separate names referring to the same city in different languages or time periods are chosen in the same game.

CityNameManager.prototype.Schema = "<a:component type='system'/><empty/>";

CityNameManager.prototype.Init = function()
{
	const cityFilesDir = "simulation/data/cities/";
	this.takenNameCodes = new Set();
	// read city name files, parse into map mapping civ code => map of city codes to names/properties
	this.civCityNames = new Map();
	for (let filename of Engine.ListDirectoryFiles(cityFilesDir, "*.json", false))
	{
		let civCode = filename.substring(cityFilesDir.length, filename.length - 5);
		this.civCityNames.set(civCode, new Map(Object.entries(Engine.ReadJSONFile(filename))));
	}
	// track which players have had their first city named; first city names should have the property "capital" if possible
	this.playersWithNamedCapital = new Set();
};

// chooses from city names for civ identified by civCode, filtered by filter
// removes chosen name from future eligibility
// @param civCode			String		code of civ for names to choose from (i.e. "athen", "kush")
// @param filter			Function	function of the form (cityName (String) OR cityNameObject (Object)) => boolean
// @return					String		City name; "" if unsuccessful
CityNameManager.prototype.ChooseCityNameByFilter = function(civCode, filter)
{
	let cityNames = this.civCityNames.get(civCode);
	if (!cityNames)
		return "";
	let candidates = [...cityNames.entries()].filter(([cityCode, cityName]) => {
		if (this.IsCityCodeTaken(cityCode))
			return false;
		return filter(cityName);
	});
	if (!candidates || !candidates.length)
		return "";
	let [chosenCityCode, chosenCityName] = pickRandom(candidates);
	cityNames.delete(chosenCityCode);
	this.SetCityCodeTaken(chosenCityCode);
	return typeof chosenCityName === 'object' ? chosenCityName.Name : chosenCityName;
};

CityNameManager.prototype.ChooseCityName = function(cityEntity)
{
	const cmpIdentity = Engine.QueryInterface(cityEntity, IID_Identity);
	const cmpPlayer = QueryOwnerInterface(cityEntity);
	if (!cmpIdentity || !cmpPlayer)
		return "";
	const playerID = cmpPlayer.GetPlayerID();
	const civCode = cmpIdentity.GetCiv();
	// applies filters defined in CityNameManager.CityEntityFilters, if available
	const cityEntityFilter = (cityName) => !CityNameManager.CityEntityFilters ||
		Object.values(CityNameManager.CityEntityFilters).every((f) => f(cityEntity, cityName));
	const filter = this.playersWithNamedCapital.has(playerID) ?
		(cityName) => cityEntityFilter(cityName) :
		(cityName) => typeof cityName === 'object' && cityName.Properties && cityName.Properties.indexOf("capital") !== -1 && cityEntityFilter(cityName);
	this.playersWithNamedCapital.add(playerID);
	let candidate = this.ChooseCityNameByFilter(civCode, filter);
	if (candidate && candidate.length)
		return candidate;
	// if no eligible capital name found, default to any city name
	return this.ChooseCityNameByFilter(civCode, cityEntityFilter);
};

CityNameManager.prototype.IsCityCodeTaken = function(cityCode)
{
	return this.takenNameCodes.has(cityCode);
};

CityNameManager.prototype.SetCityCodeTaken = function(cityCode)
{
	this.takenNameCodes.add(cityCode);
};

// Miscellaneous filters to apply in ChooseCityName
// form: (cityEntity<Number>, cityName<String||Object>) => boolean
CityNameManager.CityEntityFilters = {
	// filters by whether city owner has researched the required phase tech
	// returns true by default
	"phase": (ent, cityName) => {
		if (typeof cityName !== 'object' || !cityName.Properties)
			return true;
		// should only be one phase property; if there are multiple, only the first will be counted
		let [phase] = cityName.Properties.filter((prop) => prop.match(/^phase_/g));
		if (!phase)
			return true;
		let cmpPlayer = QueryOwnerInterface(ent);
		if (!cmpPlayer)
			return true;
		let cmpTechnologyManager = Engine.QueryInterface(cmpPlayer.GetPlayerID(), IID_TechnologyManager);
		if (!cmpTechnologyManager)
			return true;
		return cmpTechnologyManager.GetResearchedTechs().has(phase);
	}
};

Engine.RegisterSystemComponentType(IID_CityNameManager, "CityNameManager", CityNameManager);
