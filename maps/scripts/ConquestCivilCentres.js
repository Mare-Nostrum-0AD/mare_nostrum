{
	let cmpTrigger = Engine.QueryInterface(SYSTEM_ENTITY, IID_Trigger);
	cmpTrigger.ConquestAddVictoryCondition({
		"classFilter": "CivCentre",
		"defeatReason": markForTranslation("%(player)s has been defeated (lost all civil centres).")
	});
}
