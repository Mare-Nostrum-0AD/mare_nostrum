function BuildRestrictions() {}

BuildRestrictions.prototype.Schema =
	"<a:help>Specifies building placement restrictions as they relate to terrain, territories, and distance.</a:help>" +
	"<a:example>" +
		"<BuildRestrictions>" +
			"<PlacementType>land</PlacementType>" +
			"<Territory>own</Territory>" +
			"<Category>Structure</Category>" +
			"<Distance>" +
				"<FromClass>CivilCentre</FromClass>" +
				"<MaxDistance>40</MaxDistance>" +
			"</Distance>" +
		"</BuildRestrictions>" +
	"</a:example>" +
	"<optional>" +
	"<element name='AI' a:help='Data to guide the AI'>" +
		"<optional>" +
		"<element name='Affinities' a:help='How close (or far) to ideally build from other structures. For hard limits, see BuildRestrictions/DistancesExclusive or BuildRestrictions/DistancesInclusive'>" +
			"<zeroOrMore>" +
				"<element a:help='One affinity'>" +
					"<anyName />" +
					"<interleave>" +
						"<element name='Class'>" +
							"<text />" +
						"</element>" +
						"<element name='Distance' a:help='Distance to apply entity placement weights.'>" +
							"<data type='positiveInteger' />" +
						"</element>" +
						"<element name='Value' a:help='Value of affinity. Positive means structure should be placed nearer to class, negative means should be placed further from class.'>" +
							"<ref name='decimal' />" +
						"</element>" +
					"</interleave>" +
				"</element>" +
			"</zeroOrMore>" +
		"</element>" +
		"</optional>" +
		"<optional>" +
		"<element name='Critical' a:help='Whether or not this structure should be prioritized when low on resources'>" +
			"<data type='boolean' />" +
		"</element>" +
		"</optional>" +
		"<optional>" +
		"<element name='Ratios' a:help='How many of this structure to build per each structure of a given class'>" +
			"<zeroOrMore>" +
				"<element a:help='one ratio'>" +
					"<anyName />" +
					"<element name='Class' a:help='Class of other structures to compare to'>" +
						"<text />" +
					"</element>" +
					"<element name='Ratio' a:help='Number of this structure to build per each structure of Class'>" +
						"<ref name='positiveDecimal' />" +
					"</element>" +		
				"</element>" +		
			"</zeroOrMore>" +	
		"</element>" +
		"</optional>" +
	"</element>" +
	"</optional>" +
	"<element name='PlacementType' a:help='Specifies the terrain type restriction for this building.'>" +
		"<choice>" +
			"<value>land</value>" +
			"<value>shore</value>" +
			"<value>land-shore</value>"+
		"</choice>" +
	"</element>" +
	"<element name='Territory' a:help='Specifies territory type restrictions for this building.'>" +
		"<list>" +
			"<oneOrMore>" +
				"<choice>" +
					"<value>own</value>" +
					"<value>ally</value>" +
					"<value>neutral</value>" +
					"<value>enemy</value>" +
				"</choice>" +
			"</oneOrMore>" +
		"</list>" +
	"</element>" +
	"<element name='Category' a:help='Specifies the category of this building, for satisfying special constraints. Choices include: Apadana, CivilCentre, Council, Embassy, Fortress, Gladiator, Hall, Hero, Juggernaut, Library, Lighthouse, Monument, Pillar, PyramidLarge, PyramidSmall, Stoa, TempleOfAmun, Theater, Tower, UniqueBuilding, WarDog, Wonder'>" +
		"<text/>" +
	"</element>" +
	"<optional>" +
		"<element name='DistancesExclusive' a:help='Specifies distance restrictions on this building, relative to buildings from the given categories. All restrictions must be satisfied.'>" +
			"<zeroOrMore>" +
				"<element a:help='One distance restriction'>" +
					"<anyName />" +
					"<interleave>" +
						"<element name='FromClass'>" +
							"<text/>" +
						"</element>" +
						"<optional><element name='MinDistance'><data type='positiveInteger'/></element></optional>" +
						"<optional><element name='MaxDistance'><data type='positiveInteger'/></element></optional>" +
					"</interleave>" +
				"</element>" +
			"</zeroOrMore>" +
		"</element>" +
	"</optional>" +
	"<optional>" +
		"<element name='MatchLimit' a:help='Specifies how many times this entity can be created during a match.'>" +
			"<data type='positiveInteger'/>" +
		"</element>" +
	"</optional>" +
	"<optional>" +
		"<element name='DistancesInclusive' a:help='Specifies distance restrictions on this building, relative to buildings from the given categories. Only one restriction need be satisfied.'>" +
			"<zeroOrMore>" +
				"<element a:help='One distance restriction'>" +
					"<anyName />" +
					"<interleave>" +
						"<element name='FromClass'>" +
							"<text/>" +
						"</element>" +
						"<optional><element name='MinDistance'><data type='positiveInteger'/></element></optional>" +
						"<optional><element name='MaxDistance'><data type='positiveInteger'/></element></optional>" +
					"</interleave>" +
				"</element>" +
			"</zeroOrMore>" +
		"</element>" +
	"</optional>";

BuildRestrictions.prototype.Init = function()
{
};

/**
 * Checks whether building placement is valid
 *	1. Visibility is not hidden (may be fogged or visible)
 *	2. Check foundation
 *		a. Doesn't obstruct foundation-blocking entities
 *		b. On valid terrain, based on passability class
 *	3. Territory type is allowed (see note below)
 *	4. Dock is on shoreline and facing into water
 *	5. Distance constraints satisfied
 *
 * Returns result object:
 * 	{
 *		"success":             true iff the placement is valid, else false
 *		"message":             message to display in UI for invalid placement, else ""
 *		"parameters":          parameters to use in the GUI message
 *		"translateMessage":    always true
 *		"translateParameters": list of parameters to translate
 *		"pluralMessage":       we might return a plural translation instead (optional)
 *		"pluralCount":         plural translation argument (optional)
 *  }
 *
 * Note: The entity which is used to check this should be a preview entity
 *  (template name should be "preview|"+templateName), as otherwise territory
 *  checks for buildings with territory influence will not work as expected.
 */
BuildRestrictions.prototype.CheckPlacement = function()
{
	var cmpIdentity = Engine.QueryInterface(this.entity, IID_Identity);
	var name = cmpIdentity ? cmpIdentity.GetGenericName() : "Building";

	var result = {
		"success": false,
		"message": markForTranslation("%(name)s cannot be built due to unknown error"),
		"parameters": {
			"name": name,
		},
		"translateMessage": true,
		"translateParameters": ["name"],
	};

	var cmpPlayer = QueryOwnerInterface(this.entity, IID_Player);
	if (!cmpPlayer)
		return result; // Fail

	// TODO: AI has no visibility info
	if (!cmpPlayer.IsAI())
	{
		// Check whether it's in a visible or fogged region
		var cmpRangeManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_RangeManager);
		var cmpOwnership = Engine.QueryInterface(this.entity, IID_Ownership);
		if (!cmpRangeManager || !cmpOwnership)
			return result; // Fail

		var explored = (cmpRangeManager.GetLosVisibility(this.entity, cmpOwnership.GetOwner()) != "hidden");
		if (!explored)
		{
			result.message = markForTranslation("%(name)s cannot be built in unexplored area");
			return result; // Fail
		}
	}

	// Check obstructions and terrain passability
	var passClassName = "";
	switch (this.template.PlacementType)
	{
	case "shore":
		passClassName = "building-shore";
		break;

	case "land-shore":
		// 'default-terrain-only' is everywhere a normal unit can go, ignoring
		// obstructions (i.e. on passable land, and not too deep in the water)
		passClassName = "default-terrain-only";
		break;

	case "land":
	default:
		passClassName = "building-land";
	}

	var cmpObstruction = Engine.QueryInterface(this.entity, IID_Obstruction);
	if (!cmpObstruction)
		return result; // Fail


	if (this.template.Category == "Wall")
	{
		// for walls, only test the center point
		var ret = cmpObstruction.CheckFoundation(passClassName, true);
	}
	else
	{
		var ret = cmpObstruction.CheckFoundation(passClassName, false);
	}

	if (ret != "success")
	{
		switch (ret)
		{
		case "fail_error":
		case "fail_no_obstruction":
			error("CheckPlacement: Error returned from CheckFoundation");
			break;
		case "fail_obstructs_foundation":
			result.message = markForTranslation("%(name)s cannot be built on another building or resource");
			break;
		case "fail_terrain_class":
			// TODO: be more specific and/or list valid terrain?
			result.message = markForTranslation("%(name)s cannot be built on invalid terrain");
		}
		return result; // Fail
	}

	// Check territory restrictions
	var cmpTerritoryManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_TerritoryManager);
	var cmpPosition = Engine.QueryInterface(this.entity, IID_Position);
	if (!cmpTerritoryManager || !cmpPosition || !cmpPosition.IsInWorld())
		return result;	// Fail

	var pos = cmpPosition.GetPosition2D();
	var tileOwner = cmpTerritoryManager.GetOwner(pos.x, pos.y);
	var isConnected = !cmpTerritoryManager.IsTerritoryBlinking(pos.x, pos.y);
	var isOwn = tileOwner == cmpPlayer.GetPlayerID();
	var isMutualAlly = cmpPlayer.IsExclusiveMutualAlly(tileOwner);
	var isNeutral = tileOwner == 0;

	var invalidTerritory = "";
	if (isOwn)
	{
		if (!this.HasTerritory("own"))
			// Translation: territoryType being displayed in a translated sentence in the form: "House cannot be built in %(territoryType)s territory.".
			invalidTerritory = markForTranslationWithContext("Territory type", "own");
		else if (!isConnected && !this.HasTerritory("neutral"))
			// Translation: territoryType being displayed in a translated sentence in the form: "House cannot be built in %(territoryType)s territory.".
			invalidTerritory = markForTranslationWithContext("Territory type", "unconnected own");
	}
	else if (isMutualAlly)
	{
		if (!this.HasTerritory("ally"))
			// Translation: territoryType being displayed in a translated sentence in the form: "House cannot be built in %(territoryType)s territory.".
			invalidTerritory = markForTranslationWithContext("Territory type", "allied");
		else if (!isConnected && !this.HasTerritory("neutral"))
			// Translation: territoryType being displayed in a translated sentence in the form: "House cannot be built in %(territoryType)s territory.".
			invalidTerritory = markForTranslationWithContext("Territory type", "unconnected allied");
	}
	else if (isNeutral)
	{
		if (!this.HasTerritory("neutral"))
			// Translation: territoryType being displayed in a translated sentence in the form: "House cannot be built in %(territoryType)s territory.".
			invalidTerritory = markForTranslationWithContext("Territory type", "neutral");
	}
	else
	{
		// consider everything else enemy territory
		if (!this.HasTerritory("enemy"))
			// Translation: territoryType being displayed in a translated sentence in the form: "House cannot be built in %(territoryType)s territory.".
			invalidTerritory = markForTranslationWithContext("Territory type", "enemy");
	}

	if (invalidTerritory)
	{
		result.message = markForTranslation("%(name)s cannot be built in %(territoryType)s territory. Valid territories: %(validTerritories)s");
		result.translateParameters.push("territoryType");
		result.translateParameters.push("validTerritories");
		result.parameters.territoryType = { "context": "Territory type", "message": invalidTerritory };
		// gui code will join this array to a string
		result.parameters.validTerritories = { "context": "Territory type list", "list": this.GetTerritories() };
		return result;	// Fail
	}

	// Check special requirements
	if (this.template.PlacementType == "shore")
	{
		if (!cmpObstruction.CheckShorePlacement())
		{
			result.message = markForTranslation("%(name)s must be built on a valid shoreline");
			return result;	// Fail
		}
	}

	let cmpTemplateManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_TemplateManager);

	let templateName = cmpTemplateManager.GetCurrentTemplateName(this.entity);
	let template = cmpTemplateManager.GetTemplate(removeFiltersFromTemplateName(templateName));

	// Check distance restriction
	let target = this;
	let checkDist = function(dist)
	{
		var cmpRangeManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_RangeManager);
		var cmpPlayer = QueryOwnerInterface(target.entity, IID_Player);
		var cat = dist.FromClass;

		var filter = function(id)
		{
			var cmpIdentity = Engine.QueryInterface(id, IID_Identity);
			return cmpIdentity.GetClassesList().indexOf(cat) > -1;
		};
		if (dist.MinDistance !== undefined)
		{
			let minDistance = ApplyValueModificationsToEntity("BuildRestrictions/Distance/MinDistance", +dist.MinDistance, target.entity);
			if (cmpRangeManager.ExecuteQuery(target.entity, 0, minDistance, [cmpPlayer.GetPlayerID()], IID_BuildRestrictions).some(filter))
			{
				let result = markForPluralTranslation(
					"%(name)s too close to a %(category)s, must be at least %(distance)s meter away",
					"%(name)s too close to a %(category)s, must be at least %(distance)s meters away",
					minDistance);
				result.success = false;
				result.translateMessage = true;
				result.parameters = {
					"name": name,
					"category": cat,
					"distance": minDistance
				};
				result.translateParameters = ["name", "category"];
				return result;  // Fail
			}
		}
		if (dist.MaxDistance !== undefined)
		{
			let maxDistance = ApplyValueModificationsToEntity("BuildRestrictions/Distance/MaxDistance", +dist.MaxDistance, target.entity);
			if (!cmpRangeManager.ExecuteQuery(target.entity, 0, maxDistance, [cmpPlayer.GetPlayerID()], IID_BuildRestrictions).some(filter))
			{
				let result = markForPluralTranslation(
					"%(name)s too far from a %(category)s, must be within %(distance)s meter",
					"%(name)s too far from a %(category)s, must be within %(distance)s meters",
					maxDistance);

				result.success = false;
				result.translateMessage = true;
				result.parameters = {
					"name": name,
					"category": cat,
					"distance": maxDistance
				};
				result.translateParameters = ["name", "category"];
				return result;	// Fail
			}
		}
		return null;
	};// end func checkDist

	if (this.template.DistancesExclusive)
	{
		for (let d in this.template.DistancesExclusive)
		{
			let dist = this.template.DistancesExclusive[d];
			let res = checkDist(dist);
			if (res)
				return res;
		}// and for dist of this.template.DistancesExclusive
	}

	if (this.template.DistancesInclusive)
	{
		let res = null;
		for (let d in this.template.DistancesInclusive)
		{
			let dist = this.template.DistancesInclusive[d];
			res = checkDist(dist);
			if (!res)
				break;
		}// end for dist of this.template.DistancesInclusive
		if (res)
			return res;
	}

	// Success
	result.success = true;
	result.message = "";
	return result;
};

BuildRestrictions.prototype.GetCategory = function()
{
	return this.template.Category;
};

BuildRestrictions.prototype.GetTerritories = function()
{
	return ApplyValueModificationsToEntity("BuildRestrictions/Territory", this.template.Territory, this.entity).split(/\s+/);
};

BuildRestrictions.prototype.HasTerritory = function(territory)
{
	return (this.GetTerritories().indexOf(territory) != -1);
};

// Translation: Territory types being displayed as part of a list like "Valid territories: own, ally".
markForTranslationWithContext("Territory type list", "own");
// Translation: Territory types being displayed as part of a list like "Valid territories: own, ally".
markForTranslationWithContext("Territory type list", "ally");
// Translation: Territory types being displayed as part of a list like "Valid territories: own, ally".
markForTranslationWithContext("Territory type list", "neutral");
// Translation: Territory types being displayed as part of a list like "Valid territories: own, ally".
markForTranslationWithContext("Territory type list", "enemy");

Engine.RegisterComponentType(IID_BuildRestrictions, "BuildRestrictions", BuildRestrictions);
