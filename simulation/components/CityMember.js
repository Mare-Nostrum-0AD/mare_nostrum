function CityMember() {}

CityMember.prototype.Schema =
	"<a:help>Identifies this entity as a potential member of a city, able to contribute to its growth and other attributes. City membership is determined by whether this entity is within the city's radius (see City.js).</a:help>" +
	"<element name='GrowthContrib' a:help='How much this entity contributes to city growth rate.'>" +
		"<choice>" +
			"<element name='Add' a:help='Value to add to city growth rate.'>" +
				"<data type='positiveInteger' />" +
			"</element>" +
			"<element name='Multiply' a:help='Value by which to multiply city growth rate.'>" +
				"<ref name='nonNegativeDecimal' />" +
			"</element>" +
		"</choice>" +
	"</element>";

CityMember.prototype.Init = function()
{
	this.growthAmountModifier = (() => {
		if (this.template.GrowthContrib.Add)
			return ({ growthAmount, growthAmountMultiplier }) => ({
				'growthAmount': growthAmount + ApplyValueModificationsToEntity("CityMember/GrowthContrib/Add", +this.template.GrowthContrib.Add, this.entity),
				growthAmountMultiplier
			});
		if (this.template.GrowthContrib.Multiply)
			return ({ growthAmount, growthAmountMultiplier }) => ({
				growthAmount,
				'growthAmountMultiplier': ApplyValueModificationsToEntity("CityMember/GrowthContrib/Multiply", +growthAmountMultiplier, this.entity) * +this.template.GrowthContrib.Multiply
			});
		throw new Error(sprintf('CityMember component for entity %d does not have a valid GrowthContrib modifier', this.entity));
	})();
};

CityMember.prototype.ModifyGrowthRate = function({growthAmount, growthAmountMultiplier})
{
	if (!this.growthAmountModifier)
		return ({growthAmount, growthAmountMultiplier})
	return this.growthAmountModifier({growthAmount, growthAmountMultiplier});
};

// @return		[String, Number]		name of modifier, modifier value
CityMember.prototype.GetGrowthContrib = function()
{
	if (this.template.GrowthContrib.Add)
		return ['add', ApplyValueModificationsToEntity("CityMember/GrowthContrib/Add", +this.template.GrowthContrib.Add, this.entity)];
	if (this.template.GrowthContrib.Multiply)
		return ['multiply', ApplyValueModificationsToEntity("CityMember/GrowthContrib/Multiply", +this.template.GrowthContrib.Multiply, this.entity)];
	throw new Error(sprintf('CityMember component for entity %d does not have a valid GrowthContrib modifier', this.entity));
};

// no dynamic state to save
CityMember.prototype.Serialize = null;

CityMember.prototype.Deserialize = function()
{
	this.Init();
};

Engine.RegisterComponentType(IID_CityMember, "CityMember", CityMember);
