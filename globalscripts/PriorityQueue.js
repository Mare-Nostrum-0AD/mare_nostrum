// implementation of a heap consistings of entries in the format [item, priority]
// item being the relevant data and priority being the number used to rank each entry
// can be implemented as either a min heap or max heap (defaults to min heap)

// @param isMinHeap		boolean			whether should be implemented as a min heap or max heap
function PriorityQueue(compare = (a, b) => a < b) {
	this.compare = compare;
	this.values = [null];
}

PriorityQueue.prototype.push = function(item, priority) {
	this.values.push([item, priority]);
	// percolate the value upward
	for (let i = this.values.length - 1; i >> 1; i >>= 1) {
		if (this.compare(this.values[i][1], this.values[i >> 1][1])) {
			const tmp = this.values[i >> 1];
			this.values[i >> 1] = this.values[i];
			this.values[i] = tmp;
		}
	}
}

PriorityQueue.prototype.peek = function() {
	if (this.values.length < 2)
		return undefined;
	return this.values[1][0];
}

PriorityQueue.prototype.pop = function() {
	if (this.values.length < 2)
		return undefined;
	const ret = this.values[1][0];
	this.values[1] = this.values[this.values.length - 1];
	this.values.length--;
	// percolate top item downward
	const getPrefChild = (i) => {
		if ((i << 1) + 1 > this.values.length - 1)
			return i << 1;
		return this.compare(this.values[i << 1][1], this.values[(i << 1) + 1][1]) ?
			i << 1 :
			(i << 1) + 1;
	};
	for (let i = 1; i << 1 <= this.values.length - 1;) {
		const prefChild = getPrefChild(i);
		if (!this.compare(this.values[i][1], this.values[prefChild][1])) {
			const tmp = this.values[i];
			this.values[i] = this.values[prefChild];
			this.values[prefChild] = tmp;
		}
		i = prefChild;
	}
	return ret;
}
