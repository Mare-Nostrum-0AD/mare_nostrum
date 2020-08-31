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
	this.destroyListeners = new Map();
	const modifier = this.template.GrowthContrib.Operation;
	const growthVal = Math.floor(this.template.GrowthContrib.Value);
	this.growthRateModifier = modifier === 'add' ?
		({growthRate, growthRateMultiplier}) => ({
			'growthRate': growthRate + growthVal,
			growthRateMultiplier
		}) :
		({growthRate, growthRateMultiplier}) => ({
			growthRate,
			'growthRateMultiplier': growthRateMultiplier * growthVal
		});
};

CityMember.prototype.ModifyGrowthRate = function({growthRate, growthRateMultiplier})
{
	return this.growthRateModifier({growthRate, growthRateMultiplier});
};

CityMember.prototype.AddDestroyListener = function(name, func)
{
	if (this.destroyListeners.has(name)) {
		return false;
	}
	this.destroyListeners[name] = func;
	return true;
};

CityMember.prototype.ChangeDestroyListener = function(name, newFunc)
{
	if (!this.destroyListeners.has(name)) {
		return false;
	}
	this.destroyListeners[name] = newFunc;
	return true;
};

CityMember.prototype.RemoveDestroyListener = function(name)
{
	if (!this.destroyListeners.has(name)) {
		return false
	}
	this.destroyListeners.delete(name);
	return true;
};

CityMember.prototype.OnDestroy = function()
{
	for (let [name, listener] of this.destroyListeners)
	{
		listener();
	}
};

// TODO: create CityMember interface
Engine.RegisterComponentType(IID_CityMember, "CityMember", CityMember);
