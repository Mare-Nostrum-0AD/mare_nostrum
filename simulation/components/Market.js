function Market() {}

Market.prototype.Schema =
	"<element name='TradeType' a:help='Specifies the type of possible trade route (land or naval).'>" +
		"<list>" +
			"<oneOrMore>" +
				"<choice>" +
					"<value>land</value>" +
					"<value>naval</value>" +
				"</choice>" +
			"</oneOrMore>" +
		"</list>" +
	"</element>" +
	"<element name='DemandMultiplier' a:help='Multiplies trader gain.'>" +
		"<ref name='nonNegativeDecimal' />" +
	"</element>" +
	"<element name='InternationalBonus' a:help='Additional part of the gain donated when two different players trade'>" +
		"<ref name='nonNegativeDecimal'/>" +
	"</element>";

Market.prototype.Init = function()
{
	this.traders = new Set();	// list of traders with a route on this market
	this.tradeType = new Set(this.template.TradeType.split(/\s+/));
	this.tradeListeners = new Map();
};

Market.prototype.AddTrader = function(ent)
{
	this.traders.add(ent);
};

Market.prototype.RemoveTrader = function(ent)
{
	this.traders.delete(ent);
};

Market.prototype.GetDemandMultiplier = function()
{
	return ApplyValueModificationsToEntity("Market/DemandMultiplier", +this.template.DemandMultiplier, this.entity);
};

Market.prototype.GetInternationalBonus = function()
{
	return ApplyValueModificationsToEntity("Market/InternationalBonus", +this.template.InternationalBonus, this.entity);
};

Market.prototype.HasType = function(type)
{
	return this.tradeType.has(type);
};

Market.prototype.GetType = function()
{
	return this.tradeType;
};

Market.prototype.GetTraders = function()
{
	return this.traders;
};

/**
 * Check if the traders attached to this market can still trade with it
 * Warning: traders currently trading with a mirage of this market are dealt with in Mirage.js
 */

Market.prototype.UpdateTraders = function(onDestruction)
{
	for (let trader of this.traders)
	{
		let cmpTrader = Engine.QueryInterface(trader, IID_Trader);
		if (!cmpTrader)
		{
			this.RemoveTrader(trader);
			continue;
		}
		if (!cmpTrader.HasMarket(this.entity) || !onDestruction && cmpTrader.CanTrade(this.entity))
			continue;
		// this trader can no more trade
		this.RemoveTrader(trader);
		cmpTrader.RemoveMarket(this.entity);
	}
};

Market.prototype.SetTradeListener = function(name, func)
{
	this.tradeListeners[name] = func;
};

Market.prototype.HasTradeListener = function(name)
{
	return this.tradeListeners.has(name);
};

Market.prototype.RemoveTradeListener = function(name)
{
	this.tradeListeners.delete(name);
};

Market.prototype.RegisterTrade = function(goods)
{
	if (!this.cityEntity)
		return;
	let cmpOwnership = Engine.QueryInterface(this.entity, IID_Ownership);
	let marketOwner = cmpOwnership.GetOwner();
	cmpOwnership = Engine.QueryInterface(this.cityEntity, IID_Ownership);
	let cityOwner = cmpOwnership.GetOwner();
	if (marketOwner !== cityOwner)
		return;
	let cmpCity = Engine.QueryInterface(this.cityEntity, IID_City);
	if (!cmpCity)
		return;
	let tradeGrowthRate = cmpCity.GetTradeGrowthRate();
	let tradeGrowthAmount = goods.amount.traderGain * tradeGrowthRate;
	let oldPopulation = cmpCity.GetPopulation();
	cmpCity.SetPopulation(oldPopulation + tradeGrowthAmount);
}

Market.prototype.SetCity = function(cityEntity)
{
	this.cityEntity = cityEntity;
};

Market.prototype.OnDiplomacyChanged = function(msg)
{
	this.UpdateTraders(false);
};

Market.prototype.OnOwnershipChanged = function(msg)
{
	this.UpdateTraders(msg.to == INVALID_PLAYER);
};

Engine.RegisterComponentType(IID_Market, "Market", Market);
