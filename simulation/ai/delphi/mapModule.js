/** map functions */

DELPHI.TERRITORY_PLAYER_MASK = 0x1F;
DELPHI.TERRITORY_BLINKING_MASK = 0x40;

DELPHI.createObstructionMap = function(gameState, accessIndex, template)
{
	let passabilityMap = gameState.getPassabilityMap();
	let territoryMap = gameState.ai.territoryMap;
	let ratio = territoryMap.cellSize / passabilityMap.cellSize;

	// default values
	let placementType = "land";
	let buildOwn = true;
	let buildAlly = true;
	let buildNeutral = true;
	let buildEnemy = false;
	// If there is a template then replace the defaults
	if (template)
	{
		placementType = template.buildPlacementType();
		buildOwn = template.hasBuildTerritory("own");
		buildAlly = template.hasBuildTerritory("ally");
		buildNeutral = template.hasBuildTerritory("neutral");
		buildEnemy = template.hasBuildTerritory("enemy");
	}
	let obstructionTiles = new Uint8Array(passabilityMap.data.length);

	let passMap;
	let obstructionMask;
	if (placementType == "shore")
	{
		passMap = gameState.ai.accessibility.navalPassMap;
		obstructionMask = gameState.getPassabilityClassMask("building-shore");
	}
	else
	{
		passMap = gameState.ai.accessibility.landPassMap;
		obstructionMask = gameState.getPassabilityClassMask("building-land");
	}

	for (let k = 0; k < territoryMap.data.length; ++k)
	{
		let tilePlayer = territoryMap.data[k] & DELPHI.TERRITORY_PLAYER_MASK;
		let isConnected = (territoryMap.data[k] & DELPHI.TERRITORY_BLINKING_MASK) == 0;
		if (tilePlayer === PlayerID)
		{
			if (!buildOwn || !buildNeutral && !isConnected)
				continue;
		}
		else if (gameState.isPlayerMutualAlly(tilePlayer))
		{
			if (!buildAlly || !buildNeutral && !isConnected)
				continue;
		}
		else if (tilePlayer === 0)
		{
			if (!buildNeutral)
				continue;
		}
		else
		{
			if (!buildEnemy)
				continue;
		}

		let x = ratio * (k % territoryMap.width);
		let y = ratio * Math.floor(k / territoryMap.width);
		for (let ix = 0; ix < ratio; ++ix)
		{
			for (let iy = 0; iy < ratio; ++iy)
			{
				let i = x + ix + (y + iy)*passabilityMap.width;
				if (placementType != "shore" && accessIndex && accessIndex !== passMap[i])
					continue;
				if (!(passabilityMap.data[i] & obstructionMask))
					obstructionTiles[i] = 255;
			}
		}
	}

	// constrain using BuildRestrictions/Distances*
	let map = new API3.Map(gameState.sharedScript, "passability", obstructionTiles);
	map.setMaxVal(255);
	const penalty = -255;

	if (template && template.get('BuildRestrictions/DistancesExclusive'))
	{
		const obstructionRadius = template.obstructionRadius();
		const cellSize = passabilityMap.cellSize;
		let distances = template.get('BuildRestrictions/DistancesExclusive');
		for (let d in distances) {
			let dist = distances[d];
			let minDist = dist.MinDistance;
			if (!minDist)
				continue;
			let fromClass = dist.FromClass;
			if (obstructionRadius)
				minDist -= obstructionRadius.min;
			let cellDist = 1 + minDist / cellSize;
			let structures = gameState.getOwnStructures().filter(API3.Filters.byClass(fromClass));
			for (let ent of structures.values())
			{
				if (!ent.position())
					continue;
				let pos = ent.position();
				let x = Math.round(pos[0] / cellSize);
				let z = Math.round(pos[1] / cellSize);
				map.addInfluence(x, z, cellDist, penalty, "constant");
			}// end for ent of structures.values()
		}// end for d in distances
	}

	return map;
};


DELPHI.createTerritoryMap = function(gameState)
{
	let map = gameState.ai.territoryMap;

	let ret = new API3.Map(gameState.sharedScript, "territory", map.data);
	ret.getOwner = function(p) { return this.point(p) & DELPHI.TERRITORY_PLAYER_MASK; };
	ret.getOwnerIndex = function(p) { return this.map[p] & DELPHI.TERRITORY_PLAYER_MASK; };
	ret.isBlinking = function(p) { return (this.point(p) & DELPHI.TERRITORY_BLINKING_MASK) != 0; };
	return ret;
};

/**
 *  The borderMap contains some border and frontier information:
 *  - border of the map filled once:
 *     - all mini-cells (1x1) from the big cell (8x8) inaccessibles => bit 0
 *     - inside a given distance to the border                      => bit 1
 *  - frontier of our territory (updated regularly in updateFrontierMap)
 *     - narrow border (inside our territory)                       => bit 2
 *     - large border (inside our territory, exclusive of narrow)   => bit 3
 */

DELPHI.outside_Mask = 1;
DELPHI.border_Mask = 2;
DELPHI.fullBorder_Mask = DELPHI.outside_Mask | DELPHI.border_Mask;
DELPHI.narrowFrontier_Mask = 4;
DELPHI.largeFrontier_Mask = 8;
DELPHI.fullFrontier_Mask = DELPHI.narrowFrontier_Mask | DELPHI.largeFrontier_Mask;

DELPHI.createBorderMap = function(gameState)
{
	let map = new API3.Map(gameState.sharedScript, "territory");
	let width = map.width;
	let border = Math.round(80 / map.cellSize);
	let passabilityMap = gameState.getPassabilityMap();
	let obstructionMask = gameState.getPassabilityClassMask("unrestricted");
	if (gameState.circularMap)
	{
		let ic = (width - 1) / 2;
		let radcut = (ic - border) * (ic - border);
		for (let j = 0; j < map.length; ++j)
		{
			let dx = j%width - ic;
			let dy = Math.floor(j/width) - ic;
			let radius = dx*dx + dy*dy;
			if (radius < radcut)
				continue;
			map.map[j] = DELPHI.outside_Mask;
			let ind = API3.getMapIndices(j, map, passabilityMap);
			for (let k of ind)
			{
				if (passabilityMap.data[k] & obstructionMask)
					continue;
				map.map[j] = DELPHI.border_Mask;
				break;
			}
		}
	}
	else
	{
		let borderCut = width - border;
		for (let j = 0; j < map.length; ++j)
		{
			let ix = j%width;
			let iy = Math.floor(j/width);
			if (ix < border || ix >= borderCut || iy < border || iy >= borderCut)
			{
				map.map[j] = DELPHI.outside_Mask;
				let ind = API3.getMapIndices(j, map, passabilityMap);
				for (let k of ind)
				{
					if (passabilityMap.data[k] & obstructionMask)
						continue;
					map.map[j] = DELPHI.border_Mask;
					break;
				}
			}
		}
	}

	// map.dumpIm("border.png", 5);
	return map;
};

DELPHI.debugMap = function(gameState, map)
{
	let width = map.width;
	let cell = map.cellSize;
	gameState.getEntities().forEach(ent => {
		let pos = ent.position();
		if (!pos)
			return;
		let x = Math.round(pos[0] / cell);
		let z = Math.round(pos[1] / cell);
		let id = x + width*z;
		if (map.map[id] == 1)
			Engine.PostCommand(PlayerID, { "type": "set-shading-color", "entities": [ent.id()], "rgb": [2, 0, 0] });
		else if (map.map[id] == 2)
			Engine.PostCommand(PlayerID, { "type": "set-shading-color", "entities": [ent.id()], "rgb": [0, 2, 0] });
		else if (map.map[id] == 3)
			Engine.PostCommand(PlayerID, { "type": "set-shading-color", "entities": [ent.id()], "rgb": [0, 0, 2] });
	});
};
