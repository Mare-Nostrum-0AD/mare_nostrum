// Spawn units, retrying every second until all <count> units have been successfully spawned
// @param researcher		Number		entity that researched the tech
// @param player				Number		player id
// @param unitTemplate	String		name of template of units to train
// @param count					Number		number of entities to spawn
// @return none
Trigger.prototype.TechSpawnUnits = function({ researcher, player, unitTemplate, count })
{
	let cmpResearcherProductionQueue = Engine.QueryInterface(researcher, IID_ProductionQueue);
	if (!cmpResearcherProductionQueue)
		return;
	let numRemaining = count - cmpResearcherProductionQueue.SpawnUnits({
		player, unitTemplate, count
	});
	if (!numRemaining)
		return;
	let cmpTimer = Engine.QueryInterface(SYSTEM_ENTITY, IID_Timer);
	if (cmpTimer)
		cmpTimer.SetTimeout(SYSTEM_ENTITY, IID_Trigger, "TechSpawnUnits", 1000, {
			researcher, player, unitTemplate,
			"count": numRemaining
		});
};
