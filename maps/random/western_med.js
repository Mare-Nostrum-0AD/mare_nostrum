/**
 * Heightmap image source:
 * Imagery by Jesse Allen, NASA's Earth Observatory,
 * using data from the General Bathymetric Chart of the Oceans (GEBCO)
 * produced by the British Oceanographic Data Centre.
 * https://visibleearth.nasa.gov/view.php?id=73934
 *
 * Licensing: Public Domain, https://visibleearth.nasa.gov/useterms.php
 *
 * The heightmap image is reproduced using:
 * wget https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73934/gebco_08_rev_elev_{A,B,C,D}{1..2}_grey_geo.tif
 * gdal_merge.py -o world.tif gebco_08_rev_elev_{A,B,C,D}{1..2}_grey_geo.tif
 * lat=46; lon=14; width=58;
 * gdal_translate -projwin $((lon-width/2)) $((lat+width/2)) $((lon+width/2)) $((lat-width/2)) world.tif mediterranean.tif
 * convert mediterranean.tif -resize 512 -contrast-stretch 0 mediterranean.png
 * No further changes should be applied to the image to keep it easily interchangeable.
 */

Engine.LoadLibrary("rmgen");
Engine.LoadLibrary("rmgen-common");
Engine.LoadLibrary("rmgen2");
Engine.LoadLibrary("rmbiome");

TILE_CENTERED_HEIGHT_MAP = true;

const tWater = "medit_sand_wet";
const tSnowedRocks = ["alpine_cliff_b", "alpine_cliff_snow"];
setBiome("generic/aegean");

const heightScale = num => num * g_MapSettings.Size / 320;

const heightSeaGround = heightScale(-6);
const heightWaterLevel = heightScale(0);
const heightShoreline = heightScale(0.5);
const heightSnow = heightScale(15);

var g_Map = new RandomMap(heightWaterLevel, g_Terrains.mainTerrain);
var mapSize = g_Map.getSize();
var mapCenter = g_Map.getCenter();
var mapBounds = g_Map.getBounds();

g_Map.LoadHeightmapImage("western_med_2.png", 0, 40);
Engine.SetProgress(15);

initTileClasses(["autumn", "desert", "medit", "polar", "steppe", "temp", "shoreline", "africa", "northern_europe", "southern_europe", "western_europe", "eastern_europe"]);

var africaTop = fractionToTiles(0.20);
var southernEuroTop = fractionToTiles(0.65);

var climateZones = [
	{
		"tileClass": g_TileClasses.western_europe,
		"position1": new Vector2D(mapBounds.left, mapBounds.top),
		"position2": new Vector2D(mapBounds.right, southernEuroTop),
		"biome": "generic/temperate",
		"constraint": new NullConstraint(),
		"amounts": {
			"berries": ["normal"],
			"pastures": ["normal"],
			"animals": ["many"],
			"forests": ["many"],
			"stone": ["few", "normal"],
			"metal": ["few", "normal"]
		}
	},
	{
		"tileClass": g_TileClasses.southern_europe,
		"position1": new Vector2D(mapBounds.left, southernEuroTop),
		"position2": new Vector2D(mapBounds.right, africaTop),
		"biome": "generic/aegean",
		"constraint": new NullConstraint(),
		"amounts": {
			"berries": ["few"],
			"pastures": ["many"],
			"animals": ["many"],
			"forests": ["normal"],
			"stone": ["normal", "many"],
			"metal": ["normal", "many"]
		}
	},
	{
		"tileClass": g_TileClasses.africa,
		"position1": new Vector2D(mapBounds.left, africaTop),
		"position2": new Vector2D(mapBounds.right, mapBounds.bottom),
		"biome": "generic/sahara",
		"constraint": new NullConstraint(),
		"amounts": {
			"berries": ["scarce"],
			"pastures": ["few"],
			"animals": ["normal"],
			"forests": ["scarce"],
			"stone": ["normal"],
			"metal": ["normal"]
		}
	}
];

g_Map.log("Lowering sea ground");
createArea(
	new MapBoundsPlacer(),
	new SmoothElevationPainter(ELEVATION_SET, heightSeaGround, 2),
	new HeightConstraint(-Infinity, heightWaterLevel));
Engine.SetProgress(20);

g_Map.log("Smoothing heightmap");
createArea(
	new MapBoundsPlacer(),
	new SmoothingPainter(1, scaleByMapSize(0.3, 0.8), 1));
Engine.SetProgress(25);

g_Map.log("Marking water");
createArea(
	new MapBoundsPlacer(),
	new TileClassPainter(g_TileClasses.water),
	new HeightConstraint(-Infinity, heightWaterLevel));
Engine.SetProgress(30);

g_Map.log("Marking land");
createArea(
	new DiskPlacer(fractionToTiles(0.5), mapCenter),
	new TileClassPainter(g_TileClasses.land),
	avoidClasses(g_TileClasses.water, 0));
Engine.SetProgress(35);

g_Map.log("Marking climate zones");
for (let zone of climateZones)
{
	setBiome(zone.biome);
	createArea(
		new RectPlacer(zone.position1, zone.position2, Infinity),
		new TileClassPainter(zone.tileClass),
		zone.constraint);

	createArea(
			new RectPlacer(zone.position1, zone.position2, Infinity),
			new TerrainPainter(g_Terrains.mainTerrain),
			[
				new HeightConstraint(heightWaterLevel, Infinity),
				zone.constraint
			]);
}
Engine.SetProgress(40);

g_Map.log("Fuzzing biome borders");
for (let zone of climateZones)
{
	setBiome(zone.biome);

	createLayeredPatches(
		[scaleByMapSize(3, 6), scaleByMapSize(5, 10), scaleByMapSize(8, 21)],
		[
			[g_Terrains.mainTerrain, g_Terrains.tier1Terrain],
			[g_Terrains.tier1Terrain, g_Terrains.tier2Terrain],
			[g_Terrains.tier2Terrain, g_Terrains.tier3Terrain]
		],
		[1, 1],
		[
			avoidClasses(
				g_TileClasses.forest, 2,
				g_TileClasses.water, 2,
				g_TileClasses.mountain, 2,
				g_TileClasses.dirt, 5,
				g_TileClasses.player, 8),
			borderClasses(zone.tileClass, 3, 3),
		],
		scaleByMapSize(20, 60),
		g_TileClasses.dirt);
}
Engine.SetProgress(45);

if (!isNomad())
{
	g_Map.log("Finding player positions");

	let [playerIDs, playerPosition] = playerPlacementRandom(
		sortAllPlayers(),
		[
			avoidClasses(g_TileClasses.mountain, 5),
			stayClasses(g_TileClasses.land, scaleByMapSize(8, 25))
		]);

	g_Map.log("Flatten the initial CC area and placing playerbases");
	for (let i = 0; i < getNumPlayers(); ++i)
	{
		g_Map.logger.printDuration();
		setBiome(climateZones.find(zone => zone.tileClass.has(playerPosition[i])).biome);

		createArea(
			new ClumpPlacer(diskArea(defaultPlayerBaseRadius() * 0.8), 0.95, 0.6, Infinity, playerPosition[i]),
			new SmoothElevationPainter(ELEVATION_SET, g_Map.getHeight(playerPosition[i]), 6));

		createBase(playerIDs[i], playerPosition[i], mapSize >= 384);
	}
}
Engine.SetProgress(50);

for (let zone of climateZones)
{
	setBiome(zone.biome);

	g_Map.log("Painting shoreline");
	createArea(
		new MapBoundsPlacer(),
		[
			new TerrainPainter(g_Terrains.shore),
			new TileClassPainter(g_TileClasses.shoreline)
		],
		[
			stayClasses(zone.tileClass, 0),
			new HeightConstraint(-Infinity, heightShoreline)
		]);

	g_Map.log("Painting cliffs");
	createArea(
		new MapBoundsPlacer(),
		[
			new TerrainPainter(g_Terrains.cliff),
			new TileClassPainter(g_TileClasses.mountain),
		],
		[
			stayClasses(zone.tileClass, 0),
			avoidClasses(g_TileClasses.water, 2),
			new SlopeConstraint(2, Infinity)
		]);

	g_Map.log("Placing resources");
	addElements([
		{
			"func": addMetal,
			"avoid": [
				g_TileClasses.berries, 5,
				g_TileClasses.pasture, 5,
				g_TileClasses.forest, 3,
				g_TileClasses.mountain, 2,
				g_TileClasses.player, 30,
				g_TileClasses.rock, 10,
				g_TileClasses.metal, 25,
				g_TileClasses.water, 4
			],
			"stay": [zone.tileClass, 0],
			"sizes": ["normal"],
			"mixes": ["same"],
			"amounts": zone.amounts.metal ? zone.amounts.metal : ["normal"]
		},
		{
			"func": addStone,
			"avoid": [
				g_TileClasses.berries, 5,
				g_TileClasses.pasture, 5,
				g_TileClasses.forest, 3,
				g_TileClasses.mountain, 2,
				g_TileClasses.player, 30,
				g_TileClasses.rock, 10,
				g_TileClasses.metal, 25,
				g_TileClasses.water, 4
			],
			"stay": [zone.tileClass, 0],
			"sizes": ["normal"],
			"mixes": ["same"],
			"amounts": zone.amounts.stone ? zone.amounts.stone : ["normal"]
		},
		{
			"func": addForests,
			"avoid": [
				g_TileClasses.berries, 3,
				g_TileClasses.pasture, 5,
				g_TileClasses.forest, 15,
				g_TileClasses.metal, 3,
				g_TileClasses.mountain, 2,
				g_TileClasses.player, 12,
				g_TileClasses.rock, 2,
				g_TileClasses.water, 2
			],
			"stay": [zone.tileClass, 0],
			"sizes": ["normal"],
			"mixes": ["normal"],
			"amounts": zone.amounts.forests ? zone.amounts.forests : ["normal"]
		},
		{
			"func": addSmallMetal,
			"avoid": [
				g_TileClasses.berries, 5,
				g_TileClasses.pasture, 5,
				g_TileClasses.forest, 3,
				g_TileClasses.mountain, 2,
				g_TileClasses.player, 30,
				g_TileClasses.rock, 10,
				g_TileClasses.metal, 15,
				g_TileClasses.water, 4
			],
			"stay": [zone.tileClass, 0],
			"sizes": ["normal"],
			"mixes": ["same"],
			"amounts": zone.amounts.metal ? zone.amounts.metal : ["normal"]
		},
		{
			"func": addBerries,
			"avoid": [
				g_TileClasses.berries, 30,
				g_TileClasses.pasture, 10,
				g_TileClasses.forest, 2,
				g_TileClasses.metal, 4,
				g_TileClasses.mountain, 2,
				g_TileClasses.player, 20,
				g_TileClasses.rock, 4,
				g_TileClasses.water, 2
			],
			"stay": [zone.tileClass, 0],
			"sizes": ["normal"],
			"mixes": ["normal"],
			"amounts": zone.amounts.berries ? zone.amounts.berries : ["normal"]
		},
		{
			"func": addPastures,
			"avoid": [
				g_TileClasses.berries, 10,
				g_TileClasses.pasture, 30,
				g_TileClasses.forest, 2,
				g_TileClasses.metal, 4,
				g_TileClasses.mountain, 2,
				g_TileClasses.player, 20,
				g_TileClasses.rock, 4,
				g_TileClasses.water, 2
			],
			"stay": [zone.tileClass, 0],
			"sizes": ["normal"],
			"mixes": ["normal"],
			"amounts": zone.amounts.pastures ? zone.amounts.pastures : ["normal"]
		},
		{
			"func": addAnimals,
			"avoid": [
				g_TileClasses.animals, 10,
				g_TileClasses.forest, 1,
				g_TileClasses.metal, 2,
				g_TileClasses.mountain, 1,
				g_TileClasses.player, 15,
				g_TileClasses.rock, 2,
				g_TileClasses.water, 3
			],
			"stay": [zone.tileClass, 0],
			"sizes": ["normal"],
			"mixes": ["normal"],
			"amounts": zone.amounts.animals ? zone.amounts.animals : ["normal"]
		},
				{
			"func": addAnimals,
			"avoid": [
				g_TileClasses.animals, 10,
				g_TileClasses.forest, 1,
				g_TileClasses.metal, 2,
				g_TileClasses.mountain, 1,
				g_TileClasses.player, 15,
				g_TileClasses.rock, 2,
				g_TileClasses.water, 1
			],
			"stay": [zone.tileClass, 0],
			"sizes": ["small"],
			"mixes": ["normal"],
			"amounts": zone.amounts.berries ? zone.amounts.berries : ["normal"]
		},
		{
			"func": addStragglerTrees,
			"avoid": [
				g_TileClasses.berries, 5,
				g_TileClasses.pasture, 5,
				g_TileClasses.forest, 5,
				g_TileClasses.metal, 2,
				g_TileClasses.mountain, 1,
				g_TileClasses.player, 12,
				g_TileClasses.rock, 2,
				g_TileClasses.water, 3
			],
			"stay": [zone.tileClass, 0],
			"sizes": ["normal"],
			"mixes": ["normal"],
			"amounts": ["some"]
		},
		{
			"func": addLayeredPatches,
			"avoid": [
				g_TileClasses.dirt, 5,
				g_TileClasses.forest, 2,
				g_TileClasses.mountain, 2,
				g_TileClasses.player, 12,
				g_TileClasses.water, 3
			],
			"stay": [zone.tileClass, 0],
			"sizes": ["normal"],
			"mixes": ["normal"],
			"amounts": ["tons"]
		},
		{
			"func": addDecoration,
			"avoid": [
				g_TileClasses.pasture, 5,
				g_TileClasses.forest, 2,
				g_TileClasses.mountain, 2,
				g_TileClasses.player, 12,
				g_TileClasses.water, 4
			],
			"stay": [zone.tileClass, 0],
			"sizes": ["small"],
			"mixes": ["same"],
			"amounts": ["normal"]
		}
	]);
}
Engine.SetProgress(60);

g_Map.log("Painting water");
createArea(
	new MapBoundsPlacer(),
	new TerrainPainter(tWater),
	new HeightConstraint(-Infinity, heightWaterLevel));

g_Map.log("Painting snow on mountains");
createArea(
	new MapBoundsPlacer(),
	new TerrainPainter(tSnowedRocks),
	[
		new HeightConstraint(heightSnow, Infinity),
		avoidClasses(
			g_TileClasses.africa, 0,
			g_TileClasses.southern_europe, 0,
			g_TileClasses.player, 6)
	]);

Engine.SetProgress(70);

g_Map.log("Placing fish");
g_Gaia.fish = "gaia/fish/generic";
addElements([
	{
		"func": addFish,
		"avoid": [
			g_TileClasses.fish, 10,
		],
		"stay": [g_TileClasses.water, 4],
		"sizes": ["normal"],
		"mixes": ["similar"],
		"amounts": ["many"]
	}
]);
Engine.SetProgress(85);

g_Map.log("Placing whale");
g_Gaia.fish = "gaia/fauna_whale_fin";
addElements([
	{
		"func": addFish,
		"avoid": [
			g_TileClasses.fish, 2,
			g_TileClasses.desert, 50,
			g_TileClasses.steppe, 50
		],
		"stay": [g_TileClasses.water, 7],
		"sizes": ["small"],
		"mixes": ["same"],
		"amounts": ["scarce"]
	}
]);
Engine.SetProgress(95);

placePlayersNomad(
	g_Map.createTileClass(),
	[
		stayClasses(g_TileClasses.land, 5),
		avoidClasses(
			g_TileClasses.forest, 2,
			g_TileClasses.rock, 4,
			g_TileClasses.metal, 4,
			g_TileClasses.berries, 2,
			g_TileClasses.animals, 2,
			g_TileClasses.mountain, 2)
	]);

setWindAngle(-0.589049);
setWaterTint(0.556863, 0.615686, 0.643137);
setWaterColor(0.494118, 0.639216, 0.713726);
setWaterWaviness(8);
setWaterMurkiness(0.87);
setWaterType("ocean");

setAmbientColor(0.72, 0.72, 0.82);

setSunColor(0.733, 0.746, 0.574);
setSunRotation(Math.PI * 0.95);
setSunElevation(Math.PI / 6);

setSkySet("cumulus");
setFogFactor(0);
setFogThickness(0);
setFogColor(0.69, 0.616, 0.541);

setPPEffect("hdr");
setPPContrast(0.67);
setPPSaturation(0.42);
setPPBloom(0.23);

g_Map.ExportMap();
