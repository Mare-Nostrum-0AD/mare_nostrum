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

// Message of the form { "entity": number, "newentity": number }
// called by ChangeEntityTemplate after creating new entity, but before transferring entity components and posting EntityRenamed
// should be used in cases where component needs to be transferred before other components (i.e. before changing ownership)
Engine.RegisterMessageType("EntityRenamePre");

// Message of the form { "entities": number[], "owner": number }
// broadcasted when a new entity is created:
// - from Foundation component when building construction is done
// - from ProductionQueue when training is complete
// - from Upgrade when an entity is upgraded
Engine.RegisterMessageType("EntitiesCreated");

// Message sent to an entity by helper function CreateEntity
// Allows post-init of certain components, with the assumption that all other components have been initialized
Engine.RegisterMessageType("EntityCreated");

/**
 * Message of the form {}
 * sent from InitGame for component map-dependent initialization.
 */
Engine.RegisterMessageType("InitGame");
