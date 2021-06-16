function City() {}

City.prototype.Schema =
	`<a:help>Identifies this entity as a city centre.</a:help>
	<optional>
		<element name='Downgrade' a:help='Entity to downgrade to upon reaching min population.'>
			<text />
		</element>
	</optional>
	<optional>
		<element name='Initial' a:help='Whether or not this is the initial buildable city in a progression of city types.'>
			<data type='boolean' />
		</element>
	</optional>
	<element name='Population' a:help='Population of city (does not relate to player population number)'>
		<element name='Growth' a:help='Population growth rate'>
			<element name='Amount' a:help='Amount to grow population per interval'>
				<data type='nonNegativeInteger' />
			</element>
			<optional>
				<element name='AttackMultiplier' a:help='Modify growth rate when city attacked'>
					<!-- TODO: implement -->
					<ref name='decimal' />
				</element>
			</optional>
			<element name='DecayAmount' a:help='Amount to detract from population per interval'>
				<data type='nonNegativeInteger' />
			</element>
			<element name='Interval' a:help='Interval in milliseconds'>
				<data type='positiveInteger' />
			</element>
			<element name='TradeRate' a:help='Amount to modify population per arriving trader as percentage of trade gain.'>
				<ref name='nonNegativeDecimal' />
			</element>
		</element>
		<element name='Init' a:help='Initial population'>
			<data type='nonNegativeInteger' />
		</element>
		<element name='Max' a:help='Maximum population'>
			<data type='nonNegativeInteger' />
		</element>
		<element name='Min' a:help='Minimum population'>
			<data type='nonNegativeInteger' />
		</element>
	</element>
	<element name='Radius' a:help='Radius in which structures will belong to this city'>
		<ref name='nonNegativeDecimal' />
	</element>
	<optional>
		<element name='RangeOverlay'>
			<interleave>
				<element name='LineTexture'><text/></element>
				<element name='LineTextureMask'><text/></element>
				<element name='LineThickness'><ref name='nonNegativeDecimal'/></element>
			</interleave>
		</element>
	</optional>
	<optional>
		<element name='Upgrade' a:help='Entity to upgrade to upon reaching max population.'>
			<text />
		</element>
	</optional>
	<optional>
		<!-- Source: globalscripts/ModificationTemplates.js:ModificationSchema  -->
		<!-- Value modifiers for this entity, which scale with number of garrisoned units. Can affect either self or entities within city radius.  -->
		<element name='ValueModifiers' a:help='List of value modifiers for this entity, scaling by {PerPop} units population.'>
			<oneOrMore>
				<element>
					<anyName />
					<interleave>
						<element name='Paths' a:help='Space separated value paths to modify.'>
							<attribute name='datatype'>
								<value>tokens</value>
							</attribute>
							<text/>
						</element>
						<choice>
							<element name='Add'>
								<data type='decimal' />
							</element>
							<element name='Multiply'>
								<data type='decimal' />
							</element>
						</choice>
						<element name='PerPop' a:help='Modifier will scale per {PerPop} citizens living in city.'>
							<data type='positiveInteger'/>
						</element>
						<optional>
							<element name='MaxStackable' a:help='Maximum number of times to stack this value modifier; unlimited by default.'>
								<data type='positiveInteger'/>
							</element>
						</optional>
					</interleave>
				</element>
			</oneOrMore>
		</element>
	</optional>`;

City.prototype.Init = function()
{
	this.population = ApplyValueModificationsToEntity("City/Population/Init", +this.template.Population.Init, this.entity);
	this.cityMembers = new Set();
	// set timer this.growthTimer to grow population at interval
	this.ResetGrowthTimer();
};

City.prototype.ResetGrowthTimer = function()
{
	let cmpTimer = Engine.QueryInterface(SYSTEM_ENTITY, IID_Timer);
	if (this.growthTimer)
		cmpTimer.CancelTimer(this.growthTimer);
	let growthTimerInterval = this.GetPopulationGrowthInterval();
	this.growthTimer = cmpTimer.SetInterval(this.entity, IID_City, "GrowPopulation", growthTimerInterval, growthTimerInterval, null);
};

City.prototype.IsInitial = function()
{
	return this.template.hasOwnProperty('Initial') && this.template.Initial;
};

City.prototype.GetPopulation = function()
{
	return this.population;
};

City.prototype.GetMaxPopulation = function()
{
	return Math.round(ApplyValueModificationsToEntity("City/Population/Max", +this.template.Population.Max, this.entity));
};

City.prototype.GetMinPopulation = function()
{
	return Math.max(Math.round(ApplyValueModificationsToEntity("City/Population/Min", +this.template.Population.Min, this.entity)), 0);
};

City.prototype.SetPopulation = function(value, toTrack=true)
{
	const oldPopulation = this.population;
	let val = Math.round(value);
	if (typeof(val) !== 'number')
		return this.population;
	let min = this.GetMinPopulation();
	let max = this.GetMaxPopulation();
	if (value < min) {
		let replacement = this.Downgrade();
		if (replacement) {
			let cmpNewCity = Engine.QueryInterface(replacement, IID_City);
			if (cmpNewCity)
				return cmpNewCity.SetPopulation(value);
		}
		this.population = min;
	} else if (value > max) {
		let replacement = this.Upgrade();
		if (replacement) {
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
		"from": oldPopulation,
		"to": this.population
	});
	let popChange = this.population - oldPopulation;
	if (toTrack) {
		let cmpStatisticsTracker = QueryOwnerInterface(this.entity, IID_StatisticsTracker);
		if (cmpStatisticsTracker)
			cmpStatisticsTracker.IncreaseCivicPopulation(popChange);
	}
	return this.population;
};

City.prototype.SetupCityMembersQuery = function()
{
	const cmpOwner = Engine.QueryInterface(this.entity, IID_Ownership);
	const owner = cmpOwner.GetOwner();
	const radius = this.GetRadius();

	let cmpRangeManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_RangeManager);

	if (this.cityMembersQuery)
		cmpRangeManager.DestroyActiveQuery(this.cityMembersQuery);

	// Only find entities with IID_CityMember interface
	this.cityMembersQuery = cmpRangeManager.CreateActiveQuery(
		this.entity,
		0,
		radius,
		[owner],
		IID_CityMember,
		cmpRangeManager.GetEntityFlagMask("normal"),
		true
	);
	cmpRangeManager.EnableActiveQuery(this.cityMembersQuery);
};

// check for when city members added/removed
City.prototype.OnRangeUpdate = function({ tag, added, removed })
{
	if (tag !== this.cityMembersQuery)
		return;

	if (added.length > 0)
		added.forEach((ent) => this.cityMembers.add(ent));

	if (removed.length > 0)
		removed.forEach((ent) => this.cityMembers.delete(ent));
};

City.prototype.GetCityMembers = function()
{
	return [...this.cityMembers.keys()];
};

City.prototype.GetPopulationGrowthInterval = function()
{
	return ApplyValueModificationsToEntity("City/Population/Growth/Interval", +this.template.Population.Growth.Interval, this.entity);
};

City.prototype.GetPopulationGrowthAmount = function()
{
	const { growthAmount, growthAmountMultiplier } = this.GetCityMembers().map((ent) => Engine.QueryInterface(ent, IID_CityMember)).filter((cmp) => cmp).reduce((data, cmp) => cmp.ModifyGrowthRate(data), {
		"growthAmount": +this.template.Population.Growth.Amount,
		"growthAmountMultiplier": 1
	});
	return Math.round(ApplyValueModificationsToEntity("City/Population/Growth/Amount", growthAmount * growthAmountMultiplier, this.entity));
};

City.prototype.GetPopulationDecayAmount = function()
{
	return ApplyValueModificationsToEntity('City/Population/Growth/DecayAmount', +this.template.Population.Growth.DecayAmount, this.entity);
};

City.prototype.GetTradeGrowthRate = function()
{
	return ApplyValueModificationsToEntity('City/Population/Growth/TradeRate', +this.template.Population.Growth.TradeRate, this.entity);
};

City.prototype.GetEntitiesByClasses = function(classList)
{
	let cmpOwnership = Engine.QueryInterface(this.entity, IID_Ownership);
	let owner = cmpOwnership.GetOwner();
	let cmpRangeManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_RangeManager);
	return cmpRangeManager.ExecuteQuery(
		this.entity,
		0,
		this.GetRadius(),
		[owner],
		IID_Identity
	).filter(ent => MatchesClassList(Engine.QueryInterface(ent, IID_Identity).GetClassesList(), classList.join(' ')));
};

City.prototype.GetRadius = function()
{
	return ApplyValueModificationsToEntity("City/Radius", +this.template.Radius, this.entity);
}

City.prototype.GrowPopulation = function()
{
	let oldPopulation = this.population;
	return this.SetPopulation(oldPopulation + this.GetPopulationGrowthAmount() - this.GetPopulationDecayAmount());
};

City.prototype.GetUpgradeTemplate = function()
{
	if (!this.template.Upgrade)
		return null;
	let cmpPlayer = QueryOwnerInterface(this.entity);
	let cmpIdentity = Engine.QueryInterface(this.entity, IID_Identity);
	let templateName = this.template.Upgrade;
	let parsedTemplate = templateName.indexOf('{native}') != -1 ?
		parseCivTemplate(templateName, /\{native\}/g, cmpIdentity.GetCiv()) :
		parseCivTemplate(templateName, /\{civ\}/g, cmpPlayer.GetCiv());
	if (!parsedTemplate)
		parsedTemplate = parseCivTemplate(templateName, /\{civ\}/g, cmpIdentity.GetCiv());
	return parsedTemplate;
};

City.prototype.Upgrade = function()
{
	let upgradeTemplate = this.GetUpgradeTemplate();
	if (!upgradeTemplate)
		return null;
	
	return ChangeEntityTemplate(this.entity, upgradeTemplate);
};

City.prototype.GetDowngradeTemplate = function()
{
	if (!this.template.Downgrade)
		return null;
	let cmpPlayer = QueryOwnerInterface(this.entity);
	let cmpIdentity = Engine.QueryInterface(this.entity, IID_Identity);
	let templateName = this.template.Downgrade;
	let parsedTemplate = templateName.indexOf('{native}') != -1 ?
		parseCivTemplate(templateName, /\{native\}/g, cmpIdentity.GetCiv()) :
		parseCivTemplate(templateName, /\{civ\}/g, cmpPlayer.GetCiv());
	if (!parsedTemplate)
		parsedTemplate = parseCivTemplate(templateName, /\{civ\}/g, cmpIdentity.GetCiv());
	return parsedTemplate;
};

City.prototype.Downgrade = function()
{
	if (!this.template.Downgrade)
		return null;
	
	let downgradeTemplate = this.GetDowngradeTemplate();
	if (!downgradeTemplate)
		return null;
	
	return ChangeEntityTemplate(this.entity, downgradeTemplate);
};

City.prototype.OnEntityRenamed = function({ entity, newentity })
{
	const cmpOldOwnership = Engine.QueryInterface(entity, IID_Ownership);
	const cmpOldCity = Engine.QueryInterface(entity, IID_City);
	const cmpNewCity = Engine.QueryInterface(newentity, IID_City);
	if (!cmpOldCity || !cmpNewCity)
		return;
	const population = cmpOldCity.GetPopulation();
	cmpOldCity.population = 0;
	cmpNewCity.population = population;
	const statisticsTracker = QueryPlayerIDInterface(cmpOldOwnership.GetOwner(), IID_StatisticsTracker);
	if (statisticsTracker)
		statisticsTracker.IncreaseCivicPopulation(-population);
	const name = cmpOldCity.GetName();
	if (name && name.length)
		cmpNewCity.SetName(name);
};

City.prototype.GetRangeOverlays = function()
{
	if (!this.template.RangeOverlay)
		return [];
	
	let radius = this.GetRadius();
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
		this.growthTimer = undefined;
	}
};

// Get value modifiers, scaled by number of garrisoned units with approriate classes.
// @return		[Object{"PATH": [{("add"|"multiply"|"replace"): Number}]}]			Scaled value modifiers
City.prototype.GetValueModifiers = function()
{
	if (!this.template.ValueModifiers)
		return [];
	let modifierTemplates = this.template.ValueModifiers;
	let output = {};
	for (let name in modifierTemplates)
	{
		let mod = modifierTemplates[name];
		let scalar = Math.floor(this.GetPopulation() / ApplyValueModificationsToEntity("City/ValueModifiers/" + name + "/PerPop", +mod.PerPop, this.entity));
		let [type, value] = (() => {
			if (mod.Add)
				return ["add", ApplyValueModificationsToEntity("City/ValueModifiers/" + name + "/Add", +mod.Add, this.entity) * scalar];
			if (mod.Multiply)
				return ["multiply", Math.pow(ApplyValueModificationsToEntity("City/ValueModifiers/" + name + "/Multiply", +mod.Multiply, this.entity), scalar)];
		})();
		if (type === 'add' && !value)
			continue;
		if (type === 'multiply' && value === 1)
			continue;
		let effect = {};
		effect[type] = value;

		let ret = {};
		for (let path of mod.Paths._string.split(/\s+/g))
		{
			// cannot modify other City ValueModifiers; would cause an infinite loop
			if (path.match(/^City\/ValueModifiers/))
			{
				error(sprintf('City ValueModifiers cannot modify other City ValueModifiers (got %s); ignoring %s', path, name));
				ret = undefined;
				continue;
			}
			ret[path] = [effect];
		}

		if (ret)
			output[name] = [ret, scalar];
	}
	return output;
};

// returns population scalars for each value modifier
// @return		Map{"ValueModifier": Number ...}
City.prototype.GetValueModifierPopScalars = function()
{
	if (!this.template.ValueModifiers)
		return [];
	let modifierTemplates = this.template.ValueModifiers;
	let output = new Map();
	for (let name in modifierTemplates)
	{
		let mod = modifierTemplates[name];
		let scalar = Math.floor(this.GetPopulation() / ApplyValueModificationsToEntity("City/ValueModifiers/" + name + "/PerPop", +mod.PerPop, this.entity));
		output.set(name, scalar);
	}
	return output;
};

// applies value modifiers to entity
// @param force		bool		if true, update value modifiers regardless of whether population scalars have changed
// @return none
City.prototype.ApplyValueModifiers = function()
{
	// maps ModifierName => PopulationScalar
	if (!this.appliedValueModifiers)
		this.appliedValueModifiers = this.GetValueModifierPopScalars();
	let valueModifiers = this.GetValueModifiers();
	let cmpModifiersManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_ModifiersManager);
	// first, remove any modifiers that are no longer needed
	for (let key of this.appliedValueModifiers.keys())
	{
		let modName = sprintf("%d:City/ValueModifiers/%s", this.entity, key);
		if (!valueModifiers.hasOwnProperty(modName))
		{
			cmpModifiersManager.RemoveAllModifiers(modName, this.entity);
			this.appliedValueModifiers.delete(key);
		}
	}
	// next, add or modify other modifiers. if modifier already applied in some form, make sure to remove before reapplying, as scalar may be off
	for (let [key, [mod, scalar]] of Object.entries(valueModifiers))
	{
		let modName = sprintf("%d:City/ValueModifiers/%s", this.entity, key);
		if (this.appliedValueModifiers.has(key))
			cmpModifiersManager.RemoveAllModifiers(modName, this.entity);
		cmpModifiersManager.AddModifiers(modName, mod, this.entity);
		this.appliedValueModifiers.set(key, scalar);
	}
};

// Gets the city's name
// @return		String		name of the city ("" if not named"
City.prototype.GetName = function()
{
	return this.name ? this.name : "";
};

// Sets the city's name
// @param	name		String		new city name
// @return none
City.prototype.SetName = function(name)
{
	this.name = name;
};

City.prototype.OnCityPopulationChanged = function()
{
	// check if any ValueModifier scalars exist and have changed; if so, reapply value modifiers
	if (!this.template.ValueModifiers)
		return;
	let valueModifierPopScalars = this.GetValueModifierPopScalars();
	for (let [name, scalar] of valueModifierPopScalars.entries())
	{
		if (!this.appliedValueModifiers || this.appliedValueModifiers.get(name) !== scalar)
		{
			this.ApplyValueModifiers();
			return;
		}
	}
};

City.prototype.OnValueModification = function(msg)
{
	if (msg.component === 'City' && msg.valueNames.some((valueName) => valueName.indexOf("City/ValueModifiers") !== -1))
	{
		this.ApplyValueModifiers();
	}
};

City.prototype.OnOwnershipChanged = function(msg)
{
	this.SetupCityMembersQuery();
	let prevOwnerStatisticsTracker = QueryPlayerIDInterface(msg.from, IID_StatisticsTracker);
	if (prevOwnerStatisticsTracker)
		prevOwnerStatisticsTracker.IncreaseCivicPopulation(-this.population);
	let newOwnerStatisticsTracker = QueryPlayerIDInterface(msg.to, IID_StatisticsTracker);
	if (newOwnerStatisticsTracker)
		newOwnerStatisticsTracker.IncreaseCivicPopulation(+this.population);
	if (!Engine.QueryInterface(this.entity, IID_SkirmishReplacer) && (!this.GetName() || !this.GetName().length))
	{
		const cmpCityNameManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_CityNameManager);
		if (cmpCityNameManager)
			this.SetName(cmpCityNameManager.ChooseCityName(this.entity));
	}
};

City.prototype.OnDestroy = function(msg)
{
	let cmpRangeManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_RangeManager);
	if (this.cityMembersQuery)
		cmpRangeManager.DestroyActiveQuery(this.cityMembersQuery);
	let cmpModifiersManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_ModifiersManager);
	if (this.appliedValueModifiers)
	{
		for (let key of this.appliedValueModifiers.keys())
		{
			let modName = sprintf("%d/GarrisonHolder/ValueModifiers/%s", this.entity, key);
			cmpModifiersManager.RemoveAllModifiers(modName, this.entity);
		}
	}
	let cityMemberModName = sprintf('%d:CityMemberGrowthModifiers', this.entity);
	if (cmpModifiersManager.HasAnyModifier(cityMemberModName, this.entity))
		cmpModifiersManager.RemoveAllModifiers(cityMemberModName, this.entity);
	this.CancelGrowthTimer();
	let cmpStatisticsTracker = QueryOwnerInterface(this.entity, IID_StatisticsTracker);
	if (cmpStatisticsTracker)
		cmpStatisticsTracker.IncreaseCivicPopulation(-this.population);
};

City.prototype.OnInitGame = function()
{
	this.SetupCityMembersQuery();
};

City.prototype.OnTradePerformed = function({ market, goods })
{
	const cmpOwnerSelf = Engine.QueryInterface(this.entity, IID_Ownership);
	const cmpOwnerMarket = Engine.QueryInterface(market, IID_Ownership);
	if (cmpOwnerSelf.GetOwner() !== cmpOwnerMarket.GetOwner())
		return;
	if (PositionHelper.DistanceBetweenEntities(this.entity, market) > this.GetRadius())
		return;
	const oldPopulation = this.population;
	const tradeGrowthAmount = Math.round(goods.amount.traderGain * this.GetTradeGrowthRate());
	this.SetPopulation(oldPopulation + tradeGrowthAmount);
};

Engine.RegisterComponentType(IID_City, "City", City);
