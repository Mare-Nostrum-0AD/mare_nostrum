function GarrisonHolder() {}

GarrisonHolder.prototype.Schema =
	"<element name='Max' a:help='Maximum number of entities which can be garrisoned in this holder'>" +
		"<data type='positiveInteger'/>" +
	"</element>" +
	"<element name='List' a:help='Classes of entities which are allowed to garrison in this holder (from Identity)'>" +
		"<attribute name='datatype'>" +
			"<value>tokens</value>" +
		"</attribute>" +
		"<text/>" +
	"</element>" +
	"<element name='EjectClassesOnDestroy' a:help='Classes of entities to be ejected on destroy. Others are killed'>" +
		"<attribute name='datatype'>" +
			"<value>tokens</value>" +
		"</attribute>" +
		"<text/>" +
	"</element>" +
	"<element name='BuffHeal' a:help='Number of hitpoints that will be restored to this holder&apos;s garrisoned units each second'>" +
		"<ref name='nonNegativeDecimal'/>" +
	"</element>" +
	"<element name='LoadingRange' a:help='The maximum distance from this holder at which entities are allowed to garrison. Should be about 2.0 for land entities and preferably greater for ships'>" +
		"<ref name='nonNegativeDecimal'/>" +
	"</element>" +
	"<optional>" +
		"<element name='EjectHealth' a:help='Percentage of maximum health below which this holder no longer allows garrisoning'>" +
			"<ref name='nonNegativeDecimal'/>" +
		"</element>" +
	"</optional>" +
	"<optional>" +
		"<element name='Pickup' a:help='This garrisonHolder will move to pick up units to be garrisoned'>" +
			"<data type='boolean'/>" +
		"</element>" +
	"</optional>" +
	"<optional>" +
		"<!-- Source: globalscripts/ModificationTemplates.js:ModificationSchema  -->" +
		"<!-- Value modifiers for this entity, which scale with number of garrisoned units.  -->" +
		"<element name='ValueModifiers' a:help='List of value modifiers for this entity, scaling with number of garrisoned entities.'>" +
			"<oneOrMore>" +
				"<element>" +
					"<anyName />" +
					"<interleave>" +
						"<element name='Paths' a:help='Space separated value paths to modify.'>" +
							"<attribute name='datatype'>" +
								"<value>tokens</value>" +
							"</attribute>" +
							"<text/>" +
						"</element>" +
						"<element name='Classes' a:help='Classes of garrisoned units that affect this aura.'>" +
							"<attribute name='datatype'>" +
								"<value>tokens</value>" +
							"</attribute>" +
							"<text/>" +
						"</element>" +
						"<choice>" +
							"<element name='Add'>" +
								"<data type='decimal' />" +
							"</element>" +
							"<element name='Multiply'>" +
								"<data type='decimal' />" +
							"</element>" +
							"<element name='Replace'>" +
								"<text/>" +
							"</element>" +
						"</choice>" +
						"<optional>" +
							"<element name='MaxStackable' a:help='Maximum number of times to stack this aura; unlimited by default.'>" +
								"<data type='positiveInteger'/>" +
							"</element>" +
						"</optional>" +
					"</interleave>" +
				"</element>" +
			"</oneOrMore>" +
		"</element>" +
	"</optional>";

/**
 * Time between heals.
 */
GarrisonHolder.prototype.HEAL_TIMEOUT = 1000;

/**
 * Initialize GarrisonHolder Component
 * Garrisoning when loading a map is set in the script of the map, by setting initGarrison
 * which should contain the array of garrisoned entities.
 */
GarrisonHolder.prototype.Init = function()
{
	this.entities = [];
	this.allowedClasses = ApplyValueModificationsToEntity("GarrisonHolder/List/_string", this.template.List._string, this.entity);
	this.appliedValueModifiers = new Set();
};

/**
 * @param {number} entity - The entity to verify.
 * @return {boolean} - Whether the given entity is garrisoned in this GarrisonHolder.
 */
GarrisonHolder.prototype.IsGarrisoned = function(entity)
{
	return this.entities.indexOf(entity) != -1;
};

/**
 * @return {Object} max and min range at which entities can garrison the holder.
 */
GarrisonHolder.prototype.LoadingRange = function()
{
	return { "max": +this.template.LoadingRange, "min": 0 };
};

GarrisonHolder.prototype.CanPickup = function(ent)
{
	if (!this.template.Pickup || this.IsFull())
		return false;
	let cmpOwner = Engine.QueryInterface(this.entity, IID_Ownership);
	return !!cmpOwner && IsOwnedByPlayer(cmpOwner.GetOwner(), ent);
};

GarrisonHolder.prototype.GetEntities = function()
{
	return this.entities;
};

/**
 * @return {Array} unit classes which can be garrisoned inside this
 * particular entity. Obtained from the entity's template.
 */
GarrisonHolder.prototype.GetAllowedClasses = function()
{
	return this.allowedClasses;
};

GarrisonHolder.prototype.GetCapacity = function()
{
	return ApplyValueModificationsToEntity("GarrisonHolder/Max", +this.template.Max, this.entity);
};

GarrisonHolder.prototype.IsFull = function()
{
	return this.OccupiedSlots() >= this.GetCapacity();
};

GarrisonHolder.prototype.GetHealRate = function()
{
	return ApplyValueModificationsToEntity("GarrisonHolder/BuffHeal", +this.template.BuffHeal, this.entity);
};

/**
 * Set this entity to allow or disallow garrisoning in the entity.
 * Every component calling this function should do it with its own ID, and as long as one
 * component doesn't allow this entity to garrison, it can't be garrisoned
 * When this entity already contains garrisoned soldiers,
 * these will not be able to ungarrison until the flag is set to true again.
 *
 * This more useful for modern-day features. For example you can't garrison or ungarrison
 * a driving vehicle or plane.
 * @param {boolean} allow - Whether the entity should be garrisonable.
 */
GarrisonHolder.prototype.AllowGarrisoning = function(allow, callerID)
{
	if (!this.allowGarrisoning)
		this.allowGarrisoning = new Map();
	this.allowGarrisoning.set(callerID, allow);
};

/**
 * @return {boolean} - Whether (un)garrisoning is allowed.
 */
GarrisonHolder.prototype.IsGarrisoningAllowed = function()
{
	return !this.allowGarrisoning ||
		Array.from(this.allowGarrisoning.values()).every(allow => allow);
};

GarrisonHolder.prototype.GetGarrisonedEntitiesCount = function()
{
	let count = this.entities.length;
	for (let ent of this.entities)
	{
		let cmpGarrisonHolder = Engine.QueryInterface(ent, IID_GarrisonHolder);
		if (cmpGarrisonHolder)
			count += cmpGarrisonHolder.GetGarrisonedEntitiesCount();
	}
	return count;
};

GarrisonHolder.prototype.OccupiedSlots = function()
{
	let count = 0;
	for (let ent of this.entities)
	{
		let cmpGarrisonable = Engine.QueryInterface(ent, IID_Garrisonable);
		if (cmpGarrisonable)
			count += cmpGarrisonable.TotalSize();
	}
	return count;
};

GarrisonHolder.prototype.IsAllowedToGarrison = function(entity)
{
	if (!this.IsGarrisoningAllowed())
		return false;

	let cmpGarrisonable = Engine.QueryInterface(entity, IID_Garrisonable);
	if (!cmpGarrisonable || this.OccupiedSlots() + cmpGarrisonable.TotalSize() > this.GetCapacity())
		return false;

	return this.IsAllowedToBeGarrisoned(entity);
};

GarrisonHolder.prototype.IsAllowedToBeGarrisoned = function(entity)
{
	if (!IsOwnedByMutualAllyOfEntity(entity, this.entity))
		return false;

	let cmpIdentity = Engine.QueryInterface(entity, IID_Identity);
	return cmpIdentity && MatchesClassList(cmpIdentity.GetClassesList(), this.allowedClasses);
};

/**
 * @param {number} entity - The entityID to garrison.
 * @return {boolean} - Whether the entity was garrisoned.
 */
GarrisonHolder.prototype.Garrison = function(entity)
{
	if (!this.IsAllowedToGarrison(entity))
		return false;

	if (!this.HasEnoughHealth())
		return false;

	if (!this.timer && this.GetHealRate())
		this.StartTimer();

	this.entities.push(entity);
	this.UpdateGarrisonFlag();

	Engine.PostMessage(this.entity, MT_GarrisonedUnitsChanged, {
		"added": [entity],
		"removed": []
	});

	return true;
};

/**
 * @param {number} entity - The entity ID of the entity to eject.
 * @param {boolean} forced - Whether eject is forced (e.g. if building is destroyed).
 * @return {boolean} Whether the entity was ejected.
 */
GarrisonHolder.prototype.Eject = function(entity, forced)
{
	if (!this.IsGarrisoningAllowed() && !forced)
		return false;

	let entityIndex = this.entities.indexOf(entity);
	// Error: invalid entity ID, usually it's already been ejected, assume success.
	if (entityIndex == -1)
		return true;

	this.entities.splice(entityIndex, 1);
	this.UpdateGarrisonFlag();
	Engine.PostMessage(this.entity, MT_GarrisonedUnitsChanged, {
		"added": [],
		"removed": [entity]
	});

	return true;
};

/**
 * Tell unit to unload from this entity.
 * @param {number} entity - The entity to unload.
 * @return {boolean} Whether the command was successful.
 */
GarrisonHolder.prototype.Unload = function(entity)
{
	let cmpGarrisonable = Engine.QueryInterface(entity, IID_Garrisonable);
	return cmpGarrisonable && cmpGarrisonable.UnGarrison();
};

/**
 * Tell units to unload from this entity.
 * @param {number[]} entities - The entities to unload.
 * @return {boolean} - Whether all unloads were successful.
 */
GarrisonHolder.prototype.UnloadEntities = function(entities)
{
	let success = true;
	for (let entity of entities)
		if (!this.Unload(entity))
			success = false;
	return success;
};

/**
 * Unload one or all units that match a template and owner from us.
 * @param {string} template - Type of units that should be ejected.
 * @param {number} owner - Id of the player whose units should be ejected.
 * @param {boolean} all - Whether all units should be ejected.
 * @return {boolean} Whether the unloading was successful.
 */
GarrisonHolder.prototype.UnloadTemplate = function(template, owner, all)
{
	let entities = [];
	let cmpTemplateManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_TemplateManager);
	for (let entity of this.entities)
	{
		let cmpIdentity = Engine.QueryInterface(entity, IID_Identity);

		// Units with multiple ranks are grouped together.
		let name = cmpIdentity.GetSelectionGroupName() || cmpTemplateManager.GetCurrentTemplateName(entity);
		if (name != template || owner != Engine.QueryInterface(entity, IID_Ownership).GetOwner())
			continue;

		entities.push(entity);

		// If 'all' is false, only ungarrison the first matched unit.
		if (!all)
			break;
	}

	return this.UnloadEntities(entities);
};

/**
 * Unload all units, that belong to certain player
 * and order all own units to move to the rally point.
 * @param {number} owner - Id of the player whose units should be ejected.
 * @return {boolean} Whether the unloading was successful.
 */
GarrisonHolder.prototype.UnloadAllByOwner = function(owner)
{
	let entities = this.entities.filter(ent => {
		let cmpOwnership = Engine.QueryInterface(ent, IID_Ownership);
		return cmpOwnership && cmpOwnership.GetOwner() == owner;
	});
	return this.UnloadEntities(entities);
};

/**
 * Unload all units from the entity and order them to move to the rally point.
 * @return {boolean} Whether the unloading was successful.
 */
GarrisonHolder.prototype.UnloadAll = function()
{
	return this.UnloadEntities(this.entities.slice());
};

// Get value modifiers, scaled by number of garrisoned units with approriate classes.
// @return		[Object{"PATH": [{("add"|"multiply"|"replace"): Number}]}]			Scaled value modifiers
GarrisonHolder.prototype.GetValueModifiers = function()
{
	if (!this.template.ValueModifiers)
		return [];
	let modifierTemplates = this.template.ValueModifiers;
	let ents = this.GetEntities();
	let output = {};
	for (let name in modifierTemplates)
	{
		let mod = modifierTemplates[name];
		let classList = mod.Classes._string.split(/\s+/g);
		let relevantEnts = ents.filter((ent) => {
			let cmpIdentity = Engine.QueryInterface(ent, IID_Identity);
			return cmpIdentity && MatchesClassList(cmpIdentity.GetClassesList(), classList);
		});
		if (!relevantEnts || !relevantEnts.length)
			continue;
		let scalar = mod.MaxStackable ? Math.min(relevantEnts.length, +mod.MaxStackable) : relevantEnts.length;
		let [type, value] = (() => {
			if (mod.Replace)
				return ["replace", ApplyValueModificationsToEntity("GarrisonHolder/ValueModifiers/" + name + "/Replace", mod.Replace, this.entity)];
			if (mod.Add)
				return ["add", ApplyValueModificationsToEntity("GarrisonHolder/ValueModifiers/" + name + "/Add", +mod.Add, this.entity) * scalar];
			if (mod.Multiply)
				return ["multiply", Math.pow(ApplyValueModificationsToEntity("GarrisonHolder/ValueModifiers/" + name + "/Multiply", +mod.Multiply, this.entity), scalar)];
		})();
		let effect = {};
		effect[type] = value;

		let ret = {};
		for (let path of mod.Paths._string.split(/\s+/g))
		{
			ret[path] = [effect];
		}

		output[name] = ret;
	}
	return output;
};

// applies value modifiers to entity
// TODO: rewrite to only check when entities of relevant classes are added or removed
// @return none
GarrisonHolder.prototype.ApplyValueModifiers = function()
{
	let valueModifiers = this.GetValueModifiers();
	let cmpModifiersManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_ModifiersManager);
	// first, remove any modifiers that are no longer needed
	for (let key of this.appliedValueModifiers.keys())
	{
		let modName = sprintf("%d/GarrisonHolder/ValueModifiers/%s", this.entity, key);
		if (!valueModifiers.hasOwnProperty(modName))
		{
			cmpModifiersManager.RemoveAllModifiers(modName, this.entity);
			this.appliedValueModifiers.delete(key);
		}
	}
	// next, add or modify other modifiers. if modifier already applied in some form, make sure to remove before reapplying, as scalar may be off
	for (let [key, mod] of Object.entries(valueModifiers))
	{
		let modName = sprintf("%d/GarrisonHolder/ValueModifiers/%s", this.entity, key);
		if (this.appliedValueModifiers.has(key))
			cmpModifiersManager.RemoveAllModifiers(modName, this.entity);
		else
			this.appliedValueModifiers.add(key);
		cmpModifiersManager.AddModifiers(modName, mod, this.entity);
	}
};

/**
 * Used to check if the garrisoning entity's health has fallen below
 * a certain limit after which all garrisoned units are unloaded.
 */
GarrisonHolder.prototype.OnHealthChanged = function(msg)
{
	if (!this.HasEnoughHealth() && this.entities.length)
		this.EjectOrKill(this.entities.slice());
};

GarrisonHolder.prototype.HasEnoughHealth = function()
{
	// 0 is a valid value so explicitly check for undefined.
	if (this.template.EjectHealth === undefined)
		return true;

	let cmpHealth = Engine.QueryInterface(this.entity, IID_Health);
	return !cmpHealth || cmpHealth.GetHitpoints() > Math.floor(+this.template.EjectHealth * cmpHealth.GetMaxHitpoints());
};

GarrisonHolder.prototype.StartTimer = function()
{
	if (this.timer)
		return;
	let cmpTimer = Engine.QueryInterface(SYSTEM_ENTITY, IID_Timer);
	this.timer = cmpTimer.SetInterval(this.entity, IID_GarrisonHolder, "HealTimeout", this.HEAL_TIMEOUT, this.HEAL_TIMEOUT, null);
};

GarrisonHolder.prototype.StopTimer = function()
{
	if (!this.timer)
		return;
	let cmpTimer = Engine.QueryInterface(SYSTEM_ENTITY, IID_Timer);
	cmpTimer.CancelTimer(this.timer);
	delete this.timer;
};

/**
 * @params data and lateness are unused.
 */
GarrisonHolder.prototype.HealTimeout = function(data, lateness)
{
	let healRate = this.GetHealRate();
	if (!this.entities.length || !healRate)
	{
		this.StopTimer();
		return;
	}

	for (let entity of this.entities)
	{
		let cmpHealth = Engine.QueryInterface(entity, IID_Health);
		if (cmpHealth && !cmpHealth.IsUnhealable())
			cmpHealth.Increase(healRate);
	}
};

/**
 * Updates the garrison flag depending whether something is garrisoned in the entity.
 */
GarrisonHolder.prototype.UpdateGarrisonFlag = function()
{
	let cmpVisual = Engine.QueryInterface(this.entity, IID_Visual);
	if (!cmpVisual)
		return;

	cmpVisual.SetVariant("garrison", this.entities.length ? "garrisoned" : "ungarrisoned");
};

/**
 * Cancel timer when destroyed.
 */
GarrisonHolder.prototype.OnDestroy = function()
{
	if (this.timer)
	{
		let cmpTimer = Engine.QueryInterface(SYSTEM_ENTITY, IID_Timer);
		cmpTimer.CancelTimer(this.timer);
	}
	let cmpModifiersManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_ModifiersManager);
	for (let key of this.appliedValueModifiers.keys())
	{
		let modName = sprintf("%d/GarrisonHolder/ValueModifiers/%s", this.entity, key);
		cmpModifiersManager.RemoveAllModifiers(modName, this.entity);
	}
};

/**
 * If a garrisoned entity is captured, or about to be killed (so its owner changes to '-1'),
 * remove it from the building so we only ever contain valid entities.
 */
GarrisonHolder.prototype.OnGlobalOwnershipChanged = function(msg)
{
	// The ownership change may be on the garrisonholder
	if (this.entity == msg.entity)
	{
		let entities = this.entities.filter(ent => msg.to == INVALID_PLAYER || !IsOwnedByMutualAllyOfEntity(this.entity, ent));

		if (entities.length)
			this.EjectOrKill(entities);

		return;
	}

	// or on some of its garrisoned units
	let entityIndex = this.entities.indexOf(msg.entity);
	if (entityIndex != -1 && (msg.to == INVALID_PLAYER || !IsOwnedByMutualAllyOfEntity(this.entity, msg.entity)))
		this.EjectOrKill([msg.entity]);
};

/**
 * Update list of garrisoned entities when a game inits.
 */
GarrisonHolder.prototype.OnGlobalSkirmishReplacerReplaced = function(msg)
{
	if (!this.initGarrison)
		return;

	if (msg.entity == this.entity)
	{
		let cmpGarrisonHolder = Engine.QueryInterface(msg.newentity, IID_GarrisonHolder);
		if (cmpGarrisonHolder)
			cmpGarrisonHolder.initGarrison = this.initGarrison;
	}
	else
	{
		let entityIndex = this.initGarrison.indexOf(msg.entity);
		if (entityIndex != -1)
			this.initGarrison[entityIndex] = msg.newentity;
	}
};

/**
 * Eject all foreign garrisoned entities which are no more allied.
 */
GarrisonHolder.prototype.OnDiplomacyChanged = function()
{
	this.EjectOrKill(this.entities.filter(ent => !IsOwnedByMutualAllyOfEntity(this.entity, ent)));
};

/**
 * Eject or kill a garrisoned unit which can no more be garrisoned
 * (garrisonholder's health too small or ownership changed).
 */
GarrisonHolder.prototype.EjectOrKill = function(entities)
{
	let cmpPosition = Engine.QueryInterface(this.entity, IID_Position);
	// Eject the units which can be ejected (if not in world, it generally means this holder
	// is inside a holder which kills its entities, so do not eject)
	if (cmpPosition && cmpPosition.IsInWorld())
	{
		let ejectables = entities.filter(ent => this.IsEjectable(ent));
		if (ejectables.length)
			this.UnloadEntities(ejectables);
	}

	// And destroy all remaining entities
	let killedEntities = [];
	for (let entity of entities)
	{
		let entityIndex = this.entities.indexOf(entity);
		if (entityIndex == -1)
			continue;
		let cmpHealth = Engine.QueryInterface(entity, IID_Health);
		if (cmpHealth)
			cmpHealth.Kill();
		else
			Engine.DestroyEntity(entity);
		this.entities.splice(entityIndex, 1);
		killedEntities.push(entity);
	}

	if (killedEntities.length)
	{
		Engine.PostMessage(this.entity, MT_GarrisonedUnitsChanged, {
			"added": [],
			"removed": killedEntities
		});
		this.UpdateGarrisonFlag();
	}
};

/**
 * Whether an entity is ejectable.
 * @param {number} entity - The entity-ID to be tested.
 * @return {boolean} - Whether the entity is ejectable.
 */
GarrisonHolder.prototype.IsEjectable = function(entity)
{
	if (!this.entities.find(ent => ent == entity))
		return false;

	let ejectableClasses = this.template.EjectClassesOnDestroy._string;
	let entityClasses = Engine.QueryInterface(entity, IID_Identity).GetClassesList();

	return MatchesClassList(entityClasses, ejectableClasses);
};

/**
 * Sets the intitGarrison to the specified entities. Used by the mapreader.
 *
 * @param {number[]} entities - The entity IDs to garrison on init.
 */
GarrisonHolder.prototype.SetInitGarrison = function(entities)
{
	this.initGarrison = clone(entities);
};

/**
 * Initialise the garrisoned units.
 */
GarrisonHolder.prototype.OnGlobalInitGame = function(msg)
{
	if (!this.initGarrison)
		return;

	for (let ent of this.initGarrison)
	{
		let cmpGarrisonable = Engine.QueryInterface(ent, IID_Garrisonable);
		if (cmpGarrisonable)
			cmpGarrisonable.Garrison(this.entity);
	}
	delete this.initGarrison;
};

GarrisonHolder.prototype.OnValueModification = function(msg)
{
	if (msg.component != "GarrisonHolder")
		return;

	if (msg.valueNames.indexOf("GarrisonHolder/List/_string") !== -1)
	{
		this.allowedClasses = ApplyValueModificationsToEntity("GarrisonHolder/List/_string", this.template.List._string, this.entity);
		this.EjectOrKill(this.entities.filter(entity => !this.IsAllowedToBeGarrisoned(entity)));
	}

	if (msg.valueNames.some((valueName) => valueName.indexOf("GarrisonHolder/ValueModifiers") !== -1))
	{
		this.ApplyValueModifiers();
	}

	if (msg.valueNames.indexOf("GarrisonHolder/BuffHeal") === -1)
		return;

	if (this.timer && !this.GetHealRate())
		this.StopTimer();
	else if (!this.timer && this.GetHealRate())
		this.StartTimer();
};

GarrisonHolder.prototype.OnGarrisonedUnitsChanged = function()
{
	this.ApplyValueModifiers();
}

Engine.RegisterComponentType(IID_GarrisonHolder, "GarrisonHolder", GarrisonHolder);
