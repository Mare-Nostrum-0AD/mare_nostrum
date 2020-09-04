function City() {}

City.prototype.Schema = "<a:help>Identifies this entity as a city centre.</a:help>" +
"<optional>" +
"<element name='Influence' a:help='Modifications to surrounding structures'>" +
	"<zeroOrMore>" +
		"<element a:help='One modification'>" +
			"<anyName />" +
			"<element name='Attribute' a:help='Attribute to modify'>" +
				"<text />" +
			"</element>" +
			"<element name='List' a:help='Classes to modify'>" +
				"<attribute name='datatype'>" +
					"<value>tokens</value>" +
				"</attribute>" +
				"<text />" +
			"</element>" +
			"<element name='Modifier' a:help='Modification to make'>" +
				"<element name='Base' a:help='Basic value of modification'>" +
					"<ref name='decimal' />" +
				"</element>" +
				"<element name='PerPop' a:help='Apply bonus per X amount population'>" +
					"<ref name='nonNegativeDecimal' />" +
				"</element>" +
				"<element name='Type' a:help='Add or Multiply'>" +
					"<choice>" +
						"<value>add</value>" +
						"<value>multiply</value>" +
					"</choice>" +
				"</element>" +
				"<element name='Value' a:help='Population bonus value'>" +
					"<ref name='decimal' />" +
				"</element>" +
			"</element>" +
		"</element>" +
	"</zeroOrMore>" +
"</element>" +
"</optional>" +
"<element name='Population' a:help='Population of city (does not relate to player population number)'>" +
	"<element name='Growth' a:help='Population growth rate'>" +
		"<optional>" +
			"<element name='AttackMultiplier' a:help='Modify growth rate when city attacked'>" +
				"<ref name='decimal' />" +
			"</element>" +
		"</optional>" +
		"<element name='Interval' a:help='Interval in milliseconds'>" +
			"<ref name='nonNegativeDecimal' />" +
		"</element>" +
		"<element name='Rate' a:help='Amount to grow population per interval'>" +
			"<ref name='decimal' />" +
		"</element>" +
		"<element name='TradeRate' a:help='Amount to modify population per arriving trader as percentage of trade gain.'>" +
			"<ref name='decimal' />" +
		"</element>" +
	"</element>" +
	"<element name='Init' a:help='Initial population'>" +
		"<ref name='nonNegativeDecimal' />" +
	"</element>" +
	"<element name='Max' a:help='Maximum population'>" +
		"<ref name='nonNegativeDecimal' />" +
	"</element>" +
"</element>" +
"<element name='Radius' a:help='Radius in which structures will belong to this city'>" +
	"<ref name='nonNegativeDecimal' />" +
"</element>" +
"<optional>" +
"<element name='RangeOverlay'>" +
	"<interleave>" +
		"<element name='LineTexture'><text/></element>" +
		"<element name='LineTextureMask'><text/></element>" +
		"<element name='LineThickness'><ref name='nonNegativeDecimal'/></element>" +
	"</interleave>" +
"</element>" +
"</optional>" +
"<optional>" +
"<element name='ResourceTrickle' a:help='Resource trickle, modified by population'>" +
	"<element name='Interval' a:help='Interval to collect resources in milliseconds'>" +
		"<ref name='nonNegativeDecimal' />" +
	"</element>" +
	"<element name='PerPop' a:help='Multiply rates per X number of people'>" +
		"<ref name='nonNegativeDecimal' />" +
	"</element>" +
	"<element name='Rates' a:help='Rates at which to gather resources'>" +
		Resources.BuildSchema('nonNegativeDecimal') +
	"</element>" +
"</element>" +
"</optional>" + 
"<optional>" +
	"<element name='Upgrade' a:help='Entity to upgrade to upon reaching max population.'>" +
		"<text />" +
	"</element>" +
"</optional>";

City.prototype.Init = function()
{
	this.SetPopulation(this.template.Population.Init);
	// set timer this.growthTimer to grow population at interval
	this.ResetGrowthTimer();
};

City.prototype.ResetGrowthTimer = function()
{
	let cmpTimer = Engine.QueryInterface(SYSTEM_ENTITY, IID_Timer);
	if (this.growthTimer)
		cmpTimer.CancelTimer(this.growthTimer);
	let growthTimerInterval = Math.round(this.template.Population.Growth.Interval);
	this.growthTimer = cmpTimer.SetInterval(this.entity, IID_City, "GrowPopulation", growthTimerInterval, growthTimerInterval, null);
};

City.prototype.GetPopulation = function()
{
	return this.population;
};

City.prototype.GetMaxPopulation = function()
{
	return Math.round(ApplyValueModificationsToEntity("City/Population/Max", this.template.Population.Max, this.entity));
};

City.prototype.SetPopulation = function(value)
{
	let val = Math.round(value);
	if (typeof(val) !== 'number')
		return this.population;
	let min = 0;
	let max = Math.round(this.template.Population.Max);
	if (value < 0) {
		this.population = 0;
	} else if (value > max) {
		if (this.template.Upgrade) {
			let replacement = this.Upgrade();
			let cmpNewCity = Engine.QueryInterface(replacement, IID_City);
			if (cmpNewCity)
				return cmpNewCity.SetPopulation(value);
		}
		this.population = max;
	} else {
		this.population = val;
	}
	Engine.PostMessage(this.entity, MT_CityPopulationChanged, {
		"entity": this.entity,
		"to": this.population
	});
	return this.population;
};

City.prototype.GetCityMembers = function()
{
	let cmpOwnership = Engine.QueryInterface(this.entity, IID_Ownership);
	let owner = cmpOwnership.GetOwner();
	let cmpRangeManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_RangeManager);
	return cmpRangeManager.ExecuteQuery(
		this.entity,
		0,
		ApplyValueModificationsToEntity("City/Radius", +this.template.Radius, this.entity),
		[owner],
		IID_CityMember
	);
};

City.prototype.GetPopulationGrowthRate = function()
{
	let growthRate = Math.floor(this.template.Population.Growth.Rate);
	let growthRateMultiplier = 1;
	for (let cityMember of this.GetCityMembers()) {
		let cmpCityMember = Engine.QueryInterface(cityMember, IID_CityMember);
		let mods = cmpCityMember.ModifyGrowthRate({
			growthRate,
			growthRateMultiplier
		});
		growthRate = mods['growthRate'];
		growthRateMultiplier = mods['growthRateMultiplier'];
	}
	return Math.round(ApplyValueModificationsToEntity("City/Population/Growth/Rate", growthRate * growthRateMultiplier, this.entity));
};

City.prototype.GetTradeGrowthRate = function()
{
	return ApplyValueModificationsToEntity('City/Population/Growth/TradeRate', this.template.Population.Growth.TradeRate, this.entity);
};

City.prototype.GetEntitiesByClasses = function(classList)
{
	let cmpOwnership = Engine.QueryInterface(this.entity, IID_Ownership);
	let owner = cmpOwnership.GetOwner();
	let cmpRangeManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_RangeManager);
	return cmpRangeManager.ExecuteQuery(
		this.entity,
		0,
		ApplyValueModificationsToEntity("City/Radius", +this.template.Radius, this.entity),
		[owner],
		IID_Identity
	).filter(ent => MatchesClassList(Engine.QueryInterface(ent, IID_Identity).GetClassesList(), classList.join(' ')));
};

City.prototype.GrowPopulation = function()
{
	// first, set market trade listeners
	let target = this;
	let markets = this.GetEntitiesByClasses(['Market']);
	for (let market of markets) {
		let cmpMarket = Engine.QueryInterface(market, IID_Market);
		if (!cmpMarket)
			continue;
		cmpMarket.SetCity(this.entity);
	}
	// get base growth rate + modifiers
	let oldPopulation = this.population;
	return this.SetPopulation(oldPopulation + this.GetPopulationGrowthRate());
};

City.prototype.GetUpgradeTemplate = function()
{
	if (!this.template.Upgrade)
		return null;
	let cmpPlayer = QueryOwnerInterface(this.entity);
	let cmpIdentity = Engine.QueryInterface(this.entity, IID_Identity);
	return this.template.Upgrade.replace(/\{civ\}/g, cmpPlayer.GetCiv()).replace(/\{native\}/g, cmpIdentity.GetCiv());
};

City.prototype.Upgrade = function()
{
	if (!this.template.Upgrade)
		return null;
	
	let upgradeTemplate = this.GetUpgradeTemplate();
	if (!upgradeTemplate)
		return null;
	
	let newEntity = ChangeEntityTemplate(this.entity, upgradeTemplate);
	if (newEntity)
		PlaySound('upgraded', newEntity);
	
	return newEntity;
};

City.prototype.GetRangeOverlays = function()
{
	if (!this.template.RangeOverlay)
		return [];
	
	let radius = ApplyValueModificationsToEntity("City/Radius", this.template.Radius, this.entity);
	let rangeOverlay = {
		"radius": radius,
		"texture": this.template.RangeOverlay.LineTexture,
		"textureMask": this.template.RangeOverlay.LineTextureMask,
		"thickness": +this.template.RangeOverlay.LineThickness,
	};
	return [rangeOverlay];
};

City.prototype.CancelGrowthTimer = function()
{
	if (this.growthTimer)
	{
		let cmpTimer = Engine.QueryInterface(SYSTEM_ENTITY, IID_Timer);
		cmpTimer.CancelTimer(this.growthTimer);
		this.timer = undefined;
	}
};

City.prototype.OnDestroy = function(msg)
{
	this.CancelGrowthTimer();
};

City.prototype.Serialize = function()
{
	return {
		"population": this.population
	};
};

City.prototype.Deserialize = function(data)
{
	this.Init();
	this.population = data.population;
};

Engine.RegisterComponentType(IID_City, "City", City);
