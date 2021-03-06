"use strict";

var Shared = require('./Shared'),
	Path = require('./Path'),
	sharedPathSolver = new Path();

var BinaryTree = function (data, compareFunc, hashFunc) {
	this.init.apply(this, arguments);
};

BinaryTree.prototype.init = function (data, index, primaryKey, compareFunc, hashFunc) {
	this._store = [];
	this._keys = [];

	if (primaryKey !== undefined) { this.primaryKey(primaryKey); }
	if (index !== undefined) { this.index(index); }
	if (compareFunc !== undefined) { this.compareFunc(compareFunc); }
	if (hashFunc !== undefined) { this.hashFunc(hashFunc); }
	if (data !== undefined) { this.data(data); }
};

Shared.addModule('BinaryTree', BinaryTree);
Shared.mixin(BinaryTree.prototype, 'Mixin.ChainReactor');
Shared.mixin(BinaryTree.prototype, 'Mixin.Sorting');
Shared.mixin(BinaryTree.prototype, 'Mixin.Common');

Shared.synthesize(BinaryTree.prototype, 'compareFunc');
Shared.synthesize(BinaryTree.prototype, 'hashFunc');
Shared.synthesize(BinaryTree.prototype, 'indexDir');
Shared.synthesize(BinaryTree.prototype, 'primaryKey');
Shared.synthesize(BinaryTree.prototype, 'keys');
Shared.synthesize(BinaryTree.prototype, 'index', function (index) {
	if (index !== undefined) {
		if (this.debug()) {
			console.log('Setting index', index, sharedPathSolver.parse(index, true));
		}

		// Convert the index object to an array of key val objects
		this.keys(sharedPathSolver.parse(index, true));
	}

	return this.$super.call(this, index);
});

/**
 * Remove all data from the binary tree.
 */
BinaryTree.prototype.clear = function () {
	delete this._data;
	delete this._left;
	delete this._right;

	this._store = [];
};

/**
 * Sets this node's data object. All further inserted documents that
 * match this node's key and value will be pushed via the push()
 * method into the this._store array. When deciding if a new data
 * should be created left, right or middle (pushed) of this node the
 * new data is checked against the data set via this method.
 * @param val
 * @returns {*}
 */
BinaryTree.prototype.data = function (val) {
	if (val !== undefined) {
		this._data = val;

		if (this._hashFunc) { this._hash = this._hashFunc(val); }
		return this;
	}

	return this._data;
};

/**
 * Pushes an item to the binary tree node's store array.
 * @param {*} val The item to add to the store.
 * @returns {*}
 */
BinaryTree.prototype.push = function (val) {
	if (val !== undefined) {
		this._store.push(val);
		return this;
	}

	return false;
};

/**
 * Pulls an item from the binary tree node's store array.
 * @param {*} val The item to remove from the store.
 * @returns {*}
 */
BinaryTree.prototype.pull = function (val) {
	if (val !== undefined) {
		var index = this._store.indexOf(val);

		if (index > -1) {
			this._store.splice(index, 1);
			return this;
		}
	}

	return false;
};

/**
 * Default compare method. Can be overridden.
 * @param a
 * @param b
 * @returns {Number}
 * @private
 */
BinaryTree.prototype._compareFunc = function (a, b) {
	// Loop the index array
	var i,
		indexData,
		result = 0;

	for (i = 0; i < this._keys.length; i++) {
		indexData = this._keys[i];

		if (indexData.value === 1) {
			result = this.sortAscIgnoreUndefined(sharedPathSolver.get(a, indexData.path), sharedPathSolver.get(b, indexData.path));
		} else if (indexData.value === -1) {
			result = this.sortDescIgnoreUndefined(sharedPathSolver.get(a, indexData.path), sharedPathSolver.get(b, indexData.path));
		}

		if (this.debug()) {
			console.log('Compared %s with %s order %d in path %s and result was %d', sharedPathSolver.get(a, indexData.path), sharedPathSolver.get(b, indexData.path), indexData.value, indexData.path, result);
		}

		if (result !== 0) {
			if (this.debug()) {
				console.log('Retuning result %d', result);
			}
			return result;
		}
	}

	if (this.debug()) {
		console.log('Retuning result %d', result);
	}

	return result;
};

/**
 * Default hash function. Can be overridden.
 * @param obj
 * @private
 */
BinaryTree.prototype._hashFunc = function (obj) {
	/*var i,
		indexData,
		hash = '';

	for (i = 0; i < this._keys.length; i++) {
		indexData = this._keys[i];

		if (hash) { hash += '_'; }
		hash += obj[indexData.path];
	}

	return hash;*/

	return obj[this._keys[0].path];
};

/**
 * Removes (deletes reference to) either left or right child if the passed
 * node matches one of them.
 * @param {BinaryTree} node The node to remove.
 */
BinaryTree.prototype.removeChildNode = function (node) {
	if (this._left === node) {
		// Remove left
		delete this._left;
	} else if (this._right === node) {
		// Remove right
		delete this._right;
	}
};

/**
 * Returns the branch this node matches (left or right).
 * @param node
 * @returns {String}
 */
BinaryTree.prototype.nodeBranch = function (node) {
	if (this._left === node) {
		return 'left';
	} else if (this._right === node) {
		return 'right';
	}
};

/**
 * Inserts a document into the binary tree.
 * @param data
 * @returns {*}
 */
BinaryTree.prototype.insert = function (data) {
	var result,
		inserted,
		failed,
		i;

	if (data instanceof Array) {
		// Insert array of data
		inserted = [];
		failed = [];

		for (i = 0; i < data.length; i++) {
			if (this.insert(data[i])) {
				inserted.push(data[i]);
			} else {
				failed.push(data[i]);
			}
		}

		return {
			inserted: inserted,
			failed: failed
		};
	}

	if (this.debug()) {
		console.log('Inserting', data);
	}

	if (!this._data) {
		if (this.debug()) {
			console.log('Node has no data, setting data', data);
		}
		// Insert into this node (overwrite) as there is no data
		this.data(data);
		//this.push(data);
		return true;
	}

	result = this._compareFunc(this._data, data);

	if (result === 0) {
		if (this.debug()) {
			console.log('Data is equal (currrent, new)', this._data, data);
		}

		//this.push(data);

		// Less than this node
		if (this._left) {
			// Propagate down the left branch
			this._left.insert(data);
		} else {
			// Assign to left branch
			this._left = new BinaryTree(data, this._index, this._binaryTree, this._compareFunc, this._hashFunc);
			this._left._parent = this;
		}

		return true;
	}

	if (result === -1) {
		if (this.debug()) {
			console.log('Data is greater (currrent, new)', this._data, data);
		}

		// Greater than this node
		if (this._right) {
			// Propagate down the right branch
			this._right.insert(data);
		} else {
			// Assign to right branch
			this._right = new BinaryTree(data, this._index, this._binaryTree, this._compareFunc, this._hashFunc);
			this._right._parent = this;
		}

		return true;
	}

	if (result === 1) {
		if (this.debug()) {
			console.log('Data is less (currrent, new)', this._data, data);
		}

		// Less than this node
		if (this._left) {
			// Propagate down the left branch
			this._left.insert(data);
		} else {
			// Assign to left branch
			this._left = new BinaryTree(data, this._index, this._binaryTree, this._compareFunc, this._hashFunc);
			this._left._parent = this;
		}

		return true;
	}

	return false;
};

BinaryTree.prototype.remove = function (data) {
	var pk = this.primaryKey(),
		result,
		removed,
		i;

	if (data instanceof Array) {
		// Insert array of data
		removed = [];

		for (i = 0; i < data.length; i++) {
			if (this.remove(data[i])) {
				removed.push(data[i]);
			}
		}

		return removed;
	}

	if (this.debug()) {
		console.log('Removing', data);
	}

	if (this._data[pk] === data[pk]) {
		// Remove this node
		return this._remove(this);
	}

	// Compare the data to work out which branch to send the remove command down
	result = this._compareFunc(this._data, data);

	if (result === -1 && this._right) {
		return this._right.remove(data);
	}

	if (result === 1 && this._left) {
		return this._left.remove(data);
	}

	return false;
};

BinaryTree.prototype._remove = function (node) {
	var leftNode,
		rightNode;

	if (this._left) {
		// Backup branch data
		leftNode = this._left;
		rightNode = this._right;

		// Copy data from left node
		this._left = leftNode._left;
		this._right = leftNode._right;
		this._data = leftNode._data;
		this._store = leftNode._store;

		if (rightNode) {
			// Attach the rightNode data to the right-most node
			// of the leftNode
			leftNode.rightMost()._right = rightNode;
		}
	} else if (this._right) {
		// Backup branch data
		rightNode = this._right;

		// Copy data from right node
		this._left = rightNode._left;
		this._right = rightNode._right;
		this._data = rightNode._data;
		this._store = rightNode._store;
	} else {
		this.clear();
	}

	return true;
};

BinaryTree.prototype.leftMost = function () {
	if (!this._left) {
		return this;
	} else {
		return this._left.leftMost();
	}
};

BinaryTree.prototype.rightMost = function () {
	if (!this._right) {
		return this;
	} else {
		return this._right.rightMost();
	}
};

/**
 * Searches the binary tree for all matching documents based on the data
 * passed (query).
 * @param {Object} data The data / document to use for lookups.
 * @param {Object} options An options object.
 * @param {Operation} op An optional operation instance. Pass undefined
 * if not being used.
 * @param {Array=} resultArr The results passed between recursive calls.
 * Do not pass anything into this argument when calling externally.
 * @returns {*|Array}
 */
BinaryTree.prototype.lookup = function (data, options, op, resultArr) {
	var result = this._compareFunc(this._data, data);

	resultArr = resultArr || [];

	if (result === 0) {
		if (this._left) { this._left.lookup(data, options, op, resultArr); }
		resultArr.push(this._data);
		if (this._right) { this._right.lookup(data, options, op, resultArr); }
	}

	if (result === -1) {
		if (this._right) { this._right.lookup(data, options, op, resultArr); }
	}

	if (result === 1) {
		if (this._left) { this._left.lookup(data, options, op, resultArr); }
	}

	return resultArr;
};

/**
 * Returns the entire binary tree ordered.
 * @param {String} type
 * @param resultArr
 * @returns {*|Array}
 */
BinaryTree.prototype.inOrder = function (type, resultArr) {
	resultArr = resultArr || [];

	if (this._left) {
		this._left.inOrder(type, resultArr);
	}

	switch (type) {
		case 'hash':
			resultArr.push(this._hash);
			break;

		case 'data':
			resultArr.push(this._data);
			break;

		default:
			resultArr.push({
				key: this._data,
				arr: this._store
			});
			break;
	}

	if (this._right) {
		this._right.inOrder(type, resultArr);
	}

	return resultArr;
};

/**
 * Searches the binary tree for all matching documents based on the regular
 * expression passed.
 * @param path
 * @param val
 * @param regex
 * @param {Array=} resultArr The results passed between recursive calls.
 * Do not pass anything into this argument when calling externally.
 * @returns {*|Array}
 */
BinaryTree.prototype.startsWith = function (path, val, regex, resultArr) {
	var reTest,
		thisDataPathVal = sharedPathSolver.get(this._data, path),
		thisDataPathValSubStr = thisDataPathVal.substr(0, val.length),
		result;

	//regex = regex || new RegExp('^' + val);
	resultArr = resultArr || [];

	if (resultArr._visitedCount === undefined) { resultArr._visitedCount = 0; }
	resultArr._visitedCount++;
	resultArr._visitedNodes = resultArr._visitedNodes || [];
	resultArr._visitedNodes.push(thisDataPathVal);

	result = this.sortAscIgnoreUndefined(thisDataPathValSubStr, val);
	reTest = thisDataPathValSubStr === val;

	if (result === 0) {
		if (this._left) { this._left.startsWith(path, val, regex, resultArr); }
		if (reTest) { resultArr.push(this._data); }
		if (this._right) { this._right.startsWith(path, val, regex, resultArr); }
	}

	if (result === -1) {
		if (reTest) { resultArr.push(this._data); }
		if (this._right) { this._right.startsWith(path, val, regex, resultArr); }
	}

	if (result === 1) {
		if (this._left) { this._left.startsWith(path, val, regex, resultArr); }
		if (reTest) { resultArr.push(this._data); }
	}

	return resultArr;
};

/*BinaryTree.prototype.find = function (type, search, resultArr) {
	resultArr = resultArr || [];

	if (this._left) {
		this._left.find(type, search, resultArr);
	}

	// Check if this node's data is greater or less than the from value
	var fromResult = this.sortAsc(this._data[key], from),
			toResult = this.sortAsc(this._data[key], to);

	if ((fromResult === 0 || fromResult === 1) && (toResult === 0 || toResult === -1)) {
		// This data node is greater than or equal to the from value,
		// and less than or equal to the to value so include it
		switch (type) {
			case 'hash':
				resultArr.push(this._hash);
				break;

			case 'data':
				resultArr.push(this._data);
				break;

			default:
				resultArr.push({
					key: this._data,
					arr: this._store
				});
				break;
		}
	}

	if (this._right) {
		this._right.find(type, search, resultArr);
	}

	return resultArr;
};*/

/**
 *
 * @param {String} type
 * @param {String} key The data key / path to range search against.
 * @param {Number} from Range search from this value (inclusive)
 * @param {Number} to Range search to this value (inclusive)
 * @param {Array=} resultArr Leave undefined when calling (internal use),
 * passes the result array between recursive calls to be returned when
 * the recursion chain completes.
 * @param {Path=} pathResolver Leave undefined when calling (internal use),
 * caches the path resolver instance for performance.
 * @returns {Array} Array of matching document objects
 */
BinaryTree.prototype.findRange = function (type, key, from, to, resultArr, pathResolver) {
	resultArr = resultArr || [];
	pathResolver = pathResolver || new Path(key);

	if (this._left) {
		this._left.findRange(type, key, from, to, resultArr, pathResolver);
	}

	// Check if this node's data is greater or less than the from value
	var pathVal = pathResolver.value(this._data),
		fromResult = this.sortAscIgnoreUndefined(pathVal, from),
		toResult = this.sortAscIgnoreUndefined(pathVal, to);

	if ((fromResult === 0 || fromResult === 1) && (toResult === 0 || toResult === -1)) {
		// This data node is greater than or equal to the from value,
		// and less than or equal to the to value so include it
		switch (type) {
			case 'hash':
				resultArr.push(this._hash);
				break;

			case 'data':
				resultArr.push(this._data);
				break;

			default:
				resultArr.push({
					key: this._data,
					arr: this._store
				});
				break;
		}
	}

	if (this._right) {
		this._right.findRange(type, key, from, to, resultArr, pathResolver);
	}

	return resultArr;
};

/*BinaryTree.prototype.findRegExp = function (type, key, pattern, resultArr) {
	resultArr = resultArr || [];

	if (this._left) {
		this._left.findRegExp(type, key, pattern, resultArr);
	}

	// Check if this node's data is greater or less than the from value
	var fromResult = this.sortAsc(this._data[key], from),
			toResult = this.sortAsc(this._data[key], to);

	if ((fromResult === 0 || fromResult === 1) && (toResult === 0 || toResult === -1)) {
		// This data node is greater than or equal to the from value,
		// and less than or equal to the to value so include it
		switch (type) {
			case 'hash':
				resultArr.push(this._hash);
				break;

			case 'data':
				resultArr.push(this._data);
				break;

			default:
				resultArr.push({
					key: this._data,
					arr: this._store
				});
				break;
		}
	}

	if (this._right) {
		this._right.findRegExp(type, key, pattern, resultArr);
	}

	return resultArr;
};*/

/**
 * Determines if the passed query and options object will be served
 * by this index successfully or not and gives a score so that the
 * DB search system can determine how useful this index is in comparison
 * to other indexes on the same collection.
 * @param query
 * @param queryOptions
 * @param matchOptions
 * @returns {{matchedKeys: Array, totalKeyCount: Number, score: number}}
 */
BinaryTree.prototype.match = function (query, queryOptions, matchOptions) {
	// Check if the passed query has data in the keys our index
	// operates on and if so, is the query sort matching our order
	var indexKeyArr,
		queryArr,
		matchedKeys = [],
		matchedKeyCount = 0,
		i;

	indexKeyArr = sharedPathSolver.parseArr(this._index, {
		verbose: true
	});

	queryArr = sharedPathSolver.parseArr(query, matchOptions && matchOptions.pathOptions ? matchOptions.pathOptions : {
		ignore:/\$/,
		verbose: true
	});

	// Loop the query array and check the order of keys against the
	// index key array to see if this index can be used
	for (i = 0; i < indexKeyArr.length; i++) {
		if (queryArr[i] === indexKeyArr[i]) {
			matchedKeyCount++;
			matchedKeys.push(queryArr[i]);
		}
	}

	return {
		matchedKeys: matchedKeys,
		totalKeyCount: queryArr.length,
		score: matchedKeyCount
	};

	//return sharedPathSolver.countObjectPaths(this._keys, query);
};

Shared.finishModule('BinaryTree');
module.exports = BinaryTree;