function CityMember() {}

CityMember.prototype.Schema = "<a:help>Identifies this entity as a potential member of a city, able to contribute to its growth and other attributes. City membership is determined by whether this entity is within the city's radius (see City.js).</a:help>" +
"<element name='GrowthContrib' a:help='How much this entity contributes to city growth rate.'>" +
"	<element name='Operation' a:help='How to modify city growth. Either add or multiply'>" +
"		<choice>" +
"			<value>add</value>" +
"			<value>multiply</value>" +
"		</choice>" +
"	</element>" +
"	<element name='Value' a:help='Value to either add to or multiply city growth rate.'>" +
"		<ref name='decimal' />" +
"	</element>" +
"</element>";

CityMember.prototype.Init = function()
{
	const modifier = this.template.GrowthContrib.Operation;
	const growthVal = +this.template.GrowthContrib.Value;
	this.growthAmountModifier = ((() => {
		switch (modifier)
		{
			case 'add':
				return ({ growthAmount, growthAmountMultiplier }) => ({ 'growthAmount': growthAmount + growthVal, growthAmountMultiplier });
			case 'multiply':
				return ({ growthAmount, growthAmountMultiplier }) => ({ growthAmount, 'growthAmountMultiplier': growthAmountMultiplier * growthVal });
			default:
				return ({ growthAmount, growthAmountMultiplier }) => ({ growthAmount, growthAmountMultiplier });
		}
	})());
};

CityMember.prototype.ModifyGrowthRate = function({growthAmount, growthAmountMultiplier})
{
	if (!this.growthAmountModifier)
		return ({growthAmount, growthAmountMultiplier})
	return this.growthAmountModifier({growthAmount, growthAmountMultiplier});
};

// no dynamic state to save
CityMember.prototype.Serialize = null;

CityMember.prototype.Deserialize = function()
{
	this.Init();
};

Engine.RegisterComponentType(IID_CityMember, "CityMember", CityMember);
