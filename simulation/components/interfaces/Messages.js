/**
 * Message of the form { "entity": number, "newentity": number }
 * sent when one entity is changed to another:
 * - from Foundation component when a building construction is done
 * - from Formation component
 * - from Health component when an entity died and should remain as a resource
 * - from Promotion component when a unit is promoted
 * - from Mirage component when a fogged entity is re-discovered
 * - from SkirmishReplacer component when a skirmish entity has been replaced
 * - from Transform helper when an entity has been upgraded
 */
Engine.RegisterMessageType("EntityRenamed");

// Message of the form { "entities": number[], "owner": number }
// broadcasted when a new entity is created:
// - from Foundation component when building construction is done
// - from ProductionQueue when training is complete
// - from Upgrade when an entity is upgraded
Engine.RegisterMessageType("EntitiesCreated");

/**
 * Message of the form {}
 * sent from InitGame for component map-dependent initialization.
 */
Engine.RegisterMessageType("InitGame");
