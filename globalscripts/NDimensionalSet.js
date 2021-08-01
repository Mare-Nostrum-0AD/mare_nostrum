// creates a set that checks for inclusion of values determined by N comparable keys

// @param size			Integer			number N comparable keys to use
// @param initEntires	[[Comparable]]	initial comparable values to enter
function NSet(depth, initEntries) {
	if (depth < 1)
		throw new Error(sprintf("Depth must be greater than or equal to 1 (got %d)", depth));
	this.depth = depth;
	this.values = {};
	this.size = 0;
	if (!initEntries)
		return;
	for (const entry of initEntries)
		this.add(...entry);
}

NSet.prototype.add = function(...values)
{
	if (!values || values.length !== this.depth)
		throw new Error(sprintf("Expected %d values; got %d", this.depth, values ? values.length : 0));
	if (this.depth === 1)
		this.values[values[0]] = true;
	else if (this.values[values[0]])
		this.values[values[0]].add(values.slice(1));
	else
		this.values[values[0]] = new NSet(this.depth - 1, [values.slice(1)]);
	this.size++;
	return this;
};

NSet.prototype.clear = function()
{
	this.values = {};
	this.size = 0;
};

NSet.prototype.delete = function(...values)
{
	if (!values || values.length !== this.depth)
		throw new Error(sprintf("Expected %d values; got %d", this.depth, values ? values.length : 0));
	if (this.depth === 1)
	{
		const ret = this.values.hasOwnProperty(values[0]);
		delete(this.values[values[0]]);
		if (ret)
			this.size--;
		return ret;
	}
	if (this.values[values[0]])
	{
		const ret = this.values[values[0]].delete(values.slice(1));
		if (ret)
			this.size--;
		return ret;
	}
	return false;
};

NSet.prototype.has = function(...values)
{
	if (!values || values.length !== this.depth)
		throw new Error(sprintf("Expected %d values; got %d", this.depth, values ? values.length : 0));
	if (this.depth === 1)
		return this.values.hasOwnProperty(values[0]);
	if (this.values[values[0]])
		return this.values[values[0]].has(values.slice(1));
	return false;
};

