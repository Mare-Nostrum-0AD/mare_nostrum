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

// transfer <ratio> percentage of entities of class <entityClass> to player <receivingPlayerID> from each player with diplomatic relationship <givingPlayersDiplo>, as long as the other player has <minEntities> of <entityClass>
// @param receivingPlayerID			Number			ID of player who will received transferred entities.
// @param givingPlayersDiplo			[String]		The diplomatic relationship the receiving player must have with each other player in order to receive their entities.
// 													Possible values include: Ally, ExclusiveAlly, MutualAlly, ExclusiveMutualAlly, Enemy, Neutral.
// @param entityClasses				[String]		Classes of entities that can be transferred.
// @param ratio						Number			The percentage of each other player's entities to transfer to player <receivingPlayerID>. The exact entities will be chosen randomly.
// 													Must be a decimal value between 0 and 1 (i.e. 0.3).
// @param minEntities				Number			The minimum number of eligible entities each other player must have in order to lose them to the receiving player.
Trigger.prototype.TechTransferOwnershipEntities = function({ receivingPlayerID, givingPlayersDiplo, entityClasses, ratio, minEntities })
{
	const cmpPlayerManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_PlayerManager);
	if (!cmpPlayerManager)
		return;
	const cmpReceivingPlayer = Engine.QueryInterface(cmpPlayerManager.GetPlayerByID(receivingPlayerID), IID_Player);
	const givingPlayers = cmpPlayerManager.GetAllPlayers().filter(id => id !== receivingPlayerID).filter(id => givingPlayersDiplo.some(diplo => cmpReceivingPlayer["Is" + diplo](id)));
	if (!givingPlayers || !givingPlayers.length)
		return;
	const cmpRangeManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_RangeManager);
	for (let id of givingPlayers)
	{
		const transferrableEntities = cmpRangeManager.GetEntitiesByPlayer(id).filter(ent => MatchesClassList(Engine.QueryInterface(ent, IID_Identity)?.GetClassesList(), entityClasses));
		if (transferrableEntities.length < minEntities)
			continue;
		const entitiesToTransfer = shuffleArray(transferrableEntities).slice(0, transferrableEntities.length * ratio);
		entitiesToTransfer.map(ent => Engine.QueryInterface(ent, IID_Ownership)).filter(cmp => cmp).forEach(cmpOwnership => cmpOwnership.SetOwner(receivingPlayerID));
	}
};
