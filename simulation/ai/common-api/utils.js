var API3 = function(m)
{

m.warn = function(output)
{
	if (typeof output === "string")
		warn("PlayerID " + PlayerID + " |   " + output);
	else
		warn("PlayerID " + PlayerID + " |   " + uneval(output));
};

m.warnf = function(fmt, ...args)
{
	m.warn(sprintf(fmt, ...args));
};

/**
 * Useful for simulating consecutive AI matches.
 */
m.exit = function()
{
	Engine.Exit();
};

m.VectorDistance = function(a, b)
{
	return Math.euclidDistance2D(a[0], a[1], b[0], b[1]);
};

m.SquareVectorDistance = function(a, b)
{
	return Math.euclidDistance2DSquared(a[0], a[1], b[0], b[1]);
};

/** Utility functions for conversions of maps of different sizes */

/**
 * Returns the index of map2 with max content from indices contained inside the cell i of map1
 * map1.cellSize must be a multiple of map2.cellSize
 */
m.getMaxMapIndex = function(i, map1, map2)
{
	let ratio = map1.cellSize / map2.cellSize;
	let ix = (i % map1.width) * ratio;
	let iy = Math.floor(i / map1.width) * ratio;
	let index;
	for (let kx = 0; kx < ratio; ++kx)
		for (let ky = 0; ky < ratio; ++ky)
			if (!index || map2.map[ix+kx+(iy+ky)*map2.width] > map2.map[index])
				index = ix+kx+(iy+ky)*map2.width;
	return index;
};

/**
 * Returns the list of indices of map2 contained inside the cell i of map1
 * map1.cellSize must be a multiple of map2.cellSize
 */
m.getMapIndices = function(i, map1, map2)
{
	let ratio = map1.cellSize / map2.cellSize;	// TODO check that this is integer >= 1 ?
	let ix = (i % map1.width) * ratio;
	let iy = Math.floor(i / map1.width) * ratio;
	let ret = [];
	for (let kx = 0; kx < ratio; ++kx)
		for (let ky = 0; ky < ratio; ++ky)
			ret.push(ix+kx+(iy+ky)*map2.width);
	return ret;
};

/**
 * Returns the list of points of map2 contained inside the cell i of map1
 * map1.cellSize must be a multiple of map2.cellSize
 */
m.getMapPoints = function(i, map1, map2)
{
	let ratio = map1.cellSize / map2.cellSize;	// TODO check that this is integer >= 1 ?
	let ix = (i % map1.width) * ratio;
	let iy = Math.floor(i / map1.width) * ratio;
	let ret = [];
	for (let kx = 0; kx < ratio; ++kx)
		for (let ky = 0; ky < ratio; ++ky)
			ret.push([ix+kx, iy+ky]);
	return ret;
};

// a "lazy pathfinder" implementing the A* pathfinding algorithm
// generates an array of points from game position <start> to game position <dest> at <stride> distance from each other
// each point is validated using <validator>, which takes the x and z coordinates as its two arguments
// returns undefined if cannot find a path less than or equal to <maxDist> in length
// @return		[{"x": Number, "z": Number}...]		an array of game points, which can be used as route data for setup-trade-route, for example
m.findPath = function(validator, start, dest, maxDist, stride=8)
{
	const pq = new PriorityQueue();
	const visited = new NSet(2);
	const endDistSq = Math.pow(stride, 2);
	const distDiag = Math.pow(Math.pow(stride, 2) * 2, 0.5);
	const offsets = [
		[-stride, -stride, distDiag], [0, -stride, stride], [stride, -stride, distDiag],
		[-stride, 0, stride], [stride, 0, stride],
		[-stride, stride, distDiag], [0, stride, stride], [stride, stride, distDiag]];
	let currentNode = { "position": start, "dist": 0 };
	for (; currentNode; currentNode = pq.pop())
	{
		const { position, dist } = currentNode;
		const [x, z] = position;
		if (visited.has(x, z))
			continue;
		visited.add(x, z);
		if (m.SquareVectorDistance(position, dest) <= endDistSq)
			break;
		if (dist >= maxDist)
			continue;
		for (const [offsetX, offsetZ, offsetDist] of offsets)
		{
			const nextPos = [x + offsetX, z + offsetZ];
			const [isValid, bias] = validator(...nextPos);
			if (!isValid)
				continue;
			const nextNode = {
				"position": nextPos,
				"dist": dist + offsetDist,
				"prev": currentNode
			};
			const heuristic = m.SquareVectorDistance(nextPos, dest) + Math.pow(nextNode.dist, 2) - bias;
			pq.push(nextNode, heuristic);
		}
	}
	if (!currentNode)
		return [undefined, -1];
	const { dist } = currentNode;
	const points = [];
	for (; currentNode.prev; currentNode = currentNode.prev)
		points.unshift({
			"x": currentNode.position[0],
			"z": currentNode.position[1]
		});
	return [points, dist];
};

return m;

}(API3);
