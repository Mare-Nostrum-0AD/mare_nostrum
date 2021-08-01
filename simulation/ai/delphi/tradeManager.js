/**
 * Manage the trade
 */
DELPHI.TradeManager = function(Config)
{
	this.Config = Config;
	this.tradeRoute = undefined;
	this.tradeRoutes = [];
	this.potentialTradeRoute = undefined;
	this.routeProspection = false;
	this.traderRatio = this.Config.Economy.traderRatio;
	this.warnedAllies = {};
};

DELPHI.TradeManager.prototype.init = function(gameState)
{
	this.traders = gameState.getOwnUnits().filter(API3.Filters.byMetadata(PlayerID, "role", "trader"));
	this.traders.registerUpdates();
	this.minimalGain = gameState.ai.HQ.navalMap ? 3 : 5;
};

DELPHI.TradeManager.prototype.hasTradeRoutes = function()
{
	return this.tradeRoutes && this.tradeRoutes.length;
};

DELPHI.TradeManager.prototype.assignTrader = function(ent)
{
	ent.setMetadata(PlayerID, "role", "trader");
	this.traders.updateEnt(ent);
};

DELPHI.TradeManager.prototype.trainMoreTraders = function(gameState, queues)
{
	if (!this.hasTradeRoutes() || queues.trader.hasQueuedUnits())
		return;

	const targetNumTraders = gameState.getPopulationMax() * this.traderRatio;
	let numTraders = this.traders.length;
	// add traders already in training
	gameState.getOwnTrainingFacilities().forEach((ent) => {
		for (let item of ent.trainingQueue())
		{
			if (item.metadata && item.metadata.role === "trader")
				numTraders += item.count;
		}
	});
	if (numTraders >= targetNumTraders)
		return;

	const route = pickRandomWeighted(this.tradeRoutes.map(route => [route, route.gain]));
	let template;
	const metadata = {
		"role": "trader",
		"route": this.serializeRoute(route)
	};
	if (route.seaAccess)
	{
		// if we have some merchant ships assigned to transport, try first to reassign them
		// Maybe, there were produced at an early stage when no other ship were available
		// and the naval manager will train now more appropriate ships.
		const seaTransportShips = gameState.ai.HQ.navalManager.seaTransportShips[route.seaAccess].toEntityArray() || [];
		const shipToSwitch = seaTransportShips.find(ship => ship.getMetadata(PlayerID, "role") === "switchToTrader") || seaTransportShips.find((ship) => {
			if (!ship.hasClass("Trader"))
				return false;
			return !ship.getMetadata(PlayerID, "transporter");
		});
		if (shipToSwitch)
		{
			shipToSwitch.setMetadata(PlayerID, "role", !shipToSwitch.getMetadata(PlayerID, "transporter") ? "trader" : "switchToTrader");
			return;
		}

		template = gameState.applyCiv("units/{civ}/ship_merchant");
		metadata.sea = route.seaAccess;
	}
	else
	{
		template = gameState.applyCiv("units/{civ}/support_trader");
		metadata.base = route.markets[0].getMetadata(PlayerID, "base");
	}

	if (!gameState.getTemplate(template))
	{
		if (this.Config.debug > 0)
			API3.warn("Delphi error: trying to train " + template + " for civ " +
			          gameState.getPlayerCiv() + " but no template found.");
		return;
	}
	queues.trader.addPlan(new DELPHI.TrainingPlan(gameState, template, metadata, 1, 1));
};

DELPHI.TradeManager.prototype.updateTrader = function(gameState, trader)
{
	// this function only deals with unassigned traders; re-assigning working traders happens in assignTradeRoutes
	if (!trader.position() || !trader.isIdle() || trader.getMetadata(PlayerID, "transport"))
		return;
	const presentRouteSerialized = trader.getMetadata(PlayerID, "route");
	const presentRoute = presentRouteSerialized ? this.deserializeRoute(gameState, presentRouteSerialized) : undefined;
	if (presentRoute &&
		presentRoute.markets.every(market => {
			return market && market.position() && (market.owner() === PlayerID || gameState.isPlayerAlly(market.owner()));
		}) &&
		presentRoute.markets.some(market => market.owner() === PlayerID))
	{
		this.assignRouteToTrader(gameState, trader, presentRoute);
		return;
	}
	// if no previously assigned route, or previously assigned route is unavailable, assign a new one
	const traderSeaAccess = trader.hasClass("Ship") ? DELPHI.getSeaAccess(gameState, trader) : undefined;
	const traderLandAccess = !traderSeaAccess ? DELPHI.getLandAccess(gameState, trader) : undefined;
	const eligibleRoutes = this.tradeRoutes.filter(({ seaAccess, landAccess }) => {
		if (seaAccess && seaAccess === traderSeaAccess)
			return true;
		if (landAccess && traderLandAccess)
			return true;
		return false;
	});
	if (!eligibleRoutes || !eligibleRoutes.length)
		return;
	const route = pickRandomWeighted(eligibleRoutes.map(route => [route, route.gain]));
	this.assignRouteToTrader(gameState, trader, route);
};

DELPHI.TradeManager.prototype.setTradingGoods = function(gameState)
{
	let resTradeCodes = Resources.GetTradableCodes();
	if (!resTradeCodes.length)
		return;
	let tradingGoods = {};
	for (let res of resTradeCodes)
		tradingGoods[res] = 0;
	// first, try to anticipate future needs
	let stocks = gameState.ai.HQ.getTotalResourceLevel(gameState);
	let mostNeeded = gameState.ai.HQ.pickMostNeededResources(gameState, resTradeCodes);
	let wantedRates = gameState.ai.HQ.GetWantedGatherRates(gameState);
	let actualWantedRates = new Map();
	for (let res in wantedRates) {
		if (resTradeCodes.indexOf(res) !== -1) {
			actualWantedRates[res] = wantedRates[res];
		}// end if !resTradeCodes.indexOf(res)
	}// end for res in wantedRates
	wantedRates = actualWantedRates;
	let remaining = 100;
	for (let res of resTradeCodes)
	{
		if (res == "food")
			continue;
		let wantedRate = wantedRates[res];
		if (stocks.hasOwnProperty(res))
		{
			if (stocks[res] < 200)
			{
				tradingGoods[res] = wantedRate > 0 ? 20 : 10;
			}
			else if (stocks[res] < 500)
			{
				tradingGoods[res] = wantedRate > 0 ? 15 : 10;
			}
			else if (stocks[res] < 1000)
			{
				tradingGoods[res] = 10;
			}
		}
		remaining -= tradingGoods[res];
	}// end for res


	// then add what is needed now
	let mainNeed = Math.floor(remaining * 70 / 100);
	let nextNeed = remaining - mainNeed;

	tradingGoods[mostNeeded[0].type] += mainNeed;
	if (mostNeeded[1] && mostNeeded[1].wanted > 0)
		tradingGoods[mostNeeded[1].type] += nextNeed;
	else
		tradingGoods[mostNeeded[0].type] += nextNeed;
	Engine.PostCommand(PlayerID, { "type": "set-trading-goods", "tradingGoods": tradingGoods });
	if (this.Config.debug > 2)
		API3.warn(" trading goods set to " + uneval(tradingGoods));
};

/**
 * Try to barter unneeded resources for needed resources.
 * only once per turn because the info is not updated within a turn
 */
DELPHI.TradeManager.prototype.performBarter = function(gameState)
{
	let barterers = gameState.getOwnEntitiesByClass("Barter", true).filter(API3.Filters.isBuilt()).toEntityArray();
	if (barterers.length == 0)
		return false;
	let resBarterCodes = Resources.GetBarterableCodes();
	if (!resBarterCodes.length)
		return false;

	// Available resources after account substraction
	let available = gameState.ai.queueManager.getAvailableResources(gameState);
	let needs = gameState.ai.queueManager.currentNeeds(gameState);

	let rates = gameState.ai.HQ.GetCurrentGatherRates(gameState);

	let barterPrices = gameState.getBarterPrices();
	// calculates conversion rates
	let getBarterRate = (prices, buy, sell) => Math.round(100 * prices.sell[sell] / prices.buy[buy]);

	// loop through each missing resource checking if we could barter and help finishing a queue quickly.
	for (let buy of resBarterCodes)
	{
		// Check if our rate allows to gather it fast enough
		if (needs[buy] == 0 || needs[buy] < rates[buy] * 30)
			continue;

		// Pick the best resource to barter.
		let bestToSell;
		let bestRate = 0;
		for (let sell of resBarterCodes)
		{
			if (sell == buy)
				continue;
			// Do not sell if we need it or do not have enough buffer
			if (needs[sell] > 0 || available[sell] < 500)
				continue;

			let barterRateMin;
			if (sell == "food")
			{
				barterRateMin = 30;
				if (available[sell] > 40000)
					barterRateMin = 0;
				else if (available[sell] > 15000)
					barterRateMin = 5;
				else if (available[sell] > 1000)
					barterRateMin = 10;
			}
			else
			{
				barterRateMin = 70;
				if (available[sell] > 5000)
					barterRateMin = 30;
				else if (available[sell] > 1000)
					barterRateMin = 50;
				if (buy == "food")
					barterRateMin += 20;
			}

			let barterRate = getBarterRate(barterPrices, buy, sell);
			if (barterRate > bestRate && barterRate > barterRateMin)
			{
				bestRate = barterRate;
				bestToSell = sell;
			}
		}
		if (bestToSell !== undefined)
		{
			let amount = available[bestToSell] > 5000 ? 500 : 100;
			barterers[0].barter(buy, bestToSell, amount);
			if (this.Config.debug > 2)
				API3.warn("Necessity bartering: sold " + bestToSell +" for " + buy +
				          " >> need sell " + needs[bestToSell] + " need buy " + needs[buy] +
				          " rate buy " + rates[buy] + " available sell " + available[bestToSell] +
				          " available buy " + available[buy] + " barterRate " + bestRate +
				          " amount " + amount);
			return true;
		}
	}

	// now do contingency bartering, selling food to buy finite resources (and annoy our ennemies by increasing prices)
	if (available.food < 1000 || needs.food > 0 || resBarterCodes.indexOf("food") == -1)
		return false;
	let bestToBuy;
	let bestChoice = 0;
	for (let buy of resBarterCodes)
	{
		if (buy == "food")
			continue;
		let barterRateMin = 80;
		if (available[buy] < 5000 && available.food > 5000)
			barterRateMin -= 20 - Math.floor(available[buy]/250);
		let barterRate = getBarterRate(barterPrices, buy, "food");
		if (barterRate < barterRateMin)
			continue;
		let choice = barterRate / (100 + available[buy]);
		if (choice > bestChoice)
		{
			bestChoice = choice;
			bestToBuy = buy;
		}
	}
	if (bestToBuy !== undefined)
	{
		let amount = available.food > 5000 ? 500 : 100;
		barterers[0].barter(bestToBuy, "food", amount);
		if (this.Config.debug > 2)
			API3.warn("Contingency bartering: sold food for " + bestToBuy +
			          " available sell " + available.food + " available buy " + available[bestToBuy] +
			          " barterRate " + getBarterRate(barterPrices, bestToBuy, "food") +
			          " amount " + amount);
		return true;
	}

	return false;
};

DELPHI.TradeManager.prototype.checkEvents = function(gameState, events)
{
	// check if one market from a traderoute is renamed, change the route accordingly
	for (let evt of events.EntityRenamed)
	{
		let ent = gameState.getEntityById(evt.newentity);
		if (!ent || !ent.hasClass("Trade"))
			continue;
		for (let trader of this.traders.values())
		{
			let route = trader.getMetadata(PlayerID, "route");
			if (!route)
				continue;
			if (route.source == evt.entity)
				route.source = evt.newentity;
			else if (route.target == evt.entity)
				route.target = evt.newentity;
			else
				continue;
			trader.setMetadata(PlayerID, "route", route);
		}
	}

	// if one market (or market-foundation) is destroyed, we should look for a better route
	for (let evt of events.Destroy)
	{
		if (!evt.entityObj)
			continue;
		let ent = evt.entityObj;
		if (!ent || !ent.hasClass("Trade") || !gameState.isPlayerAlly(ent.owner()))
			continue;
		this.activateProspection(gameState);
		return true;
	}

	// same thing if one market is built
	for (let evt of events.Create)
	{
		let ent = gameState.getEntityById(evt.entity);
		if (!ent || ent.foundationProgress() !== undefined || !ent.hasClass("Trade") ||
		    !gameState.isPlayerAlly(ent.owner()))
			continue;
		this.activateProspection(gameState);
		return true;
	}


	// and same thing for captured markets
	for (let evt of events.OwnershipChanged)
	{
		if (!gameState.isPlayerAlly(evt.from) && !gameState.isPlayerAlly(evt.to))
			continue;
		let ent = gameState.getEntityById(evt.entity);
		if (!ent || ent.foundationProgress() !== undefined || !ent.hasClass("Trade"))
			continue;
		this.activateProspection(gameState);
		return true;
	}

	// or if diplomacy changed
	if (events.DiplomacyChanged.length)
	{
		this.activateProspection(gameState);
		return true;
	}

	return false;
};

DELPHI.TradeManager.prototype.activateProspection = function(gameState)
{
	this.routeProspection = true;
	gameState.ai.HQ.buildManager.setBuildable(gameState.applyCiv("structures/{civ}/market"));
	gameState.ai.HQ.buildManager.setBuildable(gameState.applyCiv("structures/{civ}/port"));
};

DELPHI.TradeManager.prototype.updateRoutes = function(gameState)
{
	this.tradeRoutes = [];
	// If we cannot trade, do not bother checking routes.
	if (!Resources.GetTradableCodes().length)
		return;

	const mapSize = gameState.sharedScript.mapSize;
	const traderTemplatesGains = gameState.getTraderTemplatesGains();
	const ownMarkets = gameState.updatingCollection("OwnMarkets", API3.Filters.byComponent("Market"), gameState.getOwnStructures());
	const exclusiveAllyMarkets = gameState.updatingCollection("diplo-ExclusiveAllyMarkets", API3.Filters.byComponent("Market"), gameState.getExclusiveAllyEntities());
	if (!ownMarkets.length || ownMarkets.length + exclusiveAllyMarkets.length < 2)	// wait until we have at least one of our own markets and two friendly markets total
		return;

	const ownMarketEntities = ownMarkets.toEntityArray().filter(ent => ent.position());
	const friendlyMarketEntities = new Set(ownMarketEntities.concat(exclusiveAllyMarkets.toEntityArray().filter(ent => ent.position())));
	// for API3.findPath (finding safe waypoints)
	const enemyDefenses = gameState.updatingCollection("diplo-EnemyDefensiveStructures", API3.Filters.hasDefensiveFire(), gameState.getEnemyStructures());
	const obstructions = new API3.Map(gameState.sharedScript, "territory");
	obstructions.setMaxVal(1);
	enemyDefenses.forEach(defense => {
		const defensePos = defense.position();
		if (!defensePos)
			return;
		const avoidRange = Math.round((defense.attackRange("Ranged")?.max || 0) * 1.5 / obstructions.cellSize);
		obstructions.addInfluence(...obstructions.gamePosToMapPos(defensePos), avoidRange, 1, 'constant');
	});
	for (const market of ownMarketEntities)
	{
		friendlyMarketEntities.delete(market);
		for (const otherMarket of friendlyMarketEntities.keys())
		{
			const route = {
				"markets": [market, otherMarket],
				"id": sprintf("%d:%d", ...[market, otherMarket].map(ent => ent.id()).sort())
			};
			const marketPos = market.position();
			const otherMarketPos = otherMarket.position();
			const vectorDistance = API3.SquareVectorDistance(marketPos, otherMarketPos);
			if (market.hasClass("Naval") && otherMarket.hasClass("Naval"))
			{
				const marketSeaAccess = DELPHI.getSeaAccess(gameState, market);
				const otherMarketSeaAccess = DELPHI.getSeaAccess(gameState, otherMarket);
				if (marketSeaAccess !== 1 && marketSeaAccess === otherMarketSeaAccess)
				{
					route.seaAccess = marketSeaAccess;
					route.gain = Math.round(traderTemplatesGains.navalGainMultiplier * TradeGain(vectorDistance, mapSize));
				}
			}
			if (!route.seaAccess)
			{
				const marketLandAccess = DELPHI.getLandAccess(gameState, market);
				const otherMarketLandAccess = DELPHI.getLandAccess(gameState, otherMarket);
				if (marketLandAccess === otherMarketLandAccess && !DELPHI.isLineInsideEnemyTerritory(gameState, marketPos, otherMarketPos, 50, 5))
				{
					route.landAccess = marketLandAccess;
					route.gain = Math.round(traderTemplatesGains.landGainMultiplier * TradeGain(vectorDistance, mapSize));
				}
			}
			if (route.seaAccess || route.landAccess)
			{
				this.tradeRoutes.push(route);
				// provide waypoints if part of route would otherwise cross enemy territory
				if (DELPHI.isLineInsideEnemyTerritory(gameState, ...route.markets.map(ent => ent.position())))
				{
					const access = route.seaAccess || route.landAccess;
					const accessMap = new API3.Map(gameState.sharedScript, "passability", route.seaAccess ?
						gameState.ai.accessibility.navalPassMap : gameState.ai.accessibility.landPassMap);
					const validator = (x, z) => {
						const [obsX, obsZ] = obstructions.gamePosToMapPos([x, z]);
						if (obsX < 0 || obsX >= obstructions.width || obsZ < 0 || obsZ >= obstructions.height)
							return [false, 0];
						return [
							accessMap.point([x, z]) === access && !obstructions.point([x, z]),
							0
						];
					};
					const marketPositions = route.markets.map(ent => ent.position());
					const [waypoints] = API3.findPath(validator, ...marketPositions, vectorDistance * 3, 32);
					if (waypoints)
						route.waypoints = waypoints.filter((_, i) => !(i % 2));
					if (this.Config.debug > 1)
					{
						if (!waypoints)
							API3.warnf("No waypoints found for route %s", route.id);
						else {
							API3.warnf("Route %s waypoints: %s", route.id, formatObject(waypoints));
							if (this.Config.debug > 2)
							{
								const visualizer = new API3.Map(gameState.sharedScript, "passability", accessMap.map, true);
								visualizer.setMaxVal(Math.max(...Object.keys(gameState.ai.HQ.waterValues)) * 3);
								for (const { x, z } of waypoints) {
									const [mapX, mapZ] = visualizer.gamePosToMapPos([x, z]);
									visualizer.addInfluence(mapX, mapZ, 2, visualizer.maxVal, 'constant');
								}
								visualizer.dumpIm(sprintf("waypoints_p%02d_%s_%08d.png", PlayerID, route.id, gameState.ai.playedTurn));
							}
						}
					}
				}
			}
		}
	}
	this.tradeRoutes = this.tradeRoutes.sort((a, b) => a.gain < b.gain);
};// end DELPHI.TradeManager.prototype.updateRoutes

/**
 * fills the best trade route in this.tradeRoute and the best potential route in this.potentialTradeRoute
 * If an index is given, it returns the best route with this index or the best land route if index is a land index
 */
DELPHI.TradeManager.prototype.checkRoutes = function(gameState, accessIndex)
{
	// If we cannot trade, do not bother checking routes.
	if (!Resources.GetTradableCodes().length)
	{
		this.tradeRoute = undefined;
		this.potentialTradeRoute = undefined;
		return false;
	}

	let market1 = gameState.updatingCollection("OwnMarkets", API3.Filters.byClass("Trade"), gameState.getOwnStructures());
	let market2 = gameState.updatingCollection("diplo-ExclusiveAllyMarkets", API3.Filters.byClass("Trade"), gameState.getExclusiveAllyEntities());
	if (market1.length + market2.length < 2)  // We have to wait  ... markets will be built soon
	{
		this.tradeRoute = undefined;
		this.potentialTradeRoute = undefined;
		return false;
	}

	let onlyOurs = !market2.hasEntities();
	if (onlyOurs)
		market2 = market1;
	let candidate = { "gain": 0 };
	let potential = { "gain": 0 };
	let bestIndex = { "gain": 0 };
	let bestLand = { "gain": 0 };

	let mapSize = gameState.sharedScript.mapSize;
	let traderTemplatesGains = gameState.getTraderTemplatesGains();

	for (let m1 of market1.values())
	{
		if (!m1.position())
			continue;
		let access1 = DELPHI.getLandAccess(gameState, m1);
		let sea1 = m1.hasClass("Naval") ? DELPHI.getSeaAccess(gameState, m1) : undefined;
		for (let m2 of market2.values())
		{
			if (onlyOurs && m1.id() >= m2.id())
				continue;
			if (!m2.position())
				continue;
			let access2 = DELPHI.getLandAccess(gameState, m2);
			let sea2 = m2.hasClass("Naval") ? DELPHI.getSeaAccess(gameState, m2) : undefined;
			let land = access1 == access2 ? access1 : undefined;
			let sea = sea1 && sea1 == sea2 ? sea1 : undefined;
			if (!land && !sea)
				continue;
			if (land && DELPHI.isLineInsideEnemyTerritory(gameState, m1.position(), m2.position()))
				continue;
			let gainMultiplier;
			if (land && traderTemplatesGains.landGainMultiplier)
				gainMultiplier = traderTemplatesGains.landGainMultiplier;
			else if (sea && traderTemplatesGains.navalGainMultiplier)
				gainMultiplier = traderTemplatesGains.navalGainMultiplier;
			else
				continue;
			let gain = Math.round(gainMultiplier * TradeGain(API3.SquareVectorDistance(m1.position(), m2.position()), mapSize));
			if (gain < this.minimalGain)
				continue;
			if (m1.foundationProgress() === undefined && m2.foundationProgress() === undefined)
			{
				if (accessIndex)
				{
					if (gameState.ai.accessibility.regionType[accessIndex] == "water" && sea == accessIndex)
					{
						if (gain < bestIndex.gain)
							continue;
						bestIndex = { "source": m1, "target": m2, "gain": gain, "land": land, "sea": sea };
					}
					else if (gameState.ai.accessibility.regionType[accessIndex] == "land" && land == accessIndex)
					{
						if (gain < bestIndex.gain)
							continue;
						bestIndex = { "source": m1, "target": m2, "gain": gain, "land": land, "sea": sea };
					}
					else if (gameState.ai.accessibility.regionType[accessIndex] == "land")
					{
						if (gain < bestLand.gain)
							continue;
						bestLand = { "source": m1, "target": m2, "gain": gain, "land": land, "sea": sea };
					}
				}
				if (gain < candidate.gain)
					continue;
				candidate = { "source": m1, "target": m2, "gain": gain, "land": land, "sea": sea };
			}
			if (gain < potential.gain)
				continue;
			potential = { "source": m1, "target": m2, "gain": gain, "land": land, "sea": sea };
		}
	}

	if (potential.gain < 1)
		this.potentialTradeRoute = undefined;
	else
		this.potentialTradeRoute = potential;

	if (candidate.gain < 1)
	{
		if (this.Config.debug > 2)
			API3.warn("no better trade route possible");
		this.tradeRoute = undefined;
		return false;
	}

	if (this.Config.debug > 1 && this.tradeRoute)
	{
		if (candidate.gain > this.tradeRoute.gain)
			API3.warn("one better trade route set with gain " + candidate.gain + " instead of " + this.tradeRoute.gain);
	}
	else if (this.Config.debug > 1)
		API3.warn("one trade route set with gain " + candidate.gain);
	this.tradeRoute = candidate;

	if (this.Config.chat)
	{
		let owner = this.tradeRoute.source.owner();
		if (owner == PlayerID)
			owner = this.tradeRoute.target.owner();
		if (owner != PlayerID && !this.warnedAllies[owner])
		{	// Warn an ally that we have a trade route with him
			DELPHI.chatNewTradeRoute(gameState, owner);
			this.warnedAllies[owner] = true;
		}
	}

	if (accessIndex)
	{
		if (bestIndex.gain > 0)
			return bestIndex;
		else if (gameState.ai.accessibility.regionType[accessIndex] == "land" && bestLand.gain > 0)
			return bestLand;
		return false;
	}
	return true;
};

/** Called when a market was built or destroyed, and checks if trader orders should be changed */
DELPHI.TradeManager.prototype.checkTrader = function(gameState, ent)
{
	let presentRoute = ent.getMetadata(PlayerID, "route");
	if (!presentRoute)
		return;

	if (!ent.position())
	{
		// This trader is garrisoned, we will decide later (when ungarrisoning) what to do
		ent.setMetadata(PlayerID, "route", undefined);
		return;
	}

	let access = ent.hasClass("Ship") ? DELPHI.getSeaAccess(gameState, ent) : DELPHI.getLandAccess(gameState, ent);
	let possibleRoute = this.checkRoutes(gameState, access);
	// Warning:  presentRoute is from metadata, so contains entity ids
	if (!possibleRoute ||
	    possibleRoute.source.id() != presentRoute.source && possibleRoute.source.id() != presentRoute.target ||
	    possibleRoute.target.id() != presentRoute.source && possibleRoute.target.id() != presentRoute.target)
	{
		// Trader will be assigned in updateTrader
		ent.setMetadata(PlayerID, "route", undefined);
		if (!possibleRoute && !ent.hasClass("Ship"))
		{
			let closestBase = DELPHI.getBestBase(gameState, ent, true);
			if (closestBase.accessIndex == access)
			{
				let closestBasePos = closestBase.anchor.position();
				ent.moveToRange(closestBasePos[0], closestBasePos[1], 0, 15);
				return;
			}
		}
		ent.stopMoving();
	}
};

DELPHI.TradeManager.prototype.prospectForNewMarket = function(gameState, queues)
{
	if (queues.economicBuilding.hasQueuedUnitsWithClass("Trade") || queues.dock.hasQueuedUnitsWithClass("Trade"))
		return;
	if (!gameState.ai.HQ.canBuild(gameState, "structures/{civ}/market"))
		return;
	if (!gameState.updatingCollection("OwnMarkets", API3.Filters.byClass("Trade"), gameState.getOwnStructures()).hasEntities() &&
	    !gameState.updatingCollection("diplo-ExclusiveAllyMarkets", API3.Filters.byClass("Trade"), gameState.getExclusiveAllyEntities()).hasEntities())
		return;
	let template = gameState.getTemplate(gameState.applyCiv("structures/{civ}/market"));
	if (!template)
		return;
	this.checkRoutes(gameState);
	let marketPos = gameState.ai.HQ.findMarketLocation(gameState, template);
	if (!marketPos || marketPos[3] == 0)   // marketPos[3] is the expected gain
	{	// no position found
		if (gameState.getOwnEntitiesByClass("Market", true).hasEntities())
			gameState.ai.HQ.buildManager.setUnbuildable(gameState, gameState.applyCiv("structures/{civ}/market"));
		else
			this.routeProspection = false;
		return;
	}
	this.routeProspection = false;
	if (!this.isNewMarketWorth(marketPos[3]))
		return;	// position found, but not enough gain compared to our present route

	if (this.Config.debug > 1)
	{
		if (this.potentialTradeRoute)
			API3.warn("turn " + gameState.ai.playedTurn + "we could have a new route with gain " +
				marketPos[3] + " instead of the present " + this.potentialTradeRoute.gain);
		else
			API3.warn("turn " + gameState.ai.playedTurn + "we could have a first route with gain " +
				marketPos[3]);
	}

	if (!this.tradeRoute)
		gameState.ai.queueManager.changePriority("economicBuilding", 2 * this.Config.priorities.economicBuilding);
	let plan = new DELPHI.ConstructionPlan(gameState, "structures/{civ}/market");
	if (!this.tradeRoute)
		plan.queueToReset = "economicBuilding";
	queues.economicBuilding.addPlan(plan);
};

DELPHI.TradeManager.prototype.isNewMarketWorth = function(expectedGain)
{
	if (!Resources.GetTradableCodes().length)
		return false;
	if (expectedGain < this.minimalGain)
		return false;
	if (this.potentialTradeRoute && expectedGain < 2*this.potentialTradeRoute.gain &&
		expectedGain < this.potentialTradeRoute.gain + 20)
		return false;
	return true;
};

DELPHI.TradeManager.prototype.assignRouteToTrader = function(gameState, trader, route)
{
	const traderPos = trader.position();
	const [ nearerMarket, furtherMarket ] = route.markets.sort(
		(marketA, marketB) => API3.SquareVectorDistance(traderPos, marketA.position()) < API3.SquareVectorDistance(traderPos, marketB.position())
	);
	trader.setMetadata(PlayerID, "route", this.serializeRoute(route));
	this.traders.updateEnt(trader);
	if (!trader.hasClass("Ship"))
	{
		const traderLandAccess = DELPHI.getLandAccess(gameState, trader);
		if (route.landAccess !== traderLandAccess)
		{
			gameState.ai.HQ.navalManager.requireTransport(gameState, trader, traderLandAccess, route.landAccess, nearerMarket.position());
			return;
		}
	}
	let waypoints;
	if (route.waypoints)
		waypoints = nearerMarket === route.markets[1] ? route.waypoints.slice().reverse() : route.waypoints;
	trader.tradeRoute(nearerMarket, furtherMarket, waypoints);
};

DELPHI.TradeManager.prototype.assignTradeRoutes = function(gameState)
{
	const traders = this.traders.filter((trader) => trader.position() && !trader.unitAIState().startsWith("INDIVIDUAL.COLLECTTREASURE") && !trader.getMetadata(PlayerID, "transporter"));
	const tradeRoutes = this.tradeRoutes;
	const gainsTotal = tradeRoutes.reduce((sum, { gain }) => sum + gain, 0);
	const tradersPerGain = traders.length / gainsTotal;
	const tradeRoutesByID = Object.fromEntries(tradeRoutes.map(route => [ route.id, route ]));
	const tradeRouteDesiredTraders = Object.fromEntries(tradeRoutes.map(({ id, gain }) => [ id, Math.round(gain * tradersPerGain) + 1 ]));
	traders.forEach((trader) => {
		const presentRoute = trader.getMetadata(PlayerID, "route");
		if (presentRoute)
		{
			if (tradeRouteDesiredTraders[presentRoute.id])
			{
				tradeRouteDesiredTraders[presentRoute.id]--;
				return;
			}
		}
		const traderSeaAccess = trader.hasClass("Ship") ? DELPHI.getSeaAccess(gameState, trader) : undefined;
		const traderLandAccess = !traderSeaAccess ? DELPHI.getLandAccess(gameState, trader) : undefined;
		const eligibleRoutes = tradeRoutes.filter(({ id, seaAccess, landAccess }) => {
			if (!tradeRouteDesiredTraders[id])
				return false;
			if (traderSeaAccess && seaAccess === traderSeaAccess)
				return true;
			if (traderLandAccess && landAccess)
				return true;
			return false;
		}).sort((routeA, routeB) => {
			if (routeA.landAccess && routeA.landAccess !== traderLandAccess && routeB.landAccess === traderLandAccess)
					return true;
			return tradeRouteDesiredTraders[routeA.id] < tradeRouteDesiredTraders[routeB.id];
		});
		if (!eligibleRoutes.length)
			return;
		const newRoute = eligibleRoutes[0];
		tradeRouteDesiredTraders[newRoute.id]--;
		this.assignRouteToTrader(gameState, trader, newRoute);
	});// end for trader of traders
};

DELPHI.TradeManager.prototype.update = function(gameState, events, queues)
{
	if (gameState.ai.HQ.canBarter && Resources.GetBarterableCodes().length)
		this.performBarter(gameState);

	if (this.checkEvents(gameState, events))  // true if one market was built or destroyed
	{
		this.updateRoutes(gameState);
		this.assignTradeRoutes(gameState);
	}

	if (this.tradeRoutes && this.tradeRoutes.length)
	{
		this.traders.forEach(ent => this.updateTrader(gameState, ent));
		if (gameState.ai.playedTurn % 3 === 0)
			this.trainMoreTraders(gameState, queues);
		if (gameState.ai.playedTurn % 20 == 0 && this.traders.length >= 2)
			gameState.ai.HQ.researchManager.researchTradeBonus(gameState, queues);
		if (gameState.ai.playedTurn % 60 == 0)
			this.setTradingGoods(gameState);
	}
};

DELPHI.TradeManager.prototype.serializeRoute = function(route)
{
	if (!route)
		return undefined;

	return {
		...route,
		"markets": route.markets.map(ent => ent.id())
	};
};

DELPHI.TradeManager.prototype.deserializeRoute = function(gameState, route)
{
	if (!route)
		return undefined;

	return {
		...route,
		"markets": route.markets.map(id => gameState.getEntityById(id))
	};
};

DELPHI.TradeManager.prototype.Serialize = function()
{
	return {
		"tradeRoutes": this.tradeRoutes.map(route => this.serializeRoute(route)),
		"potentialTradeRoute": this.serializeRoute(this.potentialTradeRoute),
		"routeProspection": this.routeProspection,
		"traderRatio": this.traderRatio,
		"warnedAllies": this.warnedAllies
	};
};

DELPHI.TradeManager.prototype.Deserialize = function(gameState, data)
{
	for (let [key, value] of Object.entries(data))
	{
		if (key == "tradeRoutes")
			this[key] = value.map(route => this.deserializeRoute(gameState, route));
		else
			this[key] = value;
	}
};
