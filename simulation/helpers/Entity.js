// wrapper for Engine.AddEntity
// sends message MT_EntityCreated to allow components to perform post-init procedures
// @param templateName		String		name of template of entity to create
// @param owner				Number		player id of entity owner; ownership not set if undefined
// @return					Number		new entity's id
function CreateEntity(templateName, owner=undefined)
{
	const entity = Engine.AddEntity(templateName);
	if (entity === INVALID_ENTITY)
	{
		throw new Error("Could not create valid entity from template %s", templateName);
	}
	Engine.PostMessage(entity, MT_EntityCreated);
	if (owner)
	{
		const cmpOwnership = Engine.QueryInterface(entity, IID_Ownership);
		if (cmpOwnership)
			cmpOwnership.SetOwner(owner);
	}
	return entity;
};

Engine.RegisterGlobal("CreateEntity", CreateEntity);
