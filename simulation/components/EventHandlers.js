function EventHandlers() {}

EventHandlers.prototype.Schema =
	"<a:help>Miscellaneous event handlers. Can call methods of any component.</a:help>" +
	"<oneOrMore>" +
		"<element a:help='One entity handler'>" +
			"<anyName />" +
			"<choice>" +
				"<element name='EntityComponent' a:help='Component of this entity.'>" +
					"<text />" +
				"</element>" +
				"<element name='OwnerComponent' a:help='Component of this entity`s owner.'>" +
					"<text />" +
				"</element>" +
				"<element name='SystemComponent' a:help='System (global) component.'>" +
					"<text />" +
				"</element>" +
			"</choice>" +
			"<element name='Method' a:help='Function of component to call'>" +
				"<text />" +
			"</element>" +
			"<optional>" +
				"<element name='ExtraArgs' a:help='Extra args to add to event handler message.'>" +
					"<oneOrMore>" +
						"<element a:help='One additional arg.'>" +
							"<anyName />" +
							"<text />" +
						"</element>" +
					"</oneOrMore>" +
				"</element>" +
			"</optional>" +
		"</element>" +
	"</oneOrMore>";

EventHandlers.prototype.Init = function()
{
	for (let [handlerName, handler] of Object.entries(this.template))
	{
		const getIID = (componentName) => global["IID_" + componentName];
		const [cmp, cmpType, cmpName] = (() => {
			if (handler.EntityComponent)
				return [Engine.QueryInterface(this.entity, getIID(handler.EntityComponent)), "entity", handler.EntityComponent];
			if (handler.OwnerComponent)
				return [QueryOwnerInterface(this.entity, getIID(handler.OwnerComponent)), "owner", handler.OwnerComponent];
			if (handler.SystemComponent)
				return [Engine.QueryInterface(SYSTEM_ENTITY, getIID(handler.SystemComponent)), "system", handler.SystemComponent];
			throw new Error("Could not find valid component type.");
		})();
		if (!cmp)
		{
			errorf("Could not find valid %s component named \"%s\"", cmpType, cmpName);
			return;
		}
		const extraArgs = handler.ExtraArgs || {};
		const eventHandler = (msg) => {
			const message = msg || {};
			cmp[handler.Method]({...message, ...extraArgs});
		};
		const eventHandlerName = "On" + handlerName;
		this[eventHandlerName] = eventHandler;
	}
};

// TODO: register blank functions for all possible message types here, or else Engine won't know to look for event handlers
// hopefully this doesn't incur too heavy a performance hit; this component should be used sparingly
// TODO: find a way to register listeners only for needed event handlers
EventHandlers.prototype.OnAIMetadata = function() {};
EventHandlers.prototype.OnAttackDetected = function() {};
EventHandlers.prototype.OnAttacked = function() {};
EventHandlers.prototype.OnBattleStateChanged = function() {};
EventHandlers.prototype.OnCapturePointsChanged = function() {};
EventHandlers.prototype.OnCaptureRegenStateChanged = function() {};
EventHandlers.prototype.OnCeasefireEnded = function() {};
EventHandlers.prototype.OnCeasefireStarted = function() {};
EventHandlers.prototype.OnCityPopulationChanged = function() {};
EventHandlers.prototype.OnCivChanged = function() {};
EventHandlers.prototype.OnConstructionFinished = function() {};
EventHandlers.prototype.OnCreate = function() {};
EventHandlers.prototype.OnDeserialized = function() {};
EventHandlers.prototype.OnDestroy = function() {};
EventHandlers.prototype.OnDiplomacyChanged = function() {};
EventHandlers.prototype.OnDisabledTechnologiesChanged = function() {};
EventHandlers.prototype.OnDisabledTemplatesChanged = function() {};
EventHandlers.prototype.OnDropsiteSharingChanged = function() {};
EventHandlers.prototype.OnEntitiesCreated = function() {};
EventHandlers.prototype.OnEntityRenamed = function() {};
EventHandlers.prototype.OnExperienceChanged = function() {};
EventHandlers.prototype.OnFoundationBuildersChanged = function() {};
EventHandlers.prototype.OnFoundationProgressChanged = function() {};
EventHandlers.prototype.OnGarrisonedStateChanged = function() {};
EventHandlers.prototype.OnGarrisonedUnitsChanged = function() {};
EventHandlers.prototype.OnGlobalAttacked = function() {};
EventHandlers.prototype.OnGlobalCinemaPathEnded = function() {};
EventHandlers.prototype.OnGlobalCinemaQueueEnded = function() {};
EventHandlers.prototype.OnGlobalConstructionFinished = function() {};
EventHandlers.prototype.OnGlobalDeserialized = function() {};
EventHandlers.prototype.OnGlobalDiplomacyChanged = function() {};
EventHandlers.prototype.OnGlobalEntityRenamed = function() {};
EventHandlers.prototype.OnGlobalInitGame = function() {};
EventHandlers.prototype.OnGlobalOwnershipChanged = function() {};
EventHandlers.prototype.OnGlobalPlayerDefeated = function() {};
EventHandlers.prototype.OnGlobalPlayerEntityChanged = function() {};
EventHandlers.prototype.OnGlobalPlayerWon = function() {};
EventHandlers.prototype.OnGlobalResearchFinished = function() {};
EventHandlers.prototype.OnGlobalSkirmishReplacerReplaced = function() {};
EventHandlers.prototype.OnGlobalTrainingFinished = function() {};
EventHandlers.prototype.OnGlobalTributeExchanged = function() {};
EventHandlers.prototype.OnGlobalUnitAbleToMoveChanged = function() {};
EventHandlers.prototype.OnGlobalValueModification = function() {};
EventHandlers.prototype.OnGuardedAttacked = function() {};
EventHandlers.prototype.OnHealthChanged = function() {};
EventHandlers.prototype.OnInitGame = function() {};
EventHandlers.prototype.OnInvulnerabilityChanged = function() {};
EventHandlers.prototype.OnMotionUpdate = function() {};
EventHandlers.prototype.OnMultiplierChanged = function() {};
EventHandlers.prototype.OnOwnershipChanged = function() {};
EventHandlers.prototype.OnPackFinished = function() {};
EventHandlers.prototype.OnPackProgressUpdate = function() {};
EventHandlers.prototype.OnPickupCanceled = function() {};
EventHandlers.prototype.OnPickupRequested = function() {};
EventHandlers.prototype.OnPlayerColorChanged = function() {};
EventHandlers.prototype.OnPlayerDefeated = function() {};
EventHandlers.prototype.OnPlayerEntityChanged = function() {};
EventHandlers.prototype.OnPlayerWon = function() {};
EventHandlers.prototype.OnPositionChanged = function() {};
EventHandlers.prototype.OnProductionQueueChanged = function() {};
EventHandlers.prototype.OnRangeUpdate = function() {};
EventHandlers.prototype.OnResearchFinished = function() {};
EventHandlers.prototype.OnResourceCarryingChanged = function() {};
EventHandlers.prototype.OnResourceSupplyChanged = function() {};
EventHandlers.prototype.OnResourceSupplyNumGatherersChanged = function() {};
EventHandlers.prototype.OnSkirmishReplace = function() {};
EventHandlers.prototype.OnSkirmishReplacerReplaced = function() {};
EventHandlers.prototype.OnTemplateModification = function() {};
EventHandlers.prototype.OnTerritoriesChanged = function() {};
EventHandlers.prototype.OnTerritoryDecayChanged = function() {};
EventHandlers.prototype.OnTerritoryPositionChanged = function() {};
EventHandlers.prototype.OnTradePerformed = function() {};
EventHandlers.prototype.OnTrainingFinished = function() {};
EventHandlers.prototype.OnTrainingStarted = function() {};
EventHandlers.prototype.OnTributeExchanged = function() {};
EventHandlers.prototype.OnTurretedStateChanged = function() {};
EventHandlers.prototype.OnTurretsChanged = function() {};
EventHandlers.prototype.OnUnitAbleToMoveChanged = function() {};
EventHandlers.prototype.OnUnitAIOrderDataChanged = function() {};
EventHandlers.prototype.OnUnitAIStateChanged = function() {};
EventHandlers.prototype.OnUnitIdleChanged = function() {};
EventHandlers.prototype.OnUnitStanceChanged = function() {};
EventHandlers.prototype.OnUpdate = function() {};
EventHandlers.prototype.OnUpgradeProgressUpdate = function() {};
EventHandlers.prototype.OnUpkeepPaid = function() {};
EventHandlers.prototype.OnValueModification = function() {};
EventHandlers.prototype.OnVictoryConditionsChanged = function() {};
EventHandlers.prototype.OnVisibilityChanged = function() {};
EventHandlers.prototype.OnVisionRangeChanged = function() {};

// Sample function, for testing
EventHandlers.prototype.ListArgs = function(msg)
{
	warnf('Args: [%s]', Object.entries(msg).map(([k, v]) => sprintf('%s: %s', k, v)).join(', '));
};

// no dynamic state to save
EventHandlers.prototype.Serialize = null;

EventHandlers.prototype.Deserialize = function()
{
	this.Init();
};

Engine.RegisterComponentType(IID_EventHandlers, "EventHandlers", EventHandlers);
