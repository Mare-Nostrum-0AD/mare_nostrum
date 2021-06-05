function Mercenary() {}

Mercenary.prototype.Schema =
	"<empty/>";

Mercenary.prototype.Rebel = function()
{
	let cmpOwnership = Engine.QueryInterface(this.entity, IID_Ownership);
	if (cmpOwnership && cmpOwnership.GetOwner())
	{
		let playerID = cmpOwnership.GetOwner();
		cmpOwnership.SetOwner(0);
		let cmpGuiInterface = Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface);
		if (cmpGuiInterface)
			cmpGuiInterface.PushNotification({
				"players": [playerID],
				"message": markForTranslation("Your mercenaries are deserting due to lack of pay!"),
				"translateMessage": true
			});
	}
};

Mercenary.prototype.OnUpkeepPaid = function({ hasDeficit })
{
	if (hasDeficit)
		this.Rebel();
};

Engine.RegisterSystemComponentType(IID_Mercenary, "Mercenary", Mercenary);
