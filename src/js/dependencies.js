//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind,
    nativeCreate       = Object.create;

  // Naked function reference for surrogate-prototype-swapping.
  var Ctor = function(){};

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.8.3';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var optimizeCb = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  // A mostly-internal function to generate callbacks that can be applied
  // to each element in a collection, returning the desired result — either
  // identity, an arbitrary callback, a property matcher, or a property accessor.
  var cb = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    if (_.isObject(value)) return _.matcher(value);
    return _.property(value);
  };
  _.iteratee = function(value, context) {
    return cb(value, context, Infinity);
  };

  // An internal function for creating assigner functions.
  var createAssigner = function(keysFunc, undefinedOnly) {
    return function(obj) {
      var length = arguments.length;
      if (length < 2 || obj == null) return obj;
      for (var index = 1; index < length; index++) {
        var source = arguments[index],
            keys = keysFunc(source),
            l = keys.length;
        for (var i = 0; i < l; i++) {
          var key = keys[i];
          if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
        }
      }
      return obj;
    };
  };

  // An internal function for creating a new object that inherits from another.
  var baseCreate = function(prototype) {
    if (!_.isObject(prototype)) return {};
    if (nativeCreate) return nativeCreate(prototype);
    Ctor.prototype = prototype;
    var result = new Ctor;
    Ctor.prototype = null;
    return result;
  };

  var property = function(key) {
    return function(obj) {
      return obj == null ? void 0 : obj[key];
    };
  };

  // Helper for collection methods to determine whether a collection
  // should be iterated as an array or as an object
  // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
  // Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094
  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
  var getLength = property('length');
  var isArrayLike = function(collection) {
    var length = getLength(collection);
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    iteratee = optimizeCb(iteratee, context);
    var i, length;
    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length);
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  // Create a reducing function iterating left or right.
  function createReduce(dir) {
    // Optimized iterator function as using arguments.length
    // in the main function will deoptimize the, see #1991.
    function iterator(obj, iteratee, memo, keys, index, length) {
      for (; index >= 0 && index < length; index += dir) {
        var currentKey = keys ? keys[index] : index;
        memo = iteratee(memo, obj[currentKey], currentKey, obj);
      }
      return memo;
    }

    return function(obj, iteratee, memo, context) {
      iteratee = optimizeCb(iteratee, context, 4);
      var keys = !isArrayLike(obj) && _.keys(obj),
          length = (keys || obj).length,
          index = dir > 0 ? 0 : length - 1;
      // Determine the initial value if none is provided.
      if (arguments.length < 3) {
        memo = obj[keys ? keys[index] : index];
        index += dir;
      }
      return iterator(obj, iteratee, memo, keys, index, length);
    };
  }

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = createReduce(1);

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = createReduce(-1);

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var key;
    if (isArrayLike(obj)) {
      key = _.findIndex(obj, predicate, context);
    } else {
      key = _.findKey(obj, predicate, context);
    }
    if (key !== void 0 && key !== -1) return obj[key];
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    predicate = cb(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(cb(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given item (using `===`).
  // Aliased as `includes` and `include`.
  _.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {
    if (!isArrayLike(obj)) obj = _.values(obj);
    if (typeof fromIndex != 'number' || guard) fromIndex = 0;
    return _.indexOf(obj, item, fromIndex) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      var func = isFunc ? method : value[method];
      return func == null ? func : func.apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matcher(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matcher(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var set = isArrayLike(obj) ? obj : _.values(obj);
    var length = set.length;
    var shuffled = Array(length);
    for (var index = 0, rand; index < length; index++) {
      rand = _.random(0, index);
      if (rand !== index) shuffled[index] = shuffled[rand];
      shuffled[rand] = set[index];
    }
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (!isArrayLike(obj)) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iteratee(value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iteratee, context) {
      var result = {};
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key]++; else result[key] = 1;
  });

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (isArrayLike(obj)) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return isArrayLike(obj) ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var pass = [], fail = [];
    _.each(obj, function(value, key, obj) {
      (predicate(value, key, obj) ? pass : fail).push(value);
    });
    return [pass, fail];
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[0];
    return _.initial(array, array.length - n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return _.rest(array, Math.max(0, array.length - n));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, startIndex) {
    var output = [], idx = 0;
    for (var i = startIndex || 0, length = getLength(input); i < length; i++) {
      var value = input[i];
      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
        //flatten current level of array or arguments object
        if (!shallow) value = flatten(value, shallow, strict);
        var j = 0, len = value.length;
        output.length += len;
        while (j < len) {
          output[idx++] = value[j++];
        }
      } else if (!strict) {
        output[idx++] = value;
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = cb(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = getLength(array); i < length; i++) {
      var value = array[i],
          computed = iteratee ? iteratee(value, i, array) : value;
      if (isSorted) {
        if (!i || seen !== computed) result.push(value);
        seen = computed;
      } else if (iteratee) {
        if (!_.contains(seen, computed)) {
          seen.push(computed);
          result.push(value);
        }
      } else if (!_.contains(result, value)) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(flatten(arguments, true, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = getLength(array); i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue;
      for (var j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = flatten(arguments, true, true, 1);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    return _.unzip(arguments);
  };

  // Complement of _.zip. Unzip accepts an array of arrays and groups
  // each array's elements on shared indices
  _.unzip = function(array) {
    var length = array && _.max(array, getLength).length || 0;
    var result = Array(length);

    for (var index = 0; index < length; index++) {
      result[index] = _.pluck(array, index);
    }
    return result;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    var result = {};
    for (var i = 0, length = getLength(list); i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Generator function to create the findIndex and findLastIndex functions
  function createPredicateIndexFinder(dir) {
    return function(array, predicate, context) {
      predicate = cb(predicate, context);
      var length = getLength(array);
      var index = dir > 0 ? 0 : length - 1;
      for (; index >= 0 && index < length; index += dir) {
        if (predicate(array[index], index, array)) return index;
      }
      return -1;
    };
  }

  // Returns the first index on an array-like that passes a predicate test
  _.findIndex = createPredicateIndexFinder(1);
  _.findLastIndex = createPredicateIndexFinder(-1);

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = getLength(array);
    while (low < high) {
      var mid = Math.floor((low + high) / 2);
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Generator function to create the indexOf and lastIndexOf functions
  function createIndexFinder(dir, predicateFind, sortedIndex) {
    return function(array, item, idx) {
      var i = 0, length = getLength(array);
      if (typeof idx == 'number') {
        if (dir > 0) {
            i = idx >= 0 ? idx : Math.max(idx + length, i);
        } else {
            length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
        }
      } else if (sortedIndex && idx && length) {
        idx = sortedIndex(array, item);
        return array[idx] === item ? idx : -1;
      }
      if (item !== item) {
        idx = predicateFind(slice.call(array, i, length), _.isNaN);
        return idx >= 0 ? idx + i : -1;
      }
      for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
        if (array[idx] === item) return idx;
      }
      return -1;
    };
  }

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
  _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (stop == null) {
      stop = start || 0;
      start = 0;
    }
    step = step || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Determines whether to execute a function as a constructor
  // or a normal function with the provided arguments
  var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
    var self = baseCreate(sourceFunc.prototype);
    var result = sourceFunc.apply(self, args);
    if (_.isObject(result)) return result;
    return self;
  };

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    var args = slice.call(arguments, 2);
    var bound = function() {
      return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
    };
    return bound;
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    var bound = function() {
      var position = 0, length = boundArgs.length;
      var args = Array(length);
      for (var i = 0; i < length; i++) {
        args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return executeBound(func, bound, this, this, args);
    };
    return bound;
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var i, length = arguments.length, key;
    if (length <= 1) throw new Error('bindAll must be passed function names');
    for (i = 1; i < length; i++) {
      key = arguments[i];
      obj[key] = _.bind(obj[key], obj);
    }
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = '' + (hasher ? hasher.apply(this, arguments) : key);
      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){
      return func.apply(null, args);
    }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = _.partial(_.delay, _, 1);

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;

      if (last < wait && last >= 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Returns a function that will only be executed on and after the Nth call.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed up to (but not including) the Nth call.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      }
      if (times <= 1) func = null;
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  // Object Functions
  // ----------------

  // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
  var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
  var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
                      'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

  function collectNonEnumProps(obj, keys) {
    var nonEnumIdx = nonEnumerableProps.length;
    var constructor = obj.constructor;
    var proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto;

    // Constructor is a special case.
    var prop = 'constructor';
    if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

    while (nonEnumIdx--) {
      prop = nonEnumerableProps[nonEnumIdx];
      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
        keys.push(prop);
      }
    }
  }

  // Retrieve the names of an object's own properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve all the property names of an object.
  _.allKeys = function(obj) {
    if (!_.isObject(obj)) return [];
    var keys = [];
    for (var key in obj) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Returns the results of applying the iteratee to each element of the object
  // In contrast to _.map it returns an object
  _.mapObject = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys =  _.keys(obj),
          length = keys.length,
          results = {},
          currentKey;
      for (var index = 0; index < length; index++) {
        currentKey = keys[index];
        results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
      }
      return results;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = createAssigner(_.allKeys);

  // Assigns a given object with all the own properties in the passed-in object(s)
  // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
  _.extendOwn = _.assign = createAssigner(_.keys);

  // Returns the first key on an object that passes a predicate test
  _.findKey = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = _.keys(obj), key;
    for (var i = 0, length = keys.length; i < length; i++) {
      key = keys[i];
      if (predicate(obj[key], key, obj)) return key;
    }
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(object, oiteratee, context) {
    var result = {}, obj = object, iteratee, keys;
    if (obj == null) return result;
    if (_.isFunction(oiteratee)) {
      keys = _.allKeys(obj);
      iteratee = optimizeCb(oiteratee, context);
    } else {
      keys = flatten(arguments, false, false, 1);
      iteratee = function(value, key, obj) { return key in obj; };
      obj = Object(obj);
    }
    for (var i = 0, length = keys.length; i < length; i++) {
      var key = keys[i];
      var value = obj[key];
      if (iteratee(value, key, obj)) result[key] = value;
    }
    return result;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj, iteratee, context) {
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
    } else {
      var keys = _.map(flatten(arguments, false, false, 1), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  };

  // Fill in a given object with default properties.
  _.defaults = createAssigner(_.allKeys, true);

  // Creates an object that inherits from the given prototype object.
  // If additional properties are provided then they will be added to the
  // created object.
  _.create = function(prototype, props) {
    var result = baseCreate(prototype);
    if (props) _.extendOwn(result, props);
    return result;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Returns whether an object has a given set of `key:value` pairs.
  _.isMatch = function(object, attrs) {
    var keys = _.keys(attrs), length = keys.length;
    if (object == null) return !length;
    var obj = Object(object);
    for (var i = 0; i < length; i++) {
      var key = keys[i];
      if (attrs[key] !== obj[key] || !(key in obj)) return false;
    }
    return true;
  };


  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
    }

    var areArrays = className === '[object Array]';
    if (!areArrays) {
      if (typeof a != 'object' || typeof b != 'object') return false;

      // Objects with different constructors are not equivalent, but `Object`s or `Array`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                               _.isFunction(bCtor) && bCtor instanceof bCtor)
                          && ('constructor' in a && 'constructor' in b)) {
        return false;
      }
    }
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.
    aStack = aStack || [];
    bStack = bStack || [];
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }

    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);

    // Recursively compare objects and arrays.
    if (areArrays) {
      // Compare array lengths to determine if a deep comparison is necessary.
      length = a.length;
      if (length !== b.length) return false;
      // Deep compare the contents, ignoring non-numeric properties.
      while (length--) {
        if (!eq(a[length], b[length], aStack, bStack)) return false;
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      length = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      if (_.keys(b).length !== length) return false;
      while (length--) {
        // Deep compare each member
        key = keys[length];
        if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return true;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
    return _.keys(obj).length === 0;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE < 9), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
  // IE 11 (#1621), and in Safari 8 (#1929).
  if (typeof /./ != 'function' && typeof Int8Array != 'object') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj !== +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  // Predicate-generating functions. Often useful outside of Underscore.
  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = property;

  // Generates a function for a given object that returns a given property.
  _.propertyOf = function(obj) {
    return obj == null ? function(){} : function(key) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of
  // `key:value` pairs.
  _.matcher = _.matches = function(attrs) {
    attrs = _.extendOwn({}, attrs);
    return function(obj) {
      return _.isMatch(obj, attrs);
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = optimizeCb(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() {
    return new Date().getTime();
  };

   // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property, fallback) {
    var value = object == null ? void 0 : object[property];
    if (value === void 0) {
      value = fallback;
    }
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escaper, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offest.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(instance, obj) {
    return instance._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result(this, func.apply(_, args));
      };
    });
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return result(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // Provide unwrapping proxy for some methods used in engine operations
  // such as arithmetic and JSON stringification.
  _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

  _.prototype.toString = function() {
    return '' + this._wrapped;
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}.call(this));
;// stats.js - http://github.com/mrdoob/stats.js
var Stats=function(){function f(a,e,b){a=document.createElement(a);a.id=e;a.style.cssText=b;return a}function l(a,e,b){var c=f("div",a,"padding:0 0 3px 3px;text-align:left;background:"+b),d=f("div",a+"Text","font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:bold;line-height:15px;color:"+e);d.innerHTML=a.toUpperCase();c.appendChild(d);a=f("div",a+"Graph","width:74px;height:30px;background:"+e);c.appendChild(a);for(e=0;74>e;e++)a.appendChild(f("span","","width:1px;height:30px;float:left;opacity:0.9;background:"+
b));return c}function m(a){for(var b=c.children,d=0;d<b.length;d++)b[d].style.display=d===a?"block":"none";n=a}function p(a,b){a.appendChild(a.firstChild).style.height=Math.min(30,30-30*b)+"px"}var q=self.performance&&self.performance.now?self.performance.now.bind(performance):Date.now,k=q(),r=k,t=0,n=0,c=f("div","stats","width:80px;opacity:0.9;cursor:pointer");c.addEventListener("mousedown",function(a){a.preventDefault();m(++n%c.children.length)},!1);var d=0,u=Infinity,v=0,b=l("fps","#0ff","#002"),
A=b.children[0],B=b.children[1];c.appendChild(b);var g=0,w=Infinity,x=0,b=l("ms","#0f0","#020"),C=b.children[0],D=b.children[1];c.appendChild(b);if(self.performance&&self.performance.memory){var h=0,y=Infinity,z=0,b=l("mb","#f08","#201"),E=b.children[0],F=b.children[1];c.appendChild(b)}m(n);return{REVISION:14,domElement:c,setMode:m,begin:function(){k=q()},end:function(){var a=q();g=a-k;w=Math.min(w,g);x=Math.max(x,g);C.textContent=(g|0)+" MS ("+(w|0)+"-"+(x|0)+")";p(D,g/200);t++;if(a>r+1E3&&(d=Math.round(1E3*
t/(a-r)),u=Math.min(u,d),v=Math.max(v,d),A.textContent=d+" FPS ("+u+"-"+v+")",p(B,d/100),r=a,t=0,void 0!==h)){var b=performance.memory.usedJSHeapSize,c=performance.memory.jsHeapSizeLimit;h=Math.round(9.54E-7*b);y=Math.min(y,h);z=Math.max(z,h);E.textContent=h+" MB ("+y+"-"+z+")";p(F,b/c)}return a},update:function(){k=this.end()}}};"object"===typeof module&&(module.exports=Stats);
;// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ Raphaël 2.1.4 - JavaScript Vector Library                          │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2008-2012 Dmitry Baranovskiy (http://raphaeljs.com)    │ \\
// │ Copyright © 2008-2012 Sencha Labs (http://sencha.com)              │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Licensed under the MIT (http://raphaeljs.com/license.html) license.│ \\
// └────────────────────────────────────────────────────────────────────┘ \\
// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// ┌────────────────────────────────────────────────────────────┐ \\
// │ Eve 0.4.2 - JavaScript Events Library                      │ \\
// ├────────────────────────────────────────────────────────────┤ \\
// │ Author Dmitry Baranovskiy (http://dmitry.baranovskiy.com/) │ \\
// └────────────────────────────────────────────────────────────┘ \\

(function (glob) {
    var version = "0.4.2",
        has = "hasOwnProperty",
        separator = /[\.\/]/,
        wildcard = "*",
        fun = function () {},
        numsort = function (a, b) {
            return a - b;
        },
        current_event,
        stop,
        events = {n: {}},
    /*\
     * eve
     [ method ]

     * Fires event with given `name`, given scope and other parameters.

     > Arguments

     - name (string) name of the *event*, dot (`.`) or slash (`/`) separated
     - scope (object) context for the event handlers
     - varargs (...) the rest of arguments will be sent to event handlers

     = (object) array of returned values from the listeners
    \*/
        eve = function (name, scope) {
			name = String(name);
            var e = events,
                oldstop = stop,
                args = Array.prototype.slice.call(arguments, 2),
                listeners = eve.listeners(name),
                z = 0,
                f = false,
                l,
                indexed = [],
                queue = {},
                out = [],
                ce = current_event,
                errors = [];
            current_event = name;
            stop = 0;
            for (var i = 0, ii = listeners.length; i < ii; i++) if ("zIndex" in listeners[i]) {
                indexed.push(listeners[i].zIndex);
                if (listeners[i].zIndex < 0) {
                    queue[listeners[i].zIndex] = listeners[i];
                }
            }
            indexed.sort(numsort);
            while (indexed[z] < 0) {
                l = queue[indexed[z++]];
                out.push(l.apply(scope, args));
                if (stop) {
                    stop = oldstop;
                    return out;
                }
            }
            for (i = 0; i < ii; i++) {
                l = listeners[i];
                if ("zIndex" in l) {
                    if (l.zIndex == indexed[z]) {
                        out.push(l.apply(scope, args));
                        if (stop) {
                            break;
                        }
                        do {
                            z++;
                            l = queue[indexed[z]];
                            l && out.push(l.apply(scope, args));
                            if (stop) {
                                break;
                            }
                        } while (l)
                    } else {
                        queue[l.zIndex] = l;
                    }
                } else {
                    out.push(l.apply(scope, args));
                    if (stop) {
                        break;
                    }
                }
            }
            stop = oldstop;
            current_event = ce;
            return out.length ? out : null;
        };
		// Undocumented. Debug only.
		eve._events = events;
    /*\
     * eve.listeners
     [ method ]

     * Internal method which gives you array of all event handlers that will be triggered by the given `name`.

     > Arguments

     - name (string) name of the event, dot (`.`) or slash (`/`) separated

     = (array) array of event handlers
    \*/
    eve.listeners = function (name) {
        var names = name.split(separator),
            e = events,
            item,
            items,
            k,
            i,
            ii,
            j,
            jj,
            nes,
            es = [e],
            out = [];
        for (i = 0, ii = names.length; i < ii; i++) {
            nes = [];
            for (j = 0, jj = es.length; j < jj; j++) {
                e = es[j].n;
                items = [e[names[i]], e[wildcard]];
                k = 2;
                while (k--) {
                    item = items[k];
                    if (item) {
                        nes.push(item);
                        out = out.concat(item.f || []);
                    }
                }
            }
            es = nes;
        }
        return out;
    };
    
    /*\
     * eve.on
     [ method ]
     **
     * Binds given event handler with a given name. You can use wildcards “`*`” for the names:
     | eve.on("*.under.*", f);
     | eve("mouse.under.floor"); // triggers f
     * Use @eve to trigger the listener.
     **
     > Arguments
     **
     - name (string) name of the event, dot (`.`) or slash (`/`) separated, with optional wildcards
     - f (function) event handler function
     **
     = (function) returned function accepts a single numeric parameter that represents z-index of the handler. It is an optional feature and only used when you need to ensure that some subset of handlers will be invoked in a given order, despite of the order of assignment. 
     > Example:
     | eve.on("mouse", eatIt)(2);
     | eve.on("mouse", scream);
     | eve.on("mouse", catchIt)(1);
     * This will ensure that `catchIt()` function will be called before `eatIt()`.
	 *
     * If you want to put your handler before non-indexed handlers, specify a negative value.
     * Note: I assume most of the time you don’t need to worry about z-index, but it’s nice to have this feature “just in case”.
    \*/
    eve.on = function (name, f) {
		name = String(name);
		if (typeof f != "function") {
			return function () {};
		}
        var names = name.split(separator),
            e = events;
        for (var i = 0, ii = names.length; i < ii; i++) {
            e = e.n;
            e = e.hasOwnProperty(names[i]) && e[names[i]] || (e[names[i]] = {n: {}});
        }
        e.f = e.f || [];
        for (i = 0, ii = e.f.length; i < ii; i++) if (e.f[i] == f) {
            return fun;
        }
        e.f.push(f);
        return function (zIndex) {
            if (+zIndex == +zIndex) {
                f.zIndex = +zIndex;
            }
        };
    };
    /*\
     * eve.f
     [ method ]
     **
     * Returns function that will fire given event with optional arguments.
	 * Arguments that will be passed to the result function will be also
	 * concated to the list of final arguments.
 	 | el.onclick = eve.f("click", 1, 2);
 	 | eve.on("click", function (a, b, c) {
 	 |     console.log(a, b, c); // 1, 2, [event object]
 	 | });
     > Arguments
	 - event (string) event name
	 - varargs (…) and any other arguments
	 = (function) possible event handler function
    \*/
	eve.f = function (event) {
		var attrs = [].slice.call(arguments, 1);
		return function () {
			eve.apply(null, [event, null].concat(attrs).concat([].slice.call(arguments, 0)));
		};
	};
    /*\
     * eve.stop
     [ method ]
     **
     * Is used inside an event handler to stop the event, preventing any subsequent listeners from firing.
    \*/
    eve.stop = function () {
        stop = 1;
    };
    /*\
     * eve.nt
     [ method ]
     **
     * Could be used inside event handler to figure out actual name of the event.
     **
     > Arguments
     **
     - subname (string) #optional subname of the event
     **
     = (string) name of the event, if `subname` is not specified
     * or
     = (boolean) `true`, if current event’s name contains `subname`
    \*/
    eve.nt = function (subname) {
        if (subname) {
            return new RegExp("(?:\\.|\\/|^)" + subname + "(?:\\.|\\/|$)").test(current_event);
        }
        return current_event;
    };
    /*\
     * eve.nts
     [ method ]
     **
     * Could be used inside event handler to figure out actual name of the event.
     **
     **
     = (array) names of the event
    \*/
    eve.nts = function () {
        return current_event.split(separator);
    };
    /*\
     * eve.off
     [ method ]
     **
     * Removes given function from the list of event listeners assigned to given name.
	 * If no arguments specified all the events will be cleared.
     **
     > Arguments
     **
     - name (string) name of the event, dot (`.`) or slash (`/`) separated, with optional wildcards
     - f (function) event handler function
    \*/
    /*\
     * eve.unbind
     [ method ]
     **
     * See @eve.off
    \*/
    eve.off = eve.unbind = function (name, f) {
		if (!name) {
		    eve._events = events = {n: {}};
			return;
		}
        var names = name.split(separator),
            e,
            key,
            splice,
            i, ii, j, jj,
            cur = [events];
        for (i = 0, ii = names.length; i < ii; i++) {
            for (j = 0; j < cur.length; j += splice.length - 2) {
                splice = [j, 1];
                e = cur[j].n;
                if (names[i] != wildcard) {
                    if (e[names[i]]) {
                        splice.push(e[names[i]]);
                    }
                } else {
                    for (key in e) if (e[has](key)) {
                        splice.push(e[key]);
                    }
                }
                cur.splice.apply(cur, splice);
            }
        }
        for (i = 0, ii = cur.length; i < ii; i++) {
            e = cur[i];
            while (e.n) {
                if (f) {
                    if (e.f) {
                        for (j = 0, jj = e.f.length; j < jj; j++) if (e.f[j] == f) {
                            e.f.splice(j, 1);
                            break;
                        }
                        !e.f.length && delete e.f;
                    }
                    for (key in e.n) if (e.n[has](key) && e.n[key].f) {
                        var funcs = e.n[key].f;
                        for (j = 0, jj = funcs.length; j < jj; j++) if (funcs[j] == f) {
                            funcs.splice(j, 1);
                            break;
                        }
                        !funcs.length && delete e.n[key].f;
                    }
                } else {
                    delete e.f;
                    for (key in e.n) if (e.n[has](key) && e.n[key].f) {
                        delete e.n[key].f;
                    }
                }
                e = e.n;
            }
        }
    };
    /*\
     * eve.once
     [ method ]
     **
     * Binds given event handler with a given name to only run once then unbind itself.
     | eve.once("login", f);
     | eve("login"); // triggers f
     | eve("login"); // no listeners
     * Use @eve to trigger the listener.
     **
     > Arguments
     **
     - name (string) name of the event, dot (`.`) or slash (`/`) separated, with optional wildcards
     - f (function) event handler function
     **
     = (function) same return function as @eve.on
    \*/
    eve.once = function (name, f) {
        var f2 = function () {
            eve.unbind(name, f2);
            return f.apply(this, arguments);
        };
        return eve.on(name, f2);
    };
    /*\
     * eve.version
     [ property (string) ]
     **
     * Current version of the library.
    \*/
    eve.version = version;
    eve.toString = function () {
        return "You are running Eve " + version;
    };
    (typeof module != "undefined" && module.exports) ? (module.exports = eve) : (typeof define != "undefined" ? (define("eve", [], function() { return eve; })) : (glob.eve = eve));
})(window || this);
// ┌─────────────────────────────────────────────────────────────────────┐ \\
// │ "Raphaël 2.1.2" - JavaScript Vector Library                         │ \\
// ├─────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright (c) 2008-2011 Dmitry Baranovskiy (http://raphaeljs.com)   │ \\
// │ Copyright (c) 2008-2011 Sencha Labs (http://sencha.com)             │ \\
// │ Licensed under the MIT (http://raphaeljs.com/license.html) license. │ \\
// └─────────────────────────────────────────────────────────────────────┘ \\

(function (glob, factory) {
    // AMD support
    if (typeof define === "function" && define.amd) {
        // Define as an anonymous module
        define(["eve"], function( eve ) {
            return factory(glob, eve);
        });
    } else {
        // Browser globals (glob is window)
        // Raphael adds itself to window
        factory(glob, glob.eve || (typeof require == "function" && require('eve')) );
    }
}(this, function (window, eve) {
    /*\
     * Raphael
     [ method ]
     **
     * Creates a canvas object on which to draw.
     * You must do this first, as all future calls to drawing methods
     * from this instance will be bound to this canvas.
     > Parameters
     **
     - container (HTMLElement|string) DOM element or its ID which is going to be a parent for drawing surface
     - width (number)
     - height (number)
     - callback (function) #optional callback function which is going to be executed in the context of newly created paper
     * or
     - x (number)
     - y (number)
     - width (number)
     - height (number)
     - callback (function) #optional callback function which is going to be executed in the context of newly created paper
     * or
     - all (array) (first 3 or 4 elements in the array are equal to [containerID, width, height] or [x, y, width, height]. The rest are element descriptions in format {type: type, <attributes>}). See @Paper.add.
     - callback (function) #optional callback function which is going to be executed in the context of newly created paper
     * or
     - onReadyCallback (function) function that is going to be called on DOM ready event. You can also subscribe to this event via Eve’s “DOMLoad” event. In this case method returns `undefined`.
     = (object) @Paper
     > Usage
     | // Each of the following examples create a canvas
     | // that is 320px wide by 200px high.
     | // Canvas is created at the viewport’s 10,50 coordinate.
     | var paper = Raphael(10, 50, 320, 200);
     | // Canvas is created at the top left corner of the #notepad element
     | // (or its top right corner in dir="rtl" elements)
     | var paper = Raphael(document.getElementById("notepad"), 320, 200);
     | // Same as above
     | var paper = Raphael("notepad", 320, 200);
     | // Image dump
     | var set = Raphael(["notepad", 320, 200, {
     |     type: "rect",
     |     x: 10,
     |     y: 10,
     |     width: 25,
     |     height: 25,
     |     stroke: "#f00"
     | }, {
     |     type: "text",
     |     x: 30,
     |     y: 40,
     |     text: "Dump"
     | }]);
    \*/
    function R(first) {
        if (R.is(first, "function")) {
            return loaded ? first() : eve.on("raphael.DOMload", first);
        } else if (R.is(first, array)) {
            return R._engine.create[apply](R, first.splice(0, 3 + R.is(first[0], nu))).add(first);
        } else {
            var args = Array.prototype.slice.call(arguments, 0);
            if (R.is(args[args.length - 1], "function")) {
                var f = args.pop();
                return loaded ? f.call(R._engine.create[apply](R, args)) : eve.on("raphael.DOMload", function () {
                    f.call(R._engine.create[apply](R, args));
                });
            } else {
                return R._engine.create[apply](R, arguments);
            }
        }
    }
    R.version = "2.1.2";
    R.eve = eve;
    var loaded,
        separator = /[, ]+/,
        elements = {circle: 1, rect: 1, path: 1, ellipse: 1, text: 1, image: 1},
        formatrg = /\{(\d+)\}/g,
        proto = "prototype",
        has = "hasOwnProperty",
        g = {
            doc: document,
            win: window
        },
        oldRaphael = {
            was: Object.prototype[has].call(g.win, "Raphael"),
            is: g.win.Raphael
        },
        Paper = function () {
            /*\
             * Paper.ca
             [ property (object) ]
             **
             * Shortcut for @Paper.customAttributes
            \*/
            /*\
             * Paper.customAttributes
             [ property (object) ]
             **
             * If you have a set of attributes that you would like to represent
             * as a function of some number you can do it easily with custom attributes:
             > Usage
             | paper.customAttributes.hue = function (num) {
             |     num = num % 1;
             |     return {fill: "hsb(" + num + ", 0.75, 1)"};
             | };
             | // Custom attribute “hue” will change fill
             | // to be given hue with fixed saturation and brightness.
             | // Now you can use it like this:
             | var c = paper.circle(10, 10, 10).attr({hue: .45});
             | // or even like this:
             | c.animate({hue: 1}, 1e3);
             |
             | // You could also create custom attribute
             | // with multiple parameters:
             | paper.customAttributes.hsb = function (h, s, b) {
             |     return {fill: "hsb(" + [h, s, b].join(",") + ")"};
             | };
             | c.attr({hsb: "0.5 .8 1"});
             | c.animate({hsb: [1, 0, 0.5]}, 1e3);
            \*/
            this.ca = this.customAttributes = {};
        },
        paperproto,
        appendChild = "appendChild",
        apply = "apply",
        concat = "concat",
        supportsTouch = ('ontouchstart' in g.win) || g.win.DocumentTouch && g.doc instanceof DocumentTouch, //taken from Modernizr touch test
        E = "",
        S = " ",
        Str = String,
        split = "split",
        events = "click dblclick mousedown mousemove mouseout mouseover mouseup touchstart touchmove touchend touchcancel"[split](S),
        touchMap = {
            mousedown: "touchstart",
            mousemove: "touchmove",
            mouseup: "touchend"
        },
        lowerCase = Str.prototype.toLowerCase,
        math = Math,
        mmax = math.max,
        mmin = math.min,
        abs = math.abs,
        pow = math.pow,
        PI = math.PI,
        nu = "number",
        string = "string",
        array = "array",
        toString = "toString",
        fillString = "fill",
        objectToString = Object.prototype.toString,
        paper = {},
        push = "push",
        ISURL = R._ISURL = /^url\(['"]?(.+?)['"]?\)$/i,
        colourRegExp = /^\s*((#[a-f\d]{6})|(#[a-f\d]{3})|rgba?\(\s*([\d\.]+%?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+%?(?:\s*,\s*[\d\.]+%?)?)\s*\)|hsba?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+(?:%?\s*,\s*[\d\.]+)?)%?\s*\)|hsla?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+(?:%?\s*,\s*[\d\.]+)?)%?\s*\))\s*$/i,
        isnan = {"NaN": 1, "Infinity": 1, "-Infinity": 1},
        bezierrg = /^(?:cubic-)?bezier\(([^,]+),([^,]+),([^,]+),([^\)]+)\)/,
        round = math.round,
        setAttribute = "setAttribute",
        toFloat = parseFloat,
        toInt = parseInt,
        upperCase = Str.prototype.toUpperCase,
        availableAttrs = R._availableAttrs = {
            "arrow-end": "none",
            "arrow-start": "none",
            blur: 0,
            "clip-rect": "0 0 1e9 1e9",
            cursor: "default",
            cx: 0,
            cy: 0,
            fill: "#fff",
            "fill-opacity": 1,
            font: '10px "Arial"',
            "font-family": '"Arial"',
            "font-size": "10",
            "font-style": "normal",
            "font-weight": 400,
            gradient: 0,
            height: 0,
            href: "http://raphaeljs.com/",
            "letter-spacing": 0,
            opacity: 1,
            path: "M0,0",
            r: 0,
            rx: 0,
            ry: 0,
            src: "",
            stroke: "#000",
            "stroke-dasharray": "",
            "stroke-linecap": "butt",
            "stroke-linejoin": "butt",
            "stroke-miterlimit": 0,
            "stroke-opacity": 1,
            "stroke-width": 1,
            target: "_blank",
            "text-anchor": "middle",
            title: "Raphael",
            transform: "",
            width: 0,
            x: 0,
            y: 0
        },
        availableAnimAttrs = R._availableAnimAttrs = {
            blur: nu,
            "clip-rect": "csv",
            cx: nu,
            cy: nu,
            fill: "colour",
            "fill-opacity": nu,
            "font-size": nu,
            height: nu,
            opacity: nu,
            path: "path",
            r: nu,
            rx: nu,
            ry: nu,
            stroke: "colour",
            "stroke-opacity": nu,
            "stroke-width": nu,
            transform: "transform",
            width: nu,
            x: nu,
            y: nu
        },
        whitespace = /[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]/g,
        commaSpaces = /[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*/,
        hsrg = {hs: 1, rg: 1},
        p2s = /,?([achlmqrstvxz]),?/gi,
        pathCommand = /([achlmrqstvz])[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029,]*((-?\d*\.?\d*(?:e[\-+]?\d+)?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*)+)/ig,
        tCommand = /([rstm])[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029,]*((-?\d*\.?\d*(?:e[\-+]?\d+)?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*)+)/ig,
        pathValues = /(-?\d*\.?\d*(?:e[\-+]?\d+)?)[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*/ig,
        radial_gradient = R._radial_gradient = /^r(?:\(([^,]+?)[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*([^\)]+?)\))?/,
        eldata = {},
        sortByKey = function (a, b) {
            return a.key - b.key;
        },
        sortByNumber = function (a, b) {
            return toFloat(a) - toFloat(b);
        },
        fun = function () {},
        pipe = function (x) {
            return x;
        },
        rectPath = R._rectPath = function (x, y, w, h, r) {
            if (r) {
                return [["M", x + r, y], ["l", w - r * 2, 0], ["a", r, r, 0, 0, 1, r, r], ["l", 0, h - r * 2], ["a", r, r, 0, 0, 1, -r, r], ["l", r * 2 - w, 0], ["a", r, r, 0, 0, 1, -r, -r], ["l", 0, r * 2 - h], ["a", r, r, 0, 0, 1, r, -r], ["z"]];
            }
            return [["M", x, y], ["l", w, 0], ["l", 0, h], ["l", -w, 0], ["z"]];
        },
        ellipsePath = function (x, y, rx, ry) {
            if (ry == null) {
                ry = rx;
            }
            return [["M", x, y], ["m", 0, -ry], ["a", rx, ry, 0, 1, 1, 0, 2 * ry], ["a", rx, ry, 0, 1, 1, 0, -2 * ry], ["z"]];
        },
        getPath = R._getPath = {
            path: function (el) {
                return el.attr("path");
            },
            circle: function (el) {
                var a = el.attrs;
                return ellipsePath(a.cx, a.cy, a.r);
            },
            ellipse: function (el) {
                var a = el.attrs;
                return ellipsePath(a.cx, a.cy, a.rx, a.ry);
            },
            rect: function (el) {
                var a = el.attrs;
                return rectPath(a.x, a.y, a.width, a.height, a.r);
            },
            image: function (el) {
                var a = el.attrs;
                return rectPath(a.x, a.y, a.width, a.height);
            },
            text: function (el) {
                var bbox = el._getBBox();
                return rectPath(bbox.x, bbox.y, bbox.width, bbox.height);
            },
            set : function(el) {
                var bbox = el._getBBox();
                return rectPath(bbox.x, bbox.y, bbox.width, bbox.height);
            }
        },
        /*\
         * Raphael.mapPath
         [ method ]
         **
         * Transform the path string with given matrix.
         > Parameters
         - path (string) path string
         - matrix (object) see @Matrix
         = (string) transformed path string
        \*/
        mapPath = R.mapPath = function (path, matrix) {
            if (!matrix) {
                return path;
            }
            var x, y, i, j, ii, jj, pathi;
            path = path2curve(path);
            for (i = 0, ii = path.length; i < ii; i++) {
                pathi = path[i];
                for (j = 1, jj = pathi.length; j < jj; j += 2) {
                    x = matrix.x(pathi[j], pathi[j + 1]);
                    y = matrix.y(pathi[j], pathi[j + 1]);
                    pathi[j] = x;
                    pathi[j + 1] = y;
                }
            }
            return path;
        };

    R._g = g;
    /*\
     * Raphael.type
     [ property (string) ]
     **
     * Can be “SVG”, “VML” or empty, depending on browser support.
    \*/
    R.type = (g.win.SVGAngle || g.doc.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1") ? "SVG" : "VML");
    if (R.type == "VML") {
        var d = g.doc.createElement("div"),
            b;
        d.innerHTML = '<v:shape adj="1"/>';
        b = d.firstChild;
        b.style.behavior = "url(#default#VML)";
        if (!(b && typeof b.adj == "object")) {
            return (R.type = E);
        }
        d = null;
    }
    /*\
     * Raphael.svg
     [ property (boolean) ]
     **
     * `true` if browser supports SVG.
    \*/
    /*\
     * Raphael.vml
     [ property (boolean) ]
     **
     * `true` if browser supports VML.
    \*/
    R.svg = !(R.vml = R.type == "VML");
    R._Paper = Paper;
    /*\
     * Raphael.fn
     [ property (object) ]
     **
     * You can add your own method to the canvas. For example if you want to draw a pie chart,
     * you can create your own pie chart function and ship it as a Raphaël plugin. To do this
     * you need to extend the `Raphael.fn` object. You should modify the `fn` object before a
     * Raphaël instance is created, otherwise it will take no effect. Please note that the
     * ability for namespaced plugins was removed in Raphael 2.0. It is up to the plugin to
     * ensure any namespacing ensures proper context.
     > Usage
     | Raphael.fn.arrow = function (x1, y1, x2, y2, size) {
     |     return this.path( ... );
     | };
     | // or create namespace
     | Raphael.fn.mystuff = {
     |     arrow: function () {…},
     |     star: function () {…},
     |     // etc…
     | };
     | var paper = Raphael(10, 10, 630, 480);
     | // then use it
     | paper.arrow(10, 10, 30, 30, 5).attr({fill: "#f00"});
     | paper.mystuff.arrow();
     | paper.mystuff.star();
    \*/
    R.fn = paperproto = Paper.prototype = R.prototype;
    R._id = 0;
    R._oid = 0;
    /*\
     * Raphael.is
     [ method ]
     **
     * Handful of replacements for `typeof` operator.
     > Parameters
     - o (…) any object or primitive
     - type (string) name of the type, i.e. “string”, “function”, “number”, etc.
     = (boolean) is given value is of given type
    \*/
    R.is = function (o, type) {
        type = lowerCase.call(type);
        if (type == "finite") {
            return !isnan[has](+o);
        }
        if (type == "array") {
            return o instanceof Array;
        }
        return  (type == "null" && o === null) ||
                (type == typeof o && o !== null) ||
                (type == "object" && o === Object(o)) ||
                (type == "array" && Array.isArray && Array.isArray(o)) ||
                objectToString.call(o).slice(8, -1).toLowerCase() == type;
    };

    function clone(obj) {
        if (typeof obj == "function" || Object(obj) !== obj) {
            return obj;
        }
        var res = new obj.constructor;
        for (var key in obj) if (obj[has](key)) {
            res[key] = clone(obj[key]);
        }
        return res;
    }

    /*\
     * Raphael.angle
     [ method ]
     **
     * Returns angle between two or three points
     > Parameters
     - x1 (number) x coord of first point
     - y1 (number) y coord of first point
     - x2 (number) x coord of second point
     - y2 (number) y coord of second point
     - x3 (number) #optional x coord of third point
     - y3 (number) #optional y coord of third point
     = (number) angle in degrees.
    \*/
    R.angle = function (x1, y1, x2, y2, x3, y3) {
        if (x3 == null) {
            var x = x1 - x2,
                y = y1 - y2;
            if (!x && !y) {
                return 0;
            }
            return (180 + math.atan2(-y, -x) * 180 / PI + 360) % 360;
        } else {
            return R.angle(x1, y1, x3, y3) - R.angle(x2, y2, x3, y3);
        }
    };
    /*\
     * Raphael.rad
     [ method ]
     **
     * Transform angle to radians
     > Parameters
     - deg (number) angle in degrees
     = (number) angle in radians.
    \*/
    R.rad = function (deg) {
        return deg % 360 * PI / 180;
    };
    /*\
     * Raphael.deg
     [ method ]
     **
     * Transform angle to degrees
     > Parameters
     - rad (number) angle in radians
     = (number) angle in degrees.
    \*/
    R.deg = function (rad) {
        return Math.round ((rad * 180 / PI% 360)* 1000) / 1000;
    };
    /*\
     * Raphael.snapTo
     [ method ]
     **
     * Snaps given value to given grid.
     > Parameters
     - values (array|number) given array of values or step of the grid
     - value (number) value to adjust
     - tolerance (number) #optional tolerance for snapping. Default is `10`.
     = (number) adjusted value.
    \*/
    R.snapTo = function (values, value, tolerance) {
        tolerance = R.is(tolerance, "finite") ? tolerance : 10;
        if (R.is(values, array)) {
            var i = values.length;
            while (i--) if (abs(values[i] - value) <= tolerance) {
                return values[i];
            }
        } else {
            values = +values;
            var rem = value % values;
            if (rem < tolerance) {
                return value - rem;
            }
            if (rem > values - tolerance) {
                return value - rem + values;
            }
        }
        return value;
    };

    /*\
     * Raphael.createUUID
     [ method ]
     **
     * Returns RFC4122, version 4 ID
    \*/
    var createUUID = R.createUUID = (function (uuidRegEx, uuidReplacer) {
        return function () {
            return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(uuidRegEx, uuidReplacer).toUpperCase();
        };
    })(/[xy]/g, function (c) {
        var r = math.random() * 16 | 0,
            v = c == "x" ? r : (r & 3 | 8);
        return v.toString(16);
    });

    /*\
     * Raphael.setWindow
     [ method ]
     **
     * Used when you need to draw in `&lt;iframe>`. Switched window to the iframe one.
     > Parameters
     - newwin (window) new window object
    \*/
    R.setWindow = function (newwin) {
        eve("raphael.setWindow", R, g.win, newwin);
        g.win = newwin;
        g.doc = g.win.document;
        if (R._engine.initWin) {
            R._engine.initWin(g.win);
        }
    };
    var toHex = function (color) {
        if (R.vml) {
            // http://dean.edwards.name/weblog/2009/10/convert-any-colour-value-to-hex-in-msie/
            var trim = /^\s+|\s+$/g;
            var bod;
            try {
                var docum = new ActiveXObject("htmlfile");
                docum.write("<body>");
                docum.close();
                bod = docum.body;
            } catch(e) {
                bod = createPopup().document.body;
            }
            var range = bod.createTextRange();
            toHex = cacher(function (color) {
                try {
                    bod.style.color = Str(color).replace(trim, E);
                    var value = range.queryCommandValue("ForeColor");
                    value = ((value & 255) << 16) | (value & 65280) | ((value & 16711680) >>> 16);
                    return "#" + ("000000" + value.toString(16)).slice(-6);
                } catch(e) {
                    return "none";
                }
            });
        } else {
            var i = g.doc.createElement("i");
            i.title = "Rapha\xebl Colour Picker";
            i.style.display = "none";
            g.doc.body.appendChild(i);
            toHex = cacher(function (color) {
                i.style.color = color;
                return g.doc.defaultView.getComputedStyle(i, E).getPropertyValue("color");
            });
        }
        return toHex(color);
    },
    hsbtoString = function () {
        return "hsb(" + [this.h, this.s, this.b] + ")";
    },
    hsltoString = function () {
        return "hsl(" + [this.h, this.s, this.l] + ")";
    },
    rgbtoString = function () {
        return this.hex;
    },
    prepareRGB = function (r, g, b) {
        if (g == null && R.is(r, "object") && "r" in r && "g" in r && "b" in r) {
            b = r.b;
            g = r.g;
            r = r.r;
        }
        if (g == null && R.is(r, string)) {
            var clr = R.getRGB(r);
            r = clr.r;
            g = clr.g;
            b = clr.b;
        }
        if (r > 1 || g > 1 || b > 1) {
            r /= 255;
            g /= 255;
            b /= 255;
        }

        return [r, g, b];
    },
    packageRGB = function (r, g, b, o) {
        r *= 255;
        g *= 255;
        b *= 255;
        var rgb = {
            r: r,
            g: g,
            b: b,
            hex: R.rgb(r, g, b),
            toString: rgbtoString
        };
        R.is(o, "finite") && (rgb.opacity = o);
        return rgb;
    };

    /*\
     * Raphael.color
     [ method ]
     **
     * Parses the color string and returns object with all values for the given color.
     > Parameters
     - clr (string) color string in one of the supported formats (see @Raphael.getRGB)
     = (object) Combined RGB & HSB object in format:
     o {
     o     r (number) red,
     o     g (number) green,
     o     b (number) blue,
     o     hex (string) color in HTML/CSS format: #••••••,
     o     error (boolean) `true` if string can’t be parsed,
     o     h (number) hue,
     o     s (number) saturation,
     o     v (number) value (brightness),
     o     l (number) lightness
     o }
    \*/
    R.color = function (clr) {
        var rgb;
        if (R.is(clr, "object") && "h" in clr && "s" in clr && "b" in clr) {
            rgb = R.hsb2rgb(clr);
            clr.r = rgb.r;
            clr.g = rgb.g;
            clr.b = rgb.b;
            clr.hex = rgb.hex;
        } else if (R.is(clr, "object") && "h" in clr && "s" in clr && "l" in clr) {
            rgb = R.hsl2rgb(clr);
            clr.r = rgb.r;
            clr.g = rgb.g;
            clr.b = rgb.b;
            clr.hex = rgb.hex;
        } else {
            if (R.is(clr, "string")) {
                clr = R.getRGB(clr);
            }
            if (R.is(clr, "object") && "r" in clr && "g" in clr && "b" in clr) {
                rgb = R.rgb2hsl(clr);
                clr.h = rgb.h;
                clr.s = rgb.s;
                clr.l = rgb.l;
                rgb = R.rgb2hsb(clr);
                clr.v = rgb.b;
            } else {
                clr = {hex: "none"};
                clr.r = clr.g = clr.b = clr.h = clr.s = clr.v = clr.l = -1;
            }
        }
        clr.toString = rgbtoString;
        return clr;
    };
    /*\
     * Raphael.hsb2rgb
     [ method ]
     **
     * Converts HSB values to RGB object.
     > Parameters
     - h (number) hue
     - s (number) saturation
     - v (number) value or brightness
     = (object) RGB object in format:
     o {
     o     r (number) red,
     o     g (number) green,
     o     b (number) blue,
     o     hex (string) color in HTML/CSS format: #••••••
     o }
    \*/
    R.hsb2rgb = function (h, s, v, o) {
        if (this.is(h, "object") && "h" in h && "s" in h && "b" in h) {
            v = h.b;
            s = h.s;
            o = h.o;
            h = h.h;
        }
        h *= 360;
        var R, G, B, X, C;
        h = (h % 360) / 60;
        C = v * s;
        X = C * (1 - abs(h % 2 - 1));
        R = G = B = v - C;

        h = ~~h;
        R += [C, X, 0, 0, X, C][h];
        G += [X, C, C, X, 0, 0][h];
        B += [0, 0, X, C, C, X][h];
        return packageRGB(R, G, B, o);
    };
    /*\
     * Raphael.hsl2rgb
     [ method ]
     **
     * Converts HSL values to RGB object.
     > Parameters
     - h (number) hue
     - s (number) saturation
     - l (number) luminosity
     = (object) RGB object in format:
     o {
     o     r (number) red,
     o     g (number) green,
     o     b (number) blue,
     o     hex (string) color in HTML/CSS format: #••••••
     o }
    \*/
    R.hsl2rgb = function (h, s, l, o) {
        if (this.is(h, "object") && "h" in h && "s" in h && "l" in h) {
            l = h.l;
            s = h.s;
            h = h.h;
        }
        if (h > 1 || s > 1 || l > 1) {
            h /= 360;
            s /= 100;
            l /= 100;
        }
        h *= 360;
        var R, G, B, X, C;
        h = (h % 360) / 60;
        C = 2 * s * (l < .5 ? l : 1 - l);
        X = C * (1 - abs(h % 2 - 1));
        R = G = B = l - C / 2;

        h = ~~h;
        R += [C, X, 0, 0, X, C][h];
        G += [X, C, C, X, 0, 0][h];
        B += [0, 0, X, C, C, X][h];
        return packageRGB(R, G, B, o);
    };
    /*\
     * Raphael.rgb2hsb
     [ method ]
     **
     * Converts RGB values to HSB object.
     > Parameters
     - r (number) red
     - g (number) green
     - b (number) blue
     = (object) HSB object in format:
     o {
     o     h (number) hue
     o     s (number) saturation
     o     b (number) brightness
     o }
    \*/
    R.rgb2hsb = function (r, g, b) {
        b = prepareRGB(r, g, b);
        r = b[0];
        g = b[1];
        b = b[2];

        var H, S, V, C;
        V = mmax(r, g, b);
        C = V - mmin(r, g, b);
        H = (C == 0 ? null :
             V == r ? (g - b) / C :
             V == g ? (b - r) / C + 2 :
                      (r - g) / C + 4
            );
        H = ((H + 360) % 6) * 60 / 360;
        S = C == 0 ? 0 : C / V;
        return {h: H, s: S, b: V, toString: hsbtoString};
    };
    /*\
     * Raphael.rgb2hsl
     [ method ]
     **
     * Converts RGB values to HSL object.
     > Parameters
     - r (number) red
     - g (number) green
     - b (number) blue
     = (object) HSL object in format:
     o {
     o     h (number) hue
     o     s (number) saturation
     o     l (number) luminosity
     o }
    \*/
    R.rgb2hsl = function (r, g, b) {
        b = prepareRGB(r, g, b);
        r = b[0];
        g = b[1];
        b = b[2];

        var H, S, L, M, m, C;
        M = mmax(r, g, b);
        m = mmin(r, g, b);
        C = M - m;
        H = (C == 0 ? null :
             M == r ? (g - b) / C :
             M == g ? (b - r) / C + 2 :
                      (r - g) / C + 4);
        H = ((H + 360) % 6) * 60 / 360;
        L = (M + m) / 2;
        S = (C == 0 ? 0 :
             L < .5 ? C / (2 * L) :
                      C / (2 - 2 * L));
        return {h: H, s: S, l: L, toString: hsltoString};
    };
    R._path2string = function () {
        return this.join(",").replace(p2s, "$1");
    };
    function repush(array, item) {
        for (var i = 0, ii = array.length; i < ii; i++) if (array[i] === item) {
            return array.push(array.splice(i, 1)[0]);
        }
    }
    function cacher(f, scope, postprocessor) {
        function newf() {
            var arg = Array.prototype.slice.call(arguments, 0),
                args = arg.join("\u2400"),
                cache = newf.cache = newf.cache || {},
                count = newf.count = newf.count || [];
            if (cache[has](args)) {
                repush(count, args);
                return postprocessor ? postprocessor(cache[args]) : cache[args];
            }
            count.length >= 1e3 && delete cache[count.shift()];
            count.push(args);
            cache[args] = f[apply](scope, arg);
            return postprocessor ? postprocessor(cache[args]) : cache[args];
        }
        return newf;
    }

    var preload = R._preload = function (src, f) {
        var img = g.doc.createElement("img");
        img.style.cssText = "position:absolute;left:-9999em;top:-9999em";
        img.onload = function () {
            f.call(this);
            this.onload = null;
            g.doc.body.removeChild(this);
        };
        img.onerror = function () {
            g.doc.body.removeChild(this);
        };
        g.doc.body.appendChild(img);
        img.src = src;
    };

    function clrToString() {
        return this.hex;
    }

    /*\
     * Raphael.getRGB
     [ method ]
     **
     * Parses colour string as RGB object
     > Parameters
     - colour (string) colour string in one of formats:
     # <ul>
     #     <li>Colour name (“<code>red</code>”, “<code>green</code>”, “<code>cornflowerblue</code>”, etc)</li>
     #     <li>#••• — shortened HTML colour: (“<code>#000</code>”, “<code>#fc0</code>”, etc)</li>
     #     <li>#•••••• — full length HTML colour: (“<code>#000000</code>”, “<code>#bd2300</code>”)</li>
     #     <li>rgb(•••, •••, •••) — red, green and blue channels’ values: (“<code>rgb(200,&nbsp;100,&nbsp;0)</code>”)</li>
     #     <li>rgb(•••%, •••%, •••%) — same as above, but in %: (“<code>rgb(100%,&nbsp;175%,&nbsp;0%)</code>”)</li>
     #     <li>hsb(•••, •••, •••) — hue, saturation and brightness values: (“<code>hsb(0.5,&nbsp;0.25,&nbsp;1)</code>”)</li>
     #     <li>hsb(•••%, •••%, •••%) — same as above, but in %</li>
     #     <li>hsl(•••, •••, •••) — same as hsb</li>
     #     <li>hsl(•••%, •••%, •••%) — same as hsb</li>
     # </ul>
     = (object) RGB object in format:
     o {
     o     r (number) red,
     o     g (number) green,
     o     b (number) blue
     o     hex (string) color in HTML/CSS format: #••••••,
     o     error (boolean) true if string can’t be parsed
     o }
    \*/
    R.getRGB = cacher(function (colour) {
        if (!colour || !!((colour = Str(colour)).indexOf("-") + 1)) {
            return {r: -1, g: -1, b: -1, hex: "none", error: 1, toString: clrToString};
        }
        if (colour == "none") {
            return {r: -1, g: -1, b: -1, hex: "none", toString: clrToString};
        }
        !(hsrg[has](colour.toLowerCase().substring(0, 2)) || colour.charAt() == "#") && (colour = toHex(colour));
        var res,
            red,
            green,
            blue,
            opacity,
            t,
            values,
            rgb = colour.match(colourRegExp);
        if (rgb) {
            if (rgb[2]) {
                blue = toInt(rgb[2].substring(5), 16);
                green = toInt(rgb[2].substring(3, 5), 16);
                red = toInt(rgb[2].substring(1, 3), 16);
            }
            if (rgb[3]) {
                blue = toInt((t = rgb[3].charAt(3)) + t, 16);
                green = toInt((t = rgb[3].charAt(2)) + t, 16);
                red = toInt((t = rgb[3].charAt(1)) + t, 16);
            }
            if (rgb[4]) {
                values = rgb[4][split](commaSpaces);
                red = toFloat(values[0]);
                values[0].slice(-1) == "%" && (red *= 2.55);
                green = toFloat(values[1]);
                values[1].slice(-1) == "%" && (green *= 2.55);
                blue = toFloat(values[2]);
                values[2].slice(-1) == "%" && (blue *= 2.55);
                rgb[1].toLowerCase().slice(0, 4) == "rgba" && (opacity = toFloat(values[3]));
                values[3] && values[3].slice(-1) == "%" && (opacity /= 100);
            }
            if (rgb[5]) {
                values = rgb[5][split](commaSpaces);
                red = toFloat(values[0]);
                values[0].slice(-1) == "%" && (red *= 2.55);
                green = toFloat(values[1]);
                values[1].slice(-1) == "%" && (green *= 2.55);
                blue = toFloat(values[2]);
                values[2].slice(-1) == "%" && (blue *= 2.55);
                (values[0].slice(-3) == "deg" || values[0].slice(-1) == "\xb0") && (red /= 360);
                rgb[1].toLowerCase().slice(0, 4) == "hsba" && (opacity = toFloat(values[3]));
                values[3] && values[3].slice(-1) == "%" && (opacity /= 100);
                return R.hsb2rgb(red, green, blue, opacity);
            }
            if (rgb[6]) {
                values = rgb[6][split](commaSpaces);
                red = toFloat(values[0]);
                values[0].slice(-1) == "%" && (red *= 2.55);
                green = toFloat(values[1]);
                values[1].slice(-1) == "%" && (green *= 2.55);
                blue = toFloat(values[2]);
                values[2].slice(-1) == "%" && (blue *= 2.55);
                (values[0].slice(-3) == "deg" || values[0].slice(-1) == "\xb0") && (red /= 360);
                rgb[1].toLowerCase().slice(0, 4) == "hsla" && (opacity = toFloat(values[3]));
                values[3] && values[3].slice(-1) == "%" && (opacity /= 100);
                return R.hsl2rgb(red, green, blue, opacity);
            }
            rgb = {r: red, g: green, b: blue, toString: clrToString};
            rgb.hex = "#" + (16777216 | blue | (green << 8) | (red << 16)).toString(16).slice(1);
            R.is(opacity, "finite") && (rgb.opacity = opacity);
            return rgb;
        }
        return {r: -1, g: -1, b: -1, hex: "none", error: 1, toString: clrToString};
    }, R);
    /*\
     * Raphael.hsb
     [ method ]
     **
     * Converts HSB values to hex representation of the colour.
     > Parameters
     - h (number) hue
     - s (number) saturation
     - b (number) value or brightness
     = (string) hex representation of the colour.
    \*/
    R.hsb = cacher(function (h, s, b) {
        return R.hsb2rgb(h, s, b).hex;
    });
    /*\
     * Raphael.hsl
     [ method ]
     **
     * Converts HSL values to hex representation of the colour.
     > Parameters
     - h (number) hue
     - s (number) saturation
     - l (number) luminosity
     = (string) hex representation of the colour.
    \*/
    R.hsl = cacher(function (h, s, l) {
        return R.hsl2rgb(h, s, l).hex;
    });
    /*\
     * Raphael.rgb
     [ method ]
     **
     * Converts RGB values to hex representation of the colour.
     > Parameters
     - r (number) red
     - g (number) green
     - b (number) blue
     = (string) hex representation of the colour.
    \*/
    R.rgb = cacher(function (r, g, b) {
        return "#" + (16777216 | b | (g << 8) | (r << 16)).toString(16).slice(1);
    });
    /*\
     * Raphael.getColor
     [ method ]
     **
     * On each call returns next colour in the spectrum. To reset it back to red call @Raphael.getColor.reset
     > Parameters
     - value (number) #optional brightness, default is `0.75`
     = (string) hex representation of the colour.
    \*/
    R.getColor = function (value) {
        var start = this.getColor.start = this.getColor.start || {h: 0, s: 1, b: value || .75},
            rgb = this.hsb2rgb(start.h, start.s, start.b);
        start.h += .075;
        if (start.h > 1) {
            start.h = 0;
            start.s -= .2;
            start.s <= 0 && (this.getColor.start = {h: 0, s: 1, b: start.b});
        }
        return rgb.hex;
    };
    /*\
     * Raphael.getColor.reset
     [ method ]
     **
     * Resets spectrum position for @Raphael.getColor back to red.
    \*/
    R.getColor.reset = function () {
        delete this.start;
    };

    // http://schepers.cc/getting-to-the-point
    function catmullRom2bezier(crp, z) {
        var d = [];
        for (var i = 0, iLen = crp.length; iLen - 2 * !z > i; i += 2) {
            var p = [
                        {x: +crp[i - 2], y: +crp[i - 1]},
                        {x: +crp[i],     y: +crp[i + 1]},
                        {x: +crp[i + 2], y: +crp[i + 3]},
                        {x: +crp[i + 4], y: +crp[i + 5]}
                    ];
            if (z) {
                if (!i) {
                    p[0] = {x: +crp[iLen - 2], y: +crp[iLen - 1]};
                } else if (iLen - 4 == i) {
                    p[3] = {x: +crp[0], y: +crp[1]};
                } else if (iLen - 2 == i) {
                    p[2] = {x: +crp[0], y: +crp[1]};
                    p[3] = {x: +crp[2], y: +crp[3]};
                }
            } else {
                if (iLen - 4 == i) {
                    p[3] = p[2];
                } else if (!i) {
                    p[0] = {x: +crp[i], y: +crp[i + 1]};
                }
            }
            d.push(["C",
                  (-p[0].x + 6 * p[1].x + p[2].x) / 6,
                  (-p[0].y + 6 * p[1].y + p[2].y) / 6,
                  (p[1].x + 6 * p[2].x - p[3].x) / 6,
                  (p[1].y + 6*p[2].y - p[3].y) / 6,
                  p[2].x,
                  p[2].y
            ]);
        }

        return d;
    }
    /*\
     * Raphael.parsePathString
     [ method ]
     **
     * Utility method
     **
     * Parses given path string into an array of arrays of path segments.
     > Parameters
     - pathString (string|array) path string or array of segments (in the last case it will be returned straight away)
     = (array) array of segments.
    \*/
    R.parsePathString = function (pathString) {
        if (!pathString) {
            return null;
        }
        var pth = paths(pathString);
        if (pth.arr) {
            return pathClone(pth.arr);
        }

        var paramCounts = {a: 7, c: 6, h: 1, l: 2, m: 2, r: 4, q: 4, s: 4, t: 2, v: 1, z: 0},
            data = [];
        if (R.is(pathString, array) && R.is(pathString[0], array)) { // rough assumption
            data = pathClone(pathString);
        }
        if (!data.length) {
            Str(pathString).replace(pathCommand, function (a, b, c) {
                var params = [],
                    name = b.toLowerCase();
                c.replace(pathValues, function (a, b) {
                    b && params.push(+b);
                });
                if (name == "m" && params.length > 2) {
                    data.push([b][concat](params.splice(0, 2)));
                    name = "l";
                    b = b == "m" ? "l" : "L";
                }
                if (name == "r") {
                    data.push([b][concat](params));
                } else while (params.length >= paramCounts[name]) {
                    data.push([b][concat](params.splice(0, paramCounts[name])));
                    if (!paramCounts[name]) {
                        break;
                    }
                }
            });
        }
        data.toString = R._path2string;
        pth.arr = pathClone(data);
        return data;
    };
    /*\
     * Raphael.parseTransformString
     [ method ]
     **
     * Utility method
     **
     * Parses given path string into an array of transformations.
     > Parameters
     - TString (string|array) transform string or array of transformations (in the last case it will be returned straight away)
     = (array) array of transformations.
    \*/
    R.parseTransformString = cacher(function (TString) {
        if (!TString) {
            return null;
        }
        var paramCounts = {r: 3, s: 4, t: 2, m: 6},
            data = [];
        if (R.is(TString, array) && R.is(TString[0], array)) { // rough assumption
            data = pathClone(TString);
        }
        if (!data.length) {
            Str(TString).replace(tCommand, function (a, b, c) {
                var params = [],
                    name = lowerCase.call(b);
                c.replace(pathValues, function (a, b) {
                    b && params.push(+b);
                });
                data.push([b][concat](params));
            });
        }
        data.toString = R._path2string;
        return data;
    });
    // PATHS
    var paths = function (ps) {
        var p = paths.ps = paths.ps || {};
        if (p[ps]) {
            p[ps].sleep = 100;
        } else {
            p[ps] = {
                sleep: 100
            };
        }
        setTimeout(function () {
            for (var key in p) if (p[has](key) && key != ps) {
                p[key].sleep--;
                !p[key].sleep && delete p[key];
            }
        });
        return p[ps];
    };
    /*\
     * Raphael.findDotsAtSegment
     [ method ]
     **
     * Utility method
     **
     * Find dot coordinates on the given cubic bezier curve at the given t.
     > Parameters
     - p1x (number) x of the first point of the curve
     - p1y (number) y of the first point of the curve
     - c1x (number) x of the first anchor of the curve
     - c1y (number) y of the first anchor of the curve
     - c2x (number) x of the second anchor of the curve
     - c2y (number) y of the second anchor of the curve
     - p2x (number) x of the second point of the curve
     - p2y (number) y of the second point of the curve
     - t (number) position on the curve (0..1)
     = (object) point information in format:
     o {
     o     x: (number) x coordinate of the point
     o     y: (number) y coordinate of the point
     o     m: {
     o         x: (number) x coordinate of the left anchor
     o         y: (number) y coordinate of the left anchor
     o     }
     o     n: {
     o         x: (number) x coordinate of the right anchor
     o         y: (number) y coordinate of the right anchor
     o     }
     o     start: {
     o         x: (number) x coordinate of the start of the curve
     o         y: (number) y coordinate of the start of the curve
     o     }
     o     end: {
     o         x: (number) x coordinate of the end of the curve
     o         y: (number) y coordinate of the end of the curve
     o     }
     o     alpha: (number) angle of the curve derivative at the point
     o }
    \*/
    R.findDotsAtSegment = function (p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t) {
        var t1 = 1 - t,
            t13 = pow(t1, 3),
            t12 = pow(t1, 2),
            t2 = t * t,
            t3 = t2 * t,
            x = t13 * p1x + t12 * 3 * t * c1x + t1 * 3 * t * t * c2x + t3 * p2x,
            y = t13 * p1y + t12 * 3 * t * c1y + t1 * 3 * t * t * c2y + t3 * p2y,
            mx = p1x + 2 * t * (c1x - p1x) + t2 * (c2x - 2 * c1x + p1x),
            my = p1y + 2 * t * (c1y - p1y) + t2 * (c2y - 2 * c1y + p1y),
            nx = c1x + 2 * t * (c2x - c1x) + t2 * (p2x - 2 * c2x + c1x),
            ny = c1y + 2 * t * (c2y - c1y) + t2 * (p2y - 2 * c2y + c1y),
            ax = t1 * p1x + t * c1x,
            ay = t1 * p1y + t * c1y,
            cx = t1 * c2x + t * p2x,
            cy = t1 * c2y + t * p2y,
            alpha = (90 - math.atan2(mx - nx, my - ny) * 180 / PI);
        (mx > nx || my < ny) && (alpha += 180);
        return {
            x: x,
            y: y,
            m: {x: mx, y: my},
            n: {x: nx, y: ny},
            start: {x: ax, y: ay},
            end: {x: cx, y: cy},
            alpha: alpha
        };
    };
    /*\
     * Raphael.bezierBBox
     [ method ]
     **
     * Utility method
     **
     * Return bounding box of a given cubic bezier curve
     > Parameters
     - p1x (number) x of the first point of the curve
     - p1y (number) y of the first point of the curve
     - c1x (number) x of the first anchor of the curve
     - c1y (number) y of the first anchor of the curve
     - c2x (number) x of the second anchor of the curve
     - c2y (number) y of the second anchor of the curve
     - p2x (number) x of the second point of the curve
     - p2y (number) y of the second point of the curve
     * or
     - bez (array) array of six points for bezier curve
     = (object) point information in format:
     o {
     o     min: {
     o         x: (number) x coordinate of the left point
     o         y: (number) y coordinate of the top point
     o     }
     o     max: {
     o         x: (number) x coordinate of the right point
     o         y: (number) y coordinate of the bottom point
     o     }
     o }
    \*/
    R.bezierBBox = function (p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y) {
        if (!R.is(p1x, "array")) {
            p1x = [p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y];
        }
        var bbox = curveDim.apply(null, p1x);
        return {
            x: bbox.min.x,
            y: bbox.min.y,
            x2: bbox.max.x,
            y2: bbox.max.y,
            width: bbox.max.x - bbox.min.x,
            height: bbox.max.y - bbox.min.y
        };
    };
    /*\
     * Raphael.isPointInsideBBox
     [ method ]
     **
     * Utility method
     **
     * Returns `true` if given point is inside bounding boxes.
     > Parameters
     - bbox (string) bounding box
     - x (string) x coordinate of the point
     - y (string) y coordinate of the point
     = (boolean) `true` if point inside
    \*/
    R.isPointInsideBBox = function (bbox, x, y) {
        return x >= bbox.x && x <= bbox.x2 && y >= bbox.y && y <= bbox.y2;
    };
    /*\
     * Raphael.isBBoxIntersect
     [ method ]
     **
     * Utility method
     **
     * Returns `true` if two bounding boxes intersect
     > Parameters
     - bbox1 (string) first bounding box
     - bbox2 (string) second bounding box
     = (boolean) `true` if they intersect
    \*/
    R.isBBoxIntersect = function (bbox1, bbox2) {
        var i = R.isPointInsideBBox;
        return i(bbox2, bbox1.x, bbox1.y)
            || i(bbox2, bbox1.x2, bbox1.y)
            || i(bbox2, bbox1.x, bbox1.y2)
            || i(bbox2, bbox1.x2, bbox1.y2)
            || i(bbox1, bbox2.x, bbox2.y)
            || i(bbox1, bbox2.x2, bbox2.y)
            || i(bbox1, bbox2.x, bbox2.y2)
            || i(bbox1, bbox2.x2, bbox2.y2)
            || (bbox1.x < bbox2.x2 && bbox1.x > bbox2.x || bbox2.x < bbox1.x2 && bbox2.x > bbox1.x)
            && (bbox1.y < bbox2.y2 && bbox1.y > bbox2.y || bbox2.y < bbox1.y2 && bbox2.y > bbox1.y);
    };
    function base3(t, p1, p2, p3, p4) {
        var t1 = -3 * p1 + 9 * p2 - 9 * p3 + 3 * p4,
            t2 = t * t1 + 6 * p1 - 12 * p2 + 6 * p3;
        return t * t2 - 3 * p1 + 3 * p2;
    }
    function bezlen(x1, y1, x2, y2, x3, y3, x4, y4, z) {
        if (z == null) {
            z = 1;
        }
        z = z > 1 ? 1 : z < 0 ? 0 : z;
        var z2 = z / 2,
            n = 12,
            Tvalues = [-0.1252,0.1252,-0.3678,0.3678,-0.5873,0.5873,-0.7699,0.7699,-0.9041,0.9041,-0.9816,0.9816],
            Cvalues = [0.2491,0.2491,0.2335,0.2335,0.2032,0.2032,0.1601,0.1601,0.1069,0.1069,0.0472,0.0472],
            sum = 0;
        for (var i = 0; i < n; i++) {
            var ct = z2 * Tvalues[i] + z2,
                xbase = base3(ct, x1, x2, x3, x4),
                ybase = base3(ct, y1, y2, y3, y4),
                comb = xbase * xbase + ybase * ybase;
            sum += Cvalues[i] * math.sqrt(comb);
        }
        return z2 * sum;
    }
    function getTatLen(x1, y1, x2, y2, x3, y3, x4, y4, ll) {
        if (ll < 0 || bezlen(x1, y1, x2, y2, x3, y3, x4, y4) < ll) {
            return;
        }
        var t = 1,
            step = t / 2,
            t2 = t - step,
            l,
            e = .01;
        l = bezlen(x1, y1, x2, y2, x3, y3, x4, y4, t2);
        while (abs(l - ll) > e) {
            step /= 2;
            t2 += (l < ll ? 1 : -1) * step;
            l = bezlen(x1, y1, x2, y2, x3, y3, x4, y4, t2);
        }
        return t2;
    }
    function intersect(x1, y1, x2, y2, x3, y3, x4, y4) {
        if (
            mmax(x1, x2) < mmin(x3, x4) ||
            mmin(x1, x2) > mmax(x3, x4) ||
            mmax(y1, y2) < mmin(y3, y4) ||
            mmin(y1, y2) > mmax(y3, y4)
        ) {
            return;
        }
        var nx = (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4),
            ny = (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4),
            denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

        if (!denominator) {
            return;
        }
        var px = nx / denominator,
            py = ny / denominator,
            px2 = +px.toFixed(2),
            py2 = +py.toFixed(2);
        if (
            px2 < +mmin(x1, x2).toFixed(2) ||
            px2 > +mmax(x1, x2).toFixed(2) ||
            px2 < +mmin(x3, x4).toFixed(2) ||
            px2 > +mmax(x3, x4).toFixed(2) ||
            py2 < +mmin(y1, y2).toFixed(2) ||
            py2 > +mmax(y1, y2).toFixed(2) ||
            py2 < +mmin(y3, y4).toFixed(2) ||
            py2 > +mmax(y3, y4).toFixed(2)
        ) {
            return;
        }
        return {x: px, y: py};
    }
    function inter(bez1, bez2) {
        return interHelper(bez1, bez2);
    }
    function interCount(bez1, bez2) {
        return interHelper(bez1, bez2, 1);
    }
    function interHelper(bez1, bez2, justCount) {
        var bbox1 = R.bezierBBox(bez1),
            bbox2 = R.bezierBBox(bez2);
        if (!R.isBBoxIntersect(bbox1, bbox2)) {
            return justCount ? 0 : [];
        }
        var l1 = bezlen.apply(0, bez1),
            l2 = bezlen.apply(0, bez2),
            n1 = mmax(~~(l1 / 5), 1),
            n2 = mmax(~~(l2 / 5), 1),
            dots1 = [],
            dots2 = [],
            xy = {},
            res = justCount ? 0 : [];
        for (var i = 0; i < n1 + 1; i++) {
            var p = R.findDotsAtSegment.apply(R, bez1.concat(i / n1));
            dots1.push({x: p.x, y: p.y, t: i / n1});
        }
        for (i = 0; i < n2 + 1; i++) {
            p = R.findDotsAtSegment.apply(R, bez2.concat(i / n2));
            dots2.push({x: p.x, y: p.y, t: i / n2});
        }
        for (i = 0; i < n1; i++) {
            for (var j = 0; j < n2; j++) {
                var di = dots1[i],
                    di1 = dots1[i + 1],
                    dj = dots2[j],
                    dj1 = dots2[j + 1],
                    ci = abs(di1.x - di.x) < .001 ? "y" : "x",
                    cj = abs(dj1.x - dj.x) < .001 ? "y" : "x",
                    is = intersect(di.x, di.y, di1.x, di1.y, dj.x, dj.y, dj1.x, dj1.y);
                if (is) {
                    if (xy[is.x.toFixed(4)] == is.y.toFixed(4)) {
                        continue;
                    }
                    xy[is.x.toFixed(4)] = is.y.toFixed(4);
                    var t1 = di.t + abs((is[ci] - di[ci]) / (di1[ci] - di[ci])) * (di1.t - di.t),
                        t2 = dj.t + abs((is[cj] - dj[cj]) / (dj1[cj] - dj[cj])) * (dj1.t - dj.t);
                    if (t1 >= 0 && t1 <= 1.001 && t2 >= 0 && t2 <= 1.001) {
                        if (justCount) {
                            res++;
                        } else {
                            res.push({
                                x: is.x,
                                y: is.y,
                                t1: mmin(t1, 1),
                                t2: mmin(t2, 1)
                            });
                        }
                    }
                }
            }
        }
        return res;
    }
    /*\
     * Raphael.pathIntersection
     [ method ]
     **
     * Utility method
     **
     * Finds intersections of two paths
     > Parameters
     - path1 (string) path string
     - path2 (string) path string
     = (array) dots of intersection
     o [
     o     {
     o         x: (number) x coordinate of the point
     o         y: (number) y coordinate of the point
     o         t1: (number) t value for segment of path1
     o         t2: (number) t value for segment of path2
     o         segment1: (number) order number for segment of path1
     o         segment2: (number) order number for segment of path2
     o         bez1: (array) eight coordinates representing beziér curve for the segment of path1
     o         bez2: (array) eight coordinates representing beziér curve for the segment of path2
     o     }
     o ]
    \*/
    R.pathIntersection = function (path1, path2) {
        return interPathHelper(path1, path2);
    };
    R.pathIntersectionNumber = function (path1, path2) {
        return interPathHelper(path1, path2, 1);
    };
    function interPathHelper(path1, path2, justCount) {
        path1 = R._path2curve(path1);
        path2 = R._path2curve(path2);
        var x1, y1, x2, y2, x1m, y1m, x2m, y2m, bez1, bez2,
            res = justCount ? 0 : [];
        for (var i = 0, ii = path1.length; i < ii; i++) {
            var pi = path1[i];
            if (pi[0] == "M") {
                x1 = x1m = pi[1];
                y1 = y1m = pi[2];
            } else {
                if (pi[0] == "C") {
                    bez1 = [x1, y1].concat(pi.slice(1));
                    x1 = bez1[6];
                    y1 = bez1[7];
                } else {
                    bez1 = [x1, y1, x1, y1, x1m, y1m, x1m, y1m];
                    x1 = x1m;
                    y1 = y1m;
                }
                for (var j = 0, jj = path2.length; j < jj; j++) {
                    var pj = path2[j];
                    if (pj[0] == "M") {
                        x2 = x2m = pj[1];
                        y2 = y2m = pj[2];
                    } else {
                        if (pj[0] == "C") {
                            bez2 = [x2, y2].concat(pj.slice(1));
                            x2 = bez2[6];
                            y2 = bez2[7];
                        } else {
                            bez2 = [x2, y2, x2, y2, x2m, y2m, x2m, y2m];
                            x2 = x2m;
                            y2 = y2m;
                        }
                        var intr = interHelper(bez1, bez2, justCount);
                        if (justCount) {
                            res += intr;
                        } else {
                            for (var k = 0, kk = intr.length; k < kk; k++) {
                                intr[k].segment1 = i;
                                intr[k].segment2 = j;
                                intr[k].bez1 = bez1;
                                intr[k].bez2 = bez2;
                            }
                            res = res.concat(intr);
                        }
                    }
                }
            }
        }
        return res;
    }
    /*\
     * Raphael.isPointInsidePath
     [ method ]
     **
     * Utility method
     **
     * Returns `true` if given point is inside a given closed path.
     > Parameters
     - path (string) path string
     - x (number) x of the point
     - y (number) y of the point
     = (boolean) true, if point is inside the path
    \*/
    R.isPointInsidePath = function (path, x, y) {
        var bbox = R.pathBBox(path);
        return R.isPointInsideBBox(bbox, x, y) &&
               interPathHelper(path, [["M", x, y], ["H", bbox.x2 + 10]], 1) % 2 == 1;
    };
    R._removedFactory = function (methodname) {
        return function () {
            eve("raphael.log", null, "Rapha\xebl: you are calling to method \u201c" + methodname + "\u201d of removed object", methodname);
        };
    };
    /*\
     * Raphael.pathBBox
     [ method ]
     **
     * Utility method
     **
     * Return bounding box of a given path
     > Parameters
     - path (string) path string
     = (object) bounding box
     o {
     o     x: (number) x coordinate of the left top point of the box
     o     y: (number) y coordinate of the left top point of the box
     o     x2: (number) x coordinate of the right bottom point of the box
     o     y2: (number) y coordinate of the right bottom point of the box
     o     width: (number) width of the box
     o     height: (number) height of the box
     o     cx: (number) x coordinate of the center of the box
     o     cy: (number) y coordinate of the center of the box
     o }
    \*/
    var pathDimensions = R.pathBBox = function (path) {
        var pth = paths(path);
        if (pth.bbox) {
            return clone(pth.bbox);
        }
        if (!path) {
            return {x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0};
        }
        path = path2curve(path);
        var x = 0,
            y = 0,
            X = [],
            Y = [],
            p;
        for (var i = 0, ii = path.length; i < ii; i++) {
            p = path[i];
            if (p[0] == "M") {
                x = p[1];
                y = p[2];
                X.push(x);
                Y.push(y);
            } else {
                var dim = curveDim(x, y, p[1], p[2], p[3], p[4], p[5], p[6]);
                X = X[concat](dim.min.x, dim.max.x);
                Y = Y[concat](dim.min.y, dim.max.y);
                x = p[5];
                y = p[6];
            }
        }
        var xmin = mmin[apply](0, X),
            ymin = mmin[apply](0, Y),
            xmax = mmax[apply](0, X),
            ymax = mmax[apply](0, Y),
            width = xmax - xmin,
            height = ymax - ymin,
                bb = {
                x: xmin,
                y: ymin,
                x2: xmax,
                y2: ymax,
                width: width,
                height: height,
                cx: xmin + width / 2,
                cy: ymin + height / 2
            };
        pth.bbox = clone(bb);
        return bb;
    },
        pathClone = function (pathArray) {
            var res = clone(pathArray);
            res.toString = R._path2string;
            return res;
        },
        pathToRelative = R._pathToRelative = function (pathArray) {
            var pth = paths(pathArray);
            if (pth.rel) {
                return pathClone(pth.rel);
            }
            if (!R.is(pathArray, array) || !R.is(pathArray && pathArray[0], array)) { // rough assumption
                pathArray = R.parsePathString(pathArray);
            }
            var res = [],
                x = 0,
                y = 0,
                mx = 0,
                my = 0,
                start = 0;
            if (pathArray[0][0] == "M") {
                x = pathArray[0][1];
                y = pathArray[0][2];
                mx = x;
                my = y;
                start++;
                res.push(["M", x, y]);
            }
            for (var i = start, ii = pathArray.length; i < ii; i++) {
                var r = res[i] = [],
                    pa = pathArray[i];
                if (pa[0] != lowerCase.call(pa[0])) {
                    r[0] = lowerCase.call(pa[0]);
                    switch (r[0]) {
                        case "a":
                            r[1] = pa[1];
                            r[2] = pa[2];
                            r[3] = pa[3];
                            r[4] = pa[4];
                            r[5] = pa[5];
                            r[6] = +(pa[6] - x).toFixed(3);
                            r[7] = +(pa[7] - y).toFixed(3);
                            break;
                        case "v":
                            r[1] = +(pa[1] - y).toFixed(3);
                            break;
                        case "m":
                            mx = pa[1];
                            my = pa[2];
                        default:
                            for (var j = 1, jj = pa.length; j < jj; j++) {
                                r[j] = +(pa[j] - ((j % 2) ? x : y)).toFixed(3);
                            }
                    }
                } else {
                    r = res[i] = [];
                    if (pa[0] == "m") {
                        mx = pa[1] + x;
                        my = pa[2] + y;
                    }
                    for (var k = 0, kk = pa.length; k < kk; k++) {
                        res[i][k] = pa[k];
                    }
                }
                var len = res[i].length;
                switch (res[i][0]) {
                    case "z":
                        x = mx;
                        y = my;
                        break;
                    case "h":
                        x += +res[i][len - 1];
                        break;
                    case "v":
                        y += +res[i][len - 1];
                        break;
                    default:
                        x += +res[i][len - 2];
                        y += +res[i][len - 1];
                }
            }
            res.toString = R._path2string;
            pth.rel = pathClone(res);
            return res;
        },
        pathToAbsolute = R._pathToAbsolute = function (pathArray) {
            var pth = paths(pathArray);
            if (pth.abs) {
                return pathClone(pth.abs);
            }
            if (!R.is(pathArray, array) || !R.is(pathArray && pathArray[0], array)) { // rough assumption
                pathArray = R.parsePathString(pathArray);
            }
            if (!pathArray || !pathArray.length) {
                return [["M", 0, 0]];
            }
            var res = [],
                x = 0,
                y = 0,
                mx = 0,
                my = 0,
                start = 0;
            if (pathArray[0][0] == "M") {
                x = +pathArray[0][1];
                y = +pathArray[0][2];
                mx = x;
                my = y;
                start++;
                res[0] = ["M", x, y];
            }
            var crz = pathArray.length == 3 && pathArray[0][0] == "M" && pathArray[1][0].toUpperCase() == "R" && pathArray[2][0].toUpperCase() == "Z";
            for (var r, pa, i = start, ii = pathArray.length; i < ii; i++) {
                res.push(r = []);
                pa = pathArray[i];
                if (pa[0] != upperCase.call(pa[0])) {
                    r[0] = upperCase.call(pa[0]);
                    switch (r[0]) {
                        case "A":
                            r[1] = pa[1];
                            r[2] = pa[2];
                            r[3] = pa[3];
                            r[4] = pa[4];
                            r[5] = pa[5];
                            r[6] = +(pa[6] + x);
                            r[7] = +(pa[7] + y);
                            break;
                        case "V":
                            r[1] = +pa[1] + y;
                            break;
                        case "H":
                            r[1] = +pa[1] + x;
                            break;
                        case "R":
                            var dots = [x, y][concat](pa.slice(1));
                            for (var j = 2, jj = dots.length; j < jj; j++) {
                                dots[j] = +dots[j] + x;
                                dots[++j] = +dots[j] + y;
                            }
                            res.pop();
                            res = res[concat](catmullRom2bezier(dots, crz));
                            break;
                        case "M":
                            mx = +pa[1] + x;
                            my = +pa[2] + y;
                        default:
                            for (j = 1, jj = pa.length; j < jj; j++) {
                                r[j] = +pa[j] + ((j % 2) ? x : y);
                            }
                    }
                } else if (pa[0] == "R") {
                    dots = [x, y][concat](pa.slice(1));
                    res.pop();
                    res = res[concat](catmullRom2bezier(dots, crz));
                    r = ["R"][concat](pa.slice(-2));
                } else {
                    for (var k = 0, kk = pa.length; k < kk; k++) {
                        r[k] = pa[k];
                    }
                }
                switch (r[0]) {
                    case "Z":
                        x = mx;
                        y = my;
                        break;
                    case "H":
                        x = r[1];
                        break;
                    case "V":
                        y = r[1];
                        break;
                    case "M":
                        mx = r[r.length - 2];
                        my = r[r.length - 1];
                    default:
                        x = r[r.length - 2];
                        y = r[r.length - 1];
                }
            }
            res.toString = R._path2string;
            pth.abs = pathClone(res);
            return res;
        },
        l2c = function (x1, y1, x2, y2) {
            return [x1, y1, x2, y2, x2, y2];
        },
        q2c = function (x1, y1, ax, ay, x2, y2) {
            var _13 = 1 / 3,
                _23 = 2 / 3;
            return [
                    _13 * x1 + _23 * ax,
                    _13 * y1 + _23 * ay,
                    _13 * x2 + _23 * ax,
                    _13 * y2 + _23 * ay,
                    x2,
                    y2
                ];
        },
        a2c = function (x1, y1, rx, ry, angle, large_arc_flag, sweep_flag, x2, y2, recursive) {
            // for more information of where this math came from visit:
            // http://www.w3.org/TR/SVG11/implnote.html#ArcImplementationNotes
            var _120 = PI * 120 / 180,
                rad = PI / 180 * (+angle || 0),
                res = [],
                xy,
                rotate = cacher(function (x, y, rad) {
                    var X = x * math.cos(rad) - y * math.sin(rad),
                        Y = x * math.sin(rad) + y * math.cos(rad);
                    return {x: X, y: Y};
                });
            if (!recursive) {
                xy = rotate(x1, y1, -rad);
                x1 = xy.x;
                y1 = xy.y;
                xy = rotate(x2, y2, -rad);
                x2 = xy.x;
                y2 = xy.y;
                var cos = math.cos(PI / 180 * angle),
                    sin = math.sin(PI / 180 * angle),
                    x = (x1 - x2) / 2,
                    y = (y1 - y2) / 2;
                var h = (x * x) / (rx * rx) + (y * y) / (ry * ry);
                if (h > 1) {
                    h = math.sqrt(h);
                    rx = h * rx;
                    ry = h * ry;
                }
                var rx2 = rx * rx,
                    ry2 = ry * ry,
                    k = (large_arc_flag == sweep_flag ? -1 : 1) *
                        math.sqrt(abs((rx2 * ry2 - rx2 * y * y - ry2 * x * x) / (rx2 * y * y + ry2 * x * x))),
                    cx = k * rx * y / ry + (x1 + x2) / 2,
                    cy = k * -ry * x / rx + (y1 + y2) / 2,
                    f1 = math.asin(((y1 - cy) / ry).toFixed(9)),
                    f2 = math.asin(((y2 - cy) / ry).toFixed(9));

                f1 = x1 < cx ? PI - f1 : f1;
                f2 = x2 < cx ? PI - f2 : f2;
                f1 < 0 && (f1 = PI * 2 + f1);
                f2 < 0 && (f2 = PI * 2 + f2);
                if (sweep_flag && f1 > f2) {
                    f1 = f1 - PI * 2;
                }
                if (!sweep_flag && f2 > f1) {
                    f2 = f2 - PI * 2;
                }
            } else {
                f1 = recursive[0];
                f2 = recursive[1];
                cx = recursive[2];
                cy = recursive[3];
            }
            var df = f2 - f1;
            if (abs(df) > _120) {
                var f2old = f2,
                    x2old = x2,
                    y2old = y2;
                f2 = f1 + _120 * (sweep_flag && f2 > f1 ? 1 : -1);
                x2 = cx + rx * math.cos(f2);
                y2 = cy + ry * math.sin(f2);
                res = a2c(x2, y2, rx, ry, angle, 0, sweep_flag, x2old, y2old, [f2, f2old, cx, cy]);
            }
            df = f2 - f1;
            var c1 = math.cos(f1),
                s1 = math.sin(f1),
                c2 = math.cos(f2),
                s2 = math.sin(f2),
                t = math.tan(df / 4),
                hx = 4 / 3 * rx * t,
                hy = 4 / 3 * ry * t,
                m1 = [x1, y1],
                m2 = [x1 + hx * s1, y1 - hy * c1],
                m3 = [x2 + hx * s2, y2 - hy * c2],
                m4 = [x2, y2];
            m2[0] = 2 * m1[0] - m2[0];
            m2[1] = 2 * m1[1] - m2[1];
            if (recursive) {
                return [m2, m3, m4][concat](res);
            } else {
                res = [m2, m3, m4][concat](res).join()[split](",");
                var newres = [];
                for (var i = 0, ii = res.length; i < ii; i++) {
                    newres[i] = i % 2 ? rotate(res[i - 1], res[i], rad).y : rotate(res[i], res[i + 1], rad).x;
                }
                return newres;
            }
        },
        findDotAtSegment = function (p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t) {
            var t1 = 1 - t;
            return {
                x: pow(t1, 3) * p1x + pow(t1, 2) * 3 * t * c1x + t1 * 3 * t * t * c2x + pow(t, 3) * p2x,
                y: pow(t1, 3) * p1y + pow(t1, 2) * 3 * t * c1y + t1 * 3 * t * t * c2y + pow(t, 3) * p2y
            };
        },
        curveDim = cacher(function (p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y) {
            var a = (c2x - 2 * c1x + p1x) - (p2x - 2 * c2x + c1x),
                b = 2 * (c1x - p1x) - 2 * (c2x - c1x),
                c = p1x - c1x,
                t1 = (-b + math.sqrt(b * b - 4 * a * c)) / 2 / a,
                t2 = (-b - math.sqrt(b * b - 4 * a * c)) / 2 / a,
                y = [p1y, p2y],
                x = [p1x, p2x],
                dot;
            abs(t1) > "1e12" && (t1 = .5);
            abs(t2) > "1e12" && (t2 = .5);
            if (t1 > 0 && t1 < 1) {
                dot = findDotAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t1);
                x.push(dot.x);
                y.push(dot.y);
            }
            if (t2 > 0 && t2 < 1) {
                dot = findDotAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t2);
                x.push(dot.x);
                y.push(dot.y);
            }
            a = (c2y - 2 * c1y + p1y) - (p2y - 2 * c2y + c1y);
            b = 2 * (c1y - p1y) - 2 * (c2y - c1y);
            c = p1y - c1y;
            t1 = (-b + math.sqrt(b * b - 4 * a * c)) / 2 / a;
            t2 = (-b - math.sqrt(b * b - 4 * a * c)) / 2 / a;
            abs(t1) > "1e12" && (t1 = .5);
            abs(t2) > "1e12" && (t2 = .5);
            if (t1 > 0 && t1 < 1) {
                dot = findDotAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t1);
                x.push(dot.x);
                y.push(dot.y);
            }
            if (t2 > 0 && t2 < 1) {
                dot = findDotAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t2);
                x.push(dot.x);
                y.push(dot.y);
            }
            return {
                min: {x: mmin[apply](0, x), y: mmin[apply](0, y)},
                max: {x: mmax[apply](0, x), y: mmax[apply](0, y)}
            };
        }),
        path2curve = R._path2curve = cacher(function (path, path2) {
            var pth = !path2 && paths(path);
            if (!path2 && pth.curve) {
                return pathClone(pth.curve);
            }
            var p = pathToAbsolute(path),
                p2 = path2 && pathToAbsolute(path2),
                attrs = {x: 0, y: 0, bx: 0, by: 0, X: 0, Y: 0, qx: null, qy: null},
                attrs2 = {x: 0, y: 0, bx: 0, by: 0, X: 0, Y: 0, qx: null, qy: null},
                processPath = function (path, d, pcom) {
                    var nx, ny, tq = {T:1, Q:1};
                    if (!path) {
                        return ["C", d.x, d.y, d.x, d.y, d.x, d.y];
                    }
                    !(path[0] in tq) && (d.qx = d.qy = null);
                    switch (path[0]) {
                        case "M":
                            d.X = path[1];
                            d.Y = path[2];
                            break;
                        case "A":
                            path = ["C"][concat](a2c[apply](0, [d.x, d.y][concat](path.slice(1))));
                            break;
                        case "S":
                            if (pcom == "C" || pcom == "S") { // In "S" case we have to take into account, if the previous command is C/S.
                                nx = d.x * 2 - d.bx;          // And reflect the previous
                                ny = d.y * 2 - d.by;          // command's control point relative to the current point.
                            }
                            else {                            // or some else or nothing
                                nx = d.x;
                                ny = d.y;
                            }
                            path = ["C", nx, ny][concat](path.slice(1));
                            break;
                        case "T":
                            if (pcom == "Q" || pcom == "T") { // In "T" case we have to take into account, if the previous command is Q/T.
                                d.qx = d.x * 2 - d.qx;        // And make a reflection similar
                                d.qy = d.y * 2 - d.qy;        // to case "S".
                            }
                            else {                            // or something else or nothing
                                d.qx = d.x;
                                d.qy = d.y;
                            }
                            path = ["C"][concat](q2c(d.x, d.y, d.qx, d.qy, path[1], path[2]));
                            break;
                        case "Q":
                            d.qx = path[1];
                            d.qy = path[2];
                            path = ["C"][concat](q2c(d.x, d.y, path[1], path[2], path[3], path[4]));
                            break;
                        case "L":
                            path = ["C"][concat](l2c(d.x, d.y, path[1], path[2]));
                            break;
                        case "H":
                            path = ["C"][concat](l2c(d.x, d.y, path[1], d.y));
                            break;
                        case "V":
                            path = ["C"][concat](l2c(d.x, d.y, d.x, path[1]));
                            break;
                        case "Z":
                            path = ["C"][concat](l2c(d.x, d.y, d.X, d.Y));
                            break;
                    }
                    return path;
                },
                fixArc = function (pp, i) {
                    if (pp[i].length > 7) {
                        pp[i].shift();
                        var pi = pp[i];
                        while (pi.length) {
                            pcoms1[i]="A"; // if created multiple C:s, their original seg is saved
                            p2 && (pcoms2[i]="A"); // the same as above
                            pp.splice(i++, 0, ["C"][concat](pi.splice(0, 6)));
                        }
                        pp.splice(i, 1);
                        ii = mmax(p.length, p2 && p2.length || 0);
                    }
                },
                fixM = function (path1, path2, a1, a2, i) {
                    if (path1 && path2 && path1[i][0] == "M" && path2[i][0] != "M") {
                        path2.splice(i, 0, ["M", a2.x, a2.y]);
                        a1.bx = 0;
                        a1.by = 0;
                        a1.x = path1[i][1];
                        a1.y = path1[i][2];
                        ii = mmax(p.length, p2 && p2.length || 0);
                    }
                },
                pcoms1 = [], // path commands of original path p
                pcoms2 = [], // path commands of original path p2
                pfirst = "", // temporary holder for original path command
                pcom = ""; // holder for previous path command of original path
            for (var i = 0, ii = mmax(p.length, p2 && p2.length || 0); i < ii; i++) {
                p[i] && (pfirst = p[i][0]); // save current path command

                if (pfirst != "C") // C is not saved yet, because it may be result of conversion
                {
                    pcoms1[i] = pfirst; // Save current path command
                    i && ( pcom = pcoms1[i-1]); // Get previous path command pcom
                }
                p[i] = processPath(p[i], attrs, pcom); // Previous path command is inputted to processPath

                if (pcoms1[i] != "A" && pfirst == "C") pcoms1[i] = "C"; // A is the only command
                // which may produce multiple C:s
                // so we have to make sure that C is also C in original path

                fixArc(p, i); // fixArc adds also the right amount of A:s to pcoms1

                if (p2) { // the same procedures is done to p2
                    p2[i] && (pfirst = p2[i][0]);
                    if (pfirst != "C")
                    {
                        pcoms2[i] = pfirst;
                        i && (pcom = pcoms2[i-1]);
                    }
                    p2[i] = processPath(p2[i], attrs2, pcom);

                    if (pcoms2[i]!="A" && pfirst=="C") pcoms2[i]="C";

                    fixArc(p2, i);
                }
                fixM(p, p2, attrs, attrs2, i);
                fixM(p2, p, attrs2, attrs, i);
                var seg = p[i],
                    seg2 = p2 && p2[i],
                    seglen = seg.length,
                    seg2len = p2 && seg2.length;
                attrs.x = seg[seglen - 2];
                attrs.y = seg[seglen - 1];
                attrs.bx = toFloat(seg[seglen - 4]) || attrs.x;
                attrs.by = toFloat(seg[seglen - 3]) || attrs.y;
                attrs2.bx = p2 && (toFloat(seg2[seg2len - 4]) || attrs2.x);
                attrs2.by = p2 && (toFloat(seg2[seg2len - 3]) || attrs2.y);
                attrs2.x = p2 && seg2[seg2len - 2];
                attrs2.y = p2 && seg2[seg2len - 1];
            }
            if (!p2) {
                pth.curve = pathClone(p);
            }
            return p2 ? [p, p2] : p;
        }, null, pathClone),
        parseDots = R._parseDots = cacher(function (gradient) {
            var dots = [];
            for (var i = 0, ii = gradient.length; i < ii; i++) {
                var dot = {},
                    par = gradient[i].match(/^([^:]*):?([\d\.]*)/);
                dot.color = R.getRGB(par[1]);
                if (dot.color.error) {
                    return null;
                }
                dot.color = dot.color.hex;
                par[2] && (dot.offset = par[2] + "%");
                dots.push(dot);
            }
            for (i = 1, ii = dots.length - 1; i < ii; i++) {
                if (!dots[i].offset) {
                    var start = toFloat(dots[i - 1].offset || 0),
                        end = 0;
                    for (var j = i + 1; j < ii; j++) {
                        if (dots[j].offset) {
                            end = dots[j].offset;
                            break;
                        }
                    }
                    if (!end) {
                        end = 100;
                        j = ii;
                    }
                    end = toFloat(end);
                    var d = (end - start) / (j - i + 1);
                    for (; i < j; i++) {
                        start += d;
                        dots[i].offset = start + "%";
                    }
                }
            }
            return dots;
        }),
        tear = R._tear = function (el, paper) {
            el == paper.top && (paper.top = el.prev);
            el == paper.bottom && (paper.bottom = el.next);
            el.next && (el.next.prev = el.prev);
            el.prev && (el.prev.next = el.next);
        },
        tofront = R._tofront = function (el, paper) {
            if (paper.top === el) {
                return;
            }
            tear(el, paper);
            el.next = null;
            el.prev = paper.top;
            paper.top.next = el;
            paper.top = el;
        },
        toback = R._toback = function (el, paper) {
            if (paper.bottom === el) {
                return;
            }
            tear(el, paper);
            el.next = paper.bottom;
            el.prev = null;
            paper.bottom.prev = el;
            paper.bottom = el;
        },
        insertafter = R._insertafter = function (el, el2, paper) {
            tear(el, paper);
            el2 == paper.top && (paper.top = el);
            el2.next && (el2.next.prev = el);
            el.next = el2.next;
            el.prev = el2;
            el2.next = el;
        },
        insertbefore = R._insertbefore = function (el, el2, paper) {
            tear(el, paper);
            el2 == paper.bottom && (paper.bottom = el);
            el2.prev && (el2.prev.next = el);
            el.prev = el2.prev;
            el2.prev = el;
            el.next = el2;
        },
        /*\
         * Raphael.toMatrix
         [ method ]
         **
         * Utility method
         **
         * Returns matrix of transformations applied to a given path
         > Parameters
         - path (string) path string
         - transform (string|array) transformation string
         = (object) @Matrix
        \*/
        toMatrix = R.toMatrix = function (path, transform) {
            var bb = pathDimensions(path),
                el = {
                    _: {
                        transform: E
                    },
                    getBBox: function () {
                        return bb;
                    }
                };
            extractTransform(el, transform);
            return el.matrix;
        },
        /*\
         * Raphael.transformPath
         [ method ]
         **
         * Utility method
         **
         * Returns path transformed by a given transformation
         > Parameters
         - path (string) path string
         - transform (string|array) transformation string
         = (string) path
        \*/
        transformPath = R.transformPath = function (path, transform) {
            return mapPath(path, toMatrix(path, transform));
        },
        extractTransform = R._extractTransform = function (el, tstr) {
            if (tstr == null) {
                return el._.transform;
            }
            tstr = Str(tstr).replace(/\.{3}|\u2026/g, el._.transform || E);
            var tdata = R.parseTransformString(tstr),
                deg = 0,
                dx = 0,
                dy = 0,
                sx = 1,
                sy = 1,
                _ = el._,
                m = new Matrix;
            _.transform = tdata || [];
            if (tdata) {
                for (var i = 0, ii = tdata.length; i < ii; i++) {
                    var t = tdata[i],
                        tlen = t.length,
                        command = Str(t[0]).toLowerCase(),
                        absolute = t[0] != command,
                        inver = absolute ? m.invert() : 0,
                        x1,
                        y1,
                        x2,
                        y2,
                        bb;
                    if (command == "t" && tlen == 3) {
                        if (absolute) {
                            x1 = inver.x(0, 0);
                            y1 = inver.y(0, 0);
                            x2 = inver.x(t[1], t[2]);
                            y2 = inver.y(t[1], t[2]);
                            m.translate(x2 - x1, y2 - y1);
                        } else {
                            m.translate(t[1], t[2]);
                        }
                    } else if (command == "r") {
                        if (tlen == 2) {
                            bb = bb || el.getBBox(1);
                            m.rotate(t[1], bb.x + bb.width / 2, bb.y + bb.height / 2);
                            deg += t[1];
                        } else if (tlen == 4) {
                            if (absolute) {
                                x2 = inver.x(t[2], t[3]);
                                y2 = inver.y(t[2], t[3]);
                                m.rotate(t[1], x2, y2);
                            } else {
                                m.rotate(t[1], t[2], t[3]);
                            }
                            deg += t[1];
                        }
                    } else if (command == "s") {
                        if (tlen == 2 || tlen == 3) {
                            bb = bb || el.getBBox(1);
                            m.scale(t[1], t[tlen - 1], bb.x + bb.width / 2, bb.y + bb.height / 2);
                            sx *= t[1];
                            sy *= t[tlen - 1];
                        } else if (tlen == 5) {
                            if (absolute) {
                                x2 = inver.x(t[3], t[4]);
                                y2 = inver.y(t[3], t[4]);
                                m.scale(t[1], t[2], x2, y2);
                            } else {
                                m.scale(t[1], t[2], t[3], t[4]);
                            }
                            sx *= t[1];
                            sy *= t[2];
                        }
                    } else if (command == "m" && tlen == 7) {
                        m.add(t[1], t[2], t[3], t[4], t[5], t[6]);
                    }
                    _.dirtyT = 1;
                    el.matrix = m;
                }
            }

            /*\
             * Element.matrix
             [ property (object) ]
             **
             * Keeps @Matrix object, which represents element transformation
            \*/
            el.matrix = m;

            _.sx = sx;
            _.sy = sy;
            _.deg = deg;
            _.dx = dx = m.e;
            _.dy = dy = m.f;

            if (sx == 1 && sy == 1 && !deg && _.bbox) {
                _.bbox.x += +dx;
                _.bbox.y += +dy;
            } else {
                _.dirtyT = 1;
            }
        },
        getEmpty = function (item) {
            var l = item[0];
            switch (l.toLowerCase()) {
                case "t": return [l, 0, 0];
                case "m": return [l, 1, 0, 0, 1, 0, 0];
                case "r": if (item.length == 4) {
                    return [l, 0, item[2], item[3]];
                } else {
                    return [l, 0];
                }
                case "s": if (item.length == 5) {
                    return [l, 1, 1, item[3], item[4]];
                } else if (item.length == 3) {
                    return [l, 1, 1];
                } else {
                    return [l, 1];
                }
            }
        },
        equaliseTransform = R._equaliseTransform = function (t1, t2) {
            t2 = Str(t2).replace(/\.{3}|\u2026/g, t1);
            t1 = R.parseTransformString(t1) || [];
            t2 = R.parseTransformString(t2) || [];
            var maxlength = mmax(t1.length, t2.length),
                from = [],
                to = [],
                i = 0, j, jj,
                tt1, tt2;
            for (; i < maxlength; i++) {
                tt1 = t1[i] || getEmpty(t2[i]);
                tt2 = t2[i] || getEmpty(tt1);
                if ((tt1[0] != tt2[0]) ||
                    (tt1[0].toLowerCase() == "r" && (tt1[2] != tt2[2] || tt1[3] != tt2[3])) ||
                    (tt1[0].toLowerCase() == "s" && (tt1[3] != tt2[3] || tt1[4] != tt2[4]))
                    ) {
                    return;
                }
                from[i] = [];
                to[i] = [];
                for (j = 0, jj = mmax(tt1.length, tt2.length); j < jj; j++) {
                    j in tt1 && (from[i][j] = tt1[j]);
                    j in tt2 && (to[i][j] = tt2[j]);
                }
            }
            return {
                from: from,
                to: to
            };
        };
    R._getContainer = function (x, y, w, h) {
        var container;
        container = h == null && !R.is(x, "object") ? g.doc.getElementById(x) : x;
        if (container == null) {
            return;
        }
        if (container.tagName) {
            if (y == null) {
                return {
                    container: container,
                    width: container.style.pixelWidth || container.offsetWidth,
                    height: container.style.pixelHeight || container.offsetHeight
                };
            } else {
                return {
                    container: container,
                    width: y,
                    height: w
                };
            }
        }
        return {
            container: 1,
            x: x,
            y: y,
            width: w,
            height: h
        };
    };
    /*\
     * Raphael.pathToRelative
     [ method ]
     **
     * Utility method
     **
     * Converts path to relative form
     > Parameters
     - pathString (string|array) path string or array of segments
     = (array) array of segments.
    \*/
    R.pathToRelative = pathToRelative;
    R._engine = {};
    /*\
     * Raphael.path2curve
     [ method ]
     **
     * Utility method
     **
     * Converts path to a new path where all segments are cubic bezier curves.
     > Parameters
     - pathString (string|array) path string or array of segments
     = (array) array of segments.
    \*/
    R.path2curve = path2curve;
    /*\
     * Raphael.matrix
     [ method ]
     **
     * Utility method
     **
     * Returns matrix based on given parameters.
     > Parameters
     - a (number)
     - b (number)
     - c (number)
     - d (number)
     - e (number)
     - f (number)
     = (object) @Matrix
    \*/
    R.matrix = function (a, b, c, d, e, f) {
        return new Matrix(a, b, c, d, e, f);
    };
    function Matrix(a, b, c, d, e, f) {
        if (a != null) {
            this.a = +a;
            this.b = +b;
            this.c = +c;
            this.d = +d;
            this.e = +e;
            this.f = +f;
        } else {
            this.a = 1;
            this.b = 0;
            this.c = 0;
            this.d = 1;
            this.e = 0;
            this.f = 0;
        }
    }
    (function (matrixproto) {
        /*\
         * Matrix.add
         [ method ]
         **
         * Adds given matrix to existing one.
         > Parameters
         - a (number)
         - b (number)
         - c (number)
         - d (number)
         - e (number)
         - f (number)
         or
         - matrix (object) @Matrix
        \*/
        matrixproto.add = function (a, b, c, d, e, f) {
            var out = [[], [], []],
                m = [[this.a, this.c, this.e], [this.b, this.d, this.f], [0, 0, 1]],
                matrix = [[a, c, e], [b, d, f], [0, 0, 1]],
                x, y, z, res;

            if (a && a instanceof Matrix) {
                matrix = [[a.a, a.c, a.e], [a.b, a.d, a.f], [0, 0, 1]];
            }

            for (x = 0; x < 3; x++) {
                for (y = 0; y < 3; y++) {
                    res = 0;
                    for (z = 0; z < 3; z++) {
                        res += m[x][z] * matrix[z][y];
                    }
                    out[x][y] = res;
                }
            }
            this.a = out[0][0];
            this.b = out[1][0];
            this.c = out[0][1];
            this.d = out[1][1];
            this.e = out[0][2];
            this.f = out[1][2];
        };
        /*\
         * Matrix.invert
         [ method ]
         **
         * Returns inverted version of the matrix
         = (object) @Matrix
        \*/
        matrixproto.invert = function () {
            var me = this,
                x = me.a * me.d - me.b * me.c;
            return new Matrix(me.d / x, -me.b / x, -me.c / x, me.a / x, (me.c * me.f - me.d * me.e) / x, (me.b * me.e - me.a * me.f) / x);
        };
        /*\
         * Matrix.clone
         [ method ]
         **
         * Returns copy of the matrix
         = (object) @Matrix
        \*/
        matrixproto.clone = function () {
            return new Matrix(this.a, this.b, this.c, this.d, this.e, this.f);
        };
        /*\
         * Matrix.translate
         [ method ]
         **
         * Translate the matrix
         > Parameters
         - x (number)
         - y (number)
        \*/
        matrixproto.translate = function (x, y) {
            this.add(1, 0, 0, 1, x, y);
        };
        /*\
         * Matrix.scale
         [ method ]
         **
         * Scales the matrix
         > Parameters
         - x (number)
         - y (number) #optional
         - cx (number) #optional
         - cy (number) #optional
        \*/
        matrixproto.scale = function (x, y, cx, cy) {
            y == null && (y = x);
            (cx || cy) && this.add(1, 0, 0, 1, cx, cy);
            this.add(x, 0, 0, y, 0, 0);
            (cx || cy) && this.add(1, 0, 0, 1, -cx, -cy);
        };
        /*\
         * Matrix.rotate
         [ method ]
         **
         * Rotates the matrix
         > Parameters
         - a (number)
         - x (number)
         - y (number)
        \*/
        matrixproto.rotate = function (a, x, y) {
            a = R.rad(a);
            x = x || 0;
            y = y || 0;
            var cos = +math.cos(a).toFixed(9),
                sin = +math.sin(a).toFixed(9);
            this.add(cos, sin, -sin, cos, x, y);
            this.add(1, 0, 0, 1, -x, -y);
        };
        /*\
         * Matrix.x
         [ method ]
         **
         * Return x coordinate for given point after transformation described by the matrix. See also @Matrix.y
         > Parameters
         - x (number)
         - y (number)
         = (number) x
        \*/
        matrixproto.x = function (x, y) {
            return x * this.a + y * this.c + this.e;
        };
        /*\
         * Matrix.y
         [ method ]
         **
         * Return y coordinate for given point after transformation described by the matrix. See also @Matrix.x
         > Parameters
         - x (number)
         - y (number)
         = (number) y
        \*/
        matrixproto.y = function (x, y) {
            return x * this.b + y * this.d + this.f;
        };
        matrixproto.get = function (i) {
            return +this[Str.fromCharCode(97 + i)].toFixed(4);
        };
        matrixproto.toString = function () {
            return R.svg ?
                "matrix(" + [this.get(0), this.get(1), this.get(2), this.get(3), this.get(4), this.get(5)].join() + ")" :
                [this.get(0), this.get(2), this.get(1), this.get(3), 0, 0].join();
        };
        matrixproto.toFilter = function () {
            return "progid:DXImageTransform.Microsoft.Matrix(M11=" + this.get(0) +
                ", M12=" + this.get(2) + ", M21=" + this.get(1) + ", M22=" + this.get(3) +
                ", Dx=" + this.get(4) + ", Dy=" + this.get(5) + ", sizingmethod='auto expand')";
        };
        matrixproto.offset = function () {
            return [this.e.toFixed(4), this.f.toFixed(4)];
        };
        function norm(a) {
            return a[0] * a[0] + a[1] * a[1];
        }
        function normalize(a) {
            var mag = math.sqrt(norm(a));
            a[0] && (a[0] /= mag);
            a[1] && (a[1] /= mag);
        }
        /*\
         * Matrix.split
         [ method ]
         **
         * Splits matrix into primitive transformations
         = (object) in format:
         o dx (number) translation by x
         o dy (number) translation by y
         o scalex (number) scale by x
         o scaley (number) scale by y
         o shear (number) shear
         o rotate (number) rotation in deg
         o isSimple (boolean) could it be represented via simple transformations
        \*/
        matrixproto.split = function () {
            var out = {};
            // translation
            out.dx = this.e;
            out.dy = this.f;

            // scale and shear
            var row = [[this.a, this.c], [this.b, this.d]];
            out.scalex = math.sqrt(norm(row[0]));
            normalize(row[0]);

            out.shear = row[0][0] * row[1][0] + row[0][1] * row[1][1];
            row[1] = [row[1][0] - row[0][0] * out.shear, row[1][1] - row[0][1] * out.shear];

            out.scaley = math.sqrt(norm(row[1]));
            normalize(row[1]);
            out.shear /= out.scaley;

            // rotation
            var sin = -row[0][1],
                cos = row[1][1];
            if (cos < 0) {
                out.rotate = R.deg(math.acos(cos));
                if (sin < 0) {
                    out.rotate = 360 - out.rotate;
                }
            } else {
                out.rotate = R.deg(math.asin(sin));
            }

            out.isSimple = !+out.shear.toFixed(9) && (out.scalex.toFixed(9) == out.scaley.toFixed(9) || !out.rotate);
            out.isSuperSimple = !+out.shear.toFixed(9) && out.scalex.toFixed(9) == out.scaley.toFixed(9) && !out.rotate;
            out.noRotation = !+out.shear.toFixed(9) && !out.rotate;
            return out;
        };
        /*\
         * Matrix.toTransformString
         [ method ]
         **
         * Return transform string that represents given matrix
         = (string) transform string
        \*/
        matrixproto.toTransformString = function (shorter) {
            var s = shorter || this[split]();
            if (s.isSimple) {
                s.scalex = +s.scalex.toFixed(4);
                s.scaley = +s.scaley.toFixed(4);
                s.rotate = +s.rotate.toFixed(4);
                return  (s.dx || s.dy ? "t" + [s.dx, s.dy] : E) +
                        (s.scalex != 1 || s.scaley != 1 ? "s" + [s.scalex, s.scaley, 0, 0] : E) +
                        (s.rotate ? "r" + [s.rotate, 0, 0] : E);
            } else {
                return "m" + [this.get(0), this.get(1), this.get(2), this.get(3), this.get(4), this.get(5)];
            }
        };
    })(Matrix.prototype);

    // WebKit rendering bug workaround method
    var version = navigator.userAgent.match(/Version\/(.*?)\s/) || navigator.userAgent.match(/Chrome\/(\d+)/);
    if ((navigator.vendor == "Apple Computer, Inc.") && (version && version[1] < 4 || navigator.platform.slice(0, 2) == "iP") ||
        (navigator.vendor == "Google Inc." && version && version[1] < 8)) {
        /*\
         * Paper.safari
         [ method ]
         **
         * There is an inconvenient rendering bug in Safari (WebKit):
         * sometimes the rendering should be forced.
         * This method should help with dealing with this bug.
        \*/
        paperproto.safari = function () {
            var rect = this.rect(-99, -99, this.width + 99, this.height + 99).attr({stroke: "none"});
            setTimeout(function () {rect.remove();});
        };
    } else {
        paperproto.safari = fun;
    }

    var preventDefault = function () {
        this.returnValue = false;
    },
    preventTouch = function () {
        return this.originalEvent.preventDefault();
    },
    stopPropagation = function () {
        this.cancelBubble = true;
    },
    stopTouch = function () {
        return this.originalEvent.stopPropagation();
    },
    getEventPosition = function (e) {
        var scrollY = g.doc.documentElement.scrollTop || g.doc.body.scrollTop,
            scrollX = g.doc.documentElement.scrollLeft || g.doc.body.scrollLeft;

        return {
            x: e.clientX + scrollX,
            y: e.clientY + scrollY
        };
    },
    addEvent = (function () {
        if (g.doc.addEventListener) {
            return function (obj, type, fn, element) {
                var f = function (e) {
                    var pos = getEventPosition(e);
                    return fn.call(element, e, pos.x, pos.y);
                };
                obj.addEventListener(type, f, false);

                if (supportsTouch && touchMap[type]) {
                    var _f = function (e) {
                        var pos = getEventPosition(e),
                            olde = e;

                        for (var i = 0, ii = e.targetTouches && e.targetTouches.length; i < ii; i++) {
                            if (e.targetTouches[i].target == obj) {
                                e = e.targetTouches[i];
                                e.originalEvent = olde;
                                e.preventDefault = preventTouch;
                                e.stopPropagation = stopTouch;
                                break;
                            }
                        }

                        return fn.call(element, e, pos.x, pos.y);
                    };
                    obj.addEventListener(touchMap[type], _f, false);
                }

                return function () {
                    obj.removeEventListener(type, f, false);

                    if (supportsTouch && touchMap[type])
                        obj.removeEventListener(touchMap[type], _f, false);

                    return true;
                };
            };
        } else if (g.doc.attachEvent) {
            return function (obj, type, fn, element) {
                var f = function (e) {
                    e = e || g.win.event;
                    var scrollY = g.doc.documentElement.scrollTop || g.doc.body.scrollTop,
                        scrollX = g.doc.documentElement.scrollLeft || g.doc.body.scrollLeft,
                        x = e.clientX + scrollX,
                        y = e.clientY + scrollY;
                    e.preventDefault = e.preventDefault || preventDefault;
                    e.stopPropagation = e.stopPropagation || stopPropagation;
                    return fn.call(element, e, x, y);
                };
                obj.attachEvent("on" + type, f);
                var detacher = function () {
                    obj.detachEvent("on" + type, f);
                    return true;
                };
                return detacher;
            };
        }
    })(),
    drag = [],
    dragMove = function (e) {
        var x = e.clientX,
            y = e.clientY,
            scrollY = g.doc.documentElement.scrollTop || g.doc.body.scrollTop,
            scrollX = g.doc.documentElement.scrollLeft || g.doc.body.scrollLeft,
            dragi,
            j = drag.length;
        while (j--) {
            dragi = drag[j];
            if (supportsTouch && e.touches) {
                var i = e.touches.length,
                    touch;
                while (i--) {
                    touch = e.touches[i];
                    if (touch.identifier == dragi.el._drag.id) {
                        x = touch.clientX;
                        y = touch.clientY;
                        (e.originalEvent ? e.originalEvent : e).preventDefault();
                        break;
                    }
                }
            } else {
                e.preventDefault();
            }
            var node = dragi.el.node,
                o,
                next = node.nextSibling,
                parent = node.parentNode,
                display = node.style.display;
            g.win.opera && parent.removeChild(node);
            node.style.display = "none";
            o = dragi.el.paper.getElementByPoint(x, y);
            node.style.display = display;
            g.win.opera && (next ? parent.insertBefore(node, next) : parent.appendChild(node));
            o && eve("raphael.drag.over." + dragi.el.id, dragi.el, o);
            x += scrollX;
            y += scrollY;
            eve("raphael.drag.move." + dragi.el.id, dragi.move_scope || dragi.el, x - dragi.el._drag.x, y - dragi.el._drag.y, x, y, e);
        }
    },
    dragUp = function (e) {
        R.unmousemove(dragMove).unmouseup(dragUp);
        var i = drag.length,
            dragi;
        while (i--) {
            dragi = drag[i];
            dragi.el._drag = {};
            eve("raphael.drag.end." + dragi.el.id, dragi.end_scope || dragi.start_scope || dragi.move_scope || dragi.el, e);
        }
        drag = [];
    },
    /*\
     * Raphael.el
     [ property (object) ]
     **
     * You can add your own method to elements. This is usefull when you want to hack default functionality or
     * want to wrap some common transformation or attributes in one method. In difference to canvas methods,
     * you can redefine element method at any time. Expending element methods wouldn’t affect set.
     > Usage
     | Raphael.el.red = function () {
     |     this.attr({fill: "#f00"});
     | };
     | // then use it
     | paper.circle(100, 100, 20).red();
    \*/
    elproto = R.el = {};
    /*\
     * Element.click
     [ method ]
     **
     * Adds event handler for click for the element.
     > Parameters
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.unclick
     [ method ]
     **
     * Removes event handler for click for the element.
     > Parameters
     - handler (function) #optional handler for the event
     = (object) @Element
    \*/

    /*\
     * Element.dblclick
     [ method ]
     **
     * Adds event handler for double click for the element.
     > Parameters
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.undblclick
     [ method ]
     **
     * Removes event handler for double click for the element.
     > Parameters
     - handler (function) #optional handler for the event
     = (object) @Element
    \*/

    /*\
     * Element.mousedown
     [ method ]
     **
     * Adds event handler for mousedown for the element.
     > Parameters
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.unmousedown
     [ method ]
     **
     * Removes event handler for mousedown for the element.
     > Parameters
     - handler (function) #optional handler for the event
     = (object) @Element
    \*/

    /*\
     * Element.mousemove
     [ method ]
     **
     * Adds event handler for mousemove for the element.
     > Parameters
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.unmousemove
     [ method ]
     **
     * Removes event handler for mousemove for the element.
     > Parameters
     - handler (function) #optional handler for the event
     = (object) @Element
    \*/

    /*\
     * Element.mouseout
     [ method ]
     **
     * Adds event handler for mouseout for the element.
     > Parameters
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.unmouseout
     [ method ]
     **
     * Removes event handler for mouseout for the element.
     > Parameters
     - handler (function) #optional handler for the event
     = (object) @Element
    \*/

    /*\
     * Element.mouseover
     [ method ]
     **
     * Adds event handler for mouseover for the element.
     > Parameters
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.unmouseover
     [ method ]
     **
     * Removes event handler for mouseover for the element.
     > Parameters
     - handler (function) #optional handler for the event
     = (object) @Element
    \*/

    /*\
     * Element.mouseup
     [ method ]
     **
     * Adds event handler for mouseup for the element.
     > Parameters
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.unmouseup
     [ method ]
     **
     * Removes event handler for mouseup for the element.
     > Parameters
     - handler (function) #optional handler for the event
     = (object) @Element
    \*/

    /*\
     * Element.touchstart
     [ method ]
     **
     * Adds event handler for touchstart for the element.
     > Parameters
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.untouchstart
     [ method ]
     **
     * Removes event handler for touchstart for the element.
     > Parameters
     - handler (function) #optional handler for the event
     = (object) @Element
    \*/

    /*\
     * Element.touchmove
     [ method ]
     **
     * Adds event handler for touchmove for the element.
     > Parameters
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.untouchmove
     [ method ]
     **
     * Removes event handler for touchmove for the element.
     > Parameters
     - handler (function) #optional handler for the event
     = (object) @Element
    \*/

    /*\
     * Element.touchend
     [ method ]
     **
     * Adds event handler for touchend for the element.
     > Parameters
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.untouchend
     [ method ]
     **
     * Removes event handler for touchend for the element.
     > Parameters
     - handler (function) #optional handler for the event
     = (object) @Element
    \*/

    /*\
     * Element.touchcancel
     [ method ]
     **
     * Adds event handler for touchcancel for the element.
     > Parameters
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.untouchcancel
     [ method ]
     **
     * Removes event handler for touchcancel for the element.
     > Parameters
     - handler (function) #optional handler for the event
     = (object) @Element
    \*/
    for (var i = events.length; i--;) {
        (function (eventName) {
            R[eventName] = elproto[eventName] = function (fn, scope) {
                if (R.is(fn, "function")) {
                    this.events = this.events || [];
                    this.events.push({name: eventName, f: fn, unbind: addEvent(this.shape || this.node || g.doc, eventName, fn, scope || this)});
                }
                return this;
            };
            R["un" + eventName] = elproto["un" + eventName] = function (fn) {
                var events = this.events || [],
                    l = events.length;
                while (l--){
                    if (events[l].name == eventName && (R.is(fn, "undefined") || events[l].f == fn)) {
                        events[l].unbind();
                        events.splice(l, 1);
                        !events.length && delete this.events;
                    }
                }
                return this;
            };
        })(events[i]);
    }

    /*\
     * Element.data
     [ method ]
     **
     * Adds or retrieves given value asociated with given key.
     **
     * See also @Element.removeData
     > Parameters
     - key (string) key to store data
     - value (any) #optional value to store
     = (object) @Element
     * or, if value is not specified:
     = (any) value
     * or, if key and value are not specified:
     = (object) Key/value pairs for all the data associated with the element.
     > Usage
     | for (var i = 0, i < 5, i++) {
     |     paper.circle(10 + 15 * i, 10, 10)
     |          .attr({fill: "#000"})
     |          .data("i", i)
     |          .click(function () {
     |             alert(this.data("i"));
     |          });
     | }
    \*/
    elproto.data = function (key, value) {
        var data = eldata[this.id] = eldata[this.id] || {};
        if (arguments.length == 0) {
            return data;
        }
        if (arguments.length == 1) {
            if (R.is(key, "object")) {
                for (var i in key) if (key[has](i)) {
                    this.data(i, key[i]);
                }
                return this;
            }
            eve("raphael.data.get." + this.id, this, data[key], key);
            return data[key];
        }
        data[key] = value;
        eve("raphael.data.set." + this.id, this, value, key);
        return this;
    };
    /*\
     * Element.removeData
     [ method ]
     **
     * Removes value associated with an element by given key.
     * If key is not provided, removes all the data of the element.
     > Parameters
     - key (string) #optional key
     = (object) @Element
    \*/
    elproto.removeData = function (key) {
        if (key == null) {
            eldata[this.id] = {};
        } else {
            eldata[this.id] && delete eldata[this.id][key];
        }
        return this;
    };
     /*\
     * Element.getData
     [ method ]
     **
     * Retrieves the element data
     = (object) data
    \*/
    elproto.getData = function () {
        return clone(eldata[this.id] || {});
    };
    /*\
     * Element.hover
     [ method ]
     **
     * Adds event handlers for hover for the element.
     > Parameters
     - f_in (function) handler for hover in
     - f_out (function) handler for hover out
     - icontext (object) #optional context for hover in handler
     - ocontext (object) #optional context for hover out handler
     = (object) @Element
    \*/
    elproto.hover = function (f_in, f_out, scope_in, scope_out) {
        return this.mouseover(f_in, scope_in).mouseout(f_out, scope_out || scope_in);
    };
    /*\
     * Element.unhover
     [ method ]
     **
     * Removes event handlers for hover for the element.
     > Parameters
     - f_in (function) handler for hover in
     - f_out (function) handler for hover out
     = (object) @Element
    \*/
    elproto.unhover = function (f_in, f_out) {
        return this.unmouseover(f_in).unmouseout(f_out);
    };
    var draggable = [];
    /*\
     * Element.drag
     [ method ]
     **
     * Adds event handlers for drag of the element.
     > Parameters
     - onmove (function) handler for moving
     - onstart (function) handler for drag start
     - onend (function) handler for drag end
     - mcontext (object) #optional context for moving handler
     - scontext (object) #optional context for drag start handler
     - econtext (object) #optional context for drag end handler
     * Additionaly following `drag` events will be triggered: `drag.start.<id>` on start,
     * `drag.end.<id>` on end and `drag.move.<id>` on every move. When element will be dragged over another element
     * `drag.over.<id>` will be fired as well.
     *
     * Start event and start handler will be called in specified context or in context of the element with following parameters:
     o x (number) x position of the mouse
     o y (number) y position of the mouse
     o event (object) DOM event object
     * Move event and move handler will be called in specified context or in context of the element with following parameters:
     o dx (number) shift by x from the start point
     o dy (number) shift by y from the start point
     o x (number) x position of the mouse
     o y (number) y position of the mouse
     o event (object) DOM event object
     * End event and end handler will be called in specified context or in context of the element with following parameters:
     o event (object) DOM event object
     = (object) @Element
    \*/
    elproto.drag = function (onmove, onstart, onend, move_scope, start_scope, end_scope) {
        function start(e) {
            (e.originalEvent || e).preventDefault();
            var x = e.clientX,
                y = e.clientY,
                scrollY = g.doc.documentElement.scrollTop || g.doc.body.scrollTop,
                scrollX = g.doc.documentElement.scrollLeft || g.doc.body.scrollLeft;
            this._drag.id = e.identifier;
            if (supportsTouch && e.touches) {
                var i = e.touches.length, touch;
                while (i--) {
                    touch = e.touches[i];
                    this._drag.id = touch.identifier;
                    if (touch.identifier == this._drag.id) {
                        x = touch.clientX;
                        y = touch.clientY;
                        break;
                    }
                }
            }
            this._drag.x = x + scrollX;
            this._drag.y = y + scrollY;
            !drag.length && R.mousemove(dragMove).mouseup(dragUp);
            drag.push({el: this, move_scope: move_scope, start_scope: start_scope, end_scope: end_scope});
            onstart && eve.on("raphael.drag.start." + this.id, onstart);
            onmove && eve.on("raphael.drag.move." + this.id, onmove);
            onend && eve.on("raphael.drag.end." + this.id, onend);
            eve("raphael.drag.start." + this.id, start_scope || move_scope || this, e.clientX + scrollX, e.clientY + scrollY, e);
        }
        this._drag = {};
        draggable.push({el: this, start: start});
        this.mousedown(start);
        return this;
    };
    /*\
     * Element.onDragOver
     [ method ]
     **
     * Shortcut for assigning event handler for `drag.over.<id>` event, where id is id of the element (see @Element.id).
     > Parameters
     - f (function) handler for event, first argument would be the element you are dragging over
    \*/
    elproto.onDragOver = function (f) {
        f ? eve.on("raphael.drag.over." + this.id, f) : eve.unbind("raphael.drag.over." + this.id);
    };
    /*\
     * Element.undrag
     [ method ]
     **
     * Removes all drag event handlers from given element.
    \*/
    elproto.undrag = function () {
        var i = draggable.length;
        while (i--) if (draggable[i].el == this) {
            this.unmousedown(draggable[i].start);
            draggable.splice(i, 1);
            eve.unbind("raphael.drag.*." + this.id);
        }
        !draggable.length && R.unmousemove(dragMove).unmouseup(dragUp);
        drag = [];
    };
    /*\
     * Paper.circle
     [ method ]
     **
     * Draws a circle.
     **
     > Parameters
     **
     - x (number) x coordinate of the centre
     - y (number) y coordinate of the centre
     - r (number) radius
     = (object) Raphaël element object with type “circle”
     **
     > Usage
     | var c = paper.circle(50, 50, 40);
    \*/
    paperproto.circle = function (x, y, r) {
        var out = R._engine.circle(this, x || 0, y || 0, r || 0);
        this.__set__ && this.__set__.push(out);
        return out;
    };
    /*\
     * Paper.rect
     [ method ]
     *
     * Draws a rectangle.
     **
     > Parameters
     **
     - x (number) x coordinate of the top left corner
     - y (number) y coordinate of the top left corner
     - width (number) width
     - height (number) height
     - r (number) #optional radius for rounded corners, default is 0
     = (object) Raphaël element object with type “rect”
     **
     > Usage
     | // regular rectangle
     | var c = paper.rect(10, 10, 50, 50);
     | // rectangle with rounded corners
     | var c = paper.rect(40, 40, 50, 50, 10);
    \*/
    paperproto.rect = function (x, y, w, h, r) {
        var out = R._engine.rect(this, x || 0, y || 0, w || 0, h || 0, r || 0);
        this.__set__ && this.__set__.push(out);
        return out;
    };
    /*\
     * Paper.ellipse
     [ method ]
     **
     * Draws an ellipse.
     **
     > Parameters
     **
     - x (number) x coordinate of the centre
     - y (number) y coordinate of the centre
     - rx (number) horizontal radius
     - ry (number) vertical radius
     = (object) Raphaël element object with type “ellipse”
     **
     > Usage
     | var c = paper.ellipse(50, 50, 40, 20);
    \*/
    paperproto.ellipse = function (x, y, rx, ry) {
        var out = R._engine.ellipse(this, x || 0, y || 0, rx || 0, ry || 0);
        this.__set__ && this.__set__.push(out);
        return out;
    };
    /*\
     * Paper.path
     [ method ]
     **
     * Creates a path element by given path data string.
     > Parameters
     - pathString (string) #optional path string in SVG format.
     * Path string consists of one-letter commands, followed by comma seprarated arguments in numercal form. Example:
     | "M10,20L30,40"
     * Here we can see two commands: “M”, with arguments `(10, 20)` and “L” with arguments `(30, 40)`. Upper case letter mean command is absolute, lower case—relative.
     *
     # <p>Here is short list of commands available, for more details see <a href="http://www.w3.org/TR/SVG/paths.html#PathData" title="Details of a path's data attribute's format are described in the SVG specification.">SVG path string format</a>.</p>
     # <table><thead><tr><th>Command</th><th>Name</th><th>Parameters</th></tr></thead><tbody>
     # <tr><td>M</td><td>moveto</td><td>(x y)+</td></tr>
     # <tr><td>Z</td><td>closepath</td><td>(none)</td></tr>
     # <tr><td>L</td><td>lineto</td><td>(x y)+</td></tr>
     # <tr><td>H</td><td>horizontal lineto</td><td>x+</td></tr>
     # <tr><td>V</td><td>vertical lineto</td><td>y+</td></tr>
     # <tr><td>C</td><td>curveto</td><td>(x1 y1 x2 y2 x y)+</td></tr>
     # <tr><td>S</td><td>smooth curveto</td><td>(x2 y2 x y)+</td></tr>
     # <tr><td>Q</td><td>quadratic Bézier curveto</td><td>(x1 y1 x y)+</td></tr>
     # <tr><td>T</td><td>smooth quadratic Bézier curveto</td><td>(x y)+</td></tr>
     # <tr><td>A</td><td>elliptical arc</td><td>(rx ry x-axis-rotation large-arc-flag sweep-flag x y)+</td></tr>
     # <tr><td>R</td><td><a href="http://en.wikipedia.org/wiki/Catmull–Rom_spline#Catmull.E2.80.93Rom_spline">Catmull-Rom curveto</a>*</td><td>x1 y1 (x y)+</td></tr></tbody></table>
     * * “Catmull-Rom curveto” is a not standard SVG command and added in 2.0 to make life easier.
     * Note: there is a special case when path consist of just three commands: “M10,10R…z”. In this case path will smoothly connects to its beginning.
     > Usage
     | var c = paper.path("M10 10L90 90");
     | // draw a diagonal line:
     | // move to 10,10, line to 90,90
     * For example of path strings, check out these icons: http://raphaeljs.com/icons/
    \*/
    paperproto.path = function (pathString) {
        pathString && !R.is(pathString, string) && !R.is(pathString[0], array) && (pathString += E);
        var out = R._engine.path(R.format[apply](R, arguments), this);
        this.__set__ && this.__set__.push(out);
        return out;
    };
    /*\
     * Paper.image
     [ method ]
     **
     * Embeds an image into the surface.
     **
     > Parameters
     **
     - src (string) URI of the source image
     - x (number) x coordinate position
     - y (number) y coordinate position
     - width (number) width of the image
     - height (number) height of the image
     = (object) Raphaël element object with type “image”
     **
     > Usage
     | var c = paper.image("apple.png", 10, 10, 80, 80);
    \*/
    paperproto.image = function (src, x, y, w, h) {
        var out = R._engine.image(this, src || "about:blank", x || 0, y || 0, w || 0, h || 0);
        this.__set__ && this.__set__.push(out);
        return out;
    };
    /*\
     * Paper.text
     [ method ]
     **
     * Draws a text string. If you need line breaks, put “\n” in the string.
     **
     > Parameters
     **
     - x (number) x coordinate position
     - y (number) y coordinate position
     - text (string) The text string to draw
     = (object) Raphaël element object with type “text”
     **
     > Usage
     | var t = paper.text(50, 50, "Raphaël\nkicks\nbutt!");
    \*/
    paperproto.text = function (x, y, text) {
        var out = R._engine.text(this, x || 0, y || 0, Str(text));
        this.__set__ && this.__set__.push(out);
        return out;
    };
    /*\
     * Paper.set
     [ method ]
     **
     * Creates array-like object to keep and operate several elements at once.
     * Warning: it doesn’t create any elements for itself in the page, it just groups existing elements.
     * Sets act as pseudo elements — all methods available to an element can be used on a set.
     = (object) array-like object that represents set of elements
     **
     > Usage
     | var st = paper.set();
     | st.push(
     |     paper.circle(10, 10, 5),
     |     paper.circle(30, 10, 5)
     | );
     | st.attr({fill: "red"}); // changes the fill of both circles
    \*/
    paperproto.set = function (itemsArray) {
        !R.is(itemsArray, "array") && (itemsArray = Array.prototype.splice.call(arguments, 0, arguments.length));
        var out = new Set(itemsArray);
        this.__set__ && this.__set__.push(out);
        out["paper"] = this;
        out["type"] = "set";
        return out;
    };
    /*\
     * Paper.setStart
     [ method ]
     **
     * Creates @Paper.set. All elements that will be created after calling this method and before calling
     * @Paper.setFinish will be added to the set.
     **
     > Usage
     | paper.setStart();
     | paper.circle(10, 10, 5),
     | paper.circle(30, 10, 5)
     | var st = paper.setFinish();
     | st.attr({fill: "red"}); // changes the fill of both circles
    \*/
    paperproto.setStart = function (set) {
        this.__set__ = set || this.set();
    };
    /*\
     * Paper.setFinish
     [ method ]
     **
     * See @Paper.setStart. This method finishes catching and returns resulting set.
     **
     = (object) set
    \*/
    paperproto.setFinish = function (set) {
        var out = this.__set__;
        delete this.__set__;
        return out;
    };
    /*\
     * Paper.getSize
     [ method ]
     **
     * Obtains current paper actual size.
     **
     = (object)
     \*/
    paperproto.getSize = function () {
        var container = this.canvas.parentNode;
        return {
            width: container.offsetWidth,
            height: container.offsetHeight
                };
        };
    /*\
     * Paper.setSize
     [ method ]
     **
     * If you need to change dimensions of the canvas call this method
     **
     > Parameters
     **
     - width (number) new width of the canvas
     - height (number) new height of the canvas
    \*/
    paperproto.setSize = function (width, height) {
        return R._engine.setSize.call(this, width, height);
    };
    /*\
     * Paper.setViewBox
     [ method ]
     **
     * Sets the view box of the paper. Practically it gives you ability to zoom and pan whole paper surface by
     * specifying new boundaries.
     **
     > Parameters
     **
     - x (number) new x position, default is `0`
     - y (number) new y position, default is `0`
     - w (number) new width of the canvas
     - h (number) new height of the canvas
     - fit (boolean) `true` if you want graphics to fit into new boundary box
    \*/
    paperproto.setViewBox = function (x, y, w, h, fit) {
        return R._engine.setViewBox.call(this, x, y, w, h, fit);
    };
    /*\
     * Paper.top
     [ property ]
     **
     * Points to the topmost element on the paper
    \*/
    /*\
     * Paper.bottom
     [ property ]
     **
     * Points to the bottom element on the paper
    \*/
    paperproto.top = paperproto.bottom = null;
    /*\
     * Paper.raphael
     [ property ]
     **
     * Points to the @Raphael object/function
    \*/
    paperproto.raphael = R;
    var getOffset = function (elem) {
        var box = elem.getBoundingClientRect(),
            doc = elem.ownerDocument,
            body = doc.body,
            docElem = doc.documentElement,
            clientTop = docElem.clientTop || body.clientTop || 0, clientLeft = docElem.clientLeft || body.clientLeft || 0,
            top  = box.top  + (g.win.pageYOffset || docElem.scrollTop || body.scrollTop ) - clientTop,
            left = box.left + (g.win.pageXOffset || docElem.scrollLeft || body.scrollLeft) - clientLeft;
        return {
            y: top,
            x: left
        };
    };
    /*\
     * Paper.getElementByPoint
     [ method ]
     **
     * Returns you topmost element under given point.
     **
     = (object) Raphaël element object
     > Parameters
     **
     - x (number) x coordinate from the top left corner of the window
     - y (number) y coordinate from the top left corner of the window
     > Usage
     | paper.getElementByPoint(mouseX, mouseY).attr({stroke: "#f00"});
    \*/
    paperproto.getElementByPoint = function (x, y) {
        var paper = this,
            svg = paper.canvas,
            target = g.doc.elementFromPoint(x, y);
        if (g.win.opera && target.tagName == "svg") {
            var so = getOffset(svg),
                sr = svg.createSVGRect();
            sr.x = x - so.x;
            sr.y = y - so.y;
            sr.width = sr.height = 1;
            var hits = svg.getIntersectionList(sr, null);
            if (hits.length) {
                target = hits[hits.length - 1];
            }
        }
        if (!target) {
            return null;
        }
        while (target.parentNode && target != svg.parentNode && !target.raphael) {
            target = target.parentNode;
        }
        target == paper.canvas.parentNode && (target = svg);
        target = target && target.raphael ? paper.getById(target.raphaelid) : null;
        return target;
    };

    /*\
     * Paper.getElementsByBBox
     [ method ]
     **
     * Returns set of elements that have an intersecting bounding box
     **
     > Parameters
     **
     - bbox (object) bbox to check with
     = (object) @Set
     \*/
    paperproto.getElementsByBBox = function (bbox) {
        var set = this.set();
        this.forEach(function (el) {
            if (R.isBBoxIntersect(el.getBBox(), bbox)) {
                set.push(el);
            }
        });
        return set;
    };

    /*\
     * Paper.getById
     [ method ]
     **
     * Returns you element by its internal ID.
     **
     > Parameters
     **
     - id (number) id
     = (object) Raphaël element object
    \*/
    paperproto.getById = function (id) {
        var bot = this.bottom;
        while (bot) {
            if (bot.id == id) {
                return bot;
            }
            bot = bot.next;
        }
        return null;
    };
    /*\
     * Paper.forEach
     [ method ]
     **
     * Executes given function for each element on the paper
     *
     * If callback function returns `false` it will stop loop running.
     **
     > Parameters
     **
     - callback (function) function to run
     - thisArg (object) context object for the callback
     = (object) Paper object
     > Usage
     | paper.forEach(function (el) {
     |     el.attr({ stroke: "blue" });
     | });
    \*/
    paperproto.forEach = function (callback, thisArg) {
        var bot = this.bottom;
        while (bot) {
            if (callback.call(thisArg, bot) === false) {
                return this;
            }
            bot = bot.next;
        }
        return this;
    };
    /*\
     * Paper.getElementsByPoint
     [ method ]
     **
     * Returns set of elements that have common point inside
     **
     > Parameters
     **
     - x (number) x coordinate of the point
     - y (number) y coordinate of the point
     = (object) @Set
    \*/
    paperproto.getElementsByPoint = function (x, y) {
        var set = this.set();
        this.forEach(function (el) {
            if (el.isPointInside(x, y)) {
                set.push(el);
            }
        });
        return set;
    };
    function x_y() {
        return this.x + S + this.y;
    }
    function x_y_w_h() {
        return this.x + S + this.y + S + this.width + " \xd7 " + this.height;
    }
    /*\
     * Element.isPointInside
     [ method ]
     **
     * Determine if given point is inside this element’s shape
     **
     > Parameters
     **
     - x (number) x coordinate of the point
     - y (number) y coordinate of the point
     = (boolean) `true` if point inside the shape
    \*/
    elproto.isPointInside = function (x, y) {
        var rp = this.realPath = getPath[this.type](this);
        if (this.attr('transform') && this.attr('transform').length) {
            rp = R.transformPath(rp, this.attr('transform'));
        }
        return R.isPointInsidePath(rp, x, y);
    };
    /*\
     * Element.getBBox
     [ method ]
     **
     * Return bounding box for a given element
     **
     > Parameters
     **
     - isWithoutTransform (boolean) flag, `true` if you want to have bounding box before transformations. Default is `false`.
     = (object) Bounding box object:
     o {
     o     x: (number) top left corner x
     o     y: (number) top left corner y
     o     x2: (number) bottom right corner x
     o     y2: (number) bottom right corner y
     o     width: (number) width
     o     height: (number) height
     o }
    \*/
    elproto.getBBox = function (isWithoutTransform) {
        if (this.removed) {
            return {};
        }
        var _ = this._;
        if (isWithoutTransform) {
            if (_.dirty || !_.bboxwt) {
                this.realPath = getPath[this.type](this);
                _.bboxwt = pathDimensions(this.realPath);
                _.bboxwt.toString = x_y_w_h;
                _.dirty = 0;
            }
            return _.bboxwt;
        }
        if (_.dirty || _.dirtyT || !_.bbox) {
            if (_.dirty || !this.realPath) {
                _.bboxwt = 0;
                this.realPath = getPath[this.type](this);
            }
            _.bbox = pathDimensions(mapPath(this.realPath, this.matrix));
            _.bbox.toString = x_y_w_h;
            _.dirty = _.dirtyT = 0;
        }
        return _.bbox;
    };
    /*\
     * Element.clone
     [ method ]
     **
     = (object) clone of a given element
     **
    \*/
    elproto.clone = function () {
        if (this.removed) {
            return null;
        }
        var out = this.paper[this.type]().attr(this.attr());
        this.__set__ && this.__set__.push(out);
        return out;
    };
    /*\
     * Element.glow
     [ method ]
     **
     * Return set of elements that create glow-like effect around given element. See @Paper.set.
     *
     * Note: Glow is not connected to the element. If you change element attributes it won’t adjust itself.
     **
     > Parameters
     **
     - glow (object) #optional parameters object with all properties optional:
     o {
     o     width (number) size of the glow, default is `10`
     o     fill (boolean) will it be filled, default is `false`
     o     opacity (number) opacity, default is `0.5`
     o     offsetx (number) horizontal offset, default is `0`
     o     offsety (number) vertical offset, default is `0`
     o     color (string) glow colour, default is `black`
     o }
     = (object) @Paper.set of elements that represents glow
    \*/
    elproto.glow = function (glow) {
        if (this.type == "text") {
            return null;
        }
        glow = glow || {};
        var s = {
            width: (glow.width || 10) + (+this.attr("stroke-width") || 1),
            fill: glow.fill || false,
            opacity: glow.opacity || .5,
            offsetx: glow.offsetx || 0,
            offsety: glow.offsety || 0,
            color: glow.color || "#000"
        },
            c = s.width / 2,
            r = this.paper,
            out = r.set(),
            path = this.realPath || getPath[this.type](this);
        path = this.matrix ? mapPath(path, this.matrix) : path;
        for (var i = 1; i < c + 1; i++) {
            out.push(r.path(path).attr({
                stroke: s.color,
                fill: s.fill ? s.color : "none",
                "stroke-linejoin": "round",
                "stroke-linecap": "round",
                "stroke-width": +(s.width / c * i).toFixed(3),
                opacity: +(s.opacity / c).toFixed(3)
            }));
        }
        return out.insertBefore(this).translate(s.offsetx, s.offsety);
    };
    var curveslengths = {},
    getPointAtSegmentLength = function (p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, length) {
        if (length == null) {
            return bezlen(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y);
        } else {
            return R.findDotsAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, getTatLen(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, length));
        }
    },
    getLengthFactory = function (istotal, subpath) {
        return function (path, length, onlystart) {
            path = path2curve(path);
            var x, y, p, l, sp = "", subpaths = {}, point,
                len = 0;
            for (var i = 0, ii = path.length; i < ii; i++) {
                p = path[i];
                if (p[0] == "M") {
                    x = +p[1];
                    y = +p[2];
                } else {
                    l = getPointAtSegmentLength(x, y, p[1], p[2], p[3], p[4], p[5], p[6]);
                    if (len + l > length) {
                        if (subpath && !subpaths.start) {
                            point = getPointAtSegmentLength(x, y, p[1], p[2], p[3], p[4], p[5], p[6], length - len);
                            sp += ["C" + point.start.x, point.start.y, point.m.x, point.m.y, point.x, point.y];
                            if (onlystart) {return sp;}
                            subpaths.start = sp;
                            sp = ["M" + point.x, point.y + "C" + point.n.x, point.n.y, point.end.x, point.end.y, p[5], p[6]].join();
                            len += l;
                            x = +p[5];
                            y = +p[6];
                            continue;
                        }
                        if (!istotal && !subpath) {
                            point = getPointAtSegmentLength(x, y, p[1], p[2], p[3], p[4], p[5], p[6], length - len);
                            return {x: point.x, y: point.y, alpha: point.alpha};
                        }
                    }
                    len += l;
                    x = +p[5];
                    y = +p[6];
                }
                sp += p.shift() + p;
            }
            subpaths.end = sp;
            point = istotal ? len : subpath ? subpaths : R.findDotsAtSegment(x, y, p[0], p[1], p[2], p[3], p[4], p[5], 1);
            point.alpha && (point = {x: point.x, y: point.y, alpha: point.alpha});
            return point;
        };
    };
    var getTotalLength = getLengthFactory(1),
        getPointAtLength = getLengthFactory(),
        getSubpathsAtLength = getLengthFactory(0, 1);
    /*\
     * Raphael.getTotalLength
     [ method ]
     **
     * Returns length of the given path in pixels.
     **
     > Parameters
     **
     - path (string) SVG path string.
     **
     = (number) length.
    \*/
    R.getTotalLength = getTotalLength;
    /*\
     * Raphael.getPointAtLength
     [ method ]
     **
     * Return coordinates of the point located at the given length on the given path.
     **
     > Parameters
     **
     - path (string) SVG path string
     - length (number)
     **
     = (object) representation of the point:
     o {
     o     x: (number) x coordinate
     o     y: (number) y coordinate
     o     alpha: (number) angle of derivative
     o }
    \*/
    R.getPointAtLength = getPointAtLength;
    /*\
     * Raphael.getSubpath
     [ method ]
     **
     * Return subpath of a given path from given length to given length.
     **
     > Parameters
     **
     - path (string) SVG path string
     - from (number) position of the start of the segment
     - to (number) position of the end of the segment
     **
     = (string) pathstring for the segment
    \*/
    R.getSubpath = function (path, from, to) {
        if (this.getTotalLength(path) - to < 1e-6) {
            return getSubpathsAtLength(path, from).end;
        }
        var a = getSubpathsAtLength(path, to, 1);
        return from ? getSubpathsAtLength(a, from).end : a;
    };
    /*\
     * Element.getTotalLength
     [ method ]
     **
     * Returns length of the path in pixels. Only works for element of “path” type.
     = (number) length.
    \*/
    elproto.getTotalLength = function () {
        var path = this.getPath();
        if (!path) {
            return;
        }

        if (this.node.getTotalLength) {
            return this.node.getTotalLength();
        }

        return getTotalLength(path);
    };
    /*\
     * Element.getPointAtLength
     [ method ]
     **
     * Return coordinates of the point located at the given length on the given path. Only works for element of “path” type.
     **
     > Parameters
     **
     - length (number)
     **
     = (object) representation of the point:
     o {
     o     x: (number) x coordinate
     o     y: (number) y coordinate
     o     alpha: (number) angle of derivative
     o }
    \*/
    elproto.getPointAtLength = function (length) {
        var path = this.getPath();
        if (!path) {
            return;
        }

        return getPointAtLength(path, length);
    };
    /*\
     * Element.getPath
     [ method ]
     **
     * Returns path of the element. Only works for elements of “path” type and simple elements like circle.
     = (object) path
     **
    \*/
    elproto.getPath = function () {
        var path,
            getPath = R._getPath[this.type];

        if (this.type == "text" || this.type == "set") {
            return;
        }

        if (getPath) {
            path = getPath(this);
        }

        return path;
    };
    /*\
     * Element.getSubpath
     [ method ]
     **
     * Return subpath of a given element from given length to given length. Only works for element of “path” type.
     **
     > Parameters
     **
     - from (number) position of the start of the segment
     - to (number) position of the end of the segment
     **
     = (string) pathstring for the segment
    \*/
    elproto.getSubpath = function (from, to) {
        var path = this.getPath();
        if (!path) {
            return;
        }

        return R.getSubpath(path, from, to);
    };
    /*\
     * Raphael.easing_formulas
     [ property ]
     **
     * Object that contains easing formulas for animation. You could extend it with your own. By default it has following list of easing:
     # <ul>
     #     <li>“linear”</li>
     #     <li>“&lt;” or “easeIn” or “ease-in”</li>
     #     <li>“>” or “easeOut” or “ease-out”</li>
     #     <li>“&lt;>” or “easeInOut” or “ease-in-out”</li>
     #     <li>“backIn” or “back-in”</li>
     #     <li>“backOut” or “back-out”</li>
     #     <li>“elastic”</li>
     #     <li>“bounce”</li>
     # </ul>
     # <p>See also <a href="http://raphaeljs.com/easing.html">Easing demo</a>.</p>
    \*/
    var ef = R.easing_formulas = {
        linear: function (n) {
            return n;
        },
        "<": function (n) {
            return pow(n, 1.7);
        },
        ">": function (n) {
            return pow(n, .48);
        },
        "<>": function (n) {
            var q = .48 - n / 1.04,
                Q = math.sqrt(.1734 + q * q),
                x = Q - q,
                X = pow(abs(x), 1 / 3) * (x < 0 ? -1 : 1),
                y = -Q - q,
                Y = pow(abs(y), 1 / 3) * (y < 0 ? -1 : 1),
                t = X + Y + .5;
            return (1 - t) * 3 * t * t + t * t * t;
        },
        backIn: function (n) {
            var s = 1.70158;
            return n * n * ((s + 1) * n - s);
        },
        backOut: function (n) {
            n = n - 1;
            var s = 1.70158;
            return n * n * ((s + 1) * n + s) + 1;
        },
        elastic: function (n) {
            if (n == !!n) {
                return n;
            }
            return pow(2, -10 * n) * math.sin((n - .075) * (2 * PI) / .3) + 1;
        },
        bounce: function (n) {
            var s = 7.5625,
                p = 2.75,
                l;
            if (n < (1 / p)) {
                l = s * n * n;
            } else {
                if (n < (2 / p)) {
                    n -= (1.5 / p);
                    l = s * n * n + .75;
                } else {
                    if (n < (2.5 / p)) {
                        n -= (2.25 / p);
                        l = s * n * n + .9375;
                    } else {
                        n -= (2.625 / p);
                        l = s * n * n + .984375;
                    }
                }
            }
            return l;
        }
    };
    ef.easeIn = ef["ease-in"] = ef["<"];
    ef.easeOut = ef["ease-out"] = ef[">"];
    ef.easeInOut = ef["ease-in-out"] = ef["<>"];
    ef["back-in"] = ef.backIn;
    ef["back-out"] = ef.backOut;

    var animationElements = [],
        requestAnimFrame = window.requestAnimationFrame       ||
                           window.webkitRequestAnimationFrame ||
                           window.mozRequestAnimationFrame    ||
                           window.oRequestAnimationFrame      ||
                           window.msRequestAnimationFrame     ||
                           function (callback) {
                               setTimeout(callback, 16);
                           },
        animation = function () {
            var Now = +new Date,
                l = 0;
            for (; l < animationElements.length; l++) {
                var e = animationElements[l];
                if (e.el.removed || e.paused) {
                    continue;
                }
                var time = Now - e.start,
                    ms = e.ms,
                    easing = e.easing,
                    from = e.from,
                    diff = e.diff,
                    to = e.to,
                    t = e.t,
                    that = e.el,
                    set = {},
                    now,
                    init = {},
                    key;
                if (e.initstatus) {
                    time = (e.initstatus * e.anim.top - e.prev) / (e.percent - e.prev) * ms;
                    e.status = e.initstatus;
                    delete e.initstatus;
                    e.stop && animationElements.splice(l--, 1);
                } else {
                    e.status = (e.prev + (e.percent - e.prev) * (time / ms)) / e.anim.top;
                }
                if (time < 0) {
                    continue;
                }
                if (time < ms) {
                    var pos = easing(time / ms);
                    for (var attr in from) if (from[has](attr)) {
                        switch (availableAnimAttrs[attr]) {
                            case nu:
                                now = +from[attr] + pos * ms * diff[attr];
                                break;
                            case "colour":
                                now = "rgb(" + [
                                    upto255(round(from[attr].r + pos * ms * diff[attr].r)),
                                    upto255(round(from[attr].g + pos * ms * diff[attr].g)),
                                    upto255(round(from[attr].b + pos * ms * diff[attr].b))
                                ].join(",") + ")";
                                break;
                            case "path":
                                now = [];
                                for (var i = 0, ii = from[attr].length; i < ii; i++) {
                                    now[i] = [from[attr][i][0]];
                                    for (var j = 1, jj = from[attr][i].length; j < jj; j++) {
                                        now[i][j] = +from[attr][i][j] + pos * ms * diff[attr][i][j];
                                    }
                                    now[i] = now[i].join(S);
                                }
                                now = now.join(S);
                                break;
                            case "transform":
                                if (diff[attr].real) {
                                    now = [];
                                    for (i = 0, ii = from[attr].length; i < ii; i++) {
                                        now[i] = [from[attr][i][0]];
                                        for (j = 1, jj = from[attr][i].length; j < jj; j++) {
                                            now[i][j] = from[attr][i][j] + pos * ms * diff[attr][i][j];
                                        }
                                    }
                                } else {
                                    var get = function (i) {
                                        return +from[attr][i] + pos * ms * diff[attr][i];
                                    };
                                    // now = [["r", get(2), 0, 0], ["t", get(3), get(4)], ["s", get(0), get(1), 0, 0]];
                                    now = [["m", get(0), get(1), get(2), get(3), get(4), get(5)]];
                                }
                                break;
                            case "csv":
                                if (attr == "clip-rect") {
                                    now = [];
                                    i = 4;
                                    while (i--) {
                                        now[i] = +from[attr][i] + pos * ms * diff[attr][i];
                                    }
                                }
                                break;
                            default:
                                var from2 = [][concat](from[attr]);
                                now = [];
                                i = that.paper.customAttributes[attr].length;
                                while (i--) {
                                    now[i] = +from2[i] + pos * ms * diff[attr][i];
                                }
                                break;
                        }
                        set[attr] = now;
                    }
                    that.attr(set);
                    (function (id, that, anim) {
                        setTimeout(function () {
                            eve("raphael.anim.frame." + id, that, anim);
                        });
                    })(that.id, that, e.anim);
                } else {
                    (function(f, el, a) {
                        setTimeout(function() {
                            eve("raphael.anim.frame." + el.id, el, a);
                            eve("raphael.anim.finish." + el.id, el, a);
                            R.is(f, "function") && f.call(el);
                        });
                    })(e.callback, that, e.anim);
                    that.attr(to);
                    animationElements.splice(l--, 1);
                    if (e.repeat > 1 && !e.next) {
                        for (key in to) if (to[has](key)) {
                            init[key] = e.totalOrigin[key];
                        }
                        e.el.attr(init);
                        runAnimation(e.anim, e.el, e.anim.percents[0], null, e.totalOrigin, e.repeat - 1);
                    }
                    if (e.next && !e.stop) {
                        runAnimation(e.anim, e.el, e.next, null, e.totalOrigin, e.repeat);
                    }
                }
            }
            R.svg && that && that.paper && that.paper.safari();
            animationElements.length && requestAnimFrame(animation);
        },
        upto255 = function (color) {
            return color > 255 ? 255 : color < 0 ? 0 : color;
        };
    /*\
     * Element.animateWith
     [ method ]
     **
     * Acts similar to @Element.animate, but ensure that given animation runs in sync with another given element.
     **
     > Parameters
     **
     - el (object) element to sync with
     - anim (object) animation to sync with
     - params (object) #optional final attributes for the element, see also @Element.attr
     - ms (number) #optional number of milliseconds for animation to run
     - easing (string) #optional easing type. Accept on of @Raphael.easing_formulas or CSS format: `cubic&#x2010;bezier(XX,&#160;XX,&#160;XX,&#160;XX)`
     - callback (function) #optional callback function. Will be called at the end of animation.
     * or
     - element (object) element to sync with
     - anim (object) animation to sync with
     - animation (object) #optional animation object, see @Raphael.animation
     **
     = (object) original element
    \*/
    elproto.animateWith = function (el, anim, params, ms, easing, callback) {
        var element = this;
        if (element.removed) {
            callback && callback.call(element);
            return element;
        }
        var a = params instanceof Animation ? params : R.animation(params, ms, easing, callback),
            x, y;
        runAnimation(a, element, a.percents[0], null, element.attr());
        for (var i = 0, ii = animationElements.length; i < ii; i++) {
            if (animationElements[i].anim == anim && animationElements[i].el == el) {
                animationElements[ii - 1].start = animationElements[i].start;
                break;
            }
        }
        return element;
        //
        //
        // var a = params ? R.animation(params, ms, easing, callback) : anim,
        //     status = element.status(anim);
        // return this.animate(a).status(a, status * anim.ms / a.ms);
    };
    function CubicBezierAtTime(t, p1x, p1y, p2x, p2y, duration) {
        var cx = 3 * p1x,
            bx = 3 * (p2x - p1x) - cx,
            ax = 1 - cx - bx,
            cy = 3 * p1y,
            by = 3 * (p2y - p1y) - cy,
            ay = 1 - cy - by;
        function sampleCurveX(t) {
            return ((ax * t + bx) * t + cx) * t;
        }
        function solve(x, epsilon) {
            var t = solveCurveX(x, epsilon);
            return ((ay * t + by) * t + cy) * t;
        }
        function solveCurveX(x, epsilon) {
            var t0, t1, t2, x2, d2, i;
            for(t2 = x, i = 0; i < 8; i++) {
                x2 = sampleCurveX(t2) - x;
                if (abs(x2) < epsilon) {
                    return t2;
                }
                d2 = (3 * ax * t2 + 2 * bx) * t2 + cx;
                if (abs(d2) < 1e-6) {
                    break;
                }
                t2 = t2 - x2 / d2;
            }
            t0 = 0;
            t1 = 1;
            t2 = x;
            if (t2 < t0) {
                return t0;
            }
            if (t2 > t1) {
                return t1;
            }
            while (t0 < t1) {
                x2 = sampleCurveX(t2);
                if (abs(x2 - x) < epsilon) {
                    return t2;
                }
                if (x > x2) {
                    t0 = t2;
                } else {
                    t1 = t2;
                }
                t2 = (t1 - t0) / 2 + t0;
            }
            return t2;
        }
        return solve(t, 1 / (200 * duration));
    }
    elproto.onAnimation = function (f) {
        f ? eve.on("raphael.anim.frame." + this.id, f) : eve.unbind("raphael.anim.frame." + this.id);
        return this;
    };
    function Animation(anim, ms) {
        var percents = [],
            newAnim = {};
        this.ms = ms;
        this.times = 1;
        if (anim) {
            for (var attr in anim) if (anim[has](attr)) {
                newAnim[toFloat(attr)] = anim[attr];
                percents.push(toFloat(attr));
            }
            percents.sort(sortByNumber);
        }
        this.anim = newAnim;
        this.top = percents[percents.length - 1];
        this.percents = percents;
    }
    /*\
     * Animation.delay
     [ method ]
     **
     * Creates a copy of existing animation object with given delay.
     **
     > Parameters
     **
     - delay (number) number of ms to pass between animation start and actual animation
     **
     = (object) new altered Animation object
     | var anim = Raphael.animation({cx: 10, cy: 20}, 2e3);
     | circle1.animate(anim); // run the given animation immediately
     | circle2.animate(anim.delay(500)); // run the given animation after 500 ms
    \*/
    Animation.prototype.delay = function (delay) {
        var a = new Animation(this.anim, this.ms);
        a.times = this.times;
        a.del = +delay || 0;
        return a;
    };
    /*\
     * Animation.repeat
     [ method ]
     **
     * Creates a copy of existing animation object with given repetition.
     **
     > Parameters
     **
     - repeat (number) number iterations of animation. For infinite animation pass `Infinity`
     **
     = (object) new altered Animation object
    \*/
    Animation.prototype.repeat = function (times) {
        var a = new Animation(this.anim, this.ms);
        a.del = this.del;
        a.times = math.floor(mmax(times, 0)) || 1;
        return a;
    };
    function runAnimation(anim, element, percent, status, totalOrigin, times) {
        percent = toFloat(percent);
        var params,
            isInAnim,
            isInAnimSet,
            percents = [],
            next,
            prev,
            timestamp,
            ms = anim.ms,
            from = {},
            to = {},
            diff = {};
        if (status) {
            for (i = 0, ii = animationElements.length; i < ii; i++) {
                var e = animationElements[i];
                if (e.el.id == element.id && e.anim == anim) {
                    if (e.percent != percent) {
                        animationElements.splice(i, 1);
                        isInAnimSet = 1;
                    } else {
                        isInAnim = e;
                    }
                    element.attr(e.totalOrigin);
                    break;
                }
            }
        } else {
            status = +to; // NaN
        }
        for (var i = 0, ii = anim.percents.length; i < ii; i++) {
            if (anim.percents[i] == percent || anim.percents[i] > status * anim.top) {
                percent = anim.percents[i];
                prev = anim.percents[i - 1] || 0;
                ms = ms / anim.top * (percent - prev);
                next = anim.percents[i + 1];
                params = anim.anim[percent];
                break;
            } else if (status) {
                element.attr(anim.anim[anim.percents[i]]);
            }
        }
        if (!params) {
            return;
        }
        if (!isInAnim) {
            for (var attr in params) if (params[has](attr)) {
                if (availableAnimAttrs[has](attr) || element.paper.customAttributes[has](attr)) {
                    from[attr] = element.attr(attr);
                    (from[attr] == null) && (from[attr] = availableAttrs[attr]);
                    to[attr] = params[attr];
                    switch (availableAnimAttrs[attr]) {
                        case nu:
                            diff[attr] = (to[attr] - from[attr]) / ms;
                            break;
                        case "colour":
                            from[attr] = R.getRGB(from[attr]);
                            var toColour = R.getRGB(to[attr]);
                            diff[attr] = {
                                r: (toColour.r - from[attr].r) / ms,
                                g: (toColour.g - from[attr].g) / ms,
                                b: (toColour.b - from[attr].b) / ms
                            };
                            break;
                        case "path":
                            var pathes = path2curve(from[attr], to[attr]),
                                toPath = pathes[1];
                            from[attr] = pathes[0];
                            diff[attr] = [];
                            for (i = 0, ii = from[attr].length; i < ii; i++) {
                                diff[attr][i] = [0];
                                for (var j = 1, jj = from[attr][i].length; j < jj; j++) {
                                    diff[attr][i][j] = (toPath[i][j] - from[attr][i][j]) / ms;
                                }
                            }
                            break;
                        case "transform":
                            var _ = element._,
                                eq = equaliseTransform(_[attr], to[attr]);
                            if (eq) {
                                from[attr] = eq.from;
                                to[attr] = eq.to;
                                diff[attr] = [];
                                diff[attr].real = true;
                                for (i = 0, ii = from[attr].length; i < ii; i++) {
                                    diff[attr][i] = [from[attr][i][0]];
                                    for (j = 1, jj = from[attr][i].length; j < jj; j++) {
                                        diff[attr][i][j] = (to[attr][i][j] - from[attr][i][j]) / ms;
                                    }
                                }
                            } else {
                                var m = (element.matrix || new Matrix),
                                    to2 = {
                                        _: {transform: _.transform},
                                        getBBox: function () {
                                            return element.getBBox(1);
                                        }
                                    };
                                from[attr] = [
                                    m.a,
                                    m.b,
                                    m.c,
                                    m.d,
                                    m.e,
                                    m.f
                                ];
                                extractTransform(to2, to[attr]);
                                to[attr] = to2._.transform;
                                diff[attr] = [
                                    (to2.matrix.a - m.a) / ms,
                                    (to2.matrix.b - m.b) / ms,
                                    (to2.matrix.c - m.c) / ms,
                                    (to2.matrix.d - m.d) / ms,
                                    (to2.matrix.e - m.e) / ms,
                                    (to2.matrix.f - m.f) / ms
                                ];
                                // from[attr] = [_.sx, _.sy, _.deg, _.dx, _.dy];
                                // var to2 = {_:{}, getBBox: function () { return element.getBBox(); }};
                                // extractTransform(to2, to[attr]);
                                // diff[attr] = [
                                //     (to2._.sx - _.sx) / ms,
                                //     (to2._.sy - _.sy) / ms,
                                //     (to2._.deg - _.deg) / ms,
                                //     (to2._.dx - _.dx) / ms,
                                //     (to2._.dy - _.dy) / ms
                                // ];
                            }
                            break;
                        case "csv":
                            var values = Str(params[attr])[split](separator),
                                from2 = Str(from[attr])[split](separator);
                            if (attr == "clip-rect") {
                                from[attr] = from2;
                                diff[attr] = [];
                                i = from2.length;
                                while (i--) {
                                    diff[attr][i] = (values[i] - from[attr][i]) / ms;
                                }
                            }
                            to[attr] = values;
                            break;
                        default:
                            values = [][concat](params[attr]);
                            from2 = [][concat](from[attr]);
                            diff[attr] = [];
                            i = element.paper.customAttributes[attr].length;
                            while (i--) {
                                diff[attr][i] = ((values[i] || 0) - (from2[i] || 0)) / ms;
                            }
                            break;
                    }
                }
            }
            var easing = params.easing,
                easyeasy = R.easing_formulas[easing];
            if (!easyeasy) {
                easyeasy = Str(easing).match(bezierrg);
                if (easyeasy && easyeasy.length == 5) {
                    var curve = easyeasy;
                    easyeasy = function (t) {
                        return CubicBezierAtTime(t, +curve[1], +curve[2], +curve[3], +curve[4], ms);
                    };
                } else {
                    easyeasy = pipe;
                }
            }
            timestamp = params.start || anim.start || +new Date;
            e = {
                anim: anim,
                percent: percent,
                timestamp: timestamp,
                start: timestamp + (anim.del || 0),
                status: 0,
                initstatus: status || 0,
                stop: false,
                ms: ms,
                easing: easyeasy,
                from: from,
                diff: diff,
                to: to,
                el: element,
                callback: params.callback,
                prev: prev,
                next: next,
                repeat: times || anim.times,
                origin: element.attr(),
                totalOrigin: totalOrigin
            };
            animationElements.push(e);
            if (status && !isInAnim && !isInAnimSet) {
                e.stop = true;
                e.start = new Date - ms * status;
                if (animationElements.length == 1) {
                    return animation();
                }
            }
            if (isInAnimSet) {
                e.start = new Date - e.ms * status;
            }
            animationElements.length == 1 && requestAnimFrame(animation);
        } else {
            isInAnim.initstatus = status;
            isInAnim.start = new Date - isInAnim.ms * status;
        }
        eve("raphael.anim.start." + element.id, element, anim);
    }
    /*\
     * Raphael.animation
     [ method ]
     **
     * Creates an animation object that can be passed to the @Element.animate or @Element.animateWith methods.
     * See also @Animation.delay and @Animation.repeat methods.
     **
     > Parameters
     **
     - params (object) final attributes for the element, see also @Element.attr
     - ms (number) number of milliseconds for animation to run
     - easing (string) #optional easing type. Accept one of @Raphael.easing_formulas or CSS format: `cubic&#x2010;bezier(XX,&#160;XX,&#160;XX,&#160;XX)`
     - callback (function) #optional callback function. Will be called at the end of animation.
     **
     = (object) @Animation
    \*/
    R.animation = function (params, ms, easing, callback) {
        if (params instanceof Animation) {
            return params;
        }
        if (R.is(easing, "function") || !easing) {
            callback = callback || easing || null;
            easing = null;
        }
        params = Object(params);
        ms = +ms || 0;
        var p = {},
            json,
            attr;
        for (attr in params) if (params[has](attr) && toFloat(attr) != attr && toFloat(attr) + "%" != attr) {
            json = true;
            p[attr] = params[attr];
        }
        if (!json) {
            // if percent-like syntax is used and end-of-all animation callback used
            if(callback){
                // find the last one
                var lastKey = 0;
                for(var i in params){
                    var percent = toInt(i);
                    if(params[has](i) && percent > lastKey){
                        lastKey = percent;
                    }
                }
                lastKey += '%';
                // if already defined callback in the last keyframe, skip
                !params[lastKey].callback && (params[lastKey].callback = callback);
            }
          return new Animation(params, ms);
        } else {
            easing && (p.easing = easing);
            callback && (p.callback = callback);
            return new Animation({100: p}, ms);
        }
    };
    /*\
     * Element.animate
     [ method ]
     **
     * Creates and starts animation for given element.
     **
     > Parameters
     **
     - params (object) final attributes for the element, see also @Element.attr
     - ms (number) number of milliseconds for animation to run
     - easing (string) #optional easing type. Accept one of @Raphael.easing_formulas or CSS format: `cubic&#x2010;bezier(XX,&#160;XX,&#160;XX,&#160;XX)`
     - callback (function) #optional callback function. Will be called at the end of animation.
     * or
     - animation (object) animation object, see @Raphael.animation
     **
     = (object) original element
    \*/
    elproto.animate = function (params, ms, easing, callback) {
        var element = this;
        if (element.removed) {
            callback && callback.call(element);
            return element;
        }
        var anim = params instanceof Animation ? params : R.animation(params, ms, easing, callback);
        runAnimation(anim, element, anim.percents[0], null, element.attr());
        return element;
    };
    /*\
     * Element.setTime
     [ method ]
     **
     * Sets the status of animation of the element in milliseconds. Similar to @Element.status method.
     **
     > Parameters
     **
     - anim (object) animation object
     - value (number) number of milliseconds from the beginning of the animation
     **
     = (object) original element if `value` is specified
     * Note, that during animation following events are triggered:
     *
     * On each animation frame event `anim.frame.<id>`, on start `anim.start.<id>` and on end `anim.finish.<id>`.
    \*/
    elproto.setTime = function (anim, value) {
        if (anim && value != null) {
            this.status(anim, mmin(value, anim.ms) / anim.ms);
        }
        return this;
    };
    /*\
     * Element.status
     [ method ]
     **
     * Gets or sets the status of animation of the element.
     **
     > Parameters
     **
     - anim (object) #optional animation object
     - value (number) #optional 0 – 1. If specified, method works like a setter and sets the status of a given animation to the value. This will cause animation to jump to the given position.
     **
     = (number) status
     * or
     = (array) status if `anim` is not specified. Array of objects in format:
     o {
     o     anim: (object) animation object
     o     status: (number) status
     o }
     * or
     = (object) original element if `value` is specified
    \*/
    elproto.status = function (anim, value) {
        var out = [],
            i = 0,
            len,
            e;
        if (value != null) {
            runAnimation(anim, this, -1, mmin(value, 1));
            return this;
        } else {
            len = animationElements.length;
            for (; i < len; i++) {
                e = animationElements[i];
                if (e.el.id == this.id && (!anim || e.anim == anim)) {
                    if (anim) {
                        return e.status;
                    }
                    out.push({
                        anim: e.anim,
                        status: e.status
                    });
                }
            }
            if (anim) {
                return 0;
            }
            return out;
        }
    };
    /*\
     * Element.pause
     [ method ]
     **
     * Stops animation of the element with ability to resume it later on.
     **
     > Parameters
     **
     - anim (object) #optional animation object
     **
     = (object) original element
    \*/
    elproto.pause = function (anim) {
        for (var i = 0; i < animationElements.length; i++) if (animationElements[i].el.id == this.id && (!anim || animationElements[i].anim == anim)) {
            if (eve("raphael.anim.pause." + this.id, this, animationElements[i].anim) !== false) {
                animationElements[i].paused = true;
            }
        }
        return this;
    };
    /*\
     * Element.resume
     [ method ]
     **
     * Resumes animation if it was paused with @Element.pause method.
     **
     > Parameters
     **
     - anim (object) #optional animation object
     **
     = (object) original element
    \*/
    elproto.resume = function (anim) {
        for (var i = 0; i < animationElements.length; i++) if (animationElements[i].el.id == this.id && (!anim || animationElements[i].anim == anim)) {
            var e = animationElements[i];
            if (eve("raphael.anim.resume." + this.id, this, e.anim) !== false) {
                delete e.paused;
                this.status(e.anim, e.status);
            }
        }
        return this;
    };
    /*\
     * Element.stop
     [ method ]
     **
     * Stops animation of the element.
     **
     > Parameters
     **
     - anim (object) #optional animation object
     **
     = (object) original element
    \*/
    elproto.stop = function (anim) {
        for (var i = 0; i < animationElements.length; i++) if (animationElements[i].el.id == this.id && (!anim || animationElements[i].anim == anim)) {
            if (eve("raphael.anim.stop." + this.id, this, animationElements[i].anim) !== false) {
                animationElements.splice(i--, 1);
            }
        }
        return this;
    };
    function stopAnimation(paper) {
        for (var i = 0; i < animationElements.length; i++) if (animationElements[i].el.paper == paper) {
            animationElements.splice(i--, 1);
        }
    }
    eve.on("raphael.remove", stopAnimation);
    eve.on("raphael.clear", stopAnimation);
    elproto.toString = function () {
        return "Rapha\xebl\u2019s object";
    };

    // Set
    var Set = function (items) {
        this.items = [];
        this.length = 0;
        this.type = "set";
        if (items) {
            for (var i = 0, ii = items.length; i < ii; i++) {
                if (items[i] && (items[i].constructor == elproto.constructor || items[i].constructor == Set)) {
                    this[this.items.length] = this.items[this.items.length] = items[i];
                    this.length++;
                }
            }
        }
    },
    setproto = Set.prototype;
    /*\
     * Set.push
     [ method ]
     **
     * Adds each argument to the current set.
     = (object) original element
    \*/
    setproto.push = function () {
        var item,
            len;
        for (var i = 0, ii = arguments.length; i < ii; i++) {
            item = arguments[i];
            if (item && (item.constructor == elproto.constructor || item.constructor == Set)) {
                len = this.items.length;
                this[len] = this.items[len] = item;
                this.length++;
            }
        }
        return this;
    };
    /*\
     * Set.pop
     [ method ]
     **
     * Removes last element and returns it.
     = (object) element
    \*/
    setproto.pop = function () {
        this.length && delete this[this.length--];
        return this.items.pop();
    };
    /*\
     * Set.forEach
     [ method ]
     **
     * Executes given function for each element in the set.
     *
     * If function returns `false` it will stop loop running.
     **
     > Parameters
     **
     - callback (function) function to run
     - thisArg (object) context object for the callback
     = (object) Set object
    \*/
    setproto.forEach = function (callback, thisArg) {
        for (var i = 0, ii = this.items.length; i < ii; i++) {
            if (callback.call(thisArg, this.items[i], i) === false) {
                return this;
            }
        }
        return this;
    };
    for (var method in elproto) if (elproto[has](method)) {
        setproto[method] = (function (methodname) {
            return function () {
                var arg = arguments;
                return this.forEach(function (el) {
                    el[methodname][apply](el, arg);
                });
            };
        })(method);
    }
    setproto.attr = function (name, value) {
        if (name && R.is(name, array) && R.is(name[0], "object")) {
            for (var j = 0, jj = name.length; j < jj; j++) {
                this.items[j].attr(name[j]);
            }
        } else {
            for (var i = 0, ii = this.items.length; i < ii; i++) {
                this.items[i].attr(name, value);
            }
        }
        return this;
    };
    /*\
     * Set.clear
     [ method ]
     **
     * Removes all elements from the set
    \*/
    setproto.clear = function () {
        while (this.length) {
            this.pop();
        }
    };
    /*\
     * Set.splice
     [ method ]
     **
     * Removes given element from the set
     **
     > Parameters
     **
     - index (number) position of the deletion
     - count (number) number of element to remove
     - insertion… (object) #optional elements to insert
     = (object) set elements that were deleted
    \*/
    setproto.splice = function (index, count, insertion) {
        index = index < 0 ? mmax(this.length + index, 0) : index;
        count = mmax(0, mmin(this.length - index, count));
        var tail = [],
            todel = [],
            args = [],
            i;
        for (i = 2; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
        for (i = 0; i < count; i++) {
            todel.push(this[index + i]);
        }
        for (; i < this.length - index; i++) {
            tail.push(this[index + i]);
        }
        var arglen = args.length;
        for (i = 0; i < arglen + tail.length; i++) {
            this.items[index + i] = this[index + i] = i < arglen ? args[i] : tail[i - arglen];
        }
        i = this.items.length = this.length -= count - arglen;
        while (this[i]) {
            delete this[i++];
        }
        return new Set(todel);
    };
    /*\
     * Set.exclude
     [ method ]
     **
     * Removes given element from the set
     **
     > Parameters
     **
     - element (object) element to remove
     = (boolean) `true` if object was found & removed from the set
    \*/
    setproto.exclude = function (el) {
        for (var i = 0, ii = this.length; i < ii; i++) if (this[i] == el) {
            this.splice(i, 1);
            return true;
        }
    };
    setproto.animate = function (params, ms, easing, callback) {
        (R.is(easing, "function") || !easing) && (callback = easing || null);
        var len = this.items.length,
            i = len,
            item,
            set = this,
            collector;
        if (!len) {
            return this;
        }
        callback && (collector = function () {
            !--len && callback.call(set);
        });
        easing = R.is(easing, string) ? easing : collector;
        var anim = R.animation(params, ms, easing, collector);
        item = this.items[--i].animate(anim);
        while (i--) {
            this.items[i] && !this.items[i].removed && this.items[i].animateWith(item, anim, anim);
            (this.items[i] && !this.items[i].removed) || len--;
        }
        return this;
    };
    setproto.insertAfter = function (el) {
        var i = this.items.length;
        while (i--) {
            this.items[i].insertAfter(el);
        }
        return this;
    };
    setproto.getBBox = function () {
        var x = [],
            y = [],
            x2 = [],
            y2 = [];
        for (var i = this.items.length; i--;) if (!this.items[i].removed) {
            var box = this.items[i].getBBox();
            x.push(box.x);
            y.push(box.y);
            x2.push(box.x + box.width);
            y2.push(box.y + box.height);
        }
        x = mmin[apply](0, x);
        y = mmin[apply](0, y);
        x2 = mmax[apply](0, x2);
        y2 = mmax[apply](0, y2);
        return {
            x: x,
            y: y,
            x2: x2,
            y2: y2,
            width: x2 - x,
            height: y2 - y
        };
    };
    setproto.clone = function (s) {
        s = this.paper.set();
        for (var i = 0, ii = this.items.length; i < ii; i++) {
            s.push(this.items[i].clone());
        }
        return s;
    };
    setproto.toString = function () {
        return "Rapha\xebl\u2018s set";
    };

    setproto.glow = function(glowConfig) {
        var ret = this.paper.set();
        this.forEach(function(shape, index){
            var g = shape.glow(glowConfig);
            if(g != null){
                g.forEach(function(shape2, index2){
                    ret.push(shape2);
                });
            }
        });
        return ret;
    };


    /*\
     * Set.isPointInside
     [ method ]
     **
     * Determine if given point is inside this set’s elements
     **
     > Parameters
     **
     - x (number) x coordinate of the point
     - y (number) y coordinate of the point
     = (boolean) `true` if point is inside any of the set's elements
     \*/
    setproto.isPointInside = function (x, y) {
        var isPointInside = false;
        this.forEach(function (el) {
            if (el.isPointInside(x, y)) {
                isPointInside = true;
                return false; // stop loop
            }
        });
        return isPointInside;
    };

    /*\
     * Raphael.registerFont
     [ method ]
     **
     * Adds given font to the registered set of fonts for Raphaël. Should be used as an internal call from within Cufón’s font file.
     * Returns original parameter, so it could be used with chaining.
     # <a href="http://wiki.github.com/sorccu/cufon/about">More about Cufón and how to convert your font form TTF, OTF, etc to JavaScript file.</a>
     **
     > Parameters
     **
     - font (object) the font to register
     = (object) the font you passed in
     > Usage
     | Cufon.registerFont(Raphael.registerFont({…}));
    \*/
    R.registerFont = function (font) {
        if (!font.face) {
            return font;
        }
        this.fonts = this.fonts || {};
        var fontcopy = {
                w: font.w,
                face: {},
                glyphs: {}
            },
            family = font.face["font-family"];
        for (var prop in font.face) if (font.face[has](prop)) {
            fontcopy.face[prop] = font.face[prop];
        }
        if (this.fonts[family]) {
            this.fonts[family].push(fontcopy);
        } else {
            this.fonts[family] = [fontcopy];
        }
        if (!font.svg) {
            fontcopy.face["units-per-em"] = toInt(font.face["units-per-em"], 10);
            for (var glyph in font.glyphs) if (font.glyphs[has](glyph)) {
                var path = font.glyphs[glyph];
                fontcopy.glyphs[glyph] = {
                    w: path.w,
                    k: {},
                    d: path.d && "M" + path.d.replace(/[mlcxtrv]/g, function (command) {
                            return {l: "L", c: "C", x: "z", t: "m", r: "l", v: "c"}[command] || "M";
                        }) + "z"
                };
                if (path.k) {
                    for (var k in path.k) if (path[has](k)) {
                        fontcopy.glyphs[glyph].k[k] = path.k[k];
                    }
                }
            }
        }
        return font;
    };
    /*\
     * Paper.getFont
     [ method ]
     **
     * Finds font object in the registered fonts by given parameters. You could specify only one word from the font name, like “Myriad” for “Myriad Pro”.
     **
     > Parameters
     **
     - family (string) font family name or any word from it
     - weight (string) #optional font weight
     - style (string) #optional font style
     - stretch (string) #optional font stretch
     = (object) the font object
     > Usage
     | paper.print(100, 100, "Test string", paper.getFont("Times", 800), 30);
    \*/
    paperproto.getFont = function (family, weight, style, stretch) {
        stretch = stretch || "normal";
        style = style || "normal";
        weight = +weight || {normal: 400, bold: 700, lighter: 300, bolder: 800}[weight] || 400;
        if (!R.fonts) {
            return;
        }
        var font = R.fonts[family];
        if (!font) {
            var name = new RegExp("(^|\\s)" + family.replace(/[^\w\d\s+!~.:_-]/g, E) + "(\\s|$)", "i");
            for (var fontName in R.fonts) if (R.fonts[has](fontName)) {
                if (name.test(fontName)) {
                    font = R.fonts[fontName];
                    break;
                }
            }
        }
        var thefont;
        if (font) {
            for (var i = 0, ii = font.length; i < ii; i++) {
                thefont = font[i];
                if (thefont.face["font-weight"] == weight && (thefont.face["font-style"] == style || !thefont.face["font-style"]) && thefont.face["font-stretch"] == stretch) {
                    break;
                }
            }
        }
        return thefont;
    };
    /*\
     * Paper.print
     [ method ]
     **
     * Creates path that represent given text written using given font at given position with given size.
     * Result of the method is path element that contains whole text as a separate path.
     **
     > Parameters
     **
     - x (number) x position of the text
     - y (number) y position of the text
     - string (string) text to print
     - font (object) font object, see @Paper.getFont
     - size (number) #optional size of the font, default is `16`
     - origin (string) #optional could be `"baseline"` or `"middle"`, default is `"middle"`
     - letter_spacing (number) #optional number in range `-1..1`, default is `0`
     - line_spacing (number) #optional number in range `1..3`, default is `1`
     = (object) resulting path element, which consist of all letters
     > Usage
     | var txt = r.print(10, 50, "print", r.getFont("Museo"), 30).attr({fill: "#fff"});
    \*/
    paperproto.print = function (x, y, string, font, size, origin, letter_spacing, line_spacing) {
        origin = origin || "middle"; // baseline|middle
        letter_spacing = mmax(mmin(letter_spacing || 0, 1), -1);
        line_spacing = mmax(mmin(line_spacing || 1, 3), 1);
        var letters = Str(string)[split](E),
            shift = 0,
            notfirst = 0,
            path = E,
            scale;
        R.is(font, "string") && (font = this.getFont(font));
        if (font) {
            scale = (size || 16) / font.face["units-per-em"];
            var bb = font.face.bbox[split](separator),
                top = +bb[0],
                lineHeight = bb[3] - bb[1],
                shifty = 0,
                height = +bb[1] + (origin == "baseline" ? lineHeight + (+font.face.descent) : lineHeight / 2);
            for (var i = 0, ii = letters.length; i < ii; i++) {
                if (letters[i] == "\n") {
                    shift = 0;
                    curr = 0;
                    notfirst = 0;
                    shifty += lineHeight * line_spacing;
                } else {
                    var prev = notfirst && font.glyphs[letters[i - 1]] || {},
                        curr = font.glyphs[letters[i]];
                    shift += notfirst ? (prev.w || font.w) + (prev.k && prev.k[letters[i]] || 0) + (font.w * letter_spacing) : 0;
                    notfirst = 1;
                }
                if (curr && curr.d) {
                    path += R.transformPath(curr.d, ["t", shift * scale, shifty * scale, "s", scale, scale, top, height, "t", (x - top) / scale, (y - height) / scale]);
                }
            }
        }
        return this.path(path).attr({
            fill: "#000",
            stroke: "none"
        });
    };

    /*\
     * Paper.add
     [ method ]
     **
     * Imports elements in JSON array in format `{type: type, <attributes>}`
     **
     > Parameters
     **
     - json (array)
     = (object) resulting set of imported elements
     > Usage
     | paper.add([
     |     {
     |         type: "circle",
     |         cx: 10,
     |         cy: 10,
     |         r: 5
     |     },
     |     {
     |         type: "rect",
     |         x: 10,
     |         y: 10,
     |         width: 10,
     |         height: 10,
     |         fill: "#fc0"
     |     }
     | ]);
    \*/
    paperproto.add = function (json) {
        if (R.is(json, "array")) {
            var res = this.set(),
                i = 0,
                ii = json.length,
                j;
            for (; i < ii; i++) {
                j = json[i] || {};
                elements[has](j.type) && res.push(this[j.type]().attr(j));
            }
        }
        return res;
    };

    /*\
     * Raphael.format
     [ method ]
     **
     * Simple format function. Replaces construction of type “`{<number>}`” to the corresponding argument.
     **
     > Parameters
     **
     - token (string) string to format
     - … (string) rest of arguments will be treated as parameters for replacement
     = (string) formated string
     > Usage
     | var x = 10,
     |     y = 20,
     |     width = 40,
     |     height = 50;
     | // this will draw a rectangular shape equivalent to "M10,20h40v50h-40z"
     | paper.path(Raphael.format("M{0},{1}h{2}v{3}h{4}z", x, y, width, height, -width));
    \*/
    R.format = function (token, params) {
        var args = R.is(params, array) ? [0][concat](params) : arguments;
        token && R.is(token, string) && args.length - 1 && (token = token.replace(formatrg, function (str, i) {
            return args[++i] == null ? E : args[i];
        }));
        return token || E;
    };
    /*\
     * Raphael.fullfill
     [ method ]
     **
     * A little bit more advanced format function than @Raphael.format. Replaces construction of type “`{<name>}`” to the corresponding argument.
     **
     > Parameters
     **
     - token (string) string to format
     - json (object) object which properties will be used as a replacement
     = (string) formated string
     > Usage
     | // this will draw a rectangular shape equivalent to "M10,20h40v50h-40z"
     | paper.path(Raphael.fullfill("M{x},{y}h{dim.width}v{dim.height}h{dim['negative width']}z", {
     |     x: 10,
     |     y: 20,
     |     dim: {
     |         width: 40,
     |         height: 50,
     |         "negative width": -40
     |     }
     | }));
    \*/
    R.fullfill = (function () {
        var tokenRegex = /\{([^\}]+)\}/g,
            objNotationRegex = /(?:(?:^|\.)(.+?)(?=\[|\.|$|\()|\[('|")(.+?)\2\])(\(\))?/g, // matches .xxxxx or ["xxxxx"] to run over object properties
            replacer = function (all, key, obj) {
                var res = obj;
                key.replace(objNotationRegex, function (all, name, quote, quotedName, isFunc) {
                    name = name || quotedName;
                    if (res) {
                        if (name in res) {
                            res = res[name];
                        }
                        typeof res == "function" && isFunc && (res = res());
                    }
                });
                res = (res == null || res == obj ? all : res) + "";
                return res;
            };
        return function (str, obj) {
            return String(str).replace(tokenRegex, function (all, key) {
                return replacer(all, key, obj);
            });
        };
    })();
    /*\
     * Raphael.ninja
     [ method ]
     **
     * If you want to leave no trace of Raphaël (Well, Raphaël creates only one global variable `Raphael`, but anyway.) You can use `ninja` method.
     * Beware, that in this case plugins could stop working, because they are depending on global variable existance.
     **
     = (object) Raphael object
     > Usage
     | (function (local_raphael) {
     |     var paper = local_raphael(10, 10, 320, 200);
     |     …
     | })(Raphael.ninja());
    \*/
    R.ninja = function () {
        oldRaphael.was ? (g.win.Raphael = oldRaphael.is) : delete Raphael;
        return R;
    };
    /*\
     * Raphael.st
     [ property (object) ]
     **
     * You can add your own method to elements and sets. It is wise to add a set method for each element method
     * you added, so you will be able to call the same method on sets too.
     **
     * See also @Raphael.el.
     > Usage
     | Raphael.el.red = function () {
     |     this.attr({fill: "#f00"});
     | };
     | Raphael.st.red = function () {
     |     this.forEach(function (el) {
     |         el.red();
     |     });
     | };
     | // then use it
     | paper.set(paper.circle(100, 100, 20), paper.circle(110, 100, 20)).red();
    \*/
    R.st = setproto;

    eve.on("raphael.DOMload", function () {
        loaded = true;
    });

    // Firefox <3.6 fix: http://webreflection.blogspot.com/2009/11/195-chars-to-help-lazy-loading.html
    (function (doc, loaded, f) {
        if (doc.readyState == null && doc.addEventListener){
            doc.addEventListener(loaded, f = function () {
                doc.removeEventListener(loaded, f, false);
                doc.readyState = "complete";
            }, false);
            doc.readyState = "loading";
        }
        function isLoaded() {
            (/in/).test(doc.readyState) ? setTimeout(isLoaded, 9) : R.eve("raphael.DOMload");
        }
        isLoaded();
    })(document, "DOMContentLoaded");

// ┌─────────────────────────────────────────────────────────────────────┐ \\
// │ Raphaël - JavaScript Vector Library                                 │ \\
// ├─────────────────────────────────────────────────────────────────────┤ \\
// │ SVG Module                                                          │ \\
// ├─────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright (c) 2008-2011 Dmitry Baranovskiy (http://raphaeljs.com)   │ \\
// │ Copyright (c) 2008-2011 Sencha Labs (http://sencha.com)             │ \\
// │ Licensed under the MIT (http://raphaeljs.com/license.html) license. │ \\
// └─────────────────────────────────────────────────────────────────────┘ \\

(function(){
    if (!R.svg) {
        return;
    }
    var has = "hasOwnProperty",
        Str = String,
        toFloat = parseFloat,
        toInt = parseInt,
        math = Math,
        mmax = math.max,
        abs = math.abs,
        pow = math.pow,
        separator = /[, ]+/,
        eve = R.eve,
        E = "",
        S = " ";
    var xlink = "http://www.w3.org/1999/xlink",
        markers = {
            block: "M5,0 0,2.5 5,5z",
            classic: "M5,0 0,2.5 5,5 3.5,3 3.5,2z",
            diamond: "M2.5,0 5,2.5 2.5,5 0,2.5z",
            open: "M6,1 1,3.5 6,6",
            oval: "M2.5,0A2.5,2.5,0,0,1,2.5,5 2.5,2.5,0,0,1,2.5,0z"
        },
        markerCounter = {};
    R.toString = function () {
        return  "Your browser supports SVG.\nYou are running Rapha\xebl " + this.version;
    };
    var $ = function (el, attr) {
        if (attr) {
            if (typeof el == "string") {
                el = $(el);
            }
            for (var key in attr) if (attr[has](key)) {
                if (key.substring(0, 6) == "xlink:") {
                    el.setAttributeNS(xlink, key.substring(6), Str(attr[key]));
                } else {
                    el.setAttribute(key, Str(attr[key]));
                }
            }
        } else {
            el = R._g.doc.createElementNS("http://www.w3.org/2000/svg", el);
            el.style && (el.style.webkitTapHighlightColor = "rgba(0,0,0,0)");
        }
        return el;
    },
    addGradientFill = function (element, gradient) {
        var type = "linear",
            id = element.id + gradient,
            fx = .5, fy = .5,
            o = element.node,
            SVG = element.paper,
            s = o.style,
            el = R._g.doc.getElementById(id);
        if (!el) {
            gradient = Str(gradient).replace(R._radial_gradient, function (all, _fx, _fy) {
                type = "radial";
                if (_fx && _fy) {
                    fx = toFloat(_fx);
                    fy = toFloat(_fy);
                    var dir = ((fy > .5) * 2 - 1);
                    pow(fx - .5, 2) + pow(fy - .5, 2) > .25 &&
                        (fy = math.sqrt(.25 - pow(fx - .5, 2)) * dir + .5) &&
                        fy != .5 &&
                        (fy = fy.toFixed(5) - 1e-5 * dir);
                }
                return E;
            });
            gradient = gradient.split(/\s*\-\s*/);
            if (type == "linear") {
                var angle = gradient.shift();
                angle = -toFloat(angle);
                if (isNaN(angle)) {
                    return null;
                }
                var vector = [0, 0, math.cos(R.rad(angle)), math.sin(R.rad(angle))],
                    max = 1 / (mmax(abs(vector[2]), abs(vector[3])) || 1);
                vector[2] *= max;
                vector[3] *= max;
                if (vector[2] < 0) {
                    vector[0] = -vector[2];
                    vector[2] = 0;
                }
                if (vector[3] < 0) {
                    vector[1] = -vector[3];
                    vector[3] = 0;
                }
            }
            var dots = R._parseDots(gradient);
            if (!dots) {
                return null;
            }
            id = id.replace(/[\(\)\s,\xb0#]/g, "_");

            if (element.gradient && id != element.gradient.id) {
                SVG.defs.removeChild(element.gradient);
                delete element.gradient;
            }

            if (!element.gradient) {
                el = $(type + "Gradient", {id: id});
                element.gradient = el;
                $(el, type == "radial" ? {
                    fx: fx,
                    fy: fy
                } : {
                    x1: vector[0],
                    y1: vector[1],
                    x2: vector[2],
                    y2: vector[3],
                    gradientTransform: element.matrix.invert()
                });
                SVG.defs.appendChild(el);
                for (var i = 0, ii = dots.length; i < ii; i++) {
                    el.appendChild($("stop", {
                        offset: dots[i].offset ? dots[i].offset : i ? "100%" : "0%",
                        "stop-color": dots[i].color || "#fff"
                    }));
                }
            }
        }
        $(o, {
            fill: "url('" + document.location + "#" + id + "')",
            opacity: 1,
            "fill-opacity": 1
        });
        s.fill = E;
        s.opacity = 1;
        s.fillOpacity = 1;
        return 1;
    },
    updatePosition = function (o) {
        var bbox = o.getBBox(1);
        $(o.pattern, {patternTransform: o.matrix.invert() + " translate(" + bbox.x + "," + bbox.y + ")"});
    },
    addArrow = function (o, value, isEnd) {
        if (o.type == "path") {
            var values = Str(value).toLowerCase().split("-"),
                p = o.paper,
                se = isEnd ? "end" : "start",
                node = o.node,
                attrs = o.attrs,
                stroke = attrs["stroke-width"],
                i = values.length,
                type = "classic",
                from,
                to,
                dx,
                refX,
                attr,
                w = 3,
                h = 3,
                t = 5;
            while (i--) {
                switch (values[i]) {
                    case "block":
                    case "classic":
                    case "oval":
                    case "diamond":
                    case "open":
                    case "none":
                        type = values[i];
                        break;
                    case "wide": h = 5; break;
                    case "narrow": h = 2; break;
                    case "long": w = 5; break;
                    case "short": w = 2; break;
                }
            }
            if (type == "open") {
                w += 2;
                h += 2;
                t += 2;
                dx = 1;
                refX = isEnd ? 4 : 1;
                attr = {
                    fill: "none",
                    stroke: attrs.stroke
                };
            } else {
                refX = dx = w / 2;
                attr = {
                    fill: attrs.stroke,
                    stroke: "none"
                };
            }
            if (o._.arrows) {
                if (isEnd) {
                    o._.arrows.endPath && markerCounter[o._.arrows.endPath]--;
                    o._.arrows.endMarker && markerCounter[o._.arrows.endMarker]--;
                } else {
                    o._.arrows.startPath && markerCounter[o._.arrows.startPath]--;
                    o._.arrows.startMarker && markerCounter[o._.arrows.startMarker]--;
                }
            } else {
                o._.arrows = {};
            }
            if (type != "none") {
                var pathId = "raphael-marker-" + type,
                    markerId = "raphael-marker-" + se + type + w + h + "-obj" + o.id;
                if (!R._g.doc.getElementById(pathId)) {
                    p.defs.appendChild($($("path"), {
                        "stroke-linecap": "round",
                        d: markers[type],
                        id: pathId
                    }));
                    markerCounter[pathId] = 1;
                } else {
                    markerCounter[pathId]++;
                }
                var marker = R._g.doc.getElementById(markerId),
                    use;
                if (!marker) {
                    marker = $($("marker"), {
                        id: markerId,
                        markerHeight: h,
                        markerWidth: w,
                        orient: "auto",
                        refX: refX,
                        refY: h / 2
                    });
                    use = $($("use"), {
                        "xlink:href": "#" + pathId,
                        transform: (isEnd ? "rotate(180 " + w / 2 + " " + h / 2 + ") " : E) + "scale(" + w / t + "," + h / t + ")",
                        "stroke-width": (1 / ((w / t + h / t) / 2)).toFixed(4)
                    });
                    marker.appendChild(use);
                    p.defs.appendChild(marker);
                    markerCounter[markerId] = 1;
                } else {
                    markerCounter[markerId]++;
                    use = marker.getElementsByTagName("use")[0];
                }
                $(use, attr);
                var delta = dx * (type != "diamond" && type != "oval");
                if (isEnd) {
                    from = o._.arrows.startdx * stroke || 0;
                    to = R.getTotalLength(attrs.path) - delta * stroke;
                } else {
                    from = delta * stroke;
                    to = R.getTotalLength(attrs.path) - (o._.arrows.enddx * stroke || 0);
                }
                attr = {};
                attr["marker-" + se] = "url(#" + markerId + ")";
                if (to || from) {
                    attr.d = R.getSubpath(attrs.path, from, to);
                }
                $(node, attr);
                o._.arrows[se + "Path"] = pathId;
                o._.arrows[se + "Marker"] = markerId;
                o._.arrows[se + "dx"] = delta;
                o._.arrows[se + "Type"] = type;
                o._.arrows[se + "String"] = value;
            } else {
                if (isEnd) {
                    from = o._.arrows.startdx * stroke || 0;
                    to = R.getTotalLength(attrs.path) - from;
                } else {
                    from = 0;
                    to = R.getTotalLength(attrs.path) - (o._.arrows.enddx * stroke || 0);
                }
                o._.arrows[se + "Path"] && $(node, {d: R.getSubpath(attrs.path, from, to)});
                delete o._.arrows[se + "Path"];
                delete o._.arrows[se + "Marker"];
                delete o._.arrows[se + "dx"];
                delete o._.arrows[se + "Type"];
                delete o._.arrows[se + "String"];
            }
            for (attr in markerCounter) if (markerCounter[has](attr) && !markerCounter[attr]) {
                var item = R._g.doc.getElementById(attr);
                item && item.parentNode.removeChild(item);
            }
        }
    },
    dasharray = {
        "": [0],
        "none": [0],
        "-": [3, 1],
        ".": [1, 1],
        "-.": [3, 1, 1, 1],
        "-..": [3, 1, 1, 1, 1, 1],
        ". ": [1, 3],
        "- ": [4, 3],
        "--": [8, 3],
        "- .": [4, 3, 1, 3],
        "--.": [8, 3, 1, 3],
        "--..": [8, 3, 1, 3, 1, 3]
    },
    addDashes = function (o, value, params) {
        value = dasharray[Str(value).toLowerCase()];
        if (value) {
            var width = o.attrs["stroke-width"] || "1",
                butt = {round: width, square: width, butt: 0}[o.attrs["stroke-linecap"] || params["stroke-linecap"]] || 0,
                dashes = [],
                i = value.length;
            while (i--) {
                dashes[i] = value[i] * width + ((i % 2) ? 1 : -1) * butt;
            }
            $(o.node, {"stroke-dasharray": dashes.join(",")});
        }
    },
    setFillAndStroke = function (o, params) {
        var node = o.node,
            attrs = o.attrs,
            vis = node.style.visibility;
        node.style.visibility = "hidden";
        for (var att in params) {
            if (params[has](att)) {
                if (!R._availableAttrs[has](att)) {
                    continue;
                }
                var value = params[att];
                attrs[att] = value;
                switch (att) {
                    case "blur":
                        o.blur(value);
                        break;
                    case "title":
                        var title = node.getElementsByTagName("title");

                        // Use the existing <title>.
                        if (title.length && (title = title[0])) {
                          title.firstChild.nodeValue = value;
                        } else {
                          title = $("title");
                          var val = R._g.doc.createTextNode(value);
                          title.appendChild(val);
                          node.appendChild(title);
                        }
                        break;
                    case "href":
                    case "target":
                        var pn = node.parentNode;
                        if (pn.tagName.toLowerCase() != "a") {
                            var hl = $("a");
                            pn.insertBefore(hl, node);
                            hl.appendChild(node);
                            pn = hl;
                        }
                        if (att == "target") {
                            pn.setAttributeNS(xlink, "show", value == "blank" ? "new" : value);
                        } else {
                            pn.setAttributeNS(xlink, att, value);
                        }
                        break;
                    case "cursor":
                        node.style.cursor = value;
                        break;
                    case "transform":
                        o.transform(value);
                        break;
                    case "arrow-start":
                        addArrow(o, value);
                        break;
                    case "arrow-end":
                        addArrow(o, value, 1);
                        break;
                    case "clip-rect":
                        var rect = Str(value).split(separator);
                        if (rect.length == 4) {
                            o.clip && o.clip.parentNode.parentNode.removeChild(o.clip.parentNode);
                            var el = $("clipPath"),
                                rc = $("rect");
                            el.id = R.createUUID();
                            $(rc, {
                                x: rect[0],
                                y: rect[1],
                                width: rect[2],
                                height: rect[3]
                            });
                            el.appendChild(rc);
                            o.paper.defs.appendChild(el);
                            $(node, {"clip-path": "url(#" + el.id + ")"});
                            o.clip = rc;
                        }
                        if (!value) {
                            var path = node.getAttribute("clip-path");
                            if (path) {
                                var clip = R._g.doc.getElementById(path.replace(/(^url\(#|\)$)/g, E));
                                clip && clip.parentNode.removeChild(clip);
                                $(node, {"clip-path": E});
                                delete o.clip;
                            }
                        }
                    break;
                    case "path":
                        if (o.type == "path") {
                            $(node, {d: value ? attrs.path = R._pathToAbsolute(value) : "M0,0"});
                            o._.dirty = 1;
                            if (o._.arrows) {
                                "startString" in o._.arrows && addArrow(o, o._.arrows.startString);
                                "endString" in o._.arrows && addArrow(o, o._.arrows.endString, 1);
                            }
                        }
                        break;
                    case "width":
                        node.setAttribute(att, value);
                        o._.dirty = 1;
                        if (attrs.fx) {
                            att = "x";
                            value = attrs.x;
                        } else {
                            break;
                        }
                    case "x":
                        if (attrs.fx) {
                            value = -attrs.x - (attrs.width || 0);
                        }
                    case "rx":
                        if (att == "rx" && o.type == "rect") {
                            break;
                        }
                    case "cx":
                        node.setAttribute(att, value);
                        o.pattern && updatePosition(o);
                        o._.dirty = 1;
                        break;
                    case "height":
                        node.setAttribute(att, value);
                        o._.dirty = 1;
                        if (attrs.fy) {
                            att = "y";
                            value = attrs.y;
                        } else {
                            break;
                        }
                    case "y":
                        if (attrs.fy) {
                            value = -attrs.y - (attrs.height || 0);
                        }
                    case "ry":
                        if (att == "ry" && o.type == "rect") {
                            break;
                        }
                    case "cy":
                        node.setAttribute(att, value);
                        o.pattern && updatePosition(o);
                        o._.dirty = 1;
                        break;
                    case "r":
                        if (o.type == "rect") {
                            $(node, {rx: value, ry: value});
                        } else {
                            node.setAttribute(att, value);
                        }
                        o._.dirty = 1;
                        break;
                    case "src":
                        if (o.type == "image") {
                            node.setAttributeNS(xlink, "href", value);
                        }
                        break;
                    case "stroke-width":
                        if (o._.sx != 1 || o._.sy != 1) {
                            value /= mmax(abs(o._.sx), abs(o._.sy)) || 1;
                        }
                        node.setAttribute(att, value);
                        if (attrs["stroke-dasharray"]) {
                            addDashes(o, attrs["stroke-dasharray"], params);
                        }
                        if (o._.arrows) {
                            "startString" in o._.arrows && addArrow(o, o._.arrows.startString);
                            "endString" in o._.arrows && addArrow(o, o._.arrows.endString, 1);
                        }
                        break;
                    case "stroke-dasharray":
                        addDashes(o, value, params);
                        break;
                    case "fill":
                        var isURL = Str(value).match(R._ISURL);
                        if (isURL) {
                            el = $("pattern");
                            var ig = $("image");
                            el.id = R.createUUID();
                            $(el, {x: 0, y: 0, patternUnits: "userSpaceOnUse", height: 1, width: 1});
                            $(ig, {x: 0, y: 0, "xlink:href": isURL[1]});
                            el.appendChild(ig);

                            (function (el) {
                                R._preload(isURL[1], function () {
                                    var w = this.offsetWidth,
                                        h = this.offsetHeight;
                                    $(el, {width: w, height: h});
                                    $(ig, {width: w, height: h});
                                    o.paper.safari();
                                });
                            })(el);
                            o.paper.defs.appendChild(el);
                            $(node, {fill: "url(#" + el.id + ")"});
                            o.pattern = el;
                            o.pattern && updatePosition(o);
                            break;
                        }
                        var clr = R.getRGB(value);
                        if (!clr.error) {
                            delete params.gradient;
                            delete attrs.gradient;
                            !R.is(attrs.opacity, "undefined") &&
                                R.is(params.opacity, "undefined") &&
                                $(node, {opacity: attrs.opacity});
                            !R.is(attrs["fill-opacity"], "undefined") &&
                                R.is(params["fill-opacity"], "undefined") &&
                                $(node, {"fill-opacity": attrs["fill-opacity"]});
                        } else if ((o.type == "circle" || o.type == "ellipse" || Str(value).charAt() != "r") && addGradientFill(o, value)) {
                            if ("opacity" in attrs || "fill-opacity" in attrs) {
                                var gradient = R._g.doc.getElementById(node.getAttribute("fill").replace(/^url\(#|\)$/g, E));
                                if (gradient) {
                                    var stops = gradient.getElementsByTagName("stop");
                                    $(stops[stops.length - 1], {"stop-opacity": ("opacity" in attrs ? attrs.opacity : 1) * ("fill-opacity" in attrs ? attrs["fill-opacity"] : 1)});
                                }
                            }
                            attrs.gradient = value;
                            attrs.fill = "none";
                            break;
                        }
                        clr[has]("opacity") && $(node, {"fill-opacity": clr.opacity > 1 ? clr.opacity / 100 : clr.opacity});
                    case "stroke":
                        clr = R.getRGB(value);
                        node.setAttribute(att, clr.hex);
                        att == "stroke" && clr[has]("opacity") && $(node, {"stroke-opacity": clr.opacity > 1 ? clr.opacity / 100 : clr.opacity});
                        if (att == "stroke" && o._.arrows) {
                            "startString" in o._.arrows && addArrow(o, o._.arrows.startString);
                            "endString" in o._.arrows && addArrow(o, o._.arrows.endString, 1);
                        }
                        break;
                    case "gradient":
                        (o.type == "circle" || o.type == "ellipse" || Str(value).charAt() != "r") && addGradientFill(o, value);
                        break;
                    case "opacity":
                        if (attrs.gradient && !attrs[has]("stroke-opacity")) {
                            $(node, {"stroke-opacity": value > 1 ? value / 100 : value});
                        }
                        // fall
                    case "fill-opacity":
                        if (attrs.gradient) {
                            gradient = R._g.doc.getElementById(node.getAttribute("fill").replace(/^url\(#|\)$/g, E));
                            if (gradient) {
                                stops = gradient.getElementsByTagName("stop");
                                $(stops[stops.length - 1], {"stop-opacity": value});
                            }
                            break;
                        }
                    default:
                        att == "font-size" && (value = toInt(value, 10) + "px");
                        var cssrule = att.replace(/(\-.)/g, function (w) {
                            return w.substring(1).toUpperCase();
                        });
                        node.style[cssrule] = value;
                        o._.dirty = 1;
                        node.setAttribute(att, value);
                        break;
                }
            }
        }

        tuneText(o, params);
        node.style.visibility = vis;
    },
    leading = 1.2,
    tuneText = function (el, params) {
        if (el.type != "text" || !(params[has]("text") || params[has]("font") || params[has]("font-size") || params[has]("x") || params[has]("y"))) {
            return;
        }
        var a = el.attrs,
            node = el.node,
            fontSize = node.firstChild ? toInt(R._g.doc.defaultView.getComputedStyle(node.firstChild, E).getPropertyValue("font-size"), 10) : 10;

        if (params[has]("text")) {
            a.text = params.text;
            while (node.firstChild) {
                node.removeChild(node.firstChild);
            }
            var texts = Str(params.text).split("\n"),
                tspans = [],
                tspan;
            for (var i = 0, ii = texts.length; i < ii; i++) {
                tspan = $("tspan");
                i && $(tspan, {dy: fontSize * leading, x: a.x});
                tspan.appendChild(R._g.doc.createTextNode(texts[i]));
                node.appendChild(tspan);
                tspans[i] = tspan;
            }
        } else {
            tspans = node.getElementsByTagName("tspan");
            for (i = 0, ii = tspans.length; i < ii; i++) if (i) {
                $(tspans[i], {dy: fontSize * leading, x: a.x});
            } else {
                $(tspans[0], {dy: 0});
            }
        }
        $(node, {x: a.x, y: a.y});
        el._.dirty = 1;
        var bb = el._getBBox(),
            dif = a.y - (bb.y + bb.height / 2);
        dif && R.is(dif, "finite") && $(tspans[0], {dy: dif});
    },
    getRealNode = function (node) {
        if (node.parentNode && node.parentNode.tagName.toLowerCase() === "a") {
            return node.parentNode;
        } else {
            return node;
        }
    },
    Element = function (node, svg) {
        var X = 0,
            Y = 0;
        /*\
         * Element.node
         [ property (object) ]
         **
         * Gives you a reference to the DOM object, so you can assign event handlers or just mess around.
         **
         * Note: Don’t mess with it.
         > Usage
         | // draw a circle at coordinate 10,10 with radius of 10
         | var c = paper.circle(10, 10, 10);
         | c.node.onclick = function () {
         |     c.attr("fill", "red");
         | };
        \*/
        this[0] = this.node = node;
        /*\
         * Element.raphael
         [ property (object) ]
         **
         * Internal reference to @Raphael object. In case it is not available.
         > Usage
         | Raphael.el.red = function () {
         |     var hsb = this.paper.raphael.rgb2hsb(this.attr("fill"));
         |     hsb.h = 1;
         |     this.attr({fill: this.paper.raphael.hsb2rgb(hsb).hex});
         | }
        \*/
        node.raphael = true;
        /*\
         * Element.id
         [ property (number) ]
         **
         * Unique id of the element. Especially useful when you want to listen to events of the element,
         * because all events are fired in format `<module>.<action>.<id>`. Also useful for @Paper.getById method.
        \*/
        this.id = R._oid++;
        node.raphaelid = this.id;
        this.matrix = R.matrix();
        this.realPath = null;
        /*\
         * Element.paper
         [ property (object) ]
         **
         * Internal reference to “paper” where object drawn. Mainly for use in plugins and element extensions.
         > Usage
         | Raphael.el.cross = function () {
         |     this.attr({fill: "red"});
         |     this.paper.path("M10,10L50,50M50,10L10,50")
         |         .attr({stroke: "red"});
         | }
        \*/
        this.paper = svg;
        this.attrs = this.attrs || {};
        this._ = {
            transform: [],
            sx: 1,
            sy: 1,
            deg: 0,
            dx: 0,
            dy: 0,
            dirty: 1
        };
        !svg.bottom && (svg.bottom = this);
        /*\
         * Element.prev
         [ property (object) ]
         **
         * Reference to the previous element in the hierarchy.
        \*/
        this.prev = svg.top;
        svg.top && (svg.top.next = this);
        svg.top = this;
        /*\
         * Element.next
         [ property (object) ]
         **
         * Reference to the next element in the hierarchy.
        \*/
        this.next = null;
    },
    elproto = R.el;

    Element.prototype = elproto;
    elproto.constructor = Element;

    R._engine.path = function (pathString, SVG) {
        var el = $("path");
        SVG.canvas && SVG.canvas.appendChild(el);
        var p = new Element(el, SVG);
        p.type = "path";
        setFillAndStroke(p, {
            fill: "none",
            stroke: "#000",
            path: pathString
        });
        return p;
    };
    /*\
     * Element.rotate
     [ method ]
     **
     * Deprecated! Use @Element.transform instead.
     * Adds rotation by given angle around given point to the list of
     * transformations of the element.
     > Parameters
     - deg (number) angle in degrees
     - cx (number) #optional x coordinate of the centre of rotation
     - cy (number) #optional y coordinate of the centre of rotation
     * If cx & cy aren’t specified centre of the shape is used as a point of rotation.
     = (object) @Element
    \*/
    elproto.rotate = function (deg, cx, cy) {
        if (this.removed) {
            return this;
        }
        deg = Str(deg).split(separator);
        if (deg.length - 1) {
            cx = toFloat(deg[1]);
            cy = toFloat(deg[2]);
        }
        deg = toFloat(deg[0]);
        (cy == null) && (cx = cy);
        if (cx == null || cy == null) {
            var bbox = this.getBBox(1);
            cx = bbox.x + bbox.width / 2;
            cy = bbox.y + bbox.height / 2;
        }
        this.transform(this._.transform.concat([["r", deg, cx, cy]]));
        return this;
    };
    /*\
     * Element.scale
     [ method ]
     **
     * Deprecated! Use @Element.transform instead.
     * Adds scale by given amount relative to given point to the list of
     * transformations of the element.
     > Parameters
     - sx (number) horisontal scale amount
     - sy (number) vertical scale amount
     - cx (number) #optional x coordinate of the centre of scale
     - cy (number) #optional y coordinate of the centre of scale
     * If cx & cy aren’t specified centre of the shape is used instead.
     = (object) @Element
    \*/
    elproto.scale = function (sx, sy, cx, cy) {
        if (this.removed) {
            return this;
        }
        sx = Str(sx).split(separator);
        if (sx.length - 1) {
            sy = toFloat(sx[1]);
            cx = toFloat(sx[2]);
            cy = toFloat(sx[3]);
        }
        sx = toFloat(sx[0]);
        (sy == null) && (sy = sx);
        (cy == null) && (cx = cy);
        if (cx == null || cy == null) {
            var bbox = this.getBBox(1);
        }
        cx = cx == null ? bbox.x + bbox.width / 2 : cx;
        cy = cy == null ? bbox.y + bbox.height / 2 : cy;
        this.transform(this._.transform.concat([["s", sx, sy, cx, cy]]));
        return this;
    };
    /*\
     * Element.translate
     [ method ]
     **
     * Deprecated! Use @Element.transform instead.
     * Adds translation by given amount to the list of transformations of the element.
     > Parameters
     - dx (number) horisontal shift
     - dy (number) vertical shift
     = (object) @Element
    \*/
    elproto.translate = function (dx, dy) {
        if (this.removed) {
            return this;
        }
        dx = Str(dx).split(separator);
        if (dx.length - 1) {
            dy = toFloat(dx[1]);
        }
        dx = toFloat(dx[0]) || 0;
        dy = +dy || 0;
        this.transform(this._.transform.concat([["t", dx, dy]]));
        return this;
    };
    /*\
     * Element.transform
     [ method ]
     **
     * Adds transformation to the element which is separate to other attributes,
     * i.e. translation doesn’t change `x` or `y` of the rectange. The format
     * of transformation string is similar to the path string syntax:
     | "t100,100r30,100,100s2,2,100,100r45s1.5"
     * Each letter is a command. There are four commands: `t` is for translate, `r` is for rotate, `s` is for
     * scale and `m` is for matrix.
     *
     * There are also alternative “absolute” translation, rotation and scale: `T`, `R` and `S`. They will not take previous transformation into account. For example, `...T100,0` will always move element 100 px horisontally, while `...t100,0` could move it vertically if there is `r90` before. Just compare results of `r90t100,0` and `r90T100,0`.
     *
     * So, the example line above could be read like “translate by 100, 100; rotate 30° around 100, 100; scale twice around 100, 100;
     * rotate 45° around centre; scale 1.5 times relative to centre”. As you can see rotate and scale commands have origin
     * coordinates as optional parameters, the default is the centre point of the element.
     * Matrix accepts six parameters.
     > Usage
     | var el = paper.rect(10, 20, 300, 200);
     | // translate 100, 100, rotate 45°, translate -100, 0
     | el.transform("t100,100r45t-100,0");
     | // if you want you can append or prepend transformations
     | el.transform("...t50,50");
     | el.transform("s2...");
     | // or even wrap
     | el.transform("t50,50...t-50-50");
     | // to reset transformation call method with empty string
     | el.transform("");
     | // to get current value call it without parameters
     | console.log(el.transform());
     > Parameters
     - tstr (string) #optional transformation string
     * If tstr isn’t specified
     = (string) current transformation string
     * else
     = (object) @Element
    \*/
    elproto.transform = function (tstr) {
        var _ = this._;
        if (tstr == null) {
            return _.transform;
        }
        R._extractTransform(this, tstr);

        this.clip && $(this.clip, {transform: this.matrix.invert()});
        this.pattern && updatePosition(this);
        this.node && $(this.node, {transform: this.matrix});

        if (_.sx != 1 || _.sy != 1) {
            var sw = this.attrs[has]("stroke-width") ? this.attrs["stroke-width"] : 1;
            this.attr({"stroke-width": sw});
        }

        return this;
    };
    /*\
     * Element.hide
     [ method ]
     **
     * Makes element invisible. See @Element.show.
     = (object) @Element
    \*/
    elproto.hide = function () {
        !this.removed && this.paper.safari(this.node.style.display = "none");
        return this;
    };
    /*\
     * Element.show
     [ method ]
     **
     * Makes element visible. See @Element.hide.
     = (object) @Element
    \*/
    elproto.show = function () {
        !this.removed && this.paper.safari(this.node.style.display = "");
        return this;
    };
    /*\
     * Element.remove
     [ method ]
     **
     * Removes element from the paper.
    \*/
    elproto.remove = function () {
        var node = getRealNode(this.node);
        if (this.removed || !node.parentNode) {
            return;
        }
        var paper = this.paper;
        paper.__set__ && paper.__set__.exclude(this);
        eve.unbind("raphael.*.*." + this.id);
        if (this.gradient) {
            paper.defs.removeChild(this.gradient);
        }
        R._tear(this, paper);

        node.parentNode.removeChild(node);

        // Remove custom data for element
        this.removeData();

        for (var i in this) {
            this[i] = typeof this[i] == "function" ? R._removedFactory(i) : null;
        }
        this.removed = true;
    };
    elproto._getBBox = function () {
        if (this.node.style.display == "none") {
            this.show();
            var hide = true;
        }
        var canvasHidden = false,
            containerStyle;
        if (this.paper.canvas.parentElement) {
          containerStyle = this.paper.canvas.parentElement.style;
        } //IE10+ can't find parentElement
        else if (this.paper.canvas.parentNode) {
          containerStyle = this.paper.canvas.parentNode.style;
        }

        if(containerStyle && containerStyle.display == "none") {
          canvasHidden = true;
          containerStyle.display = "";
        }
        var bbox = {};
        try {
            bbox = this.node.getBBox();
        } catch(e) {
            // Firefox 3.0.x, 25.0.1 (probably more versions affected) play badly here - possible fix
            bbox = {
                x: this.node.clientLeft,
                y: this.node.clientTop,
                width: this.node.clientWidth,
                height: this.node.clientHeight
            }
        } finally {
            bbox = bbox || {};
            if(canvasHidden){
              containerStyle.display = "none";
            }
        }
        hide && this.hide();
        return bbox;
    };
    /*\
     * Element.attr
     [ method ]
     **
     * Sets the attributes of the element.
     > Parameters
     - attrName (string) attribute’s name
     - value (string) value
     * or
     - params (object) object of name/value pairs
     * or
     - attrName (string) attribute’s name
     * or
     - attrNames (array) in this case method returns array of current values for given attribute names
     = (object) @Element if attrsName & value or params are passed in.
     = (...) value of the attribute if only attrsName is passed in.
     = (array) array of values of the attribute if attrsNames is passed in.
     = (object) object of attributes if nothing is passed in.
     > Possible parameters
     # <p>Please refer to the <a href="http://www.w3.org/TR/SVG/" title="The W3C Recommendation for the SVG language describes these properties in detail.">SVG specification</a> for an explanation of these parameters.</p>
     o arrow-end (string) arrowhead on the end of the path. The format for string is `<type>[-<width>[-<length>]]`. Possible types: `classic`, `block`, `open`, `oval`, `diamond`, `none`, width: `wide`, `narrow`, `medium`, length: `long`, `short`, `midium`.
     o clip-rect (string) comma or space separated values: x, y, width and height
     o cursor (string) CSS type of the cursor
     o cx (number) the x-axis coordinate of the center of the circle, or ellipse
     o cy (number) the y-axis coordinate of the center of the circle, or ellipse
     o fill (string) colour, gradient or image
     o fill-opacity (number)
     o font (string)
     o font-family (string)
     o font-size (number) font size in pixels
     o font-weight (string)
     o height (number)
     o href (string) URL, if specified element behaves as hyperlink
     o opacity (number)
     o path (string) SVG path string format
     o r (number) radius of the circle, ellipse or rounded corner on the rect
     o rx (number) horisontal radius of the ellipse
     o ry (number) vertical radius of the ellipse
     o src (string) image URL, only works for @Element.image element
     o stroke (string) stroke colour
     o stroke-dasharray (string) [“”, “`-`”, “`.`”, “`-.`”, “`-..`”, “`. `”, “`- `”, “`--`”, “`- .`”, “`--.`”, “`--..`”]
     o stroke-linecap (string) [“`butt`”, “`square`”, “`round`”]
     o stroke-linejoin (string) [“`bevel`”, “`round`”, “`miter`”]
     o stroke-miterlimit (number)
     o stroke-opacity (number)
     o stroke-width (number) stroke width in pixels, default is '1'
     o target (string) used with href
     o text (string) contents of the text element. Use `\n` for multiline text
     o text-anchor (string) [“`start`”, “`middle`”, “`end`”], default is “`middle`”
     o title (string) will create tooltip with a given text
     o transform (string) see @Element.transform
     o width (number)
     o x (number)
     o y (number)
     > Gradients
     * Linear gradient format: “`‹angle›-‹colour›[-‹colour›[:‹offset›]]*-‹colour›`”, example: “`90-#fff-#000`” – 90°
     * gradient from white to black or “`0-#fff-#f00:20-#000`” – 0° gradient from white via red (at 20%) to black.
     *
     * radial gradient: “`r[(‹fx›, ‹fy›)]‹colour›[-‹colour›[:‹offset›]]*-‹colour›`”, example: “`r#fff-#000`” –
     * gradient from white to black or “`r(0.25, 0.75)#fff-#000`” – gradient from white to black with focus point
     * at 0.25, 0.75. Focus point coordinates are in 0..1 range. Radial gradients can only be applied to circles and ellipses.
     > Path String
     # <p>Please refer to <a href="http://www.w3.org/TR/SVG/paths.html#PathData" title="Details of a path’s data attribute’s format are described in the SVG specification.">SVG documentation regarding path string</a>. Raphaël fully supports it.</p>
     > Colour Parsing
     # <ul>
     #     <li>Colour name (“<code>red</code>”, “<code>green</code>”, “<code>cornflowerblue</code>”, etc)</li>
     #     <li>#••• — shortened HTML colour: (“<code>#000</code>”, “<code>#fc0</code>”, etc)</li>
     #     <li>#•••••• — full length HTML colour: (“<code>#000000</code>”, “<code>#bd2300</code>”)</li>
     #     <li>rgb(•••, •••, •••) — red, green and blue channels’ values: (“<code>rgb(200,&nbsp;100,&nbsp;0)</code>”)</li>
     #     <li>rgb(•••%, •••%, •••%) — same as above, but in %: (“<code>rgb(100%,&nbsp;175%,&nbsp;0%)</code>”)</li>
     #     <li>rgba(•••, •••, •••, •••) — red, green and blue channels’ values: (“<code>rgba(200,&nbsp;100,&nbsp;0, .5)</code>”)</li>
     #     <li>rgba(•••%, •••%, •••%, •••%) — same as above, but in %: (“<code>rgba(100%,&nbsp;175%,&nbsp;0%, 50%)</code>”)</li>
     #     <li>hsb(•••, •••, •••) — hue, saturation and brightness values: (“<code>hsb(0.5,&nbsp;0.25,&nbsp;1)</code>”)</li>
     #     <li>hsb(•••%, •••%, •••%) — same as above, but in %</li>
     #     <li>hsba(•••, •••, •••, •••) — same as above, but with opacity</li>
     #     <li>hsl(•••, •••, •••) — almost the same as hsb, see <a href="http://en.wikipedia.org/wiki/HSL_and_HSV" title="HSL and HSV - Wikipedia, the free encyclopedia">Wikipedia page</a></li>
     #     <li>hsl(•••%, •••%, •••%) — same as above, but in %</li>
     #     <li>hsla(•••, •••, •••, •••) — same as above, but with opacity</li>
     #     <li>Optionally for hsb and hsl you could specify hue as a degree: “<code>hsl(240deg,&nbsp;1,&nbsp;.5)</code>” or, if you want to go fancy, “<code>hsl(240°,&nbsp;1,&nbsp;.5)</code>”</li>
     # </ul>
    \*/
    elproto.attr = function (name, value) {
        if (this.removed) {
            return this;
        }
        if (name == null) {
            var res = {};
            for (var a in this.attrs) if (this.attrs[has](a)) {
                res[a] = this.attrs[a];
            }
            res.gradient && res.fill == "none" && (res.fill = res.gradient) && delete res.gradient;
            res.transform = this._.transform;
            return res;
        }
        if (value == null && R.is(name, "string")) {
            if (name == "fill" && this.attrs.fill == "none" && this.attrs.gradient) {
                return this.attrs.gradient;
            }
            if (name == "transform") {
                return this._.transform;
            }
            var names = name.split(separator),
                out = {};
            for (var i = 0, ii = names.length; i < ii; i++) {
                name = names[i];
                if (name in this.attrs) {
                    out[name] = this.attrs[name];
                } else if (R.is(this.paper.customAttributes[name], "function")) {
                    out[name] = this.paper.customAttributes[name].def;
                } else {
                    out[name] = R._availableAttrs[name];
                }
            }
            return ii - 1 ? out : out[names[0]];
        }
        if (value == null && R.is(name, "array")) {
            out = {};
            for (i = 0, ii = name.length; i < ii; i++) {
                out[name[i]] = this.attr(name[i]);
            }
            return out;
        }
        if (value != null) {
            var params = {};
            params[name] = value;
        } else if (name != null && R.is(name, "object")) {
            params = name;
        }
        for (var key in params) {
            eve("raphael.attr." + key + "." + this.id, this, params[key]);
        }
        for (key in this.paper.customAttributes) if (this.paper.customAttributes[has](key) && params[has](key) && R.is(this.paper.customAttributes[key], "function")) {
            var par = this.paper.customAttributes[key].apply(this, [].concat(params[key]));
            this.attrs[key] = params[key];
            for (var subkey in par) if (par[has](subkey)) {
                params[subkey] = par[subkey];
            }
        }
        setFillAndStroke(this, params);
        return this;
    };
    /*\
     * Element.toFront
     [ method ]
     **
     * Moves the element so it is the closest to the viewer’s eyes, on top of other elements.
     = (object) @Element
    \*/
    elproto.toFront = function () {
        if (this.removed) {
            return this;
        }
        var node = getRealNode(this.node);
        node.parentNode.appendChild(node);
        var svg = this.paper;
        svg.top != this && R._tofront(this, svg);
        return this;
    };
    /*\
     * Element.toBack
     [ method ]
     **
     * Moves the element so it is the furthest from the viewer’s eyes, behind other elements.
     = (object) @Element
    \*/
    elproto.toBack = function () {
        if (this.removed) {
            return this;
        }
        var node = getRealNode(this.node);
        var parentNode = node.parentNode;
        parentNode.insertBefore(node, parentNode.firstChild);
        R._toback(this, this.paper);
        var svg = this.paper;
        return this;
    };
    /*\
     * Element.insertAfter
     [ method ]
     **
     * Inserts current object after the given one.
     = (object) @Element
    \*/
    elproto.insertAfter = function (element) {
        if (this.removed || !element) {
            return this;
        }

        var node = getRealNode(this.node);
        var afterNode = getRealNode(element.node || element[element.length - 1].node);
        if (afterNode.nextSibling) {
            afterNode.parentNode.insertBefore(node, afterNode.nextSibling);
        } else {
            afterNode.parentNode.appendChild(node);
        }
        R._insertafter(this, element, this.paper);
        return this;
    };
    /*\
     * Element.insertBefore
     [ method ]
     **
     * Inserts current object before the given one.
     = (object) @Element
    \*/
    elproto.insertBefore = function (element) {
        if (this.removed || !element) {
            return this;
        }

        var node = getRealNode(this.node);
        var beforeNode = getRealNode(element.node || element[0].node);
        beforeNode.parentNode.insertBefore(node, beforeNode);
        R._insertbefore(this, element, this.paper);
        return this;
    };
    elproto.blur = function (size) {
        // Experimental. No Safari support. Use it on your own risk.
        var t = this;
        if (+size !== 0) {
            var fltr = $("filter"),
                blur = $("feGaussianBlur");
            t.attrs.blur = size;
            fltr.id = R.createUUID();
            $(blur, {stdDeviation: +size || 1.5});
            fltr.appendChild(blur);
            t.paper.defs.appendChild(fltr);
            t._blur = fltr;
            $(t.node, {filter: "url(#" + fltr.id + ")"});
        } else {
            if (t._blur) {
                t._blur.parentNode.removeChild(t._blur);
                delete t._blur;
                delete t.attrs.blur;
            }
            t.node.removeAttribute("filter");
        }
        return t;
    };
    R._engine.circle = function (svg, x, y, r) {
        var el = $("circle");
        svg.canvas && svg.canvas.appendChild(el);
        var res = new Element(el, svg);
        res.attrs = {cx: x, cy: y, r: r, fill: "none", stroke: "#000"};
        res.type = "circle";
        $(el, res.attrs);
        return res;
    };
    R._engine.rect = function (svg, x, y, w, h, r) {
        var el = $("rect");
        svg.canvas && svg.canvas.appendChild(el);
        var res = new Element(el, svg);
        res.attrs = {x: x, y: y, width: w, height: h, rx: r || 0, ry: r || 0, fill: "none", stroke: "#000"};
        res.type = "rect";
        $(el, res.attrs);
        return res;
    };
    R._engine.ellipse = function (svg, x, y, rx, ry) {
        var el = $("ellipse");
        svg.canvas && svg.canvas.appendChild(el);
        var res = new Element(el, svg);
        res.attrs = {cx: x, cy: y, rx: rx, ry: ry, fill: "none", stroke: "#000"};
        res.type = "ellipse";
        $(el, res.attrs);
        return res;
    };
    R._engine.image = function (svg, src, x, y, w, h) {
        var el = $("image");
        $(el, {x: x, y: y, width: w, height: h, preserveAspectRatio: "none"});
        el.setAttributeNS(xlink, "href", src);
        svg.canvas && svg.canvas.appendChild(el);
        var res = new Element(el, svg);
        res.attrs = {x: x, y: y, width: w, height: h, src: src};
        res.type = "image";
        return res;
    };
    R._engine.text = function (svg, x, y, text) {
        var el = $("text");
        svg.canvas && svg.canvas.appendChild(el);
        var res = new Element(el, svg);
        res.attrs = {
            x: x,
            y: y,
            "text-anchor": "middle",
            text: text,
            "font-family": R._availableAttrs["font-family"],
            "font-size": R._availableAttrs["font-size"],
            stroke: "none",
            fill: "#000"
        };
        res.type = "text";
        setFillAndStroke(res, res.attrs);
        return res;
    };
    R._engine.setSize = function (width, height) {
        this.width = width || this.width;
        this.height = height || this.height;
        this.canvas.setAttribute("width", this.width);
        this.canvas.setAttribute("height", this.height);
        if (this._viewBox) {
            this.setViewBox.apply(this, this._viewBox);
        }
        return this;
    };
    R._engine.create = function () {
        var con = R._getContainer.apply(0, arguments),
            container = con && con.container,
            x = con.x,
            y = con.y,
            width = con.width,
            height = con.height;
        if (!container) {
            throw new Error("SVG container not found.");
        }
        var cnvs = $("svg"),
            css = "overflow:hidden;",
            isFloating;
        x = x || 0;
        y = y || 0;
        width = width || 512;
        height = height || 342;
        $(cnvs, {
            height: height,
            version: 1.1,
            width: width,
            xmlns: "http://www.w3.org/2000/svg",
            "xmlns:xlink": "http://www.w3.org/1999/xlink"
        });
        if (container == 1) {
            cnvs.style.cssText = css + "position:absolute;left:" + x + "px;top:" + y + "px";
            R._g.doc.body.appendChild(cnvs);
            isFloating = 1;
        } else {
            cnvs.style.cssText = css + "position:relative";
            if (container.firstChild) {
                container.insertBefore(cnvs, container.firstChild);
            } else {
                container.appendChild(cnvs);
            }
        }
        container = new R._Paper;
        container.width = width;
        container.height = height;
        container.canvas = cnvs;
        container.clear();
        container._left = container._top = 0;
        isFloating && (container.renderfix = function () {});
        container.renderfix();
        return container;
    };
    R._engine.setViewBox = function (x, y, w, h, fit) {
        eve("raphael.setViewBox", this, this._viewBox, [x, y, w, h, fit]);
        var paperSize = this.getSize(),
            size = mmax(w / paperSize.width, h / paperSize.height),
            top = this.top,
            aspectRatio = fit ? "xMidYMid meet" : "xMinYMin",
            vb,
            sw;
        if (x == null) {
            if (this._vbSize) {
                size = 1;
            }
            delete this._vbSize;
            vb = "0 0 " + this.width + S + this.height;
        } else {
            this._vbSize = size;
            vb = x + S + y + S + w + S + h;
        }
        $(this.canvas, {
            viewBox: vb,
            preserveAspectRatio: aspectRatio
        });
        while (size && top) {
            sw = "stroke-width" in top.attrs ? top.attrs["stroke-width"] : 1;
            top.attr({"stroke-width": sw});
            top._.dirty = 1;
            top._.dirtyT = 1;
            top = top.prev;
        }
        this._viewBox = [x, y, w, h, !!fit];
        return this;
    };
    /*\
     * Paper.renderfix
     [ method ]
     **
     * Fixes the issue of Firefox and IE9 regarding subpixel rendering. If paper is dependant
     * on other elements after reflow it could shift half pixel which cause for lines to lost their crispness.
     * This method fixes the issue.
     **
       Special thanks to Mariusz Nowak (http://www.medikoo.com/) for this method.
    \*/
    R.prototype.renderfix = function () {
        var cnvs = this.canvas,
            s = cnvs.style,
            pos;
        try {
            pos = cnvs.getScreenCTM() || cnvs.createSVGMatrix();
        } catch (e) {
            pos = cnvs.createSVGMatrix();
        }
        var left = -pos.e % 1,
            top = -pos.f % 1;
        if (left || top) {
            if (left) {
                this._left = (this._left + left) % 1;
                s.left = this._left + "px";
            }
            if (top) {
                this._top = (this._top + top) % 1;
                s.top = this._top + "px";
            }
        }
    };
    /*\
     * Paper.clear
     [ method ]
     **
     * Clears the paper, i.e. removes all the elements.
    \*/
    R.prototype.clear = function () {
        R.eve("raphael.clear", this);
        var c = this.canvas;
        while (c.firstChild) {
            c.removeChild(c.firstChild);
        }
        this.bottom = this.top = null;
        (this.desc = $("desc")).appendChild(R._g.doc.createTextNode("Created with Rapha\xebl " + R.version));
        c.appendChild(this.desc);
        c.appendChild(this.defs = $("defs"));
    };
    /*\
     * Paper.remove
     [ method ]
     **
     * Removes the paper from the DOM.
    \*/
    R.prototype.remove = function () {
        eve("raphael.remove", this);
        this.canvas.parentNode && this.canvas.parentNode.removeChild(this.canvas);
        for (var i in this) {
            this[i] = typeof this[i] == "function" ? R._removedFactory(i) : null;
        }
    };
    var setproto = R.st;
    for (var method in elproto) if (elproto[has](method) && !setproto[has](method)) {
        setproto[method] = (function (methodname) {
            return function () {
                var arg = arguments;
                return this.forEach(function (el) {
                    el[methodname].apply(el, arg);
                });
            };
        })(method);
    }
})();

// ┌─────────────────────────────────────────────────────────────────────┐ \\
// │ Raphaël - JavaScript Vector Library                                 │ \\
// ├─────────────────────────────────────────────────────────────────────┤ \\
// │ VML Module                                                          │ \\
// ├─────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright (c) 2008-2011 Dmitry Baranovskiy (http://raphaeljs.com)   │ \\
// │ Copyright (c) 2008-2011 Sencha Labs (http://sencha.com)             │ \\
// │ Licensed under the MIT (http://raphaeljs.com/license.html) license. │ \\
// └─────────────────────────────────────────────────────────────────────┘ \\

(function(){
    if (!R.vml) {
        return;
    }
    var has = "hasOwnProperty",
        Str = String,
        toFloat = parseFloat,
        math = Math,
        round = math.round,
        mmax = math.max,
        mmin = math.min,
        abs = math.abs,
        fillString = "fill",
        separator = /[, ]+/,
        eve = R.eve,
        ms = " progid:DXImageTransform.Microsoft",
        S = " ",
        E = "",
        map = {M: "m", L: "l", C: "c", Z: "x", m: "t", l: "r", c: "v", z: "x"},
        bites = /([clmz]),?([^clmz]*)/gi,
        blurregexp = / progid:\S+Blur\([^\)]+\)/g,
        val = /-?[^,\s-]+/g,
        cssDot = "position:absolute;left:0;top:0;width:1px;height:1px;behavior:url(#default#VML)",
        zoom = 21600,
        pathTypes = {path: 1, rect: 1, image: 1},
        ovalTypes = {circle: 1, ellipse: 1},
        path2vml = function (path) {
            var total =  /[ahqstv]/ig,
                command = R._pathToAbsolute;
            Str(path).match(total) && (command = R._path2curve);
            total = /[clmz]/g;
            if (command == R._pathToAbsolute && !Str(path).match(total)) {
                var res = Str(path).replace(bites, function (all, command, args) {
                    var vals = [],
                        isMove = command.toLowerCase() == "m",
                        res = map[command];
                    args.replace(val, function (value) {
                        if (isMove && vals.length == 2) {
                            res += vals + map[command == "m" ? "l" : "L"];
                            vals = [];
                        }
                        vals.push(round(value * zoom));
                    });
                    return res + vals;
                });
                return res;
            }
            var pa = command(path), p, r;
            res = [];
            for (var i = 0, ii = pa.length; i < ii; i++) {
                p = pa[i];
                r = pa[i][0].toLowerCase();
                r == "z" && (r = "x");
                for (var j = 1, jj = p.length; j < jj; j++) {
                    r += round(p[j] * zoom) + (j != jj - 1 ? "," : E);
                }
                res.push(r);
            }
            return res.join(S);
        },
        compensation = function (deg, dx, dy) {
            var m = R.matrix();
            m.rotate(-deg, .5, .5);
            return {
                dx: m.x(dx, dy),
                dy: m.y(dx, dy)
            };
        },
        setCoords = function (p, sx, sy, dx, dy, deg) {
            var _ = p._,
                m = p.matrix,
                fillpos = _.fillpos,
                o = p.node,
                s = o.style,
                y = 1,
                flip = "",
                dxdy,
                kx = zoom / sx,
                ky = zoom / sy;
            s.visibility = "hidden";
            if (!sx || !sy) {
                return;
            }
            o.coordsize = abs(kx) + S + abs(ky);
            s.rotation = deg * (sx * sy < 0 ? -1 : 1);
            if (deg) {
                var c = compensation(deg, dx, dy);
                dx = c.dx;
                dy = c.dy;
            }
            sx < 0 && (flip += "x");
            sy < 0 && (flip += " y") && (y = -1);
            s.flip = flip;
            o.coordorigin = (dx * -kx) + S + (dy * -ky);
            if (fillpos || _.fillsize) {
                var fill = o.getElementsByTagName(fillString);
                fill = fill && fill[0];
                o.removeChild(fill);
                if (fillpos) {
                    c = compensation(deg, m.x(fillpos[0], fillpos[1]), m.y(fillpos[0], fillpos[1]));
                    fill.position = c.dx * y + S + c.dy * y;
                }
                if (_.fillsize) {
                    fill.size = _.fillsize[0] * abs(sx) + S + _.fillsize[1] * abs(sy);
                }
                o.appendChild(fill);
            }
            s.visibility = "visible";
        };
    R.toString = function () {
        return  "Your browser doesn\u2019t support SVG. Falling down to VML.\nYou are running Rapha\xebl " + this.version;
    };
    var addArrow = function (o, value, isEnd) {
        var values = Str(value).toLowerCase().split("-"),
            se = isEnd ? "end" : "start",
            i = values.length,
            type = "classic",
            w = "medium",
            h = "medium";
        while (i--) {
            switch (values[i]) {
                case "block":
                case "classic":
                case "oval":
                case "diamond":
                case "open":
                case "none":
                    type = values[i];
                    break;
                case "wide":
                case "narrow": h = values[i]; break;
                case "long":
                case "short": w = values[i]; break;
            }
        }
        var stroke = o.node.getElementsByTagName("stroke")[0];
        stroke[se + "arrow"] = type;
        stroke[se + "arrowlength"] = w;
        stroke[se + "arrowwidth"] = h;
    },
    setFillAndStroke = function (o, params) {
        // o.paper.canvas.style.display = "none";
        o.attrs = o.attrs || {};
        var node = o.node,
            a = o.attrs,
            s = node.style,
            xy,
            newpath = pathTypes[o.type] && (params.x != a.x || params.y != a.y || params.width != a.width || params.height != a.height || params.cx != a.cx || params.cy != a.cy || params.rx != a.rx || params.ry != a.ry || params.r != a.r),
            isOval = ovalTypes[o.type] && (a.cx != params.cx || a.cy != params.cy || a.r != params.r || a.rx != params.rx || a.ry != params.ry),
            res = o;


        for (var par in params) if (params[has](par)) {
            a[par] = params[par];
        }
        if (newpath) {
            a.path = R._getPath[o.type](o);
            o._.dirty = 1;
        }
        params.href && (node.href = params.href);
        params.title && (node.title = params.title);
        params.target && (node.target = params.target);
        params.cursor && (s.cursor = params.cursor);
        "blur" in params && o.blur(params.blur);
        if (params.path && o.type == "path" || newpath) {
            node.path = path2vml(~Str(a.path).toLowerCase().indexOf("r") ? R._pathToAbsolute(a.path) : a.path);
            o._.dirty = 1;
            if (o.type == "image") {
                o._.fillpos = [a.x, a.y];
                o._.fillsize = [a.width, a.height];
                setCoords(o, 1, 1, 0, 0, 0);
            }
        }
        "transform" in params && o.transform(params.transform);
        if (isOval) {
            var cx = +a.cx,
                cy = +a.cy,
                rx = +a.rx || +a.r || 0,
                ry = +a.ry || +a.r || 0;
            node.path = R.format("ar{0},{1},{2},{3},{4},{1},{4},{1}x", round((cx - rx) * zoom), round((cy - ry) * zoom), round((cx + rx) * zoom), round((cy + ry) * zoom), round(cx * zoom));
            o._.dirty = 1;
        }
        if ("clip-rect" in params) {
            var rect = Str(params["clip-rect"]).split(separator);
            if (rect.length == 4) {
                rect[2] = +rect[2] + (+rect[0]);
                rect[3] = +rect[3] + (+rect[1]);
                var div = node.clipRect || R._g.doc.createElement("div"),
                    dstyle = div.style;
                dstyle.clip = R.format("rect({1}px {2}px {3}px {0}px)", rect);
                if (!node.clipRect) {
                    dstyle.position = "absolute";
                    dstyle.top = 0;
                    dstyle.left = 0;
                    dstyle.width = o.paper.width + "px";
                    dstyle.height = o.paper.height + "px";
                    node.parentNode.insertBefore(div, node);
                    div.appendChild(node);
                    node.clipRect = div;
                }
            }
            if (!params["clip-rect"]) {
                node.clipRect && (node.clipRect.style.clip = "auto");
            }
        }
        if (o.textpath) {
            var textpathStyle = o.textpath.style;
            params.font && (textpathStyle.font = params.font);
            params["font-family"] && (textpathStyle.fontFamily = '"' + params["font-family"].split(",")[0].replace(/^['"]+|['"]+$/g, E) + '"');
            params["font-size"] && (textpathStyle.fontSize = params["font-size"]);
            params["font-weight"] && (textpathStyle.fontWeight = params["font-weight"]);
            params["font-style"] && (textpathStyle.fontStyle = params["font-style"]);
        }
        if ("arrow-start" in params) {
            addArrow(res, params["arrow-start"]);
        }
        if ("arrow-end" in params) {
            addArrow(res, params["arrow-end"], 1);
        }
        if (params.opacity != null || 
            params["stroke-width"] != null ||
            params.fill != null ||
            params.src != null ||
            params.stroke != null ||
            params["stroke-width"] != null ||
            params["stroke-opacity"] != null ||
            params["fill-opacity"] != null ||
            params["stroke-dasharray"] != null ||
            params["stroke-miterlimit"] != null ||
            params["stroke-linejoin"] != null ||
            params["stroke-linecap"] != null) {
            var fill = node.getElementsByTagName(fillString),
                newfill = false;
            fill = fill && fill[0];
            !fill && (newfill = fill = createNode(fillString));
            if (o.type == "image" && params.src) {
                fill.src = params.src;
            }
            params.fill && (fill.on = true);
            if (fill.on == null || params.fill == "none" || params.fill === null) {
                fill.on = false;
            }
            if (fill.on && params.fill) {
                var isURL = Str(params.fill).match(R._ISURL);
                if (isURL) {
                    fill.parentNode == node && node.removeChild(fill);
                    fill.rotate = true;
                    fill.src = isURL[1];
                    fill.type = "tile";
                    var bbox = o.getBBox(1);
                    fill.position = bbox.x + S + bbox.y;
                    o._.fillpos = [bbox.x, bbox.y];

                    R._preload(isURL[1], function () {
                        o._.fillsize = [this.offsetWidth, this.offsetHeight];
                    });
                } else {
                    fill.color = R.getRGB(params.fill).hex;
                    fill.src = E;
                    fill.type = "solid";
                    if (R.getRGB(params.fill).error && (res.type in {circle: 1, ellipse: 1} || Str(params.fill).charAt() != "r") && addGradientFill(res, params.fill, fill)) {
                        a.fill = "none";
                        a.gradient = params.fill;
                        fill.rotate = false;
                    }
                }
            }
            if ("fill-opacity" in params || "opacity" in params) {
                var opacity = ((+a["fill-opacity"] + 1 || 2) - 1) * ((+a.opacity + 1 || 2) - 1) * ((+R.getRGB(params.fill).o + 1 || 2) - 1);
                opacity = mmin(mmax(opacity, 0), 1);
                fill.opacity = opacity;
                if (fill.src) {
                    fill.color = "none";
                }
            }
            node.appendChild(fill);
            var stroke = (node.getElementsByTagName("stroke") && node.getElementsByTagName("stroke")[0]),
            newstroke = false;
            !stroke && (newstroke = stroke = createNode("stroke"));
            if ((params.stroke && params.stroke != "none") ||
                params["stroke-width"] ||
                params["stroke-opacity"] != null ||
                params["stroke-dasharray"] ||
                params["stroke-miterlimit"] ||
                params["stroke-linejoin"] ||
                params["stroke-linecap"]) {
                stroke.on = true;
            }
            (params.stroke == "none" || params.stroke === null || stroke.on == null || params.stroke == 0 || params["stroke-width"] == 0) && (stroke.on = false);
            var strokeColor = R.getRGB(params.stroke);
            stroke.on && params.stroke && (stroke.color = strokeColor.hex);
            opacity = ((+a["stroke-opacity"] + 1 || 2) - 1) * ((+a.opacity + 1 || 2) - 1) * ((+strokeColor.o + 1 || 2) - 1);
            var width = (toFloat(params["stroke-width"]) || 1) * .75;
            opacity = mmin(mmax(opacity, 0), 1);
            params["stroke-width"] == null && (width = a["stroke-width"]);
            params["stroke-width"] && (stroke.weight = width);
            width && width < 1 && (opacity *= width) && (stroke.weight = 1);
            stroke.opacity = opacity;
        
            params["stroke-linejoin"] && (stroke.joinstyle = params["stroke-linejoin"] || "miter");
            stroke.miterlimit = params["stroke-miterlimit"] || 8;
            params["stroke-linecap"] && (stroke.endcap = params["stroke-linecap"] == "butt" ? "flat" : params["stroke-linecap"] == "square" ? "square" : "round");
            if ("stroke-dasharray" in params) {
                var dasharray = {
                    "-": "shortdash",
                    ".": "shortdot",
                    "-.": "shortdashdot",
                    "-..": "shortdashdotdot",
                    ". ": "dot",
                    "- ": "dash",
                    "--": "longdash",
                    "- .": "dashdot",
                    "--.": "longdashdot",
                    "--..": "longdashdotdot"
                };
                stroke.dashstyle = dasharray[has](params["stroke-dasharray"]) ? dasharray[params["stroke-dasharray"]] : E;
            }
            newstroke && node.appendChild(stroke);
        }
        if (res.type == "text") {
            res.paper.canvas.style.display = E;
            var span = res.paper.span,
                m = 100,
                fontSize = a.font && a.font.match(/\d+(?:\.\d*)?(?=px)/);
            s = span.style;
            a.font && (s.font = a.font);
            a["font-family"] && (s.fontFamily = a["font-family"]);
            a["font-weight"] && (s.fontWeight = a["font-weight"]);
            a["font-style"] && (s.fontStyle = a["font-style"]);
            fontSize = toFloat(a["font-size"] || fontSize && fontSize[0]) || 10;
            s.fontSize = fontSize * m + "px";
            res.textpath.string && (span.innerHTML = Str(res.textpath.string).replace(/</g, "&#60;").replace(/&/g, "&#38;").replace(/\n/g, "<br>"));
            var brect = span.getBoundingClientRect();
            res.W = a.w = (brect.right - brect.left) / m;
            res.H = a.h = (brect.bottom - brect.top) / m;
            // res.paper.canvas.style.display = "none";
            res.X = a.x;
            res.Y = a.y + res.H / 2;

            ("x" in params || "y" in params) && (res.path.v = R.format("m{0},{1}l{2},{1}", round(a.x * zoom), round(a.y * zoom), round(a.x * zoom) + 1));
            var dirtyattrs = ["x", "y", "text", "font", "font-family", "font-weight", "font-style", "font-size"];
            for (var d = 0, dd = dirtyattrs.length; d < dd; d++) if (dirtyattrs[d] in params) {
                res._.dirty = 1;
                break;
            }
        
            // text-anchor emulation
            switch (a["text-anchor"]) {
                case "start":
                    res.textpath.style["v-text-align"] = "left";
                    res.bbx = res.W / 2;
                break;
                case "end":
                    res.textpath.style["v-text-align"] = "right";
                    res.bbx = -res.W / 2;
                break;
                default:
                    res.textpath.style["v-text-align"] = "center";
                    res.bbx = 0;
                break;
            }
            res.textpath.style["v-text-kern"] = true;
        }
        // res.paper.canvas.style.display = E;
    },
    addGradientFill = function (o, gradient, fill) {
        o.attrs = o.attrs || {};
        var attrs = o.attrs,
            pow = Math.pow,
            opacity,
            oindex,
            type = "linear",
            fxfy = ".5 .5";
        o.attrs.gradient = gradient;
        gradient = Str(gradient).replace(R._radial_gradient, function (all, fx, fy) {
            type = "radial";
            if (fx && fy) {
                fx = toFloat(fx);
                fy = toFloat(fy);
                pow(fx - .5, 2) + pow(fy - .5, 2) > .25 && (fy = math.sqrt(.25 - pow(fx - .5, 2)) * ((fy > .5) * 2 - 1) + .5);
                fxfy = fx + S + fy;
            }
            return E;
        });
        gradient = gradient.split(/\s*\-\s*/);
        if (type == "linear") {
            var angle = gradient.shift();
            angle = -toFloat(angle);
            if (isNaN(angle)) {
                return null;
            }
        }
        var dots = R._parseDots(gradient);
        if (!dots) {
            return null;
        }
        o = o.shape || o.node;
        if (dots.length) {
            o.removeChild(fill);
            fill.on = true;
            fill.method = "none";
            fill.color = dots[0].color;
            fill.color2 = dots[dots.length - 1].color;
            var clrs = [];
            for (var i = 0, ii = dots.length; i < ii; i++) {
                dots[i].offset && clrs.push(dots[i].offset + S + dots[i].color);
            }
            fill.colors = clrs.length ? clrs.join() : "0% " + fill.color;
            if (type == "radial") {
                fill.type = "gradientTitle";
                fill.focus = "100%";
                fill.focussize = "0 0";
                fill.focusposition = fxfy;
                fill.angle = 0;
            } else {
                // fill.rotate= true;
                fill.type = "gradient";
                fill.angle = (270 - angle) % 360;
            }
            o.appendChild(fill);
        }
        return 1;
    },
    Element = function (node, vml) {
        this[0] = this.node = node;
        node.raphael = true;
        this.id = R._oid++;
        node.raphaelid = this.id;
        this.X = 0;
        this.Y = 0;
        this.attrs = {};
        this.paper = vml;
        this.matrix = R.matrix();
        this._ = {
            transform: [],
            sx: 1,
            sy: 1,
            dx: 0,
            dy: 0,
            deg: 0,
            dirty: 1,
            dirtyT: 1
        };
        !vml.bottom && (vml.bottom = this);
        this.prev = vml.top;
        vml.top && (vml.top.next = this);
        vml.top = this;
        this.next = null;
    };
    var elproto = R.el;

    Element.prototype = elproto;
    elproto.constructor = Element;
    elproto.transform = function (tstr) {
        if (tstr == null) {
            return this._.transform;
        }
        var vbs = this.paper._viewBoxShift,
            vbt = vbs ? "s" + [vbs.scale, vbs.scale] + "-1-1t" + [vbs.dx, vbs.dy] : E,
            oldt;
        if (vbs) {
            oldt = tstr = Str(tstr).replace(/\.{3}|\u2026/g, this._.transform || E);
        }
        R._extractTransform(this, vbt + tstr);
        var matrix = this.matrix.clone(),
            skew = this.skew,
            o = this.node,
            split,
            isGrad = ~Str(this.attrs.fill).indexOf("-"),
            isPatt = !Str(this.attrs.fill).indexOf("url(");
        matrix.translate(1, 1);
        if (isPatt || isGrad || this.type == "image") {
            skew.matrix = "1 0 0 1";
            skew.offset = "0 0";
            split = matrix.split();
            if ((isGrad && split.noRotation) || !split.isSimple) {
                o.style.filter = matrix.toFilter();
                var bb = this.getBBox(),
                    bbt = this.getBBox(1),
                    dx = bb.x - bbt.x,
                    dy = bb.y - bbt.y;
                o.coordorigin = (dx * -zoom) + S + (dy * -zoom);
                setCoords(this, 1, 1, dx, dy, 0);
            } else {
                o.style.filter = E;
                setCoords(this, split.scalex, split.scaley, split.dx, split.dy, split.rotate);
            }
        } else {
            o.style.filter = E;
            skew.matrix = Str(matrix);
            skew.offset = matrix.offset();
        }
        if (oldt !== null) { // empty string value is true as well
            this._.transform = oldt;
            R._extractTransform(this, oldt);
        }
        return this;
    };
    elproto.rotate = function (deg, cx, cy) {
        if (this.removed) {
            return this;
        }
        if (deg == null) {
            return;
        }
        deg = Str(deg).split(separator);
        if (deg.length - 1) {
            cx = toFloat(deg[1]);
            cy = toFloat(deg[2]);
        }
        deg = toFloat(deg[0]);
        (cy == null) && (cx = cy);
        if (cx == null || cy == null) {
            var bbox = this.getBBox(1);
            cx = bbox.x + bbox.width / 2;
            cy = bbox.y + bbox.height / 2;
        }
        this._.dirtyT = 1;
        this.transform(this._.transform.concat([["r", deg, cx, cy]]));
        return this;
    };
    elproto.translate = function (dx, dy) {
        if (this.removed) {
            return this;
        }
        dx = Str(dx).split(separator);
        if (dx.length - 1) {
            dy = toFloat(dx[1]);
        }
        dx = toFloat(dx[0]) || 0;
        dy = +dy || 0;
        if (this._.bbox) {
            this._.bbox.x += dx;
            this._.bbox.y += dy;
        }
        this.transform(this._.transform.concat([["t", dx, dy]]));
        return this;
    };
    elproto.scale = function (sx, sy, cx, cy) {
        if (this.removed) {
            return this;
        }
        sx = Str(sx).split(separator);
        if (sx.length - 1) {
            sy = toFloat(sx[1]);
            cx = toFloat(sx[2]);
            cy = toFloat(sx[3]);
            isNaN(cx) && (cx = null);
            isNaN(cy) && (cy = null);
        }
        sx = toFloat(sx[0]);
        (sy == null) && (sy = sx);
        (cy == null) && (cx = cy);
        if (cx == null || cy == null) {
            var bbox = this.getBBox(1);
        }
        cx = cx == null ? bbox.x + bbox.width / 2 : cx;
        cy = cy == null ? bbox.y + bbox.height / 2 : cy;
    
        this.transform(this._.transform.concat([["s", sx, sy, cx, cy]]));
        this._.dirtyT = 1;
        return this;
    };
    elproto.hide = function () {
        !this.removed && (this.node.style.display = "none");
        return this;
    };
    elproto.show = function () {
        !this.removed && (this.node.style.display = E);
        return this;
    };
    // Needed to fix the vml setViewBox issues
    elproto.auxGetBBox = R.el.getBBox;
    elproto.getBBox = function(){
      var b = this.auxGetBBox();
      if (this.paper && this.paper._viewBoxShift)
      {
        var c = {};
        var z = 1/this.paper._viewBoxShift.scale;
        c.x = b.x - this.paper._viewBoxShift.dx;
        c.x *= z;
        c.y = b.y - this.paper._viewBoxShift.dy;
        c.y *= z;
        c.width  = b.width  * z;
        c.height = b.height * z;
        c.x2 = c.x + c.width;
        c.y2 = c.y + c.height;
        return c;
      }
      return b;
    };
    elproto._getBBox = function () {
        if (this.removed) {
            return {};
        }
        return {
            x: this.X + (this.bbx || 0) - this.W / 2,
            y: this.Y - this.H,
            width: this.W,
            height: this.H
        };
    };
    elproto.remove = function () {
        if (this.removed || !this.node.parentNode) {
            return;
        }
        this.paper.__set__ && this.paper.__set__.exclude(this);
        R.eve.unbind("raphael.*.*." + this.id);
        R._tear(this, this.paper);
        this.node.parentNode.removeChild(this.node);
        this.shape && this.shape.parentNode.removeChild(this.shape);
        for (var i in this) {
            this[i] = typeof this[i] == "function" ? R._removedFactory(i) : null;
        }
        this.removed = true;
    };
    elproto.attr = function (name, value) {
        if (this.removed) {
            return this;
        }
        if (name == null) {
            var res = {};
            for (var a in this.attrs) if (this.attrs[has](a)) {
                res[a] = this.attrs[a];
            }
            res.gradient && res.fill == "none" && (res.fill = res.gradient) && delete res.gradient;
            res.transform = this._.transform;
            return res;
        }
        if (value == null && R.is(name, "string")) {
            if (name == fillString && this.attrs.fill == "none" && this.attrs.gradient) {
                return this.attrs.gradient;
            }
            var names = name.split(separator),
                out = {};
            for (var i = 0, ii = names.length; i < ii; i++) {
                name = names[i];
                if (name in this.attrs) {
                    out[name] = this.attrs[name];
                } else if (R.is(this.paper.customAttributes[name], "function")) {
                    out[name] = this.paper.customAttributes[name].def;
                } else {
                    out[name] = R._availableAttrs[name];
                }
            }
            return ii - 1 ? out : out[names[0]];
        }
        if (this.attrs && value == null && R.is(name, "array")) {
            out = {};
            for (i = 0, ii = name.length; i < ii; i++) {
                out[name[i]] = this.attr(name[i]);
            }
            return out;
        }
        var params;
        if (value != null) {
            params = {};
            params[name] = value;
        }
        value == null && R.is(name, "object") && (params = name);
        for (var key in params) {
            eve("raphael.attr." + key + "." + this.id, this, params[key]);
        }
        if (params) {
            for (key in this.paper.customAttributes) if (this.paper.customAttributes[has](key) && params[has](key) && R.is(this.paper.customAttributes[key], "function")) {
                var par = this.paper.customAttributes[key].apply(this, [].concat(params[key]));
                this.attrs[key] = params[key];
                for (var subkey in par) if (par[has](subkey)) {
                    params[subkey] = par[subkey];
                }
            }
            // this.paper.canvas.style.display = "none";
            if (params.text && this.type == "text") {
                this.textpath.string = params.text;
            }
            setFillAndStroke(this, params);
            // this.paper.canvas.style.display = E;
        }
        return this;
    };
    elproto.toFront = function () {
        !this.removed && this.node.parentNode.appendChild(this.node);
        this.paper && this.paper.top != this && R._tofront(this, this.paper);
        return this;
    };
    elproto.toBack = function () {
        if (this.removed) {
            return this;
        }
        if (this.node.parentNode.firstChild != this.node) {
            this.node.parentNode.insertBefore(this.node, this.node.parentNode.firstChild);
            R._toback(this, this.paper);
        }
        return this;
    };
    elproto.insertAfter = function (element) {
        if (this.removed) {
            return this;
        }
        if (element.constructor == R.st.constructor) {
            element = element[element.length - 1];
        }
        if (element.node.nextSibling) {
            element.node.parentNode.insertBefore(this.node, element.node.nextSibling);
        } else {
            element.node.parentNode.appendChild(this.node);
        }
        R._insertafter(this, element, this.paper);
        return this;
    };
    elproto.insertBefore = function (element) {
        if (this.removed) {
            return this;
        }
        if (element.constructor == R.st.constructor) {
            element = element[0];
        }
        element.node.parentNode.insertBefore(this.node, element.node);
        R._insertbefore(this, element, this.paper);
        return this;
    };
    elproto.blur = function (size) {
        var s = this.node.runtimeStyle,
            f = s.filter;
        f = f.replace(blurregexp, E);
        if (+size !== 0) {
            this.attrs.blur = size;
            s.filter = f + S + ms + ".Blur(pixelradius=" + (+size || 1.5) + ")";
            s.margin = R.format("-{0}px 0 0 -{0}px", round(+size || 1.5));
        } else {
            s.filter = f;
            s.margin = 0;
            delete this.attrs.blur;
        }
        return this;
    };

    R._engine.path = function (pathString, vml) {
        var el = createNode("shape");
        el.style.cssText = cssDot;
        el.coordsize = zoom + S + zoom;
        el.coordorigin = vml.coordorigin;
        var p = new Element(el, vml),
            attr = {fill: "none", stroke: "#000"};
        pathString && (attr.path = pathString);
        p.type = "path";
        p.path = [];
        p.Path = E;
        setFillAndStroke(p, attr);
        vml.canvas.appendChild(el);
        var skew = createNode("skew");
        skew.on = true;
        el.appendChild(skew);
        p.skew = skew;
        p.transform(E);
        return p;
    };
    R._engine.rect = function (vml, x, y, w, h, r) {
        var path = R._rectPath(x, y, w, h, r),
            res = vml.path(path),
            a = res.attrs;
        res.X = a.x = x;
        res.Y = a.y = y;
        res.W = a.width = w;
        res.H = a.height = h;
        a.r = r;
        a.path = path;
        res.type = "rect";
        return res;
    };
    R._engine.ellipse = function (vml, x, y, rx, ry) {
        var res = vml.path(),
            a = res.attrs;
        res.X = x - rx;
        res.Y = y - ry;
        res.W = rx * 2;
        res.H = ry * 2;
        res.type = "ellipse";
        setFillAndStroke(res, {
            cx: x,
            cy: y,
            rx: rx,
            ry: ry
        });
        return res;
    };
    R._engine.circle = function (vml, x, y, r) {
        var res = vml.path(),
            a = res.attrs;
        res.X = x - r;
        res.Y = y - r;
        res.W = res.H = r * 2;
        res.type = "circle";
        setFillAndStroke(res, {
            cx: x,
            cy: y,
            r: r
        });
        return res;
    };
    R._engine.image = function (vml, src, x, y, w, h) {
        var path = R._rectPath(x, y, w, h),
            res = vml.path(path).attr({stroke: "none"}),
            a = res.attrs,
            node = res.node,
            fill = node.getElementsByTagName(fillString)[0];
        a.src = src;
        res.X = a.x = x;
        res.Y = a.y = y;
        res.W = a.width = w;
        res.H = a.height = h;
        a.path = path;
        res.type = "image";
        fill.parentNode == node && node.removeChild(fill);
        fill.rotate = true;
        fill.src = src;
        fill.type = "tile";
        res._.fillpos = [x, y];
        res._.fillsize = [w, h];
        node.appendChild(fill);
        setCoords(res, 1, 1, 0, 0, 0);
        return res;
    };
    R._engine.text = function (vml, x, y, text) {
        var el = createNode("shape"),
            path = createNode("path"),
            o = createNode("textpath");
        x = x || 0;
        y = y || 0;
        text = text || "";
        path.v = R.format("m{0},{1}l{2},{1}", round(x * zoom), round(y * zoom), round(x * zoom) + 1);
        path.textpathok = true;
        o.string = Str(text);
        o.on = true;
        el.style.cssText = cssDot;
        el.coordsize = zoom + S + zoom;
        el.coordorigin = "0 0";
        var p = new Element(el, vml),
            attr = {
                fill: "#000",
                stroke: "none",
                font: R._availableAttrs.font,
                text: text
            };
        p.shape = el;
        p.path = path;
        p.textpath = o;
        p.type = "text";
        p.attrs.text = Str(text);
        p.attrs.x = x;
        p.attrs.y = y;
        p.attrs.w = 1;
        p.attrs.h = 1;
        setFillAndStroke(p, attr);
        el.appendChild(o);
        el.appendChild(path);
        vml.canvas.appendChild(el);
        var skew = createNode("skew");
        skew.on = true;
        el.appendChild(skew);
        p.skew = skew;
        p.transform(E);
        return p;
    };
    R._engine.setSize = function (width, height) {
        var cs = this.canvas.style;
        this.width = width;
        this.height = height;
        width == +width && (width += "px");
        height == +height && (height += "px");
        cs.width = width;
        cs.height = height;
        cs.clip = "rect(0 " + width + " " + height + " 0)";
        if (this._viewBox) {
            R._engine.setViewBox.apply(this, this._viewBox);
        }
        return this;
    };
    R._engine.setViewBox = function (x, y, w, h, fit) {
        R.eve("raphael.setViewBox", this, this._viewBox, [x, y, w, h, fit]);
        var paperSize = this.getSize(),
            width = paperSize.width,
            height = paperSize.height,
            H, W;
        if (fit) {
            H = height / h;
            W = width / w;
            if (w * H < width) {
                x -= (width - w * H) / 2 / H;
            }
            if (h * W < height) {
                y -= (height - h * W) / 2 / W;
            }
        }
        this._viewBox = [x, y, w, h, !!fit];
        this._viewBoxShift = {
            dx: -x,
            dy: -y,
            scale: paperSize
        };
        this.forEach(function (el) {
            el.transform("...");
        });
        return this;
    };
    var createNode;
    R._engine.initWin = function (win) {
            var doc = win.document;
            if (doc.styleSheets.length < 31) {
                doc.createStyleSheet().addRule(".rvml", "behavior:url(#default#VML)");
            } else {
                // no more room, add to the existing one
                // http://msdn.microsoft.com/en-us/library/ms531194%28VS.85%29.aspx
                doc.styleSheets[0].addRule(".rvml", "behavior:url(#default#VML)");
            }
            try {
                !doc.namespaces.rvml && doc.namespaces.add("rvml", "urn:schemas-microsoft-com:vml");
                createNode = function (tagName) {
                    return doc.createElement('<rvml:' + tagName + ' class="rvml">');
                };
            } catch (e) {
                createNode = function (tagName) {
                    return doc.createElement('<' + tagName + ' xmlns="urn:schemas-microsoft.com:vml" class="rvml">');
                };
            }
        };
    R._engine.initWin(R._g.win);
    R._engine.create = function () {
        var con = R._getContainer.apply(0, arguments),
            container = con.container,
            height = con.height,
            s,
            width = con.width,
            x = con.x,
            y = con.y;
        if (!container) {
            throw new Error("VML container not found.");
        }
        var res = new R._Paper,
            c = res.canvas = R._g.doc.createElement("div"),
            cs = c.style;
        x = x || 0;
        y = y || 0;
        width = width || 512;
        height = height || 342;
        res.width = width;
        res.height = height;
        width == +width && (width += "px");
        height == +height && (height += "px");
        res.coordsize = zoom * 1e3 + S + zoom * 1e3;
        res.coordorigin = "0 0";
        res.span = R._g.doc.createElement("span");
        res.span.style.cssText = "position:absolute;left:-9999em;top:-9999em;padding:0;margin:0;line-height:1;";
        c.appendChild(res.span);
        cs.cssText = R.format("top:0;left:0;width:{0};height:{1};display:inline-block;position:relative;clip:rect(0 {0} {1} 0);overflow:hidden", width, height);
        if (container == 1) {
            R._g.doc.body.appendChild(c);
            cs.left = x + "px";
            cs.top = y + "px";
            cs.position = "absolute";
        } else {
            if (container.firstChild) {
                container.insertBefore(c, container.firstChild);
            } else {
                container.appendChild(c);
            }
        }
        res.renderfix = function () {};
        return res;
    };
    R.prototype.clear = function () {
        R.eve("raphael.clear", this);
        this.canvas.innerHTML = E;
        this.span = R._g.doc.createElement("span");
        this.span.style.cssText = "position:absolute;left:-9999em;top:-9999em;padding:0;margin:0;line-height:1;display:inline;";
        this.canvas.appendChild(this.span);
        this.bottom = this.top = null;
    };
    R.prototype.remove = function () {
        R.eve("raphael.remove", this);
        this.canvas.parentNode.removeChild(this.canvas);
        for (var i in this) {
            this[i] = typeof this[i] == "function" ? R._removedFactory(i) : null;
        }
        return true;
    };

    var setproto = R.st;
    for (var method in elproto) if (elproto[has](method) && !setproto[has](method)) {
        setproto[method] = (function (methodname) {
            return function () {
                var arg = arguments;
                return this.forEach(function (el) {
                    el[methodname].apply(el, arg);
                });
            };
        })(method);
    }
})();

    // EXPOSE
    // SVG and VML are appended just before the EXPOSE line
    // Even with AMD, Raphael should be defined globally
    oldRaphael.was ? (g.win.Raphael = R) : (Raphael = R);

    if(typeof exports == "object"){
        module.exports = R;
    }
    return R;
}));
;/*! @license Firebase v2.3.1
    License: https://www.firebase.com/terms/terms-of-service.html */
(function(ns) {
  ns.wrapper = function(goog, fb) {
    // Prevents closure from trying (and failing) to retrieve a deps.js file.
    var CLOSURE_NO_DEPS = true;

    // Sets CLIENT_VERSION manually, since we can't use a closure --define with WHITESPACE_ONLY compilation.
    var CLIENT_VERSION = '2.3.1';
    var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.global.CLOSURE_UNCOMPILED_DEFINES;
goog.global.CLOSURE_DEFINES;
goog.isDef = function(val) {
  return val !== void 0;
};
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if (!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0]);
  }
  for (var part;parts.length && (part = parts.shift());) {
    if (!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object;
    } else {
      if (cur[part]) {
        cur = cur[part];
      } else {
        cur = cur[part] = {};
      }
    }
  }
};
goog.define = function(name, defaultValue) {
  var value = defaultValue;
  if (!COMPILED) {
    if (goog.global.CLOSURE_UNCOMPILED_DEFINES && Object.prototype.hasOwnProperty.call(goog.global.CLOSURE_UNCOMPILED_DEFINES, name)) {
      value = goog.global.CLOSURE_UNCOMPILED_DEFINES[name];
    } else {
      if (goog.global.CLOSURE_DEFINES && Object.prototype.hasOwnProperty.call(goog.global.CLOSURE_DEFINES, name)) {
        value = goog.global.CLOSURE_DEFINES[name];
      }
    }
  }
  goog.exportPath_(name, value);
};
goog.define("goog.DEBUG", true);
goog.define("goog.LOCALE", "en");
goog.define("goog.TRUSTED_SITE", true);
goog.define("goog.STRICT_MODE_COMPATIBLE", false);
goog.define("goog.DISALLOW_TEST_ONLY_CODE", COMPILED && !goog.DEBUG);
goog.provide = function(name) {
  if (!COMPILED) {
    if (goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
  }
  goog.constructNamespace_(name);
};
goog.constructNamespace_ = function(name, opt_obj) {
  if (!COMPILED) {
    delete goog.implicitNamespaces_[name];
    var namespace = name;
    while (namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      if (goog.getObjectByName(namespace)) {
        break;
      }
      goog.implicitNamespaces_[namespace] = true;
    }
  }
  goog.exportPath_(name, opt_obj);
};
goog.VALID_MODULE_RE_ = /^[a-zA-Z_$][a-zA-Z0-9._$]*$/;
goog.module = function(name) {
  if (!goog.isString(name) || !name || name.search(goog.VALID_MODULE_RE_) == -1) {
    throw Error("Invalid module identifier");
  }
  if (!goog.isInModuleLoader_()) {
    throw Error("Module " + name + " has been loaded incorrectly.");
  }
  if (goog.moduleLoaderState_.moduleName) {
    throw Error("goog.module may only be called once per module.");
  }
  goog.moduleLoaderState_.moduleName = name;
  if (!COMPILED) {
    if (goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
  }
};
goog.module.get = function(name) {
  return goog.module.getInternal_(name);
};
goog.module.getInternal_ = function(name) {
  if (!COMPILED) {
    if (goog.isProvided_(name)) {
      return name in goog.loadedModules_ ? goog.loadedModules_[name] : goog.getObjectByName(name);
    } else {
      return null;
    }
  }
};
goog.moduleLoaderState_ = null;
goog.isInModuleLoader_ = function() {
  return goog.moduleLoaderState_ != null;
};
goog.module.declareTestMethods = function() {
  if (!goog.isInModuleLoader_()) {
    throw new Error("goog.module.declareTestMethods must be called from " + "within a goog.module");
  }
  goog.moduleLoaderState_.declareTestMethods = true;
};
goog.module.declareLegacyNamespace = function() {
  if (!COMPILED && !goog.isInModuleLoader_()) {
    throw new Error("goog.module.declareLegacyNamespace must be called from " + "within a goog.module");
  }
  if (!COMPILED && !goog.moduleLoaderState_.moduleName) {
    throw Error("goog.module must be called prior to " + "goog.module.declareLegacyNamespace.");
  }
  goog.moduleLoaderState_.declareLegacyNamespace = true;
};
goog.setTestOnly = function(opt_message) {
  if (goog.DISALLOW_TEST_ONLY_CODE) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + (opt_message ? ": " + opt_message : "."));
  }
};
goog.forwardDeclare = function(name) {
};
if (!COMPILED) {
  goog.isProvided_ = function(name) {
    return name in goog.loadedModules_ || !goog.implicitNamespaces_[name] && goog.isDefAndNotNull(goog.getObjectByName(name));
  };
  goog.implicitNamespaces_ = {"goog.module":true};
}
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for (var part;part = parts.shift();) {
    if (goog.isDefAndNotNull(cur[part])) {
      cur = cur[part];
    } else {
      return null;
    }
  }
  return cur;
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for (var x in obj) {
    global[x] = obj[x];
  }
};
goog.addDependency = function(relPath, provides, requires, opt_isModule) {
  if (goog.DEPENDENCIES_ENABLED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for (var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      deps.pathIsModule[path] = !!opt_isModule;
    }
    for (var j = 0;require = requires[j];j++) {
      if (!(path in deps.requires)) {
        deps.requires[path] = {};
      }
      deps.requires[path][require] = true;
    }
  }
};
goog.define("goog.ENABLE_DEBUG_LOADER", true);
goog.logToConsole_ = function(msg) {
  if (goog.global.console) {
    goog.global.console["error"](msg);
  }
};
goog.require = function(name) {
  if (!COMPILED) {
    if (goog.ENABLE_DEBUG_LOADER && goog.IS_OLD_IE_) {
      goog.maybeProcessDeferredDep_(name);
    }
    if (goog.isProvided_(name)) {
      if (goog.isInModuleLoader_()) {
        return goog.module.getInternal_(name);
      } else {
        return null;
      }
    }
    if (goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if (path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return null;
      }
    }
    var errorMessage = "goog.require could not find: " + name;
    goog.logToConsole_(errorMessage);
    throw Error(errorMessage);
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(opt_returnValue, var_args) {
  return opt_returnValue;
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    if (ctor.instance_) {
      return ctor.instance_;
    }
    if (goog.DEBUG) {
      goog.instantiatedSingletons_[goog.instantiatedSingletons_.length] = ctor;
    }
    return ctor.instance_ = new ctor;
  };
};
goog.instantiatedSingletons_ = [];
goog.define("goog.LOAD_MODULE_USING_EVAL", true);
goog.define("goog.SEAL_MODULE_EXPORTS", goog.DEBUG);
goog.loadedModules_ = {};
goog.DEPENDENCIES_ENABLED = !COMPILED && goog.ENABLE_DEBUG_LOADER;
if (goog.DEPENDENCIES_ENABLED) {
  goog.included_ = {};
  goog.dependencies_ = {pathIsModule:{}, nameToPath:{}, requires:{}, visited:{}, written:{}, deferred:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc;
  };
  goog.findBasePath_ = function() {
    if (goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return;
    } else {
      if (!goog.inHtmlDocument_()) {
        return;
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for (var i = scripts.length - 1;i >= 0;--i) {
      var script = (scripts[i]);
      var src = script.src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if (src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return;
      }
    }
  };
  goog.importScript_ = function(src, opt_sourceText) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if (importScript(src, opt_sourceText)) {
      goog.dependencies_.written[src] = true;
    }
  };
  goog.IS_OLD_IE_ = !goog.global.atob && goog.global.document && goog.global.document.all;
  goog.importModule_ = function(src) {
    var bootstrap = 'goog.retrieveAndExecModule_("' + src + '");';
    if (goog.importScript_("", bootstrap)) {
      goog.dependencies_.written[src] = true;
    }
  };
  goog.queuedModules_ = [];
  goog.wrapModule_ = function(srcUrl, scriptText) {
    if (!goog.LOAD_MODULE_USING_EVAL || !goog.isDef(goog.global.JSON)) {
      return "" + "goog.loadModule(function(exports) {" + '"use strict";' + scriptText + "\n" + ";return exports" + "});" + "\n//# sourceURL=" + srcUrl + "\n";
    } else {
      return "" + "goog.loadModule(" + goog.global.JSON.stringify(scriptText + "\n//# sourceURL=" + srcUrl + "\n") + ");";
    }
  };
  goog.loadQueuedModules_ = function() {
    var count = goog.queuedModules_.length;
    if (count > 0) {
      var queue = goog.queuedModules_;
      goog.queuedModules_ = [];
      for (var i = 0;i < count;i++) {
        var path = queue[i];
        goog.maybeProcessDeferredPath_(path);
      }
    }
  };
  goog.maybeProcessDeferredDep_ = function(name) {
    if (goog.isDeferredModule_(name) && goog.allDepsAreAvailable_(name)) {
      var path = goog.getPathFromDeps_(name);
      goog.maybeProcessDeferredPath_(goog.basePath + path);
    }
  };
  goog.isDeferredModule_ = function(name) {
    var path = goog.getPathFromDeps_(name);
    if (path && goog.dependencies_.pathIsModule[path]) {
      var abspath = goog.basePath + path;
      return abspath in goog.dependencies_.deferred;
    }
    return false;
  };
  goog.allDepsAreAvailable_ = function(name) {
    var path = goog.getPathFromDeps_(name);
    if (path && path in goog.dependencies_.requires) {
      for (var requireName in goog.dependencies_.requires[path]) {
        if (!goog.isProvided_(requireName) && !goog.isDeferredModule_(requireName)) {
          return false;
        }
      }
    }
    return true;
  };
  goog.maybeProcessDeferredPath_ = function(abspath) {
    if (abspath in goog.dependencies_.deferred) {
      var src = goog.dependencies_.deferred[abspath];
      delete goog.dependencies_.deferred[abspath];
      goog.globalEval(src);
    }
  };
  goog.loadModule = function(moduleDef) {
    var previousState = goog.moduleLoaderState_;
    try {
      goog.moduleLoaderState_ = {moduleName:undefined, declareTestMethods:false};
      var exports;
      if (goog.isFunction(moduleDef)) {
        exports = moduleDef.call(goog.global, {});
      } else {
        if (goog.isString(moduleDef)) {
          exports = goog.loadModuleFromSource_.call(goog.global, moduleDef);
        } else {
          throw Error("Invalid module definition");
        }
      }
      var moduleName = goog.moduleLoaderState_.moduleName;
      if (!goog.isString(moduleName) || !moduleName) {
        throw Error('Invalid module name "' + moduleName + '"');
      }
      if (goog.moduleLoaderState_.declareLegacyNamespace) {
        goog.constructNamespace_(moduleName, exports);
      } else {
        if (goog.SEAL_MODULE_EXPORTS && Object.seal) {
          Object.seal(exports);
        }
      }
      goog.loadedModules_[moduleName] = exports;
      if (goog.moduleLoaderState_.declareTestMethods) {
        for (var entry in exports) {
          if (entry.indexOf("test", 0) === 0 || entry == "tearDown" || entry == "setUp" || entry == "setUpPage" || entry == "tearDownPage") {
            goog.global[entry] = exports[entry];
          }
        }
      }
    } finally {
      goog.moduleLoaderState_ = previousState;
    }
  };
  goog.loadModuleFromSource_ = function(source) {
    var exports = {};
    eval(arguments[0]);
    return exports;
  };
  goog.writeScriptTag_ = function(src, opt_sourceText) {
    if (goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      if (doc.readyState == "complete") {
        var isDeps = /\bdeps.js$/.test(src);
        if (isDeps) {
          return false;
        } else {
          throw Error('Cannot write "' + src + '" after document load');
        }
      }
      var isOldIE = goog.IS_OLD_IE_;
      if (opt_sourceText === undefined) {
        if (!isOldIE) {
          doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
        } else {
          var state = " onreadystatechange='goog.onScriptLoad_(this, " + ++goog.lastNonModuleScriptIndex_ + ")' ";
          doc.write('<script type="text/javascript" src="' + src + '"' + state + "></" + "script>");
        }
      } else {
        doc.write('<script type="text/javascript">' + opt_sourceText + "</" + "script>");
      }
      return true;
    } else {
      return false;
    }
  };
  goog.lastNonModuleScriptIndex_ = 0;
  goog.onScriptLoad_ = function(script, scriptIndex) {
    if (script.readyState == "complete" && goog.lastNonModuleScriptIndex_ == scriptIndex) {
      goog.loadQueuedModules_();
    }
    return true;
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if (path in deps.written) {
        return;
      }
      if (path in deps.visited) {
        if (!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path);
        }
        return;
      }
      deps.visited[path] = true;
      if (path in deps.requires) {
        for (var requireName in deps.requires[path]) {
          if (!goog.isProvided_(requireName)) {
            if (requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName]);
            } else {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if (!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path);
      }
    }
    for (var path in goog.included_) {
      if (!deps.written[path]) {
        visitNode(path);
      }
    }
    for (var i = 0;i < scripts.length;i++) {
      var path = scripts[i];
      goog.dependencies_.written[path] = true;
    }
    var moduleState = goog.moduleLoaderState_;
    goog.moduleLoaderState_ = null;
    var loadingModule = false;
    for (var i = 0;i < scripts.length;i++) {
      var path = scripts[i];
      if (path) {
        if (!deps.pathIsModule[path]) {
          goog.importScript_(goog.basePath + path);
        } else {
          loadingModule = true;
          goog.importModule_(goog.basePath + path);
        }
      } else {
        goog.moduleLoaderState_ = moduleState;
        throw Error("Undefined script input");
      }
    }
    goog.moduleLoaderState_ = moduleState;
  };
  goog.getPathFromDeps_ = function(rule) {
    if (rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule];
    } else {
      return null;
    }
  };
  goog.findBasePath_();
  if (!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js");
  }
}
goog.normalizePath_ = function(path) {
  var components = path.split("/");
  var i = 0;
  while (i < components.length) {
    if (components[i] == ".") {
      components.splice(i, 1);
    } else {
      if (i && components[i] == ".." && components[i - 1] && components[i - 1] != "..") {
        components.splice(--i, 2);
      } else {
        i++;
      }
    }
  }
  return components.join("/");
};
goog.retrieveAndExecModule_ = function(src) {
  if (!COMPILED) {
    var originalPath = src;
    src = goog.normalizePath_(src);
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    var scriptText = null;
    var xhr = new goog.global["XMLHttpRequest"];
    xhr.onload = function() {
      scriptText = this.responseText;
    };
    xhr.open("get", src, false);
    xhr.send();
    scriptText = xhr.responseText;
    if (scriptText != null) {
      var execModuleScript = goog.wrapModule_(src, scriptText);
      var isOldIE = goog.IS_OLD_IE_;
      if (isOldIE) {
        goog.dependencies_.deferred[originalPath] = execModuleScript;
        goog.queuedModules_.push(originalPath);
      } else {
        importScript(src, execModuleScript);
      }
    } else {
      throw new Error("load of " + src + "failed");
    }
  }
};
goog.typeOf = function(value) {
  var s = typeof value;
  if (s == "object") {
    if (value) {
      if (value instanceof Array) {
        return "array";
      } else {
        if (value instanceof Object) {
          return s;
        }
      }
      var className = Object.prototype.toString.call((value));
      if (className == "[object Window]") {
        return "object";
      }
      if (className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return "array";
      }
      if (className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return "function";
      }
    } else {
      return "null";
    }
  } else {
    if (s == "function" && typeof value.call == "undefined") {
      return "object";
    }
  }
  return s;
};
goog.isNull = function(val) {
  return val === null;
};
goog.isDefAndNotNull = function(val) {
  return val != null;
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array";
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number";
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function";
};
goog.isString = function(val) {
  return typeof val == "string";
};
goog.isBoolean = function(val) {
  return typeof val == "boolean";
};
goog.isNumber = function(val) {
  return typeof val == "number";
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function";
};
goog.isObject = function(val) {
  var type = typeof val;
  return type == "object" && val != null || type == "function";
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_);
};
goog.hasUid = function(obj) {
  return!!obj[goog.UID_PROPERTY_];
};
goog.removeUid = function(obj) {
  if ("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_);
  }
  try {
    delete obj[goog.UID_PROPERTY_];
  } catch (ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + (Math.random() * 1E9 >>> 0);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if (type == "object" || type == "array") {
    if (obj.clone) {
      return obj.clone();
    }
    var clone = type == "array" ? [] : {};
    for (var key in obj) {
      clone[key] = goog.cloneObject(obj[key]);
    }
    return clone;
  }
  return obj;
};
goog.bindNative_ = function(fn, selfObj, var_args) {
  return(fn.call.apply(fn.bind, arguments));
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if (!fn) {
    throw new Error;
  }
  if (arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs);
    };
  } else {
    return function() {
      return fn.apply(selfObj, arguments);
    };
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if (Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_;
  } else {
    goog.bind = goog.bindJs_;
  }
  return goog.bind.apply(null, arguments);
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = args.slice();
    newArgs.push.apply(newArgs, arguments);
    return fn.apply(this, newArgs);
  };
};
goog.mixin = function(target, source) {
  for (var x in source) {
    target[x] = source[x];
  }
};
goog.now = goog.TRUSTED_SITE && Date.now || function() {
  return+new Date;
};
goog.globalEval = function(script) {
  if (goog.global.execScript) {
    goog.global.execScript(script, "JavaScript");
  } else {
    if (goog.global.eval) {
      if (goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if (typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true;
        } else {
          goog.evalWorksForGlobals_ = false;
        }
      }
      if (goog.evalWorksForGlobals_) {
        goog.global.eval(script);
      } else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt);
      }
    } else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName;
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for (var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]));
    }
    return mapped.join("-");
  };
  var rename;
  if (goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts;
  } else {
    rename = function(a) {
      return a;
    };
  }
  if (opt_modifier) {
    return className + "-" + rename(opt_modifier);
  } else {
    return rename(className);
  }
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style;
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if (!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING;
}
goog.getMsg = function(str, opt_values) {
  if (opt_values) {
    str = str.replace(/\{\$([^}]+)}/g, function(match, key) {
      return key in opt_values ? opt_values[key] : match;
    });
  }
  return str;
};
goog.getMsgWithFallback = function(a, b) {
  return a;
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo);
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol;
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor;
  childCtor.base = function(me, methodName, var_args) {
    var args = new Array(arguments.length - 2);
    for (var i = 2;i < arguments.length;i++) {
      args[i - 2] = arguments[i];
    }
    return parentCtor.prototype[methodName].apply(me, args);
  };
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if (goog.STRICT_MODE_COMPATIBLE || goog.DEBUG && !caller) {
    throw Error("arguments.caller not defined.  goog.base() cannot be used " + "with strict mode code. See " + "http://www.ecma-international.org/ecma-262/5.1/#sec-C");
  }
  if (caller.superClass_) {
    var ctorArgs = new Array(arguments.length - 1);
    for (var i = 1;i < arguments.length;i++) {
      ctorArgs[i - 1] = arguments[i];
    }
    return caller.superClass_.constructor.apply(me, ctorArgs);
  }
  var args = new Array(arguments.length - 2);
  for (var i = 2;i < arguments.length;i++) {
    args[i - 2] = arguments[i];
  }
  var foundCaller = false;
  for (var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if (ctor.prototype[opt_methodName] === caller) {
      foundCaller = true;
    } else {
      if (foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args);
      }
    }
  }
  if (me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args);
  } else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global);
};
if (!COMPILED) {
  goog.global["COMPILED"] = COMPILED;
}
goog.defineClass = function(superClass, def) {
  var constructor = def.constructor;
  var statics = def.statics;
  if (!constructor || constructor == Object.prototype.constructor) {
    constructor = function() {
      throw Error("cannot instantiate an interface (no constructor defined).");
    };
  }
  var cls = goog.defineClass.createSealingConstructor_(constructor, superClass);
  if (superClass) {
    goog.inherits(cls, superClass);
  }
  delete def.constructor;
  delete def.statics;
  goog.defineClass.applyProperties_(cls.prototype, def);
  if (statics != null) {
    if (statics instanceof Function) {
      statics(cls);
    } else {
      goog.defineClass.applyProperties_(cls, statics);
    }
  }
  return cls;
};
goog.defineClass.ClassDescriptor;
goog.define("goog.defineClass.SEAL_CLASS_INSTANCES", goog.DEBUG);
goog.defineClass.createSealingConstructor_ = function(ctr, superClass) {
  if (goog.defineClass.SEAL_CLASS_INSTANCES && Object.seal instanceof Function) {
    if (superClass && superClass.prototype && superClass.prototype[goog.UNSEALABLE_CONSTRUCTOR_PROPERTY_]) {
      return ctr;
    }
    var wrappedCtr = function() {
      var instance = ctr.apply(this, arguments) || this;
      instance[goog.UID_PROPERTY_] = instance[goog.UID_PROPERTY_];
      if (this.constructor === wrappedCtr) {
        Object.seal(instance);
      }
      return instance;
    };
    return wrappedCtr;
  }
  return ctr;
};
goog.defineClass.OBJECT_PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.defineClass.applyProperties_ = function(target, source) {
  var key;
  for (key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      target[key] = source[key];
    }
  }
  for (var i = 0;i < goog.defineClass.OBJECT_PROTOTYPE_FIELDS_.length;i++) {
    key = goog.defineClass.OBJECT_PROTOTYPE_FIELDS_[i];
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      target[key] = source[key];
    }
  }
};
goog.tagUnsealableClass = function(ctr) {
  if (!COMPILED && goog.defineClass.SEAL_CLASS_INSTANCES) {
    ctr.prototype[goog.UNSEALABLE_CONSTRUCTOR_PROPERTY_] = true;
  }
};
goog.UNSEALABLE_CONSTRUCTOR_PROPERTY_ = "goog_defineClass_legacy_unsealable";
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, goog.debug.Error);
  } else {
    var stack = (new Error).stack;
    if (stack) {
      this.stack = stack;
    }
  }
  if (opt_msg) {
    this.message = String(opt_msg);
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for (var key in obj) {
    f.call(opt_obj, obj[key], key, obj);
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for (var key in obj) {
    if (f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key];
    }
  }
  return res;
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for (var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj);
  }
  return res;
};
goog.object.some = function(obj, f, opt_obj) {
  for (var key in obj) {
    if (f.call(opt_obj, obj[key], key, obj)) {
      return true;
    }
  }
  return false;
};
goog.object.every = function(obj, f, opt_obj) {
  for (var key in obj) {
    if (!f.call(opt_obj, obj[key], key, obj)) {
      return false;
    }
  }
  return true;
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for (var key in obj) {
    rv++;
  }
  return rv;
};
goog.object.getAnyKey = function(obj) {
  for (var key in obj) {
    return key;
  }
};
goog.object.getAnyValue = function(obj) {
  for (var key in obj) {
    return obj[key];
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val);
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for (var key in obj) {
    res[i++] = obj[key];
  }
  return res;
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for (var key in obj) {
    res[i++] = key;
  }
  return res;
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for (var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if (!goog.isDef(obj)) {
      break;
    }
  }
  return obj;
};
goog.object.containsKey = function(obj, key) {
  return key in obj;
};
goog.object.containsValue = function(obj, val) {
  for (var key in obj) {
    if (obj[key] == val) {
      return true;
    }
  }
  return false;
};
goog.object.findKey = function(obj, f, opt_this) {
  for (var key in obj) {
    if (f.call(opt_this, obj[key], key, obj)) {
      return key;
    }
  }
  return undefined;
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key];
};
goog.object.isEmpty = function(obj) {
  for (var key in obj) {
    return false;
  }
  return true;
};
goog.object.clear = function(obj) {
  for (var i in obj) {
    delete obj[i];
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if (rv = key in obj) {
    delete obj[key];
  }
  return rv;
};
goog.object.add = function(obj, key, val) {
  if (key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val);
};
goog.object.get = function(obj, key, opt_val) {
  if (key in obj) {
    return obj[key];
  }
  return opt_val;
};
goog.object.set = function(obj, key, value) {
  obj[key] = value;
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value;
};
goog.object.setWithReturnValueIfNotSet = function(obj, key, f) {
  if (key in obj) {
    return obj[key];
  }
  var val = f();
  obj[key] = val;
  return val;
};
goog.object.equals = function(a, b) {
  for (var k in a) {
    if (!(k in b) || a[k] !== b[k]) {
      return false;
    }
  }
  for (var k in b) {
    if (!(k in a)) {
      return false;
    }
  }
  return true;
};
goog.object.clone = function(obj) {
  var res = {};
  for (var key in obj) {
    res[key] = obj[key];
  }
  return res;
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if (type == "object" || type == "array") {
    if (obj.clone) {
      return obj.clone();
    }
    var clone = type == "array" ? [] : {};
    for (var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key]);
    }
    return clone;
  }
  return obj;
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for (var key in obj) {
    transposed[obj[key]] = key;
  }
  return transposed;
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for (var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for (key in source) {
      target[key] = source[key];
    }
    for (var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if (argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0]);
  }
  if (argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for (var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1];
  }
  return rv;
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if (argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0]);
  }
  var rv = {};
  for (var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true;
  }
  return rv;
};
goog.object.createImmutableView = function(obj) {
  var result = obj;
  if (Object.isFrozen && !Object.isFrozen(obj)) {
    result = Object.create(obj);
    Object.freeze(result);
  }
  return result;
};
goog.object.isImmutableView = function(obj) {
  return!!Object.isFrozen && Object.isFrozen(obj);
};
goog.provide("goog.dom.NodeType");
goog.dom.NodeType = {ELEMENT:1, ATTRIBUTE:2, TEXT:3, CDATA_SECTION:4, ENTITY_REFERENCE:5, ENTITY:6, PROCESSING_INSTRUCTION:7, COMMENT:8, DOCUMENT:9, DOCUMENT_TYPE:10, DOCUMENT_FRAGMENT:11, NOTATION:12};
goog.provide("goog.json");
goog.provide("goog.json.Replacer");
goog.provide("goog.json.Reviver");
goog.provide("goog.json.Serializer");
goog.define("goog.json.USE_NATIVE_JSON", false);
goog.json.isValid = function(s) {
  if (/^\s*$/.test(s)) {
    return false;
  }
  var backslashesRe = /\\["\\\/bfnrtu]/g;
  var simpleValuesRe = /"[^"\\\n\r\u2028\u2029\x00-\x08\x0a-\x1f]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
  var openBracketsRe = /(?:^|:|,)(?:[\s\u2028\u2029]*\[)+/g;
  var remainderRe = /^[\],:{}\s\u2028\u2029]*$/;
  return remainderRe.test(s.replace(backslashesRe, "@").replace(simpleValuesRe, "]").replace(openBracketsRe, ""));
};
goog.json.parse = goog.json.USE_NATIVE_JSON ? (goog.global["JSON"]["parse"]) : function(s) {
  var o = String(s);
  if (goog.json.isValid(o)) {
    try {
      return(eval("(" + o + ")"));
    } catch (ex) {
    }
  }
  throw Error("Invalid JSON string: " + o);
};
goog.json.unsafeParse = goog.json.USE_NATIVE_JSON ? (goog.global["JSON"]["parse"]) : function(s) {
  return(eval("(" + s + ")"));
};
goog.json.Replacer;
goog.json.Reviver;
goog.json.serialize = goog.json.USE_NATIVE_JSON ? (goog.global["JSON"]["stringify"]) : function(object, opt_replacer) {
  return(new goog.json.Serializer(opt_replacer)).serialize(object);
};
goog.json.Serializer = function(opt_replacer) {
  this.replacer_ = opt_replacer;
};
goog.json.Serializer.prototype.serialize = function(object) {
  var sb = [];
  this.serializeInternal(object, sb);
  return sb.join("");
};
goog.json.Serializer.prototype.serializeInternal = function(object, sb) {
  switch(typeof object) {
    case "string":
      this.serializeString_((object), sb);
      break;
    case "number":
      this.serializeNumber_((object), sb);
      break;
    case "boolean":
      sb.push(object);
      break;
    case "undefined":
      sb.push("null");
      break;
    case "object":
      if (object == null) {
        sb.push("null");
        break;
      }
      if (goog.isArray(object)) {
        this.serializeArray((object), sb);
        break;
      }
      this.serializeObject_((object), sb);
      break;
    case "function":
      break;
    default:
      throw Error("Unknown type: " + typeof object);;
  }
};
goog.json.Serializer.charToJsonCharCache_ = {'"':'\\"', "\\":"\\\\", "/":"\\/", "\b":"\\b", "\f":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\u000b"};
goog.json.Serializer.charsToReplace_ = /\uffff/.test("\uffff") ? /[\\\"\x00-\x1f\x7f-\uffff]/g : /[\\\"\x00-\x1f\x7f-\xff]/g;
goog.json.Serializer.prototype.serializeString_ = function(s, sb) {
  sb.push('"', s.replace(goog.json.Serializer.charsToReplace_, function(c) {
    if (c in goog.json.Serializer.charToJsonCharCache_) {
      return goog.json.Serializer.charToJsonCharCache_[c];
    }
    var cc = c.charCodeAt(0);
    var rv = "\\u";
    if (cc < 16) {
      rv += "000";
    } else {
      if (cc < 256) {
        rv += "00";
      } else {
        if (cc < 4096) {
          rv += "0";
        }
      }
    }
    return goog.json.Serializer.charToJsonCharCache_[c] = rv + cc.toString(16);
  }), '"');
};
goog.json.Serializer.prototype.serializeNumber_ = function(n, sb) {
  sb.push(isFinite(n) && !isNaN(n) ? n : "null");
};
goog.json.Serializer.prototype.serializeArray = function(arr, sb) {
  var l = arr.length;
  sb.push("[");
  var sep = "";
  for (var i = 0;i < l;i++) {
    sb.push(sep);
    var value = arr[i];
    this.serializeInternal(this.replacer_ ? this.replacer_.call(arr, String(i), value) : value, sb);
    sep = ",";
  }
  sb.push("]");
};
goog.json.Serializer.prototype.serializeObject_ = function(obj, sb) {
  sb.push("{");
  var sep = "";
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      var value = obj[key];
      if (typeof value != "function") {
        sb.push(sep);
        this.serializeString_(key, sb);
        sb.push(":");
        this.serializeInternal(this.replacer_ ? this.replacer_.call(obj, key, value) : value, sb);
        sep = ",";
      }
    }
  }
  sb.push("}");
};
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.define("goog.string.DETECT_DOUBLE_ESCAPING", false);
goog.define("goog.string.FORCE_NON_DOM_HTML_UNESCAPING", false);
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0;
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l;
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0;
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0;
};
goog.string.caseInsensitiveEquals = function(str1, str2) {
  return str1.toLowerCase() == str2.toLowerCase();
};
goog.string.subs = function(str, var_args) {
  var splitParts = str.split("%s");
  var returnString = "";
  var subsArguments = Array.prototype.slice.call(arguments, 1);
  while (subsArguments.length && splitParts.length > 1) {
    returnString += splitParts.shift() + subsArguments.shift();
  }
  return returnString + splitParts.join("%s");
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "");
};
goog.string.isEmptyOrWhitespace = function(str) {
  return/^[\s\xa0]*$/.test(str);
};
goog.string.isEmptyString = function(str) {
  return str.length == 0;
};
goog.string.isEmpty = goog.string.isEmptyOrWhitespace;
goog.string.isEmptyOrWhitespaceSafe = function(str) {
  return goog.string.isEmptyOrWhitespace(goog.string.makeSafe(str));
};
goog.string.isEmptySafe = goog.string.isEmptyOrWhitespaceSafe;
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str);
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str);
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str);
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str);
};
goog.string.isSpace = function(ch) {
  return ch == " ";
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd";
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ");
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n");
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ");
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ");
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "");
};
goog.string.trim = goog.TRUSTED_SITE && String.prototype.trim ? function(str) {
  return str.trim();
} : function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "");
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "");
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "");
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if (test1 < test2) {
    return-1;
  } else {
    if (test1 == test2) {
      return 0;
    } else {
      return 1;
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if (str1 == str2) {
    return 0;
  }
  if (!str1) {
    return-1;
  }
  if (!str2) {
    return 1;
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for (var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if (a != b) {
      var num1 = parseInt(a, 10);
      if (!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if (!isNaN(num2) && num1 - num2) {
          return num1 - num2;
        }
      }
      return a < b ? -1 : 1;
    }
  }
  if (tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length;
  }
  return str1 < str2 ? -1 : 1;
};
goog.string.urlEncode = function(str) {
  return encodeURIComponent(String(str));
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "));
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>");
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if (opt_isLikelyToContainHtmlChars) {
    str = str.replace(goog.string.AMP_RE_, "&amp;").replace(goog.string.LT_RE_, "&lt;").replace(goog.string.GT_RE_, "&gt;").replace(goog.string.QUOT_RE_, "&quot;").replace(goog.string.SINGLE_QUOTE_RE_, "&#39;").replace(goog.string.NULL_RE_, "&#0;");
    if (goog.string.DETECT_DOUBLE_ESCAPING) {
      str = str.replace(goog.string.E_RE_, "&#101;");
    }
    return str;
  } else {
    if (!goog.string.ALL_RE_.test(str)) {
      return str;
    }
    if (str.indexOf("&") != -1) {
      str = str.replace(goog.string.AMP_RE_, "&amp;");
    }
    if (str.indexOf("<") != -1) {
      str = str.replace(goog.string.LT_RE_, "&lt;");
    }
    if (str.indexOf(">") != -1) {
      str = str.replace(goog.string.GT_RE_, "&gt;");
    }
    if (str.indexOf('"') != -1) {
      str = str.replace(goog.string.QUOT_RE_, "&quot;");
    }
    if (str.indexOf("'") != -1) {
      str = str.replace(goog.string.SINGLE_QUOTE_RE_, "&#39;");
    }
    if (str.indexOf("\x00") != -1) {
      str = str.replace(goog.string.NULL_RE_, "&#0;");
    }
    if (goog.string.DETECT_DOUBLE_ESCAPING && str.indexOf("e") != -1) {
      str = str.replace(goog.string.E_RE_, "&#101;");
    }
    return str;
  }
};
goog.string.AMP_RE_ = /&/g;
goog.string.LT_RE_ = /</g;
goog.string.GT_RE_ = />/g;
goog.string.QUOT_RE_ = /"/g;
goog.string.SINGLE_QUOTE_RE_ = /'/g;
goog.string.NULL_RE_ = /\x00/g;
goog.string.E_RE_ = /e/g;
goog.string.ALL_RE_ = goog.string.DETECT_DOUBLE_ESCAPING ? /[\x00&<>"'e]/ : /[\x00&<>"']/;
goog.string.unescapeEntities = function(str) {
  if (goog.string.contains(str, "&")) {
    if (!goog.string.FORCE_NON_DOM_HTML_UNESCAPING && "document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str);
    } else {
      return goog.string.unescapePureXmlEntities_(str);
    }
  }
  return str;
};
goog.string.unescapeEntitiesWithDocument = function(str, document) {
  if (goog.string.contains(str, "&")) {
    return goog.string.unescapeEntitiesUsingDom_(str, document);
  }
  return str;
};
goog.string.unescapeEntitiesUsingDom_ = function(str, opt_document) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'};
  var div;
  if (opt_document) {
    div = opt_document.createElement("div");
  } else {
    div = goog.global.document.createElement("div");
  }
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if (value) {
      return value;
    }
    if (entity.charAt(0) == "#") {
      var n = Number("0" + entity.substr(1));
      if (!isNaN(n)) {
        value = String.fromCharCode(n);
      }
    }
    if (!value) {
      div.innerHTML = s + " ";
      value = div.firstChild.nodeValue.slice(0, -1);
    }
    return seen[s] = value;
  });
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return "&";
      case "lt":
        return "<";
      case "gt":
        return ">";
      case "quot":
        return'"';
      default:
        if (entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if (!isNaN(n)) {
            return String.fromCharCode(n);
          }
        }
        return s;
    }
  });
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml);
};
goog.string.preserveSpaces = function(str) {
  return str.replace(/(^|[\n ]) /g, "$1" + goog.string.Unicode.NBSP);
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for (var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if (str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1);
    }
  }
  return str;
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if (opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str);
  }
  if (str.length > chars) {
    str = str.substring(0, chars - 3) + "...";
  }
  if (opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str);
  }
  return str;
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if (opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str);
  }
  if (opt_trailingChars && str.length > chars) {
    if (opt_trailingChars > chars) {
      opt_trailingChars = chars;
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint);
  } else {
    if (str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos);
    }
  }
  if (opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str);
  }
  return str;
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\b":"\\b", "\f":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if (s.quote) {
    return s.quote();
  } else {
    var sb = ['"'];
    for (var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch));
    }
    sb.push('"');
    return sb.join("");
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for (var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i));
  }
  return sb.join("");
};
goog.string.escapeChar = function(c) {
  if (c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c];
  }
  if (c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c];
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if (cc > 31 && cc < 127) {
    rv = c;
  } else {
    if (cc < 256) {
      rv = "\\x";
      if (cc < 16 || cc > 256) {
        rv += "0";
      }
    } else {
      rv = "\\u";
      if (cc < 4096) {
        rv += "0";
      }
    }
    rv += cc.toString(16).toUpperCase();
  }
  return goog.string.jsEscapeCache_[c] = rv;
};
goog.string.contains = function(str, subString) {
  return str.indexOf(subString) != -1;
};
goog.string.caseInsensitiveContains = function(str, subString) {
  return goog.string.contains(str.toLowerCase(), subString.toLowerCase());
};
goog.string.countOf = function(s, ss) {
  return s && ss ? s.split(ss).length - 1 : 0;
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if (index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength);
  }
  return resultStr;
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "");
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "");
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08");
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string);
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if (index == -1) {
    index = s.length;
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s;
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj);
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "");
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36);
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for (var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if (v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break;
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2]);
    } while (order == 0);
  }
  return order;
};
goog.string.compareElements_ = function(left, right) {
  if (left < right) {
    return-1;
  } else {
    if (left > right) {
      return 1;
    }
  }
  return 0;
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for (var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_;
  }
  return result;
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return "goog_" + goog.string.uniqueStringCounter_++;
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if (num == 0 && goog.string.isEmptyOrWhitespace(str)) {
    return NaN;
  }
  return num;
};
goog.string.isLowerCamelCase = function(str) {
  return/^[a-z]+([A-Z][a-z]*)*$/.test(str);
};
goog.string.isUpperCamelCase = function(str) {
  return/^([A-Z][a-z]*)+$/.test(str);
};
goog.string.toCamelCase = function(str) {
  return String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase();
  });
};
goog.string.toSelectorCase = function(str) {
  return String(str).replace(/([A-Z])/g, "-$1").toLowerCase();
};
goog.string.toTitleCase = function(str, opt_delimiters) {
  var delimiters = goog.isString(opt_delimiters) ? goog.string.regExpEscape(opt_delimiters) : "\\s";
  delimiters = delimiters ? "|[" + delimiters + "]+" : "";
  var regexp = new RegExp("(^" + delimiters + ")([a-z])", "g");
  return str.replace(regexp, function(all, p1, p2) {
    return p1 + p2.toUpperCase();
  });
};
goog.string.capitalize = function(str) {
  return String(str.charAt(0)).toUpperCase() + String(str.substr(1)).toLowerCase();
};
goog.string.parseInt = function(value) {
  if (isFinite(value)) {
    value = String(value);
  }
  if (goog.isString(value)) {
    return/^\s*-?0x/i.test(value) ? parseInt(value, 16) : parseInt(value, 10);
  }
  return NaN;
};
goog.string.splitLimit = function(str, separator, limit) {
  var parts = str.split(separator);
  var returnVal = [];
  while (limit > 0 && parts.length) {
    returnVal.push(parts.shift());
    limit--;
  }
  if (parts.length) {
    returnVal.push(parts.join(separator));
  }
  return returnVal;
};
goog.string.editDistance = function(a, b) {
  var v0 = [];
  var v1 = [];
  if (a == b) {
    return 0;
  }
  if (!a.length || !b.length) {
    return Math.max(a.length, b.length);
  }
  for (var i = 0;i < b.length + 1;i++) {
    v0[i] = i;
  }
  for (var i = 0;i < a.length;i++) {
    v1[0] = i + 1;
    for (var j = 0;j < b.length;j++) {
      var cost = a[i] != b[j];
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
    }
    for (var j = 0;j < v0.length;j++) {
      v0[j] = v1[j];
    }
  }
  return v1[b.length];
};
goog.provide("goog.labs.userAgent.util");
goog.require("goog.string");
goog.labs.userAgent.util.getNativeUserAgentString_ = function() {
  var navigator = goog.labs.userAgent.util.getNavigator_();
  if (navigator) {
    var userAgent = navigator.userAgent;
    if (userAgent) {
      return userAgent;
    }
  }
  return "";
};
goog.labs.userAgent.util.getNavigator_ = function() {
  return goog.global.navigator;
};
goog.labs.userAgent.util.userAgent_ = goog.labs.userAgent.util.getNativeUserAgentString_();
goog.labs.userAgent.util.setUserAgent = function(opt_userAgent) {
  goog.labs.userAgent.util.userAgent_ = opt_userAgent || goog.labs.userAgent.util.getNativeUserAgentString_();
};
goog.labs.userAgent.util.getUserAgent = function() {
  return goog.labs.userAgent.util.userAgent_;
};
goog.labs.userAgent.util.matchUserAgent = function(str) {
  var userAgent = goog.labs.userAgent.util.getUserAgent();
  return goog.string.contains(userAgent, str);
};
goog.labs.userAgent.util.matchUserAgentIgnoreCase = function(str) {
  var userAgent = goog.labs.userAgent.util.getUserAgent();
  return goog.string.caseInsensitiveContains(userAgent, str);
};
goog.labs.userAgent.util.extractVersionTuples = function(userAgent) {
  var versionRegExp = new RegExp("(\\w[\\w ]+)" + "/" + "([^\\s]+)" + "\\s*" + "(?:\\((.*?)\\))?", "g");
  var data = [];
  var match;
  while (match = versionRegExp.exec(userAgent)) {
    data.push([match[1], match[2], match[3] || undefined]);
  }
  return data;
};
goog.provide("goog.labs.userAgent.platform");
goog.require("goog.labs.userAgent.util");
goog.require("goog.string");
goog.labs.userAgent.platform.isAndroid = function() {
  return goog.labs.userAgent.util.matchUserAgent("Android");
};
goog.labs.userAgent.platform.isIpod = function() {
  return goog.labs.userAgent.util.matchUserAgent("iPod");
};
goog.labs.userAgent.platform.isIphone = function() {
  return goog.labs.userAgent.util.matchUserAgent("iPhone") && !goog.labs.userAgent.util.matchUserAgent("iPod") && !goog.labs.userAgent.util.matchUserAgent("iPad");
};
goog.labs.userAgent.platform.isIpad = function() {
  return goog.labs.userAgent.util.matchUserAgent("iPad");
};
goog.labs.userAgent.platform.isIos = function() {
  return goog.labs.userAgent.platform.isIphone() || goog.labs.userAgent.platform.isIpad() || goog.labs.userAgent.platform.isIpod();
};
goog.labs.userAgent.platform.isMacintosh = function() {
  return goog.labs.userAgent.util.matchUserAgent("Macintosh");
};
goog.labs.userAgent.platform.isLinux = function() {
  return goog.labs.userAgent.util.matchUserAgent("Linux");
};
goog.labs.userAgent.platform.isWindows = function() {
  return goog.labs.userAgent.util.matchUserAgent("Windows");
};
goog.labs.userAgent.platform.isChromeOS = function() {
  return goog.labs.userAgent.util.matchUserAgent("CrOS");
};
goog.labs.userAgent.platform.getVersion = function() {
  var userAgentString = goog.labs.userAgent.util.getUserAgent();
  var version = "", re;
  if (goog.labs.userAgent.platform.isWindows()) {
    re = /Windows (?:NT|Phone) ([0-9.]+)/;
    var match = re.exec(userAgentString);
    if (match) {
      version = match[1];
    } else {
      version = "0.0";
    }
  } else {
    if (goog.labs.userAgent.platform.isIos()) {
      re = /(?:iPhone|iPod|iPad|CPU)\s+OS\s+(\S+)/;
      var match = re.exec(userAgentString);
      version = match && match[1].replace(/_/g, ".");
    } else {
      if (goog.labs.userAgent.platform.isMacintosh()) {
        re = /Mac OS X ([0-9_.]+)/;
        var match = re.exec(userAgentString);
        version = match ? match[1].replace(/_/g, ".") : "10";
      } else {
        if (goog.labs.userAgent.platform.isAndroid()) {
          re = /Android\s+([^\);]+)(\)|;)/;
          var match = re.exec(userAgentString);
          version = match && match[1];
        } else {
          if (goog.labs.userAgent.platform.isChromeOS()) {
            re = /(?:CrOS\s+(?:i686|x86_64)\s+([0-9.]+))/;
            var match = re.exec(userAgentString);
            version = match && match[1];
          }
        }
      }
    }
  }
  return version || "";
};
goog.labs.userAgent.platform.isVersionOrHigher = function(version) {
  return goog.string.compareVersions(goog.labs.userAgent.platform.getVersion(), version) >= 0;
};
goog.provide("goog.crypt.Hash");
goog.crypt.Hash = function() {
  this.blockSize = -1;
};
goog.crypt.Hash.prototype.reset = goog.abstractMethod;
goog.crypt.Hash.prototype.update = goog.abstractMethod;
goog.crypt.Hash.prototype.digest = goog.abstractMethod;
goog.provide("goog.crypt.Sha1");
goog.require("goog.crypt.Hash");
goog.crypt.Sha1 = function() {
  goog.crypt.Sha1.base(this, "constructor");
  this.blockSize = 512 / 8;
  this.chain_ = [];
  this.buf_ = [];
  this.W_ = [];
  this.pad_ = [];
  this.pad_[0] = 128;
  for (var i = 1;i < this.blockSize;++i) {
    this.pad_[i] = 0;
  }
  this.inbuf_ = 0;
  this.total_ = 0;
  this.reset();
};
goog.inherits(goog.crypt.Sha1, goog.crypt.Hash);
goog.crypt.Sha1.prototype.reset = function() {
  this.chain_[0] = 1732584193;
  this.chain_[1] = 4023233417;
  this.chain_[2] = 2562383102;
  this.chain_[3] = 271733878;
  this.chain_[4] = 3285377520;
  this.inbuf_ = 0;
  this.total_ = 0;
};
goog.crypt.Sha1.prototype.compress_ = function(buf, opt_offset) {
  if (!opt_offset) {
    opt_offset = 0;
  }
  var W = this.W_;
  if (goog.isString(buf)) {
    for (var i = 0;i < 16;i++) {
      W[i] = buf.charCodeAt(opt_offset) << 24 | buf.charCodeAt(opt_offset + 1) << 16 | buf.charCodeAt(opt_offset + 2) << 8 | buf.charCodeAt(opt_offset + 3);
      opt_offset += 4;
    }
  } else {
    for (var i = 0;i < 16;i++) {
      W[i] = buf[opt_offset] << 24 | buf[opt_offset + 1] << 16 | buf[opt_offset + 2] << 8 | buf[opt_offset + 3];
      opt_offset += 4;
    }
  }
  for (var i = 16;i < 80;i++) {
    var t = W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16];
    W[i] = (t << 1 | t >>> 31) & 4294967295;
  }
  var a = this.chain_[0];
  var b = this.chain_[1];
  var c = this.chain_[2];
  var d = this.chain_[3];
  var e = this.chain_[4];
  var f, k;
  for (var i = 0;i < 80;i++) {
    if (i < 40) {
      if (i < 20) {
        f = d ^ b & (c ^ d);
        k = 1518500249;
      } else {
        f = b ^ c ^ d;
        k = 1859775393;
      }
    } else {
      if (i < 60) {
        f = b & c | d & (b | c);
        k = 2400959708;
      } else {
        f = b ^ c ^ d;
        k = 3395469782;
      }
    }
    var t = (a << 5 | a >>> 27) + f + e + k + W[i] & 4294967295;
    e = d;
    d = c;
    c = (b << 30 | b >>> 2) & 4294967295;
    b = a;
    a = t;
  }
  this.chain_[0] = this.chain_[0] + a & 4294967295;
  this.chain_[1] = this.chain_[1] + b & 4294967295;
  this.chain_[2] = this.chain_[2] + c & 4294967295;
  this.chain_[3] = this.chain_[3] + d & 4294967295;
  this.chain_[4] = this.chain_[4] + e & 4294967295;
};
goog.crypt.Sha1.prototype.update = function(bytes, opt_length) {
  if (bytes == null) {
    return;
  }
  if (!goog.isDef(opt_length)) {
    opt_length = bytes.length;
  }
  var lengthMinusBlock = opt_length - this.blockSize;
  var n = 0;
  var buf = this.buf_;
  var inbuf = this.inbuf_;
  while (n < opt_length) {
    if (inbuf == 0) {
      while (n <= lengthMinusBlock) {
        this.compress_(bytes, n);
        n += this.blockSize;
      }
    }
    if (goog.isString(bytes)) {
      while (n < opt_length) {
        buf[inbuf] = bytes.charCodeAt(n);
        ++inbuf;
        ++n;
        if (inbuf == this.blockSize) {
          this.compress_(buf);
          inbuf = 0;
          break;
        }
      }
    } else {
      while (n < opt_length) {
        buf[inbuf] = bytes[n];
        ++inbuf;
        ++n;
        if (inbuf == this.blockSize) {
          this.compress_(buf);
          inbuf = 0;
          break;
        }
      }
    }
  }
  this.inbuf_ = inbuf;
  this.total_ += opt_length;
};
goog.crypt.Sha1.prototype.digest = function() {
  var digest = [];
  var totalBits = this.total_ * 8;
  if (this.inbuf_ < 56) {
    this.update(this.pad_, 56 - this.inbuf_);
  } else {
    this.update(this.pad_, this.blockSize - (this.inbuf_ - 56));
  }
  for (var i = this.blockSize - 1;i >= 56;i--) {
    this.buf_[i] = totalBits & 255;
    totalBits /= 256;
  }
  this.compress_(this.buf_);
  var n = 0;
  for (var i = 0;i < 5;i++) {
    for (var j = 24;j >= 0;j -= 8) {
      digest[n] = this.chain_[i] >> j & 255;
      ++n;
    }
  }
  return digest;
};
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.dom.NodeType");
goog.require("goog.string");
goog.define("goog.asserts.ENABLE_ASSERTS", goog.DEBUG);
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern;
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.DEFAULT_ERROR_HANDLER = function(e) {
  throw e;
};
goog.asserts.errorHandler_ = goog.asserts.DEFAULT_ERROR_HANDLER;
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if (givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs;
  } else {
    if (defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs;
    }
  }
  var e = new goog.asserts.AssertionError("" + message, args || []);
  goog.asserts.errorHandler_(e);
};
goog.asserts.setErrorHandler = function(errorHandler) {
  if (goog.asserts.ENABLE_ASSERTS) {
    goog.asserts.errorHandler_ = errorHandler;
  }
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2));
  }
  return condition;
};
goog.asserts.fail = function(opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS) {
    goog.asserts.errorHandler_(new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1)));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2));
  }
  return(value);
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2));
  }
  return(value);
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2));
  }
  return(value);
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2));
  }
  return(value);
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2));
  }
  return(value);
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2));
  }
  return(value);
};
goog.asserts.assertElement = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && (!goog.isObject(value) || value.nodeType != goog.dom.NodeType.ELEMENT)) {
    goog.asserts.doAssertFailure_("Expected Element but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2));
  }
  return(value);
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("Expected instanceof %s but got %s.", [goog.asserts.getType_(type), goog.asserts.getType_(value)], opt_message, Array.prototype.slice.call(arguments, 3));
  }
  return value;
};
goog.asserts.assertObjectPrototypeIsIntact = function() {
  for (var key in Object.prototype) {
    goog.asserts.fail(key + " should not be enumerable in Object.prototype.");
  }
};
goog.asserts.getType_ = function(value) {
  if (value instanceof Function) {
    return value.displayName || value.name || "unknown type name";
  } else {
    if (value instanceof Object) {
      return value.constructor.displayName || value.constructor.name || Object.prototype.toString.call(value);
    } else {
      return value === null ? "null" : typeof value;
    }
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.define("goog.NATIVE_ARRAY_PROTOTYPES", goog.TRUSTED_SITE);
goog.define("goog.array.ASSUME_NATIVE_FUNCTIONS", false);
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1];
};
goog.array.last = goog.array.peek;
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && (goog.array.ASSUME_NATIVE_FUNCTIONS || goog.array.ARRAY_PROTOTYPE_.indexOf) ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex);
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if (goog.isString(arr)) {
    if (!goog.isString(obj) || obj.length != 1) {
      return-1;
    }
    return arr.indexOf(obj, fromIndex);
  }
  for (var i = fromIndex;i < arr.length;i++) {
    if (i in arr && arr[i] === obj) {
      return i;
    }
  }
  return-1;
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && (goog.array.ASSUME_NATIVE_FUNCTIONS || goog.array.ARRAY_PROTOTYPE_.lastIndexOf) ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex);
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if (fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex);
  }
  if (goog.isString(arr)) {
    if (!goog.isString(obj) || obj.length != 1) {
      return-1;
    }
    return arr.lastIndexOf(obj, fromIndex);
  }
  for (var i = fromIndex;i >= 0;i--) {
    if (i in arr && arr[i] === obj) {
      return i;
    }
  }
  return-1;
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && (goog.array.ASSUME_NATIVE_FUNCTIONS || goog.array.ARRAY_PROTOTYPE_.forEach) ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj);
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for (var i = 0;i < l;i++) {
    if (i in arr2) {
      f.call(opt_obj, arr2[i], i, arr);
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for (var i = l - 1;i >= 0;--i) {
    if (i in arr2) {
      f.call(opt_obj, arr2[i], i, arr);
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && (goog.array.ASSUME_NATIVE_FUNCTIONS || goog.array.ARRAY_PROTOTYPE_.filter) ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj);
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for (var i = 0;i < l;i++) {
    if (i in arr2) {
      var val = arr2[i];
      if (f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val;
      }
    }
  }
  return res;
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && (goog.array.ASSUME_NATIVE_FUNCTIONS || goog.array.ARRAY_PROTOTYPE_.map) ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj);
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for (var i = 0;i < l;i++) {
    if (i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr);
    }
  }
  return res;
};
goog.array.reduce = goog.NATIVE_ARRAY_PROTOTYPES && (goog.array.ASSUME_NATIVE_FUNCTIONS || goog.array.ARRAY_PROTOTYPE_.reduce) ? function(arr, f, val, opt_obj) {
  goog.asserts.assert(arr.length != null);
  var params = [];
  for (var i = 1, l = arguments.length;i < l;i++) {
    params.push(arguments[i]);
  }
  if (opt_obj) {
    params[0] = goog.bind(f, opt_obj);
  }
  return goog.array.ARRAY_PROTOTYPE_.reduce.apply(arr, params);
} : function(arr, f, val, opt_obj) {
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr);
  });
  return rval;
};
goog.array.reduceRight = goog.NATIVE_ARRAY_PROTOTYPES && (goog.array.ASSUME_NATIVE_FUNCTIONS || goog.array.ARRAY_PROTOTYPE_.reduceRight) ? function(arr, f, val, opt_obj) {
  goog.asserts.assert(arr.length != null);
  if (opt_obj) {
    f = goog.bind(f, opt_obj);
  }
  return goog.array.ARRAY_PROTOTYPE_.reduceRight.call(arr, f, val);
} : function(arr, f, val, opt_obj) {
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr);
  });
  return rval;
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && (goog.array.ASSUME_NATIVE_FUNCTIONS || goog.array.ARRAY_PROTOTYPE_.some) ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj);
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for (var i = 0;i < l;i++) {
    if (i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true;
    }
  }
  return false;
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && (goog.array.ASSUME_NATIVE_FUNCTIONS || goog.array.ARRAY_PROTOTYPE_.every) ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj);
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for (var i = 0;i < l;i++) {
    if (i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false;
    }
  }
  return true;
};
goog.array.count = function(arr, f, opt_obj) {
  var count = 0;
  goog.array.forEach(arr, function(element, index, arr) {
    if (f.call(opt_obj, element, index, arr)) {
      ++count;
    }
  }, opt_obj);
  return count;
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i];
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for (var i = 0;i < l;i++) {
    if (i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i;
    }
  }
  return-1;
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i];
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for (var i = l - 1;i >= 0;i--) {
    if (i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i;
    }
  }
  return-1;
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0;
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0;
};
goog.array.clear = function(arr) {
  if (!goog.isArray(arr)) {
    for (var i = arr.length - 1;i >= 0;i--) {
      delete arr[i];
    }
  }
  arr.length = 0;
};
goog.array.insert = function(arr, obj) {
  if (!goog.array.contains(arr, obj)) {
    arr.push(obj);
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj);
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd);
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if (arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj);
  } else {
    goog.array.insertAt(arr, obj, i);
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if (rv = i >= 0) {
    goog.array.removeAt(arr, i);
  }
  return rv;
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1;
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if (i >= 0) {
    goog.array.removeAt(arr, i);
    return true;
  }
  return false;
};
goog.array.removeAllIf = function(arr, f, opt_obj) {
  var removedCount = 0;
  goog.array.forEachRight(arr, function(val, index) {
    if (f.call(opt_obj, val, index, arr)) {
      if (goog.array.removeAt(arr, index)) {
        removedCount++;
      }
    }
  });
  return removedCount;
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments);
};
goog.array.join = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments);
};
goog.array.toArray = function(object) {
  var length = object.length;
  if (length > 0) {
    var rv = new Array(length);
    for (var i = 0;i < length;i++) {
      rv[i] = object[i];
    }
    return rv;
  }
  return[];
};
goog.array.clone = goog.array.toArray;
goog.array.extend = function(arr1, var_args) {
  for (var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    if (goog.isArrayLike(arr2)) {
      var len1 = arr1.length || 0;
      var len2 = arr2.length || 0;
      arr1.length = len1 + len2;
      for (var j = 0;j < len2;j++) {
        arr1[len1 + j] = arr2[j];
      }
    } else {
      arr1.push(arr2);
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1));
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if (arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start);
  } else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end);
  }
};
goog.array.removeDuplicates = function(arr, opt_rv, opt_hashFn) {
  var returnArray = opt_rv || arr;
  var defaultHashFn = function(item) {
    return goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
  };
  var hashFn = opt_hashFn || defaultHashFn;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while (cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = hashFn(current);
    if (!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current;
    }
  }
  returnArray.length = cursorInsert;
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target);
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj);
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while (left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if (isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr);
    } else {
      compareResult = compareFn(opt_target, arr[middle]);
    }
    if (compareResult > 0) {
      left = middle + 1;
    } else {
      right = middle;
      found = !compareResult;
    }
  }
  return found ? left : ~left;
};
goog.array.sort = function(arr, opt_compareFn) {
  arr.sort(opt_compareFn || goog.array.defaultCompare);
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for (var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]};
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index;
  }
  goog.array.sort(arr, stableCompareFn);
  for (var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value;
  }
};
goog.array.sortByKey = function(arr, keyFn, opt_compareFn) {
  var keyCompareFn = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return keyCompareFn(keyFn(a), keyFn(b));
  });
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  goog.array.sortByKey(arr, function(obj) {
    return obj[key];
  }, opt_compareFn);
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for (var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if (compareResult > 0 || compareResult == 0 && opt_strict) {
      return false;
    }
  }
  return true;
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if (!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false;
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for (var i = 0;i < l;i++) {
    if (!equalsFn(arr1[i], arr2[i])) {
      return false;
    }
  }
  return true;
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for (var i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if (result != 0) {
      return result;
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length);
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0;
};
goog.array.inverseDefaultCompare = function(a, b) {
  return-goog.array.defaultCompare(a, b);
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b;
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if (index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true;
  }
  return false;
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false;
};
goog.array.bucket = function(array, sorter, opt_obj) {
  var buckets = {};
  for (var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter.call(opt_obj, value, i, array);
    if (goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value);
    }
  }
  return buckets;
};
goog.array.toObject = function(arr, keyFunc, opt_obj) {
  var ret = {};
  goog.array.forEach(arr, function(element, index) {
    ret[keyFunc.call(opt_obj, element, index, arr)] = element;
  });
  return ret;
};
goog.array.range = function(startOrEnd, opt_end, opt_step) {
  var array = [];
  var start = 0;
  var end = startOrEnd;
  var step = opt_step || 1;
  if (opt_end !== undefined) {
    start = startOrEnd;
    end = opt_end;
  }
  if (step * (end - start) < 0) {
    return[];
  }
  if (step > 0) {
    for (var i = start;i < end;i += step) {
      array.push(i);
    }
  } else {
    for (var i = start;i > end;i += step) {
      array.push(i);
    }
  }
  return array;
};
goog.array.repeat = function(value, n) {
  var array = [];
  for (var i = 0;i < n;i++) {
    array[i] = value;
  }
  return array;
};
goog.array.flatten = function(var_args) {
  var CHUNK_SIZE = 8192;
  var result = [];
  for (var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if (goog.isArray(element)) {
      for (var c = 0;c < element.length;c += CHUNK_SIZE) {
        var chunk = goog.array.slice(element, c, c + CHUNK_SIZE);
        var recurseResult = goog.array.flatten.apply(null, chunk);
        for (var r = 0;r < recurseResult.length;r++) {
          result.push(recurseResult[r]);
        }
      }
    } else {
      result.push(element);
    }
  }
  return result;
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if (array.length) {
    n %= array.length;
    if (n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n));
    } else {
      if (n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n));
      }
    }
  }
  return array;
};
goog.array.moveItem = function(arr, fromIndex, toIndex) {
  goog.asserts.assert(fromIndex >= 0 && fromIndex < arr.length);
  goog.asserts.assert(toIndex >= 0 && toIndex < arr.length);
  var removedItems = goog.array.ARRAY_PROTOTYPE_.splice.call(arr, fromIndex, 1);
  goog.array.ARRAY_PROTOTYPE_.splice.call(arr, toIndex, 0, removedItems[0]);
};
goog.array.zip = function(var_args) {
  if (!arguments.length) {
    return[];
  }
  var result = [];
  for (var i = 0;true;i++) {
    var value = [];
    for (var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if (i >= arr.length) {
        return result;
      }
      value.push(arr[i]);
    }
    result.push(value);
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for (var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
};
goog.array.copyByIndex = function(arr, index_arr) {
  var result = [];
  goog.array.forEach(index_arr, function(index) {
    result.push(arr[index]);
  });
  return result;
};
goog.provide("goog.labs.userAgent.browser");
goog.require("goog.array");
goog.require("goog.labs.userAgent.util");
goog.require("goog.object");
goog.require("goog.string");
goog.labs.userAgent.browser.matchOpera_ = function() {
  return goog.labs.userAgent.util.matchUserAgent("Opera") || goog.labs.userAgent.util.matchUserAgent("OPR");
};
goog.labs.userAgent.browser.matchIE_ = function() {
  return goog.labs.userAgent.util.matchUserAgent("Trident") || goog.labs.userAgent.util.matchUserAgent("MSIE");
};
goog.labs.userAgent.browser.matchFirefox_ = function() {
  return goog.labs.userAgent.util.matchUserAgent("Firefox");
};
goog.labs.userAgent.browser.matchSafari_ = function() {
  return goog.labs.userAgent.util.matchUserAgent("Safari") && !(goog.labs.userAgent.browser.matchChrome_() || goog.labs.userAgent.browser.matchCoast_() || goog.labs.userAgent.browser.matchOpera_() || goog.labs.userAgent.browser.isSilk() || goog.labs.userAgent.util.matchUserAgent("Android"));
};
goog.labs.userAgent.browser.matchCoast_ = function() {
  return goog.labs.userAgent.util.matchUserAgent("Coast");
};
goog.labs.userAgent.browser.matchIosWebview_ = function() {
  return(goog.labs.userAgent.util.matchUserAgent("iPad") || goog.labs.userAgent.util.matchUserAgent("iPhone")) && !goog.labs.userAgent.browser.matchSafari_() && !goog.labs.userAgent.browser.matchChrome_() && !goog.labs.userAgent.browser.matchCoast_() && goog.labs.userAgent.util.matchUserAgent("AppleWebKit");
};
goog.labs.userAgent.browser.matchChrome_ = function() {
  return(goog.labs.userAgent.util.matchUserAgent("Chrome") || goog.labs.userAgent.util.matchUserAgent("CriOS")) && !goog.labs.userAgent.browser.matchOpera_();
};
goog.labs.userAgent.browser.matchAndroidBrowser_ = function() {
  return goog.labs.userAgent.util.matchUserAgent("Android") && !(goog.labs.userAgent.browser.isChrome() || goog.labs.userAgent.browser.isFirefox() || goog.labs.userAgent.browser.isOpera() || goog.labs.userAgent.browser.isSilk());
};
goog.labs.userAgent.browser.isOpera = goog.labs.userAgent.browser.matchOpera_;
goog.labs.userAgent.browser.isIE = goog.labs.userAgent.browser.matchIE_;
goog.labs.userAgent.browser.isFirefox = goog.labs.userAgent.browser.matchFirefox_;
goog.labs.userAgent.browser.isSafari = goog.labs.userAgent.browser.matchSafari_;
goog.labs.userAgent.browser.isCoast = goog.labs.userAgent.browser.matchCoast_;
goog.labs.userAgent.browser.isIosWebview = goog.labs.userAgent.browser.matchIosWebview_;
goog.labs.userAgent.browser.isChrome = goog.labs.userAgent.browser.matchChrome_;
goog.labs.userAgent.browser.isAndroidBrowser = goog.labs.userAgent.browser.matchAndroidBrowser_;
goog.labs.userAgent.browser.isSilk = function() {
  return goog.labs.userAgent.util.matchUserAgent("Silk");
};
goog.labs.userAgent.browser.getVersion = function() {
  var userAgentString = goog.labs.userAgent.util.getUserAgent();
  if (goog.labs.userAgent.browser.isIE()) {
    return goog.labs.userAgent.browser.getIEVersion_(userAgentString);
  }
  var versionTuples = goog.labs.userAgent.util.extractVersionTuples(userAgentString);
  var versionMap = {};
  goog.array.forEach(versionTuples, function(tuple) {
    var key = tuple[0];
    var value = tuple[1];
    versionMap[key] = value;
  });
  var versionMapHasKey = goog.partial(goog.object.containsKey, versionMap);
  function lookUpValueWithKeys(keys) {
    var key = goog.array.find(keys, versionMapHasKey);
    return versionMap[key] || "";
  }
  if (goog.labs.userAgent.browser.isOpera()) {
    return lookUpValueWithKeys(["Version", "Opera", "OPR"]);
  }
  if (goog.labs.userAgent.browser.isChrome()) {
    return lookUpValueWithKeys(["Chrome", "CriOS"]);
  }
  var tuple = versionTuples[2];
  return tuple && tuple[1] || "";
};
goog.labs.userAgent.browser.isVersionOrHigher = function(version) {
  return goog.string.compareVersions(goog.labs.userAgent.browser.getVersion(), version) >= 0;
};
goog.labs.userAgent.browser.getIEVersion_ = function(userAgent) {
  var rv = /rv: *([\d\.]*)/.exec(userAgent);
  if (rv && rv[1]) {
    return rv[1];
  }
  var version = "";
  var msie = /MSIE +([\d\.]+)/.exec(userAgent);
  if (msie && msie[1]) {
    var tridentVersion = /Trident\/(\d.\d)/.exec(userAgent);
    if (msie[1] == "7.0") {
      if (tridentVersion && tridentVersion[1]) {
        switch(tridentVersion[1]) {
          case "4.0":
            version = "8.0";
            break;
          case "5.0":
            version = "9.0";
            break;
          case "6.0":
            version = "10.0";
            break;
          case "7.0":
            version = "11.0";
            break;
        }
      } else {
        version = "7.0";
      }
    } else {
      version = msie[1];
    }
  }
  return version;
};
goog.provide("goog.labs.userAgent.engine");
goog.require("goog.array");
goog.require("goog.labs.userAgent.util");
goog.require("goog.string");
goog.labs.userAgent.engine.isPresto = function() {
  return goog.labs.userAgent.util.matchUserAgent("Presto");
};
goog.labs.userAgent.engine.isTrident = function() {
  return goog.labs.userAgent.util.matchUserAgent("Trident") || goog.labs.userAgent.util.matchUserAgent("MSIE");
};
goog.labs.userAgent.engine.isWebKit = function() {
  return goog.labs.userAgent.util.matchUserAgentIgnoreCase("WebKit");
};
goog.labs.userAgent.engine.isGecko = function() {
  return goog.labs.userAgent.util.matchUserAgent("Gecko") && !goog.labs.userAgent.engine.isWebKit() && !goog.labs.userAgent.engine.isTrident();
};
goog.labs.userAgent.engine.getVersion = function() {
  var userAgentString = goog.labs.userAgent.util.getUserAgent();
  if (userAgentString) {
    var tuples = goog.labs.userAgent.util.extractVersionTuples(userAgentString);
    var engineTuple = tuples[1];
    if (engineTuple) {
      if (engineTuple[0] == "Gecko") {
        return goog.labs.userAgent.engine.getVersionForKey_(tuples, "Firefox");
      }
      return engineTuple[1];
    }
    var browserTuple = tuples[0];
    var info;
    if (browserTuple && (info = browserTuple[2])) {
      var match = /Trident\/([^\s;]+)/.exec(info);
      if (match) {
        return match[1];
      }
    }
  }
  return "";
};
goog.labs.userAgent.engine.isVersionOrHigher = function(version) {
  return goog.string.compareVersions(goog.labs.userAgent.engine.getVersion(), version) >= 0;
};
goog.labs.userAgent.engine.getVersionForKey_ = function(tuples, key) {
  var pair = goog.array.find(tuples, function(pair) {
    return key == pair[0];
  });
  return pair && pair[1] || "";
};
goog.provide("goog.crypt");
goog.require("goog.array");
goog.require("goog.asserts");
goog.crypt.stringToByteArray = function(str) {
  var output = [], p = 0;
  for (var i = 0;i < str.length;i++) {
    var c = str.charCodeAt(i);
    while (c > 255) {
      output[p++] = c & 255;
      c >>= 8;
    }
    output[p++] = c;
  }
  return output;
};
goog.crypt.byteArrayToString = function(bytes) {
  var CHUNK_SIZE = 8192;
  if (bytes.length < CHUNK_SIZE) {
    return String.fromCharCode.apply(null, bytes);
  }
  var str = "";
  for (var i = 0;i < bytes.length;i += CHUNK_SIZE) {
    var chunk = goog.array.slice(bytes, i, i + CHUNK_SIZE);
    str += String.fromCharCode.apply(null, chunk);
  }
  return str;
};
goog.crypt.byteArrayToHex = function(array) {
  return goog.array.map(array, function(numByte) {
    var hexByte = numByte.toString(16);
    return hexByte.length > 1 ? hexByte : "0" + hexByte;
  }).join("");
};
goog.crypt.hexToByteArray = function(hexString) {
  goog.asserts.assert(hexString.length % 2 == 0, "Key string length must be multiple of 2");
  var arr = [];
  for (var i = 0;i < hexString.length;i += 2) {
    arr.push(parseInt(hexString.substring(i, i + 2), 16));
  }
  return arr;
};
goog.crypt.stringToUtf8ByteArray = function(str) {
  str = str.replace(/\r\n/g, "\n");
  var out = [], p = 0;
  for (var i = 0;i < str.length;i++) {
    var c = str.charCodeAt(i);
    if (c < 128) {
      out[p++] = c;
    } else {
      if (c < 2048) {
        out[p++] = c >> 6 | 192;
        out[p++] = c & 63 | 128;
      } else {
        out[p++] = c >> 12 | 224;
        out[p++] = c >> 6 & 63 | 128;
        out[p++] = c & 63 | 128;
      }
    }
  }
  return out;
};
goog.crypt.utf8ByteArrayToString = function(bytes) {
  var out = [], pos = 0, c = 0;
  while (pos < bytes.length) {
    var c1 = bytes[pos++];
    if (c1 < 128) {
      out[c++] = String.fromCharCode(c1);
    } else {
      if (c1 > 191 && c1 < 224) {
        var c2 = bytes[pos++];
        out[c++] = String.fromCharCode((c1 & 31) << 6 | c2 & 63);
      } else {
        var c2 = bytes[pos++];
        var c3 = bytes[pos++];
        out[c++] = String.fromCharCode((c1 & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
      }
    }
  }
  return out.join("");
};
goog.crypt.xorByteArray = function(bytes1, bytes2) {
  goog.asserts.assert(bytes1.length == bytes2.length, "XOR array lengths must match");
  var result = [];
  for (var i = 0;i < bytes1.length;i++) {
    result.push(bytes1[i] ^ bytes2[i]);
  }
  return result;
};
goog.provide("goog.userAgent");
goog.require("goog.labs.userAgent.browser");
goog.require("goog.labs.userAgent.engine");
goog.require("goog.labs.userAgent.platform");
goog.require("goog.labs.userAgent.util");
goog.require("goog.string");
goog.define("goog.userAgent.ASSUME_IE", false);
goog.define("goog.userAgent.ASSUME_GECKO", false);
goog.define("goog.userAgent.ASSUME_WEBKIT", false);
goog.define("goog.userAgent.ASSUME_MOBILE_WEBKIT", false);
goog.define("goog.userAgent.ASSUME_OPERA", false);
goog.define("goog.userAgent.ASSUME_ANY_VERSION", false);
goog.userAgent.BROWSER_KNOWN_ = goog.userAgent.ASSUME_IE || goog.userAgent.ASSUME_GECKO || goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_OPERA;
goog.userAgent.getUserAgentString = function() {
  return goog.labs.userAgent.util.getUserAgent();
};
goog.userAgent.getNavigator = function() {
  return goog.global["navigator"] || null;
};
goog.userAgent.OPERA = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_OPERA : goog.labs.userAgent.browser.isOpera();
goog.userAgent.IE = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_IE : goog.labs.userAgent.browser.isIE();
goog.userAgent.GECKO = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_GECKO : goog.labs.userAgent.engine.isGecko();
goog.userAgent.WEBKIT = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_MOBILE_WEBKIT : goog.labs.userAgent.engine.isWebKit();
goog.userAgent.isMobile_ = function() {
  return goog.userAgent.WEBKIT && goog.labs.userAgent.util.matchUserAgent("Mobile");
};
goog.userAgent.MOBILE = goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.isMobile_();
goog.userAgent.SAFARI = goog.userAgent.WEBKIT;
goog.userAgent.determinePlatform_ = function() {
  var navigator = goog.userAgent.getNavigator();
  return navigator && navigator.platform || "";
};
goog.userAgent.PLATFORM = goog.userAgent.determinePlatform_();
goog.define("goog.userAgent.ASSUME_MAC", false);
goog.define("goog.userAgent.ASSUME_WINDOWS", false);
goog.define("goog.userAgent.ASSUME_LINUX", false);
goog.define("goog.userAgent.ASSUME_X11", false);
goog.define("goog.userAgent.ASSUME_ANDROID", false);
goog.define("goog.userAgent.ASSUME_IPHONE", false);
goog.define("goog.userAgent.ASSUME_IPAD", false);
goog.userAgent.PLATFORM_KNOWN_ = goog.userAgent.ASSUME_MAC || goog.userAgent.ASSUME_WINDOWS || goog.userAgent.ASSUME_LINUX || goog.userAgent.ASSUME_X11 || goog.userAgent.ASSUME_ANDROID || goog.userAgent.ASSUME_IPHONE || goog.userAgent.ASSUME_IPAD;
goog.userAgent.MAC = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_MAC : goog.labs.userAgent.platform.isMacintosh();
goog.userAgent.WINDOWS = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_WINDOWS : goog.labs.userAgent.platform.isWindows();
goog.userAgent.isLegacyLinux_ = function() {
  return goog.labs.userAgent.platform.isLinux() || goog.labs.userAgent.platform.isChromeOS();
};
goog.userAgent.LINUX = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_LINUX : goog.userAgent.isLegacyLinux_();
goog.userAgent.isX11_ = function() {
  var navigator = goog.userAgent.getNavigator();
  return!!navigator && goog.string.contains(navigator["appVersion"] || "", "X11");
};
goog.userAgent.X11 = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_X11 : goog.userAgent.isX11_();
goog.userAgent.ANDROID = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_ANDROID : goog.labs.userAgent.platform.isAndroid();
goog.userAgent.IPHONE = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_IPHONE : goog.labs.userAgent.platform.isIphone();
goog.userAgent.IPAD = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_IPAD : goog.labs.userAgent.platform.isIpad();
goog.userAgent.determineVersion_ = function() {
  var version = "", re;
  if (goog.userAgent.OPERA && goog.global["opera"]) {
    var operaVersion = goog.global["opera"].version;
    return goog.isFunction(operaVersion) ? operaVersion() : operaVersion;
  }
  if (goog.userAgent.GECKO) {
    re = /rv\:([^\);]+)(\)|;)/;
  } else {
    if (goog.userAgent.IE) {
      re = /\b(?:MSIE|rv)[: ]([^\);]+)(\)|;)/;
    } else {
      if (goog.userAgent.WEBKIT) {
        re = /WebKit\/(\S+)/;
      }
    }
  }
  if (re) {
    var arr = re.exec(goog.userAgent.getUserAgentString());
    version = arr ? arr[1] : "";
  }
  if (goog.userAgent.IE) {
    var docMode = goog.userAgent.getDocumentMode_();
    if (docMode > parseFloat(version)) {
      return String(docMode);
    }
  }
  return version;
};
goog.userAgent.getDocumentMode_ = function() {
  var doc = goog.global["document"];
  return doc ? doc["documentMode"] : undefined;
};
goog.userAgent.VERSION = goog.userAgent.determineVersion_();
goog.userAgent.compare = function(v1, v2) {
  return goog.string.compareVersions(v1, v2);
};
goog.userAgent.isVersionOrHigherCache_ = {};
goog.userAgent.isVersionOrHigher = function(version) {
  return goog.userAgent.ASSUME_ANY_VERSION || goog.userAgent.isVersionOrHigherCache_[version] || (goog.userAgent.isVersionOrHigherCache_[version] = goog.string.compareVersions(goog.userAgent.VERSION, version) >= 0);
};
goog.userAgent.isVersion = goog.userAgent.isVersionOrHigher;
goog.userAgent.isDocumentModeOrHigher = function(documentMode) {
  return goog.userAgent.IE && goog.userAgent.DOCUMENT_MODE >= documentMode;
};
goog.userAgent.isDocumentMode = goog.userAgent.isDocumentModeOrHigher;
goog.userAgent.DOCUMENT_MODE = function() {
  var doc = goog.global["document"];
  if (!doc || !goog.userAgent.IE) {
    return undefined;
  }
  var mode = goog.userAgent.getDocumentMode_();
  return mode || (doc["compatMode"] == "CSS1Compat" ? parseInt(goog.userAgent.VERSION, 10) : 5);
}();
goog.provide("goog.crypt.base64");
goog.require("goog.crypt");
goog.require("goog.userAgent");
goog.crypt.base64.byteToCharMap_ = null;
goog.crypt.base64.charToByteMap_ = null;
goog.crypt.base64.byteToCharMapWebSafe_ = null;
goog.crypt.base64.charToByteMapWebSafe_ = null;
goog.crypt.base64.ENCODED_VALS_BASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ" + "abcdefghijklmnopqrstuvwxyz" + "0123456789";
goog.crypt.base64.ENCODED_VALS = goog.crypt.base64.ENCODED_VALS_BASE + "+/=";
goog.crypt.base64.ENCODED_VALS_WEBSAFE = goog.crypt.base64.ENCODED_VALS_BASE + "-_.";
goog.crypt.base64.HAS_NATIVE_SUPPORT = goog.userAgent.GECKO || goog.userAgent.WEBKIT || goog.userAgent.OPERA || typeof goog.global.atob == "function";
goog.crypt.base64.encodeByteArray = function(input, opt_webSafe) {
  if (!goog.isArrayLike(input)) {
    throw Error("encodeByteArray takes an array as a parameter");
  }
  goog.crypt.base64.init_();
  var byteToCharMap = opt_webSafe ? goog.crypt.base64.byteToCharMapWebSafe_ : goog.crypt.base64.byteToCharMap_;
  var output = [];
  for (var i = 0;i < input.length;i += 3) {
    var byte1 = input[i];
    var haveByte2 = i + 1 < input.length;
    var byte2 = haveByte2 ? input[i + 1] : 0;
    var haveByte3 = i + 2 < input.length;
    var byte3 = haveByte3 ? input[i + 2] : 0;
    var outByte1 = byte1 >> 2;
    var outByte2 = (byte1 & 3) << 4 | byte2 >> 4;
    var outByte3 = (byte2 & 15) << 2 | byte3 >> 6;
    var outByte4 = byte3 & 63;
    if (!haveByte3) {
      outByte4 = 64;
      if (!haveByte2) {
        outByte3 = 64;
      }
    }
    output.push(byteToCharMap[outByte1], byteToCharMap[outByte2], byteToCharMap[outByte3], byteToCharMap[outByte4]);
  }
  return output.join("");
};
goog.crypt.base64.encodeString = function(input, opt_webSafe) {
  if (goog.crypt.base64.HAS_NATIVE_SUPPORT && !opt_webSafe) {
    return goog.global.btoa(input);
  }
  return goog.crypt.base64.encodeByteArray(goog.crypt.stringToByteArray(input), opt_webSafe);
};
goog.crypt.base64.decodeString = function(input, opt_webSafe) {
  if (goog.crypt.base64.HAS_NATIVE_SUPPORT && !opt_webSafe) {
    return goog.global.atob(input);
  }
  return goog.crypt.byteArrayToString(goog.crypt.base64.decodeStringToByteArray(input, opt_webSafe));
};
goog.crypt.base64.decodeStringToByteArray = function(input, opt_webSafe) {
  goog.crypt.base64.init_();
  var charToByteMap = opt_webSafe ? goog.crypt.base64.charToByteMapWebSafe_ : goog.crypt.base64.charToByteMap_;
  var output = [];
  for (var i = 0;i < input.length;) {
    var byte1 = charToByteMap[input.charAt(i++)];
    var haveByte2 = i < input.length;
    var byte2 = haveByte2 ? charToByteMap[input.charAt(i)] : 0;
    ++i;
    var haveByte3 = i < input.length;
    var byte3 = haveByte3 ? charToByteMap[input.charAt(i)] : 64;
    ++i;
    var haveByte4 = i < input.length;
    var byte4 = haveByte4 ? charToByteMap[input.charAt(i)] : 64;
    ++i;
    if (byte1 == null || byte2 == null || byte3 == null || byte4 == null) {
      throw Error();
    }
    var outByte1 = byte1 << 2 | byte2 >> 4;
    output.push(outByte1);
    if (byte3 != 64) {
      var outByte2 = byte2 << 4 & 240 | byte3 >> 2;
      output.push(outByte2);
      if (byte4 != 64) {
        var outByte3 = byte3 << 6 & 192 | byte4;
        output.push(outByte3);
      }
    }
  }
  return output;
};
goog.crypt.base64.init_ = function() {
  if (!goog.crypt.base64.byteToCharMap_) {
    goog.crypt.base64.byteToCharMap_ = {};
    goog.crypt.base64.charToByteMap_ = {};
    goog.crypt.base64.byteToCharMapWebSafe_ = {};
    goog.crypt.base64.charToByteMapWebSafe_ = {};
    for (var i = 0;i < goog.crypt.base64.ENCODED_VALS.length;i++) {
      goog.crypt.base64.byteToCharMap_[i] = goog.crypt.base64.ENCODED_VALS.charAt(i);
      goog.crypt.base64.charToByteMap_[goog.crypt.base64.byteToCharMap_[i]] = i;
      goog.crypt.base64.byteToCharMapWebSafe_[i] = goog.crypt.base64.ENCODED_VALS_WEBSAFE.charAt(i);
      goog.crypt.base64.charToByteMapWebSafe_[goog.crypt.base64.byteToCharMapWebSafe_[i]] = i;
      if (i >= goog.crypt.base64.ENCODED_VALS_BASE.length) {
        goog.crypt.base64.charToByteMap_[goog.crypt.base64.ENCODED_VALS_WEBSAFE.charAt(i)] = i;
        goog.crypt.base64.charToByteMapWebSafe_[goog.crypt.base64.ENCODED_VALS.charAt(i)] = i;
      }
    }
  }
};
goog.provide("fb.constants");
var NODE_CLIENT = false;
var CLIENT_VERSION_DEFINE = "0.0.0";
var CLIENT_VERSION = CLIENT_VERSION || CLIENT_VERSION_DEFINE;
goog.provide("fb.util.obj");
fb.util.obj.contains = function(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
};
fb.util.obj.get = function(obj, key) {
  if (Object.prototype.hasOwnProperty.call(obj, key)) {
    return obj[key];
  }
};
fb.util.obj.foreach = function(obj, fn) {
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      fn(key, obj[key]);
    }
  }
};
fb.util.obj.clone = function(obj) {
  var clone = {};
  fb.util.obj.foreach(obj, function(key, value) {
    clone[key] = value;
  });
  return clone;
};
goog.provide("fb.util");
goog.require("fb.util.obj");
fb.util.querystring = function(querystringParams) {
  var params = [];
  fb.util.obj.foreach(querystringParams, function(key, value) {
    if (goog.isArray(value)) {
      goog.array.forEach(value, function(arrayVal) {
        params.push(encodeURIComponent(key) + "=" + encodeURIComponent(arrayVal));
      });
    } else {
      params.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
    }
  });
  return params.length ? "&" + params.join("&") : "";
};
fb.util.querystringDecode = function(querystring) {
  var obj = {};
  var tokens = querystring.replace(/^\?/, "").split("&");
  goog.array.forEach(tokens, function(token) {
    if (token) {
      var key = token.split("=");
      obj[key[0]] = key[1];
    }
  });
  return obj;
};
goog.provide("fb.util.validation");
fb.util.validation.validateArgCount = function(fnName, minCount, maxCount, argCount) {
  var argError;
  if (argCount < minCount) {
    argError = "at least " + minCount;
  } else {
    if (argCount > maxCount) {
      argError = maxCount === 0 ? "none" : "no more than " + maxCount;
    }
  }
  if (argError) {
    var error = fnName + " failed: Was called with " + argCount + (argCount === 1 ? " argument." : " arguments.") + " Expects " + argError + ".";
    throw new Error(error);
  }
};
fb.util.validation.errorPrefix = function(fnName, argumentNumber, optional) {
  var argName = "";
  switch(argumentNumber) {
    case 1:
      argName = optional ? "first" : "First";
      break;
    case 2:
      argName = optional ? "second" : "Second";
      break;
    case 3:
      argName = optional ? "third" : "Third";
      break;
    case 4:
      argName = optional ? "fourth" : "Fourth";
      break;
    default:
      throw new Error("errorPrefix called with argumentNumber > 4.  Need to update it?");;
  }
  var error = fnName + " failed: ";
  error += argName + " argument ";
  return error;
};
fb.util.validation.validateNamespace = function(fnName, argumentNumber, namespace, optional) {
  if (optional && !goog.isDef(namespace)) {
    return;
  }
  if (!goog.isString(namespace)) {
    throw new Error(fb.util.validation.errorPrefix(fnName, argumentNumber, optional) + "must be a valid firebase namespace.");
  }
};
fb.util.validation.validateCallback = function(fnName, argumentNumber, callback, optional) {
  if (optional && !goog.isDef(callback)) {
    return;
  }
  if (!goog.isFunction(callback)) {
    throw new Error(fb.util.validation.errorPrefix(fnName, argumentNumber, optional) + "must be a valid function.");
  }
};
fb.util.validation.validateContextObject = function(fnName, argumentNumber, context, optional) {
  if (optional && !goog.isDef(context)) {
    return;
  }
  if (!goog.isObject(context) || context === null) {
    throw new Error(fb.util.validation.errorPrefix(fnName, argumentNumber, optional) + "must be a valid context object.");
  }
};
goog.provide("fb.util.json");
goog.require("goog.json");
fb.util.json.eval = function(str) {
  if (typeof JSON !== "undefined" && goog.isDef(JSON.parse)) {
    return JSON.parse(str);
  } else {
    return goog.json.parse(str);
  }
};
fb.util.json.stringify = function(data) {
  if (typeof JSON !== "undefined" && goog.isDef(JSON.stringify)) {
    return JSON.stringify(data);
  } else {
    return goog.json.serialize(data);
  }
};
goog.provide("fb.core.SnapshotHolder");
fb.core.SnapshotHolder = function() {
  this.rootNode_ = fb.core.snap.EMPTY_NODE;
};
fb.core.SnapshotHolder.prototype.getNode = function(path) {
  return this.rootNode_.getChild(path);
};
fb.core.SnapshotHolder.prototype.updateSnapshot = function(path, newSnapshotNode) {
  this.rootNode_ = this.rootNode_.updateChild(path, newSnapshotNode);
};
if (goog.DEBUG) {
  fb.core.SnapshotHolder.prototype.toString = function() {
    return this.rootNode_.toString();
  };
}
;goog.provide("fb.core.view.CompleteChildSource");
fb.core.view.CompleteChildSource = function() {
};
fb.core.view.CompleteChildSource.prototype.getCompleteChild = function(childKey) {
};
fb.core.view.CompleteChildSource.prototype.getChildAfterChild = function(index, child, reverse) {
};
fb.core.view.NoCompleteChildSource_ = function() {
};
fb.core.view.NoCompleteChildSource_.prototype.getCompleteChild = function() {
  return null;
};
fb.core.view.NoCompleteChildSource_.prototype.getChildAfterChild = function() {
  return null;
};
fb.core.view.NO_COMPLETE_CHILD_SOURCE = new fb.core.view.NoCompleteChildSource_;
fb.core.view.WriteTreeCompleteChildSource = function(writes, viewCache, optCompleteServerCache) {
  this.writes_ = writes;
  this.viewCache_ = viewCache;
  this.optCompleteServerCache_ = optCompleteServerCache;
};
fb.core.view.WriteTreeCompleteChildSource.prototype.getCompleteChild = function(childKey) {
  var node = this.viewCache_.getEventCache();
  if (node.isCompleteForChild(childKey)) {
    return node.getNode().getImmediateChild(childKey);
  } else {
    var serverNode = this.optCompleteServerCache_ != null ? new fb.core.view.CacheNode(this.optCompleteServerCache_, true, false) : this.viewCache_.getServerCache();
    return this.writes_.calcCompleteChild(childKey, serverNode);
  }
};
fb.core.view.WriteTreeCompleteChildSource.prototype.getChildAfterChild = function(index, child, reverse) {
  var completeServerData = this.optCompleteServerCache_ != null ? this.optCompleteServerCache_ : this.viewCache_.getCompleteServerSnap();
  var nodes = this.writes_.calcIndexedSlice(completeServerData, child, 1, reverse, index);
  if (nodes.length === 0) {
    return null;
  } else {
    return nodes[0];
  }
};
goog.provide("fb.core.view.EventQueue");
fb.core.view.EventQueue = function() {
  this.eventLists_ = [];
  this.recursionDepth_ = 0;
};
fb.core.view.EventQueue.prototype.queueEvents = function(eventDataList) {
  var currList = null;
  for (var i = 0;i < eventDataList.length;i++) {
    var eventData = eventDataList[i];
    var eventPath = eventData.getPath();
    if (currList !== null && !eventPath.equals(currList.getPath())) {
      this.eventLists_.push(currList);
      currList = null;
    }
    if (currList === null) {
      currList = new fb.core.view.EventList(eventPath);
    }
    currList.add(eventData);
  }
  if (currList) {
    this.eventLists_.push(currList);
  }
};
fb.core.view.EventQueue.prototype.raiseEventsAtPath = function(path, eventDataList) {
  this.queueEvents(eventDataList);
  this.raiseQueuedEventsMatchingPredicate_(function(eventPath) {
    return eventPath.equals(path);
  });
};
fb.core.view.EventQueue.prototype.raiseEventsForChangedPath = function(changedPath, eventDataList) {
  this.queueEvents(eventDataList);
  this.raiseQueuedEventsMatchingPredicate_(function(eventPath) {
    return eventPath.contains(changedPath) || changedPath.contains(eventPath);
  });
};
fb.core.view.EventQueue.prototype.raiseQueuedEventsMatchingPredicate_ = function(predicate) {
  this.recursionDepth_++;
  var sentAll = true;
  for (var i = 0;i < this.eventLists_.length;i++) {
    var eventList = this.eventLists_[i];
    if (eventList) {
      var eventPath = eventList.getPath();
      if (predicate(eventPath)) {
        this.eventLists_[i].raise();
        this.eventLists_[i] = null;
      } else {
        sentAll = false;
      }
    }
  }
  if (sentAll) {
    this.eventLists_ = [];
  }
  this.recursionDepth_--;
};
fb.core.view.EventList = function(path) {
  this.path_ = path;
  this.events_ = [];
};
fb.core.view.EventList.prototype.add = function(eventData) {
  this.events_.push(eventData);
};
fb.core.view.EventList.prototype.raise = function() {
  for (var i = 0;i < this.events_.length;i++) {
    var eventData = this.events_[i];
    if (eventData !== null) {
      this.events_[i] = null;
      var eventFn = eventData.getEventRunner();
      if (fb.core.util.logger) {
        fb.core.util.log("event: " + eventData.toString());
      }
      fb.core.util.exceptionGuard(eventFn);
    }
  }
};
fb.core.view.EventList.prototype.getPath = function() {
  return this.path_;
};
goog.provide("fb.core.view.Change");
fb.core.view.Change = function(type, snapshotNode, childName, oldSnap, prevName) {
  this.type = type;
  this.snapshotNode = snapshotNode;
  this.childName = childName;
  this.oldSnap = oldSnap;
  this.prevName = prevName;
};
fb.core.view.Change.valueChange = function(snapshot) {
  return new fb.core.view.Change(fb.core.view.Change.VALUE, snapshot);
};
fb.core.view.Change.childAddedChange = function(childKey, snapshot) {
  return new fb.core.view.Change(fb.core.view.Change.CHILD_ADDED, snapshot, childKey);
};
fb.core.view.Change.childRemovedChange = function(childKey, snapshot) {
  return new fb.core.view.Change(fb.core.view.Change.CHILD_REMOVED, snapshot, childKey);
};
fb.core.view.Change.childChangedChange = function(childKey, newSnapshot, oldSnapshot) {
  return new fb.core.view.Change(fb.core.view.Change.CHILD_CHANGED, newSnapshot, childKey, oldSnapshot);
};
fb.core.view.Change.childMovedChange = function(childKey, snapshot) {
  return new fb.core.view.Change(fb.core.view.Change.CHILD_MOVED, snapshot, childKey);
};
fb.core.view.Change.prototype.changeWithPrevName = function(prevName) {
  return new fb.core.view.Change(this.type, this.snapshotNode, this.childName, this.oldSnap, prevName);
};
fb.core.view.Change.CHILD_ADDED = "child_added";
fb.core.view.Change.CHILD_REMOVED = "child_removed";
fb.core.view.Change.CHILD_CHANGED = "child_changed";
fb.core.view.Change.CHILD_MOVED = "child_moved";
fb.core.view.Change.VALUE = "value";
goog.provide("fb.core.view.Event");
fb.core.view.Event = function() {
};
fb.core.view.Event.prototype.getPath;
fb.core.view.Event.prototype.getEventType;
fb.core.view.Event.prototype.getEventRunner;
fb.core.view.Event.prototype.toString;
fb.core.view.DataEvent = function(eventType, eventRegistration, snapshot, prevName) {
  this.eventRegistration = eventRegistration;
  this.snapshot = snapshot;
  this.prevName = prevName;
  this.eventType = eventType;
};
fb.core.view.DataEvent.prototype.getPath = function() {
  var ref = this.snapshot.ref();
  if (this.eventType === "value") {
    return ref.path;
  } else {
    return ref.parent().path;
  }
};
fb.core.view.DataEvent.prototype.getEventType = function() {
  return this.eventType;
};
fb.core.view.DataEvent.prototype.getEventRunner = function() {
  return this.eventRegistration.getEventRunner(this);
};
fb.core.view.DataEvent.prototype.toString = function() {
  return this.getPath().toString() + ":" + this.eventType + ":" + fb.util.json.stringify(this.snapshot.exportVal());
};
fb.core.view.CancelEvent = function(eventRegistration, error, path) {
  this.eventRegistration = eventRegistration;
  this.error = error;
  this.path = path;
};
fb.core.view.CancelEvent.prototype.getPath = function() {
  return this.path;
};
fb.core.view.CancelEvent.prototype.getEventType = function() {
  return "cancel";
};
fb.core.view.CancelEvent.prototype.getEventRunner = function() {
  return this.eventRegistration.getEventRunner(this);
};
fb.core.view.CancelEvent.prototype.toString = function() {
  return this.path.toString() + ":cancel";
};
goog.provide("fb.core.view.CacheNode");
fb.core.view.CacheNode = function(node, fullyInitialized, filtered) {
  this.node_ = node;
  this.fullyInitialized_ = fullyInitialized;
  this.filtered_ = filtered;
};
fb.core.view.CacheNode.prototype.isFullyInitialized = function() {
  return this.fullyInitialized_;
};
fb.core.view.CacheNode.prototype.isFiltered = function() {
  return this.filtered_;
};
fb.core.view.CacheNode.prototype.isCompleteForPath = function(path) {
  if (path.isEmpty()) {
    return this.isFullyInitialized() && !this.filtered_;
  } else {
    var childKey = path.getFront();
    return this.isCompleteForChild(childKey);
  }
};
fb.core.view.CacheNode.prototype.isCompleteForChild = function(key) {
  return this.isFullyInitialized() && !this.filtered_ || this.node_.hasChild(key);
};
fb.core.view.CacheNode.prototype.getNode = function() {
  return this.node_;
};
goog.provide("fb.core.stats.StatsListener");
fb.core.stats.StatsListener = function(collection) {
  this.collection_ = collection;
  this.last_ = null;
};
fb.core.stats.StatsListener.prototype.get = function() {
  var newStats = this.collection_.get();
  var delta = goog.object.clone(newStats);
  if (this.last_) {
    for (var stat in this.last_) {
      delta[stat] = delta[stat] - this.last_[stat];
    }
  }
  this.last_ = newStats;
  return delta;
};
goog.provide("fb.core.stats.StatsReporter");
var FIRST_STATS_MIN_TIME = 10 * 1E3;
var FIRST_STATS_MAX_TIME = 30 * 1E3;
var REPORT_STATS_INTERVAL = 5 * 60 * 1E3;
fb.core.stats.StatsReporter = function(collection, connection) {
  this.statsToReport_ = {};
  this.statsListener_ = new fb.core.stats.StatsListener(collection);
  this.server_ = connection;
  var timeout = FIRST_STATS_MIN_TIME + (FIRST_STATS_MAX_TIME - FIRST_STATS_MIN_TIME) * Math.random();
  setTimeout(goog.bind(this.reportStats_, this), Math.floor(timeout));
};
fb.core.stats.StatsReporter.prototype.includeStat = function(stat) {
  this.statsToReport_[stat] = true;
};
fb.core.stats.StatsReporter.prototype.reportStats_ = function() {
  var stats = this.statsListener_.get();
  var reportedStats = {};
  var haveStatsToReport = false;
  for (var stat in stats) {
    if (stats[stat] > 0 && fb.util.obj.contains(this.statsToReport_, stat)) {
      reportedStats[stat] = stats[stat];
      haveStatsToReport = true;
    }
  }
  if (haveStatsToReport) {
    this.server_.reportStats(reportedStats);
  }
  setTimeout(goog.bind(this.reportStats_, this), Math.floor(Math.random() * 2 * REPORT_STATS_INTERVAL));
};
goog.provide("fb.core.stats.StatsCollection");
goog.require("fb.util.obj");
goog.require("goog.array");
goog.require("goog.object");
fb.core.stats.StatsCollection = function() {
  this.counters_ = {};
};
fb.core.stats.StatsCollection.prototype.incrementCounter = function(name, amount) {
  if (!goog.isDef(amount)) {
    amount = 1;
  }
  if (!fb.util.obj.contains(this.counters_, name)) {
    this.counters_[name] = 0;
  }
  this.counters_[name] += amount;
};
fb.core.stats.StatsCollection.prototype.get = function() {
  return goog.object.clone(this.counters_);
};
goog.provide("fb.core.stats.StatsManager");
goog.require("fb.core.stats.StatsCollection");
goog.require("fb.core.stats.StatsListener");
goog.require("fb.core.stats.StatsReporter");
fb.core.stats.StatsManager = {};
fb.core.stats.StatsManager.collections_ = {};
fb.core.stats.StatsManager.reporters_ = {};
fb.core.stats.StatsManager.getCollection = function(repoInfo) {
  var hashString = repoInfo.toString();
  if (!fb.core.stats.StatsManager.collections_[hashString]) {
    fb.core.stats.StatsManager.collections_[hashString] = new fb.core.stats.StatsCollection;
  }
  return fb.core.stats.StatsManager.collections_[hashString];
};
fb.core.stats.StatsManager.getOrCreateReporter = function(repoInfo, creatorFunction) {
  var hashString = repoInfo.toString();
  if (!fb.core.stats.StatsManager.reporters_[hashString]) {
    fb.core.stats.StatsManager.reporters_[hashString] = creatorFunction();
  }
  return fb.core.stats.StatsManager.reporters_[hashString];
};
goog.provide("fb.core.ServerActions");
fb.core.ServerActions = goog.defineClass(null, {listen:goog.abstractMethod, unlisten:goog.abstractMethod, put:goog.abstractMethod, merge:goog.abstractMethod, auth:goog.abstractMethod, unauth:goog.abstractMethod, onDisconnectPut:goog.abstractMethod, onDisconnectMerge:goog.abstractMethod, onDisconnectCancel:goog.abstractMethod, reportStats:goog.abstractMethod});
goog.provide("fb.core.snap.Node");
goog.provide("fb.core.snap.NamedNode");
fb.core.snap.Node = function() {
};
fb.core.snap.Node.prototype.isLeafNode;
fb.core.snap.Node.prototype.getPriority;
fb.core.snap.Node.prototype.updatePriority;
fb.core.snap.Node.prototype.getImmediateChild;
fb.core.snap.Node.prototype.getChild;
fb.core.snap.Node.prototype.getPredecessorChildName;
fb.core.snap.Node.prototype.updateImmediateChild;
fb.core.snap.Node.prototype.updateChild;
fb.core.snap.Node.prototype.hasChild;
fb.core.snap.Node.prototype.isEmpty;
fb.core.snap.Node.prototype.numChildren;
fb.core.snap.Node.prototype.forEachChild;
fb.core.snap.Node.prototype.val;
fb.core.snap.Node.prototype.hash;
fb.core.snap.Node.prototype.compareTo;
fb.core.snap.Node.prototype.equals;
fb.core.snap.Node.prototype.withIndex;
fb.core.snap.Node.prototype.isIndexed;
fb.core.snap.NamedNode = function(name, node) {
  this.name = name;
  this.node = node;
};
fb.core.snap.NamedNode.Wrap = function(name, node) {
  return new fb.core.snap.NamedNode(name, node);
};
goog.provide("fb.core.snap.comparators");
fb.core.snap.NAME_ONLY_COMPARATOR = function(left, right) {
  return fb.core.util.nameCompare(left.name, right.name);
};
fb.core.snap.NAME_COMPARATOR = function(left, right) {
  return fb.core.util.nameCompare(left, right);
};
goog.provide("fb.core.operation.Overwrite");
fb.core.operation.Overwrite = function(source, path, snap) {
  this.type = fb.core.OperationType.OVERWRITE;
  this.source = source;
  this.path = path;
  this.snap = snap;
};
fb.core.operation.Overwrite.prototype.operationForChild = function(childName) {
  if (this.path.isEmpty()) {
    return new fb.core.operation.Overwrite(this.source, fb.core.util.Path.Empty, this.snap.getImmediateChild(childName));
  } else {
    return new fb.core.operation.Overwrite(this.source, this.path.popFront(), this.snap);
  }
};
if (goog.DEBUG) {
  fb.core.operation.Overwrite.prototype.toString = function() {
    return "Operation(" + this.path + ": " + this.source.toString() + " overwrite: " + this.snap.toString() + ")";
  };
}
;goog.provide("fb.core.operation.ListenComplete");
fb.core.operation.ListenComplete = function(source, path) {
  this.type = fb.core.OperationType.LISTEN_COMPLETE;
  this.source = source;
  this.path = path;
};
fb.core.operation.ListenComplete.prototype.operationForChild = function(childName) {
  if (this.path.isEmpty()) {
    return new fb.core.operation.ListenComplete(this.source, fb.core.util.Path.Empty);
  } else {
    return new fb.core.operation.ListenComplete(this.source, this.path.popFront());
  }
};
if (goog.DEBUG) {
  fb.core.operation.ListenComplete.prototype.toString = function() {
    return "Operation(" + this.path + ": " + this.source.toString() + " listen_complete)";
  };
}
;goog.provide("fb.core.util.SortedMap");
goog.require("goog.array");
fb.Comparator;
fb.core.util.SortedMap = goog.defineClass(null, {constructor:function(comparator, opt_root) {
  this.comparator_ = comparator;
  this.root_ = opt_root ? opt_root : fb.core.util.SortedMap.EMPTY_NODE_;
}, insert:function(key, value) {
  return new fb.core.util.SortedMap(this.comparator_, this.root_.insert(key, value, this.comparator_).copy(null, null, fb.LLRBNode.BLACK, null, null));
}, remove:function(key) {
  return new fb.core.util.SortedMap(this.comparator_, this.root_.remove(key, this.comparator_).copy(null, null, fb.LLRBNode.BLACK, null, null));
}, get:function(key) {
  var cmp;
  var node = this.root_;
  while (!node.isEmpty()) {
    cmp = this.comparator_(key, node.key);
    if (cmp === 0) {
      return node.value;
    } else {
      if (cmp < 0) {
        node = node.left;
      } else {
        if (cmp > 0) {
          node = node.right;
        }
      }
    }
  }
  return null;
}, getPredecessorKey:function(key) {
  var cmp, node = this.root_, rightParent = null;
  while (!node.isEmpty()) {
    cmp = this.comparator_(key, node.key);
    if (cmp === 0) {
      if (!node.left.isEmpty()) {
        node = node.left;
        while (!node.right.isEmpty()) {
          node = node.right;
        }
        return node.key;
      } else {
        if (rightParent) {
          return rightParent.key;
        } else {
          return null;
        }
      }
    } else {
      if (cmp < 0) {
        node = node.left;
      } else {
        if (cmp > 0) {
          rightParent = node;
          node = node.right;
        }
      }
    }
  }
  throw new Error("Attempted to find predecessor key for a nonexistent key.  What gives?");
}, isEmpty:function() {
  return this.root_.isEmpty();
}, count:function() {
  return this.root_.count();
}, minKey:function() {
  return this.root_.minKey();
}, maxKey:function() {
  return this.root_.maxKey();
}, inorderTraversal:function(action) {
  return this.root_.inorderTraversal(action);
}, reverseTraversal:function(action) {
  return this.root_.reverseTraversal(action);
}, getIterator:function(opt_resultGenerator) {
  return new fb.core.util.SortedMapIterator(this.root_, null, this.comparator_, false, opt_resultGenerator);
}, getIteratorFrom:function(key, opt_resultGenerator) {
  return new fb.core.util.SortedMapIterator(this.root_, key, this.comparator_, false, opt_resultGenerator);
}, getReverseIteratorFrom:function(key, opt_resultGenerator) {
  return new fb.core.util.SortedMapIterator(this.root_, key, this.comparator_, true, opt_resultGenerator);
}, getReverseIterator:function(opt_resultGenerator) {
  return new fb.core.util.SortedMapIterator(this.root_, null, this.comparator_, true, opt_resultGenerator);
}});
fb.core.util.SortedMapIterator = goog.defineClass(null, {constructor:function(node, startKey, comparator, isReverse, opt_resultGenerator) {
  this.resultGenerator_ = opt_resultGenerator || null;
  this.isReverse_ = isReverse;
  this.nodeStack_ = [];
  var cmp = 1;
  while (!node.isEmpty()) {
    cmp = startKey ? comparator(node.key, startKey) : 1;
    if (isReverse) {
      cmp *= -1;
    }
    if (cmp < 0) {
      if (this.isReverse_) {
        node = node.left;
      } else {
        node = node.right;
      }
    } else {
      if (cmp === 0) {
        this.nodeStack_.push(node);
        break;
      } else {
        this.nodeStack_.push(node);
        if (this.isReverse_) {
          node = node.right;
        } else {
          node = node.left;
        }
      }
    }
  }
}, getNext:function() {
  if (this.nodeStack_.length === 0) {
    return null;
  }
  var node = this.nodeStack_.pop(), result;
  if (this.resultGenerator_) {
    result = this.resultGenerator_(node.key, node.value);
  } else {
    result = {key:node.key, value:node.value};
  }
  if (this.isReverse_) {
    node = node.left;
    while (!node.isEmpty()) {
      this.nodeStack_.push(node);
      node = node.right;
    }
  } else {
    node = node.right;
    while (!node.isEmpty()) {
      this.nodeStack_.push(node);
      node = node.left;
    }
  }
  return result;
}, hasNext:function() {
  return this.nodeStack_.length > 0;
}, peek:function() {
  if (this.nodeStack_.length === 0) {
    return null;
  }
  var node = goog.array.peek(this.nodeStack_);
  if (this.resultGenerator_) {
    return this.resultGenerator_(node.key, node.value);
  } else {
    return{key:node.key, value:node.value};
  }
}});
fb.LLRBNode = goog.defineClass(null, {constructor:function(key, value, color, opt_left, opt_right) {
  this.key = key;
  this.value = value;
  this.color = color != null ? color : fb.LLRBNode.RED;
  this.left = opt_left != null ? opt_left : fb.core.util.SortedMap.EMPTY_NODE_;
  this.right = opt_right != null ? opt_right : fb.core.util.SortedMap.EMPTY_NODE_;
}, statics:{RED:true, BLACK:false}, copy:function(key, value, color, left, right) {
  return new fb.LLRBNode(key != null ? key : this.key, value != null ? value : this.value, color != null ? color : this.color, left != null ? left : this.left, right != null ? right : this.right);
}, count:function() {
  return this.left.count() + 1 + this.right.count();
}, isEmpty:function() {
  return false;
}, inorderTraversal:function(action) {
  return this.left.inorderTraversal(action) || action(this.key, this.value) || this.right.inorderTraversal(action);
}, reverseTraversal:function(action) {
  return this.right.reverseTraversal(action) || action(this.key, this.value) || this.left.reverseTraversal(action);
}, min_:function() {
  if (this.left.isEmpty()) {
    return this;
  } else {
    return this.left.min_();
  }
}, minKey:function() {
  return this.min_().key;
}, maxKey:function() {
  if (this.right.isEmpty()) {
    return this.key;
  } else {
    return this.right.maxKey();
  }
}, insert:function(key, value, comparator) {
  var cmp, n;
  n = this;
  cmp = comparator(key, n.key);
  if (cmp < 0) {
    n = n.copy(null, null, null, n.left.insert(key, value, comparator), null);
  } else {
    if (cmp === 0) {
      n = n.copy(null, value, null, null, null);
    } else {
      n = n.copy(null, null, null, null, n.right.insert(key, value, comparator));
    }
  }
  return n.fixUp_();
}, removeMin_:function() {
  var n;
  if (this.left.isEmpty()) {
    return fb.core.util.SortedMap.EMPTY_NODE_;
  }
  n = this;
  if (!n.left.isRed_() && !n.left.left.isRed_()) {
    n = n.moveRedLeft_();
  }
  n = n.copy(null, null, null, n.left.removeMin_(), null);
  return n.fixUp_();
}, remove:function(key, comparator) {
  var n, smallest;
  n = this;
  if (comparator(key, n.key) < 0) {
    if (!n.left.isEmpty() && !n.left.isRed_() && !n.left.left.isRed_()) {
      n = n.moveRedLeft_();
    }
    n = n.copy(null, null, null, n.left.remove(key, comparator), null);
  } else {
    if (n.left.isRed_()) {
      n = n.rotateRight_();
    }
    if (!n.right.isEmpty() && !n.right.isRed_() && !n.right.left.isRed_()) {
      n = n.moveRedRight_();
    }
    if (comparator(key, n.key) === 0) {
      if (n.right.isEmpty()) {
        return fb.core.util.SortedMap.EMPTY_NODE_;
      } else {
        smallest = n.right.min_();
        n = n.copy(smallest.key, smallest.value, null, null, n.right.removeMin_());
      }
    }
    n = n.copy(null, null, null, null, n.right.remove(key, comparator));
  }
  return n.fixUp_();
}, isRed_:function() {
  return this.color;
}, fixUp_:function() {
  var n = this;
  if (n.right.isRed_() && !n.left.isRed_()) {
    n = n.rotateLeft_();
  }
  if (n.left.isRed_() && n.left.left.isRed_()) {
    n = n.rotateRight_();
  }
  if (n.left.isRed_() && n.right.isRed_()) {
    n = n.colorFlip_();
  }
  return n;
}, moveRedLeft_:function() {
  var n = this.colorFlip_();
  if (n.right.left.isRed_()) {
    n = n.copy(null, null, null, null, n.right.rotateRight_());
    n = n.rotateLeft_();
    n = n.colorFlip_();
  }
  return n;
}, moveRedRight_:function() {
  var n = this.colorFlip_();
  if (n.left.left.isRed_()) {
    n = n.rotateRight_();
    n = n.colorFlip_();
  }
  return n;
}, rotateLeft_:function() {
  var nl;
  nl = this.copy(null, null, fb.LLRBNode.RED, null, this.right.left);
  return this.right.copy(null, null, this.color, nl, null);
}, rotateRight_:function() {
  var nr;
  nr = this.copy(null, null, fb.LLRBNode.RED, this.left.right, null);
  return this.left.copy(null, null, this.color, null, nr);
}, colorFlip_:function() {
  var left, right;
  left = this.left.copy(null, null, !this.left.color, null, null);
  right = this.right.copy(null, null, !this.right.color, null, null);
  return this.copy(null, null, !this.color, left, right);
}, checkMaxDepth_:function() {
  var blackDepth;
  blackDepth = this.check_();
  if (Math.pow(2, blackDepth) <= this.count() + 1) {
    return true;
  } else {
    return false;
  }
}, check_:function() {
  var blackDepth;
  if (this.isRed_() && this.left.isRed_()) {
    throw new Error("Red node has red child(" + this.key + "," + this.value + ")");
  }
  if (this.right.isRed_()) {
    throw new Error("Right child of (" + this.key + "," + this.value + ") is red");
  }
  blackDepth = this.left.check_();
  if (blackDepth !== this.right.check_()) {
    throw new Error("Black depths differ");
  } else {
    return blackDepth + (this.isRed_() ? 0 : 1);
  }
}});
fb.LLRBEmptyNode = goog.defineClass(null, {constructor:function() {
}, copy:function() {
  return this;
}, insert:function(key, value, comparator) {
  return new fb.LLRBNode(key, value, null);
}, remove:function(key, comparator) {
  return this;
}, count:function() {
  return 0;
}, isEmpty:function() {
  return true;
}, inorderTraversal:function(action) {
  return false;
}, reverseTraversal:function(action) {
  return false;
}, minKey:function() {
  return null;
}, maxKey:function() {
  return null;
}, check_:function() {
  return 0;
}, isRed_:function() {
  return false;
}});
fb.core.util.SortedMap.EMPTY_NODE_ = new fb.LLRBEmptyNode;
goog.provide("fb.core.util.NodePatches");
(function() {
  if (NODE_CLIENT) {
    var version = process["version"];
    if (version === "v0.10.22" || version === "v0.10.23" || version === "v0.10.24") {
      var Writable = require("_stream_writable");
      Writable["prototype"]["write"] = function(chunk, encoding, cb) {
        var state = this["_writableState"];
        var ret = false;
        if (typeof encoding === "function") {
          cb = encoding;
          encoding = null;
        }
        if (Buffer["isBuffer"](chunk)) {
          encoding = "buffer";
        } else {
          if (!encoding) {
            encoding = state["defaultEncoding"];
          }
        }
        if (typeof cb !== "function") {
          cb = function() {
          };
        }
        if (state["ended"]) {
          writeAfterEnd(this, state, cb);
        } else {
          if (validChunk(this, state, chunk, cb)) {
            ret = writeOrBuffer(this, state, chunk, encoding, cb);
          }
        }
        return ret;
      };
      function writeAfterEnd(stream, state, cb) {
        var er = new Error("write after end");
        stream["emit"]("error", er);
        process["nextTick"](function() {
          cb(er);
        });
      }
      function validChunk(stream, state, chunk, cb) {
        var valid = true;
        if (!Buffer["isBuffer"](chunk) && "string" !== typeof chunk && chunk !== null && chunk !== undefined && !state["objectMode"]) {
          var er = new TypeError("Invalid non-string/buffer chunk");
          stream["emit"]("error", er);
          process["nextTick"](function() {
            cb(er);
          });
          valid = false;
        }
        return valid;
      }
      function writeOrBuffer(stream, state, chunk, encoding, cb) {
        chunk = decodeChunk(state, chunk, encoding);
        if (Buffer["isBuffer"](chunk)) {
          encoding = "buffer";
        }
        var len = state["objectMode"] ? 1 : chunk["length"];
        state["length"] += len;
        var ret = state["length"] < state["highWaterMark"];
        if (!ret) {
          state["needDrain"] = true;
        }
        if (state["writing"]) {
          state["buffer"]["push"](new WriteReq(chunk, encoding, cb));
        } else {
          doWrite(stream, state, len, chunk, encoding, cb);
        }
        return ret;
      }
      function decodeChunk(state, chunk, encoding) {
        if (!state["objectMode"] && state["decodeStrings"] !== false && typeof chunk === "string") {
          chunk = new Buffer(chunk, encoding);
        }
        return chunk;
      }
      function WriteReq(chunk, encoding, cb) {
        this["chunk"] = chunk;
        this["encoding"] = encoding;
        this["callback"] = cb;
      }
      function doWrite(stream, state, len, chunk, encoding, cb) {
        state["writelen"] = len;
        state["writecb"] = cb;
        state["writing"] = true;
        state["sync"] = true;
        stream["_write"](chunk, encoding, state["onwrite"]);
        state["sync"] = false;
      }
      var Duplex = require("_stream_duplex");
      Duplex["prototype"]["write"] = Writable["prototype"]["write"];
    }
  }
})();
goog.provide("fb.core.util.ServerValues");
fb.core.util.ServerValues.generateWithValues = function(values) {
  values = values || {};
  values["timestamp"] = values["timestamp"] || (new Date).getTime();
  return values;
};
fb.core.util.ServerValues.resolveDeferredValue = function(value, serverValues) {
  if (!value || typeof value !== "object") {
    return(value);
  } else {
    fb.core.util.assert(".sv" in value, "Unexpected leaf node or priority contents");
    return serverValues[value[".sv"]];
  }
};
fb.core.util.ServerValues.resolveDeferredValueTree = function(tree, serverValues) {
  var resolvedTree = new fb.core.SparseSnapshotTree;
  tree.forEachTree(new fb.core.util.Path(""), function(path, node) {
    resolvedTree.remember(path, fb.core.util.ServerValues.resolveDeferredValueSnapshot(node, serverValues));
  });
  return resolvedTree;
};
fb.core.util.ServerValues.resolveDeferredValueSnapshot = function(node, serverValues) {
  var rawPri = (node.getPriority().val()), priority = fb.core.util.ServerValues.resolveDeferredValue(rawPri, serverValues), newNode;
  if (node.isLeafNode()) {
    var leafNode = (node);
    var value = fb.core.util.ServerValues.resolveDeferredValue(leafNode.getValue(), serverValues);
    if (value !== leafNode.getValue() || priority !== leafNode.getPriority().val()) {
      return new fb.core.snap.LeafNode(value, fb.core.snap.NodeFromJSON(priority));
    } else {
      return node;
    }
  } else {
    var childrenNode = (node);
    newNode = childrenNode;
    if (priority !== childrenNode.getPriority().val()) {
      newNode = newNode.updatePriority(new fb.core.snap.LeafNode(priority));
    }
    childrenNode.forEachChild(fb.core.snap.PriorityIndex, function(childName, childNode) {
      var newChildNode = fb.core.util.ServerValues.resolveDeferredValueSnapshot(childNode, serverValues);
      if (newChildNode !== childNode) {
        newNode = newNode.updateImmediateChild(childName, newChildNode);
      }
    });
    return newNode;
  }
};
goog.provide("fb.core.storage.MemoryStorage");
goog.require("fb.util.obj");
goog.scope(function() {
  var obj = fb.util.obj;
  fb.core.storage.MemoryStorage = function() {
    this.cache_ = {};
  };
  var MemoryStorage = fb.core.storage.MemoryStorage;
  MemoryStorage.prototype.set = function(key, value) {
    if (value == null) {
      delete this.cache_[key];
    } else {
      this.cache_[key] = value;
    }
  };
  MemoryStorage.prototype.get = function(key) {
    if (obj.contains(this.cache_, key)) {
      return this.cache_[key];
    }
    return null;
  };
  MemoryStorage.prototype.remove = function(key) {
    delete this.cache_[key];
  };
  MemoryStorage.prototype.isInMemoryStorage = true;
});
goog.provide("fb.core.storage.DOMStorageWrapper");
goog.require("fb.util.obj");
goog.scope(function() {
  fb.core.storage.DOMStorageWrapper = function(domStorage) {
    this.domStorage_ = domStorage;
    this.prefix_ = "firebase:";
  };
  var DOMStorageWrapper = fb.core.storage.DOMStorageWrapper;
  DOMStorageWrapper.prototype.set = function(key, value) {
    if (value == null) {
      this.domStorage_.removeItem(this.prefixedName_(key));
    } else {
      this.domStorage_.setItem(this.prefixedName_(key), fb.util.json.stringify(value));
    }
  };
  DOMStorageWrapper.prototype.get = function(key) {
    var storedVal = this.domStorage_.getItem(this.prefixedName_(key));
    if (storedVal == null) {
      return null;
    } else {
      return fb.util.json.eval(storedVal);
    }
  };
  DOMStorageWrapper.prototype.remove = function(key) {
    this.domStorage_.removeItem(this.prefixedName_(key));
  };
  DOMStorageWrapper.prototype.isInMemoryStorage = false;
  DOMStorageWrapper.prototype.prefixedName_ = function(name) {
    return this.prefix_ + name;
  };
  DOMStorageWrapper.prototype.toString = function() {
    return this.domStorage_.toString();
  };
});
goog.provide("fb.core.storage");
goog.require("fb.core.storage.DOMStorageWrapper");
goog.require("fb.core.storage.MemoryStorage");
fb.core.storage.createStoragefor = function(domStorageName) {
  try {
    if (typeof window !== "undefined" && typeof window[domStorageName] !== "undefined") {
      var domStorage = window[domStorageName];
      domStorage.setItem("firebase:sentinel", "cache");
      domStorage.removeItem("firebase:sentinel");
      return new fb.core.storage.DOMStorageWrapper(domStorage);
    }
  } catch (e) {
  }
  return new fb.core.storage.MemoryStorage;
};
fb.core.storage.PersistentStorage = fb.core.storage.createStoragefor("localStorage");
fb.core.storage.SessionStorage = fb.core.storage.createStoragefor("sessionStorage");
goog.provide("fb.core.RepoInfo");
goog.require("fb.core.storage");
fb.core.RepoInfo = function(host, secure, namespace, webSocketOnly, persistenceKey) {
  this.host = host.toLowerCase();
  this.domain = this.host.substr(this.host.indexOf(".") + 1);
  this.secure = secure;
  this.namespace = namespace;
  this.webSocketOnly = webSocketOnly;
  this.persistenceKey = persistenceKey || "";
  this.internalHost = fb.core.storage.PersistentStorage.get("host:" + host) || this.host;
};
fb.core.RepoInfo.prototype.needsQueryParam = function() {
  return this.host !== this.internalHost;
};
fb.core.RepoInfo.prototype.isCacheableHost = function() {
  return this.internalHost.substr(0, 2) === "s-";
};
fb.core.RepoInfo.prototype.isDemoHost = function() {
  return this.domain === "firebaseio-demo.com";
};
fb.core.RepoInfo.prototype.isCustomHost = function() {
  return this.domain !== "firebaseio.com" && this.domain !== "firebaseio-demo.com";
};
fb.core.RepoInfo.prototype.updateHost = function(newHost) {
  if (newHost !== this.internalHost) {
    this.internalHost = newHost;
    if (this.isCacheableHost()) {
      fb.core.storage.PersistentStorage.set("host:" + this.host, this.internalHost);
    }
  }
};
fb.core.RepoInfo.prototype.connectionURL = function(type, params) {
  fb.core.util.assert(typeof type === "string", "typeof type must == string");
  fb.core.util.assert(typeof params === "object", "typeof params must == object");
  var connURL;
  if (type === fb.realtime.Constants.WEBSOCKET) {
    connURL = (this.secure ? "wss://" : "ws://") + this.internalHost + "/.ws?";
  } else {
    if (type === fb.realtime.Constants.LONG_POLLING) {
      connURL = (this.secure ? "https://" : "http://") + this.internalHost + "/.lp?";
    } else {
      throw new Error("Unknown connection type: " + type);
    }
  }
  if (this.needsQueryParam()) {
    params["ns"] = this.namespace;
  }
  var pairs = [];
  goog.object.forEach(params, function(element, index, obj) {
    pairs.push(index + "=" + element);
  });
  return connURL + pairs.join("&");
};
fb.core.RepoInfo.prototype.toString = function() {
  var str = (this.secure ? "https://" : "http://") + this.host;
  if (this.persistenceKey) {
    str += "<" + this.persistenceKey + ">";
  }
  return str;
};
goog.provide("fb.core.util");
goog.require("fb.constants");
goog.require("fb.core.RepoInfo");
goog.require("fb.core.storage");
goog.require("fb.util.json");
goog.require("goog.crypt.Sha1");
goog.require("goog.crypt.base64");
goog.require("goog.object");
goog.require("goog.string");
fb.core.util.LUIDGenerator = function() {
  var id = 1;
  return function() {
    return id++;
  };
}();
fb.core.util.assert = function(assertion, message) {
  if (!assertion) {
    throw fb.core.util.assertionError(message);
  }
};
fb.core.util.assertionError = function(message) {
  return new Error("Firebase (" + Firebase.SDK_VERSION + ") INTERNAL ASSERT FAILED: " + message);
};
fb.core.util.assertWeak = function(assertion, message) {
  if (!assertion) {
    fb.core.util.error(message);
  }
};
fb.core.util.base64Encode = function(str) {
  var utf8Bytes = fb.util.utf8.stringToByteArray(str);
  return goog.crypt.base64.encodeByteArray(utf8Bytes, true);
};
fb.core.util.base64Decode = function(str) {
  try {
    if (NODE_CLIENT) {
      return(new Buffer(str, "base64")).toString("utf8");
    } else {
      if (typeof atob !== "undefined") {
        return atob(str);
      } else {
        return goog.crypt.base64.decodeString(str, true);
      }
    }
  } catch (e) {
    fb.core.util.log("base64Decode failed: ", e);
  }
  return null;
};
fb.core.util.sha1 = function(str) {
  var utf8Bytes = fb.util.utf8.stringToByteArray(str);
  var sha1 = new goog.crypt.Sha1;
  sha1.update(utf8Bytes);
  var sha1Bytes = sha1.digest();
  return goog.crypt.base64.encodeByteArray(sha1Bytes);
};
fb.core.util.buildLogMessage_ = function(var_args) {
  var message = "";
  for (var i = 0;i < arguments.length;i++) {
    if (goog.isArrayLike(arguments[i])) {
      message += fb.core.util.buildLogMessage_.apply(null, arguments[i]);
    } else {
      if (typeof arguments[i] === "object") {
        message += fb.util.json.stringify(arguments[i]);
      } else {
        message += arguments[i];
      }
    }
    message += " ";
  }
  return message;
};
fb.core.util.logger = null;
fb.core.util.firstLog_ = true;
fb.core.util.log = function(var_args) {
  if (fb.core.util.firstLog_ === true) {
    fb.core.util.firstLog_ = false;
    if (fb.core.util.logger === null && fb.core.storage.SessionStorage.get("logging_enabled") === true) {
      Firebase.enableLogging(true);
    }
  }
  if (fb.core.util.logger) {
    var message = fb.core.util.buildLogMessage_.apply(null, arguments);
    fb.core.util.logger(message);
  }
};
fb.core.util.logWrapper = function(prefix) {
  return function() {
    fb.core.util.log(prefix, arguments);
  };
};
fb.core.util.error = function(var_args) {
  if (typeof console !== "undefined") {
    var message = "FIREBASE INTERNAL ERROR: " + fb.core.util.buildLogMessage_.apply(null, arguments);
    if (typeof console.error !== "undefined") {
      console.error(message);
    } else {
      console.log(message);
    }
  }
};
fb.core.util.fatal = function(var_args) {
  var message = fb.core.util.buildLogMessage_.apply(null, arguments);
  throw new Error("FIREBASE FATAL ERROR: " + message);
};
fb.core.util.warn = function(var_args) {
  if (typeof console !== "undefined") {
    var message = "FIREBASE WARNING: " + fb.core.util.buildLogMessage_.apply(null, arguments);
    if (typeof console.warn !== "undefined") {
      console.warn(message);
    } else {
      console.log(message);
    }
  }
};
fb.core.util.warnIfPageIsSecure = function() {
  if (typeof window !== "undefined" && window.location && window.location.protocol && window.location.protocol.indexOf("https:") !== -1) {
    fb.core.util.warn("Insecure Firebase access from a secure page. " + "Please use https in calls to new Firebase().");
  }
};
fb.core.util.warnAboutUnsupportedMethod = function(methodName) {
  fb.core.util.warn(methodName + " is unsupported and will likely change soon.  " + "Please do not use.");
};
fb.core.util.parseRepoInfo = function(dataURL) {
  var parsedUrl = fb.core.util.parseURL(dataURL), namespace = parsedUrl.subdomain;
  if (parsedUrl.domain === "firebase") {
    fb.core.util.fatal(parsedUrl.host + " is no longer supported. " + "Please use <YOUR FIREBASE>.firebaseio.com instead");
  }
  if (!namespace || namespace == "undefined") {
    fb.core.util.fatal("Cannot parse Firebase url. " + "Please use https://<YOUR FIREBASE>.firebaseio.com");
  }
  if (!parsedUrl.secure) {
    fb.core.util.warnIfPageIsSecure();
  }
  var webSocketOnly = parsedUrl.scheme === "ws" || parsedUrl.scheme === "wss";
  return{repoInfo:new fb.core.RepoInfo(parsedUrl.host, parsedUrl.secure, namespace, webSocketOnly), path:new fb.core.util.Path(parsedUrl.pathString)};
};
fb.core.util.parseURL = function(dataURL) {
  var host = "", domain = "", subdomain = "", pathString = "";
  var secure = true, scheme = "https", port = 443;
  if (goog.isString(dataURL)) {
    var colonInd = dataURL.indexOf("//");
    if (colonInd >= 0) {
      scheme = dataURL.substring(0, colonInd - 1);
      dataURL = dataURL.substring(colonInd + 2);
    }
    var slashInd = dataURL.indexOf("/");
    if (slashInd === -1) {
      slashInd = dataURL.length;
    }
    host = dataURL.substring(0, slashInd);
    pathString = fb.core.util.decodePath(dataURL.substring(slashInd));
    var parts = host.split(".");
    if (parts.length === 3) {
      domain = parts[1];
      subdomain = parts[0].toLowerCase();
    } else {
      if (parts.length === 2) {
        domain = parts[0];
      }
    }
    colonInd = host.indexOf(":");
    if (colonInd >= 0) {
      secure = scheme === "https" || scheme === "wss";
      port = goog.string.parseInt(host.substring(colonInd + 1));
    }
  }
  return{host:host, port:port, domain:domain, subdomain:subdomain, secure:secure, scheme:scheme, pathString:pathString};
};
fb.core.util.decodePath = function(pathString) {
  var pathStringDecoded = "";
  var pieces = pathString.split("/");
  for (var i = 0;i < pieces.length;i++) {
    if (pieces[i].length > 0) {
      var piece = pieces[i];
      try {
        piece = goog.string.urlDecode(piece);
      } catch (e) {
      }
      pathStringDecoded += "/" + piece;
    }
  }
  return pathStringDecoded;
};
fb.core.util.isInvalidJSONNumber = function(data) {
  return goog.isNumber(data) && (data != data || data == Number.POSITIVE_INFINITY || data == Number.NEGATIVE_INFINITY);
};
fb.core.util.executeWhenDOMReady = function(fn) {
  if (NODE_CLIENT || document.readyState === "complete") {
    fn();
  } else {
    var called = false;
    var wrappedFn = function() {
      if (!document.body) {
        setTimeout(wrappedFn, Math.floor(10));
        return;
      }
      if (!called) {
        called = true;
        fn();
      }
    };
    if (document.addEventListener) {
      document.addEventListener("DOMContentLoaded", wrappedFn, false);
      window.addEventListener("load", wrappedFn, false);
    } else {
      if (document.attachEvent) {
        document.attachEvent("onreadystatechange", function() {
          if (document.readyState === "complete") {
            wrappedFn();
          }
        });
        window.attachEvent("onload", wrappedFn);
      }
    }
  }
};
fb.core.util.MIN_NAME = "[MIN_NAME]";
fb.core.util.MAX_NAME = "[MAX_NAME]";
fb.core.util.nameCompare = function(a, b) {
  if (a === b) {
    return 0;
  } else {
    if (a === fb.core.util.MIN_NAME || b === fb.core.util.MAX_NAME) {
      return-1;
    } else {
      if (b === fb.core.util.MIN_NAME || a === fb.core.util.MAX_NAME) {
        return 1;
      } else {
        var aAsInt = fb.core.util.tryParseInt(a), bAsInt = fb.core.util.tryParseInt(b);
        if (aAsInt !== null) {
          if (bAsInt !== null) {
            return aAsInt - bAsInt == 0 ? a.length - b.length : aAsInt - bAsInt;
          } else {
            return-1;
          }
        } else {
          if (bAsInt !== null) {
            return 1;
          } else {
            return a < b ? -1 : 1;
          }
        }
      }
    }
  }
};
fb.core.util.stringCompare = function(a, b) {
  if (a === b) {
    return 0;
  } else {
    if (a < b) {
      return-1;
    } else {
      return 1;
    }
  }
};
fb.core.util.requireKey = function(key, obj) {
  if (obj && key in obj) {
    return obj[key];
  } else {
    throw new Error("Missing required key (" + key + ") in object: " + fb.util.json.stringify(obj));
  }
};
fb.core.util.ObjectToUniqueKey = function(obj) {
  if (typeof obj !== "object" || obj === null) {
    return fb.util.json.stringify(obj);
  }
  var keys = [];
  for (var k in obj) {
    keys.push(k);
  }
  keys.sort();
  var key = "{";
  for (var i = 0;i < keys.length;i++) {
    if (i !== 0) {
      key += ",";
    }
    key += fb.util.json.stringify(keys[i]);
    key += ":";
    key += fb.core.util.ObjectToUniqueKey(obj[keys[i]]);
  }
  key += "}";
  return key;
};
fb.core.util.splitStringBySize = function(str, segsize) {
  if (str.length <= segsize) {
    return[str];
  }
  var dataSegs = [];
  for (var c = 0;c < str.length;c += segsize) {
    if (c + segsize > str) {
      dataSegs.push(str.substring(c, str.length));
    } else {
      dataSegs.push(str.substring(c, c + segsize));
    }
  }
  return dataSegs;
};
fb.core.util.each = function(obj, fn) {
  if (goog.isArray(obj)) {
    for (var i = 0;i < obj.length;++i) {
      fn(i, obj[i]);
    }
  } else {
    goog.object.forEach(obj, fn);
  }
};
fb.core.util.bindCallback = function(callback, opt_context) {
  return opt_context ? goog.bind(callback, opt_context) : callback;
};
fb.core.util.doubleToIEEE754String = function(v) {
  fb.core.util.assert(!fb.core.util.isInvalidJSONNumber(v), "Invalid JSON number");
  var ebits = 11, fbits = 52;
  var bias = (1 << ebits - 1) - 1, s, e, f, ln, i, bits, str, bytes;
  if (v === 0) {
    e = 0;
    f = 0;
    s = 1 / v === -Infinity ? 1 : 0;
  } else {
    s = v < 0;
    v = Math.abs(v);
    if (v >= Math.pow(2, 1 - bias)) {
      ln = Math.min(Math.floor(Math.log(v) / Math.LN2), bias);
      e = ln + bias;
      f = Math.round(v * Math.pow(2, fbits - ln) - Math.pow(2, fbits));
    } else {
      e = 0;
      f = Math.round(v / Math.pow(2, 1 - bias - fbits));
    }
  }
  bits = [];
  for (i = fbits;i;i -= 1) {
    bits.push(f % 2 ? 1 : 0);
    f = Math.floor(f / 2);
  }
  for (i = ebits;i;i -= 1) {
    bits.push(e % 2 ? 1 : 0);
    e = Math.floor(e / 2);
  }
  bits.push(s ? 1 : 0);
  bits.reverse();
  str = bits.join("");
  var hexByteString = "";
  for (i = 0;i < 64;i += 8) {
    var hexByte = parseInt(str.substr(i, 8), 2).toString(16);
    if (hexByte.length === 1) {
      hexByte = "0" + hexByte;
    }
    hexByteString = hexByteString + hexByte;
  }
  return hexByteString.toLowerCase();
};
fb.core.util.isChromeExtensionContentScript = function() {
  return!!(typeof window === "object" && window["chrome"] && window["chrome"]["extension"] && !/^chrome/.test(window.location.href));
};
fb.core.util.isWindowsStoreApp = function() {
  return typeof Windows === "object" && typeof Windows.UI === "object";
};
fb.core.util.errorForServerCode = function(code) {
  var reason = "Unknown Error";
  if (code === "too_big") {
    reason = "The data requested exceeds the maximum size " + "that can be accessed with a single request.";
  } else {
    if (code == "permission_denied") {
      reason = "Client doesn't have permission to access the desired data.";
    } else {
      if (code == "unavailable") {
        reason = "The service is unavailable";
      }
    }
  }
  var error = new Error(code + ": " + reason);
  error.code = code.toUpperCase();
  return error;
};
fb.core.util.INTEGER_REGEXP_ = new RegExp("^-?\\d{1,10}$");
fb.core.util.tryParseInt = function(str) {
  if (fb.core.util.INTEGER_REGEXP_.test(str)) {
    var intVal = Number(str);
    if (intVal >= -2147483648 && intVal <= 2147483647) {
      return intVal;
    }
  }
  return null;
};
fb.core.util.exceptionGuard = function(fn) {
  try {
    fn();
  } catch (e) {
    setTimeout(function() {
      var stack = e.stack || "";
      fb.core.util.warn("Exception was thrown by user callback.", stack);
      throw e;
    }, Math.floor(0));
  }
};
fb.core.util.callUserCallback = function(opt_callback, var_args) {
  if (goog.isFunction(opt_callback)) {
    var args = Array.prototype.slice.call(arguments, 1);
    var newArgs = args.slice();
    fb.core.util.exceptionGuard(function() {
      opt_callback.apply(null, newArgs);
    });
  }
};
fb.core.util.beingCrawled = function() {
  var userAgent = typeof window === "object" && window["navigator"] && window["navigator"]["userAgent"] || "";
  return userAgent.search(/googlebot|google webmaster tools|bingbot|yahoo! slurp|baiduspider|yandexbot|duckduckbot/i) >= 0;
};
goog.provide("fb.util.utf8");
goog.require("fb.core.util");
fb.util.utf8.stringToByteArray = function(str) {
  var out = [], p = 0;
  for (var i = 0;i < str.length;i++) {
    var c = str.charCodeAt(i);
    if (c >= 55296 && c <= 56319) {
      var high = c - 55296;
      i++;
      fb.core.util.assert(i < str.length, "Surrogate pair missing trail surrogate.");
      var low = str.charCodeAt(i) - 56320;
      c = 65536 + (high << 10) + low;
    }
    if (c < 128) {
      out[p++] = c;
    } else {
      if (c < 2048) {
        out[p++] = c >> 6 | 192;
        out[p++] = c & 63 | 128;
      } else {
        if (c < 65536) {
          out[p++] = c >> 12 | 224;
          out[p++] = c >> 6 & 63 | 128;
          out[p++] = c & 63 | 128;
        } else {
          out[p++] = c >> 18 | 240;
          out[p++] = c >> 12 & 63 | 128;
          out[p++] = c >> 6 & 63 | 128;
          out[p++] = c & 63 | 128;
        }
      }
    }
  }
  return out;
};
fb.util.utf8.stringLength = function(str) {
  var p = 0;
  for (var i = 0;i < str.length;i++) {
    var c = str.charCodeAt(i);
    if (c < 128) {
      p++;
    } else {
      if (c < 2048) {
        p += 2;
      } else {
        if (c >= 55296 && c <= 56319) {
          p += 4;
          i++;
        } else {
          p += 3;
        }
      }
    }
  }
  return p;
};
goog.provide("fb.util.jwt");
goog.require("fb.core.util");
goog.require("fb.util.json");
goog.require("fb.util.obj");
goog.require("goog.crypt.base64");
goog.require("goog.json");
fb.util.jwt.decode = function(token) {
  var header = {}, claims = {}, data = {}, signature = "";
  try {
    var parts = token.split(".");
    header = fb.util.json.eval(fb.core.util.base64Decode(parts[0]) || "");
    claims = fb.util.json.eval(fb.core.util.base64Decode(parts[1]) || "");
    signature = parts[2];
    data = claims["d"] || {};
    delete claims["d"];
  } catch (e) {
  }
  return{header:header, claims:claims, data:data, signature:signature};
};
fb.util.jwt.isValidTimestamp = function(token) {
  var claims = fb.util.jwt.decode(token).claims, now = Math.floor((new Date).getTime() / 1E3), validSince, validUntil;
  if (typeof claims === "object") {
    if (claims.hasOwnProperty("nbf")) {
      validSince = fb.util.obj.get(claims, "nbf");
    } else {
      if (claims.hasOwnProperty("iat")) {
        validSince = fb.util.obj.get(claims, "iat");
      }
    }
    if (claims.hasOwnProperty("exp")) {
      validUntil = fb.util.obj.get(claims, "exp");
    } else {
      validUntil = validSince + 86400;
    }
  }
  return now && validSince && validUntil && now >= validSince && now <= validUntil;
};
fb.util.jwt.issuedAtTime = function(token) {
  var claims = fb.util.jwt.decode(token).claims;
  if (typeof claims === "object" && claims.hasOwnProperty("iat")) {
    return fb.util.obj.get(claims, "iat");
  }
  return null;
};
fb.util.jwt.isValidFormat = function(token) {
  var decoded = fb.util.jwt.decode(token), claims = decoded.claims;
  return!!decoded.signature && !!claims && typeof claims === "object" && claims.hasOwnProperty("iat");
};
fb.util.jwt.isAdmin = function(token) {
  var claims = fb.util.jwt.decode(token).claims;
  return typeof claims === "object" && fb.util.obj.get(claims, "admin") === true;
};
goog.provide("fb.core.view.EventGenerator");
goog.require("fb.core.snap.NamedNode");
goog.require("fb.core.util");
fb.core.view.EventGenerator = function(query) {
  this.query_ = query;
  this.index_ = query.getQueryParams().getIndex();
};
fb.core.view.EventGenerator.prototype.generateEventsForChanges = function(changes, eventCache, eventRegistrations) {
  var events = [], self = this;
  var moves = [];
  goog.array.forEach(changes, function(change) {
    if (change.type === fb.core.view.Change.CHILD_CHANGED && self.index_.indexedValueChanged((change.oldSnap), change.snapshotNode)) {
      moves.push(fb.core.view.Change.childMovedChange((change.childName), change.snapshotNode));
    }
  });
  this.generateEventsForType_(events, fb.core.view.Change.CHILD_REMOVED, changes, eventRegistrations, eventCache);
  this.generateEventsForType_(events, fb.core.view.Change.CHILD_ADDED, changes, eventRegistrations, eventCache);
  this.generateEventsForType_(events, fb.core.view.Change.CHILD_MOVED, moves, eventRegistrations, eventCache);
  this.generateEventsForType_(events, fb.core.view.Change.CHILD_CHANGED, changes, eventRegistrations, eventCache);
  this.generateEventsForType_(events, fb.core.view.Change.VALUE, changes, eventRegistrations, eventCache);
  return events;
};
fb.core.view.EventGenerator.prototype.generateEventsForType_ = function(events, eventType, changes, registrations, eventCache) {
  var filteredChanges = goog.array.filter(changes, function(change) {
    return change.type === eventType;
  });
  var self = this;
  goog.array.sort(filteredChanges, goog.bind(this.compareChanges_, this));
  goog.array.forEach(filteredChanges, function(change) {
    var materializedChange = self.materializeSingleChange_(change, eventCache);
    goog.array.forEach(registrations, function(registration) {
      if (registration.respondsTo(change.type)) {
        events.push(registration.createEvent(materializedChange, self.query_));
      }
    });
  });
};
fb.core.view.EventGenerator.prototype.materializeSingleChange_ = function(change, eventCache) {
  if (change.type === "value" || change.type === "child_removed") {
    return change;
  } else {
    change.prevName = eventCache.getPredecessorChildName((change.childName), change.snapshotNode, this.index_);
    return change;
  }
};
fb.core.view.EventGenerator.prototype.compareChanges_ = function(a, b) {
  if (a.childName == null || b.childName == null) {
    throw fb.core.util.assertionError("Should only compare child_ events.");
  }
  var aWrapped = new fb.core.snap.NamedNode(a.childName, a.snapshotNode);
  var bWrapped = new fb.core.snap.NamedNode(b.childName, b.snapshotNode);
  return this.index_.compare(aWrapped, bWrapped);
};
goog.provide("fb.core.view.ChildChangeAccumulator");
goog.require("fb.core.util");
fb.core.view.ChildChangeAccumulator = function() {
  this.changeMap_ = {};
};
fb.core.view.ChildChangeAccumulator.prototype.trackChildChange = function(change) {
  var Change = fb.core.view.Change;
  var type = change.type;
  var childKey = (change.childName);
  fb.core.util.assert(type == fb.core.view.Change.CHILD_ADDED || type == fb.core.view.Change.CHILD_CHANGED || type == fb.core.view.Change.CHILD_REMOVED, "Only child changes supported for tracking");
  fb.core.util.assert(childKey !== ".priority", "Only non-priority child changes can be tracked.");
  var oldChange = fb.util.obj.get(this.changeMap_, childKey);
  if (oldChange) {
    var oldType = oldChange.type;
    if (type == Change.CHILD_ADDED && oldType == Change.CHILD_REMOVED) {
      this.changeMap_[childKey] = Change.childChangedChange(childKey, change.snapshotNode, oldChange.snapshotNode);
    } else {
      if (type == Change.CHILD_REMOVED && oldType == Change.CHILD_ADDED) {
        delete this.changeMap_[childKey];
      } else {
        if (type == Change.CHILD_REMOVED && oldType == Change.CHILD_CHANGED) {
          this.changeMap_[childKey] = Change.childRemovedChange(childKey, (oldChange.oldSnap));
        } else {
          if (type == Change.CHILD_CHANGED && oldType == Change.CHILD_ADDED) {
            this.changeMap_[childKey] = Change.childAddedChange(childKey, change.snapshotNode);
          } else {
            if (type == Change.CHILD_CHANGED && oldType == Change.CHILD_CHANGED) {
              this.changeMap_[childKey] = Change.childChangedChange(childKey, change.snapshotNode, (oldChange.oldSnap));
            } else {
              throw fb.core.util.assertionError("Illegal combination of changes: " + change + " occurred after " + oldChange);
            }
          }
        }
      }
    }
  } else {
    this.changeMap_[childKey] = change;
  }
};
fb.core.view.ChildChangeAccumulator.prototype.getChanges = function() {
  return goog.object.getValues(this.changeMap_);
};
goog.provide("fb.core.view.EventRegistration");
goog.require("fb.core.view.Change");
goog.require("fb.core.view.Event");
goog.require("fb.core.util");
fb.core.view.EventRegistration = function() {
};
fb.core.view.EventRegistration.prototype.respondsTo;
fb.core.view.EventRegistration.prototype.createEvent;
fb.core.view.EventRegistration.prototype.getEventRunner;
fb.core.view.EventRegistration.prototype.createCancelEvent;
fb.core.view.EventRegistration.prototype.matches;
fb.core.view.EventRegistration.prototype.hasAnyCallback;
fb.core.view.ValueEventRegistration = function(callback, cancelCallback, context) {
  this.callback_ = callback;
  this.cancelCallback_ = cancelCallback;
  this.context_ = context || null;
};
fb.core.view.ValueEventRegistration.prototype.respondsTo = function(eventType) {
  return eventType === "value";
};
fb.core.view.ValueEventRegistration.prototype.createEvent = function(change, query) {
  var index = query.getQueryParams().getIndex();
  return new fb.core.view.DataEvent("value", this, new fb.api.DataSnapshot(change.snapshotNode, query.ref(), index));
};
fb.core.view.ValueEventRegistration.prototype.getEventRunner = function(eventData) {
  var ctx = this.context_;
  if (eventData.getEventType() === "cancel") {
    fb.core.util.assert(this.cancelCallback_, "Raising a cancel event on a listener with no cancel callback");
    var cancelCB = this.cancelCallback_;
    return function() {
      cancelCB.call(ctx, eventData.error);
    };
  } else {
    var cb = this.callback_;
    return function() {
      cb.call(ctx, eventData.snapshot);
    };
  }
};
fb.core.view.ValueEventRegistration.prototype.createCancelEvent = function(error, path) {
  if (this.cancelCallback_) {
    return new fb.core.view.CancelEvent(this, error, path);
  } else {
    return null;
  }
};
fb.core.view.ValueEventRegistration.prototype.matches = function(other) {
  if (!(other instanceof fb.core.view.ValueEventRegistration)) {
    return false;
  } else {
    if (!other.callback_ || !this.callback_) {
      return true;
    } else {
      return other.callback_ === this.callback_ && other.context_ === this.context_;
    }
  }
};
fb.core.view.ValueEventRegistration.prototype.hasAnyCallback = function() {
  return this.callback_ !== null;
};
fb.core.view.ChildEventRegistration = function(callbacks, cancelCallback, context) {
  this.callbacks_ = callbacks;
  this.cancelCallback_ = cancelCallback;
  this.context_ = context;
};
fb.core.view.ChildEventRegistration.prototype.respondsTo = function(eventType) {
  var eventToCheck = eventType === "children_added" ? "child_added" : eventType;
  eventToCheck = eventToCheck === "children_removed" ? "child_removed" : eventToCheck;
  return goog.object.containsKey(this.callbacks_, eventToCheck);
};
fb.core.view.ChildEventRegistration.prototype.createCancelEvent = function(error, path) {
  if (this.cancelCallback_) {
    return new fb.core.view.CancelEvent(this, error, path);
  } else {
    return null;
  }
};
fb.core.view.ChildEventRegistration.prototype.createEvent = function(change, query) {
  fb.core.util.assert(change.childName != null, "Child events should have a childName.");
  var ref = query.ref().child((change.childName));
  var index = query.getQueryParams().getIndex();
  return new fb.core.view.DataEvent(change.type, this, new fb.api.DataSnapshot(change.snapshotNode, ref, index), change.prevName);
};
fb.core.view.ChildEventRegistration.prototype.getEventRunner = function(eventData) {
  var ctx = this.context_;
  if (eventData.getEventType() === "cancel") {
    fb.core.util.assert(this.cancelCallback_, "Raising a cancel event on a listener with no cancel callback");
    var cancelCB = this.cancelCallback_;
    return function() {
      cancelCB.call(ctx, eventData.error);
    };
  } else {
    var cb = this.callbacks_[eventData.eventType];
    return function() {
      cb.call(ctx, eventData.snapshot, eventData.prevName);
    };
  }
};
fb.core.view.ChildEventRegistration.prototype.matches = function(other) {
  if (other instanceof fb.core.view.ChildEventRegistration) {
    if (!this.callbacks_ || !other.callbacks_) {
      return true;
    } else {
      if (this.context_ === other.context_) {
        var otherCount = goog.object.getCount(other.callbacks_);
        var thisCount = goog.object.getCount(this.callbacks_);
        if (otherCount === thisCount) {
          if (otherCount === 1) {
            var otherKey = (goog.object.getAnyKey(other.callbacks_));
            var thisKey = (goog.object.getAnyKey(this.callbacks_));
            return thisKey === otherKey && (!other.callbacks_[otherKey] || !this.callbacks_[thisKey] || other.callbacks_[otherKey] === this.callbacks_[thisKey]);
          } else {
            return goog.object.every(this.callbacks_, function(cb, eventType) {
              return other.callbacks_[eventType] === cb;
            });
          }
        }
      }
    }
  }
  return false;
};
fb.core.view.ChildEventRegistration.prototype.hasAnyCallback = function() {
  return this.callbacks_ !== null;
};
goog.provide("fb.core.view.filter.IndexedFilter");
goog.require("fb.core.util");
fb.core.view.filter.IndexedFilter = function(index) {
  this.index_ = index;
};
fb.core.view.filter.IndexedFilter.prototype.updateChild = function(snap, key, newChild, affectedPath, source, optChangeAccumulator) {
  var Change = fb.core.view.Change;
  fb.core.util.assert(snap.isIndexed(this.index_), "A node must be indexed if only a child is updated");
  var oldChild = snap.getImmediateChild(key);
  if (oldChild.getChild(affectedPath).equals(newChild.getChild(affectedPath))) {
    if (oldChild.isEmpty() == newChild.isEmpty()) {
      return snap;
    }
  }
  if (optChangeAccumulator != null) {
    if (newChild.isEmpty()) {
      if (snap.hasChild(key)) {
        optChangeAccumulator.trackChildChange(Change.childRemovedChange(key, oldChild));
      } else {
        fb.core.util.assert(snap.isLeafNode(), "A child remove without an old child only makes sense on a leaf node");
      }
    } else {
      if (oldChild.isEmpty()) {
        optChangeAccumulator.trackChildChange(Change.childAddedChange(key, newChild));
      } else {
        optChangeAccumulator.trackChildChange(Change.childChangedChange(key, newChild, oldChild));
      }
    }
  }
  if (snap.isLeafNode() && newChild.isEmpty()) {
    return snap;
  } else {
    return snap.updateImmediateChild(key, newChild).withIndex(this.index_);
  }
};
fb.core.view.filter.IndexedFilter.prototype.updateFullNode = function(oldSnap, newSnap, optChangeAccumulator) {
  var Change = fb.core.view.Change;
  if (optChangeAccumulator != null) {
    if (!oldSnap.isLeafNode()) {
      oldSnap.forEachChild(fb.core.snap.PriorityIndex, function(key, childNode) {
        if (!newSnap.hasChild(key)) {
          optChangeAccumulator.trackChildChange(Change.childRemovedChange(key, childNode));
        }
      });
    }
    if (!newSnap.isLeafNode()) {
      newSnap.forEachChild(fb.core.snap.PriorityIndex, function(key, childNode) {
        if (oldSnap.hasChild(key)) {
          var oldChild = oldSnap.getImmediateChild(key);
          if (!oldChild.equals(childNode)) {
            optChangeAccumulator.trackChildChange(Change.childChangedChange(key, childNode, oldChild));
          }
        } else {
          optChangeAccumulator.trackChildChange(Change.childAddedChange(key, childNode));
        }
      });
    }
  }
  return newSnap.withIndex(this.index_);
};
fb.core.view.filter.IndexedFilter.prototype.updatePriority = function(oldSnap, newPriority) {
  if (oldSnap.isEmpty()) {
    return fb.core.snap.EMPTY_NODE;
  } else {
    return oldSnap.updatePriority(newPriority);
  }
};
fb.core.view.filter.IndexedFilter.prototype.filtersNodes = function() {
  return false;
};
fb.core.view.filter.IndexedFilter.prototype.getIndexedFilter = function() {
  return this;
};
fb.core.view.filter.IndexedFilter.prototype.getIndex = function() {
  return this.index_;
};
goog.provide("fb.core.view.filter.RangedFilter");
goog.require("fb.core.view.filter.IndexedFilter");
fb.core.view.filter.RangedFilter = function(params) {
  this.indexedFilter_ = new fb.core.view.filter.IndexedFilter(params.getIndex());
  this.index_ = params.getIndex();
  this.startPost_ = this.getStartPost_(params);
  this.endPost_ = this.getEndPost_(params);
};
fb.core.view.filter.RangedFilter.prototype.getStartPost = function() {
  return this.startPost_;
};
fb.core.view.filter.RangedFilter.prototype.getEndPost = function() {
  return this.endPost_;
};
fb.core.view.filter.RangedFilter.prototype.matches = function(node) {
  return this.index_.compare(this.getStartPost(), node) <= 0 && this.index_.compare(node, this.getEndPost()) <= 0;
};
fb.core.view.filter.RangedFilter.prototype.updateChild = function(snap, key, newChild, affectedPath, source, optChangeAccumulator) {
  if (!this.matches(new fb.core.snap.NamedNode(key, newChild))) {
    newChild = fb.core.snap.EMPTY_NODE;
  }
  return this.indexedFilter_.updateChild(snap, key, newChild, affectedPath, source, optChangeAccumulator);
};
fb.core.view.filter.RangedFilter.prototype.updateFullNode = function(oldSnap, newSnap, optChangeAccumulator) {
  if (newSnap.isLeafNode()) {
    newSnap = fb.core.snap.EMPTY_NODE;
  }
  var filtered = newSnap.withIndex(this.index_);
  filtered = filtered.updatePriority(fb.core.snap.EMPTY_NODE);
  var self = this;
  newSnap.forEachChild(fb.core.snap.PriorityIndex, function(key, childNode) {
    if (!self.matches(new fb.core.snap.NamedNode(key, childNode))) {
      filtered = filtered.updateImmediateChild(key, fb.core.snap.EMPTY_NODE);
    }
  });
  return this.indexedFilter_.updateFullNode(oldSnap, filtered, optChangeAccumulator);
};
fb.core.view.filter.RangedFilter.prototype.updatePriority = function(oldSnap, newPriority) {
  return oldSnap;
};
fb.core.view.filter.RangedFilter.prototype.filtersNodes = function() {
  return true;
};
fb.core.view.filter.RangedFilter.prototype.getIndexedFilter = function() {
  return this.indexedFilter_;
};
fb.core.view.filter.RangedFilter.prototype.getIndex = function() {
  return this.index_;
};
fb.core.view.filter.RangedFilter.prototype.getStartPost_ = function(params) {
  if (params.hasStart()) {
    var startName = params.getIndexStartName();
    return params.getIndex().makePost(params.getIndexStartValue(), startName);
  } else {
    return params.getIndex().minPost();
  }
};
fb.core.view.filter.RangedFilter.prototype.getEndPost_ = function(params) {
  if (params.hasEnd()) {
    var endName = params.getIndexEndName();
    return params.getIndex().makePost(params.getIndexEndValue(), endName);
  } else {
    return params.getIndex().maxPost();
  }
};
goog.provide("fb.core.view.filter.NodeFilter");
goog.require("fb.core.view.ChildChangeAccumulator");
goog.require("fb.core.view.CompleteChildSource");
fb.core.view.filter.NodeFilter = function() {
};
fb.core.view.filter.NodeFilter.prototype.updateChild = function(snap, key, newChild, affectedPath, source, optChangeAccumulator) {
};
fb.core.view.filter.NodeFilter.prototype.updateFullNode = function(oldSnap, newSnap, optChangeAccumulator) {
};
fb.core.view.filter.NodeFilter.prototype.updatePriority = function(oldSnap, newPriority) {
};
fb.core.view.filter.NodeFilter.prototype.filtersNodes = function() {
};
fb.core.view.filter.NodeFilter.prototype.getIndexedFilter = function() {
};
fb.core.view.filter.NodeFilter.prototype.getIndex = function() {
};
goog.provide("fb.core.view.filter.LimitedFilter");
goog.require("fb.core.snap.NamedNode");
goog.require("fb.core.view.filter.RangedFilter");
goog.require("fb.core.util");
fb.core.view.filter.LimitedFilter = function(params) {
  this.rangedFilter_ = new fb.core.view.filter.RangedFilter(params);
  this.index_ = params.getIndex();
  this.limit_ = params.getLimit();
  this.reverse_ = !params.isViewFromLeft();
};
fb.core.view.filter.LimitedFilter.prototype.updateChild = function(snap, key, newChild, affectedPath, source, optChangeAccumulator) {
  if (!this.rangedFilter_.matches(new fb.core.snap.NamedNode(key, newChild))) {
    newChild = fb.core.snap.EMPTY_NODE;
  }
  if (snap.getImmediateChild(key).equals(newChild)) {
    return snap;
  } else {
    if (snap.numChildren() < this.limit_) {
      return this.rangedFilter_.getIndexedFilter().updateChild(snap, key, newChild, affectedPath, source, optChangeAccumulator);
    } else {
      return this.fullLimitUpdateChild_(snap, key, newChild, source, optChangeAccumulator);
    }
  }
};
fb.core.view.filter.LimitedFilter.prototype.updateFullNode = function(oldSnap, newSnap, optChangeAccumulator) {
  var filtered;
  if (newSnap.isLeafNode() || newSnap.isEmpty()) {
    filtered = fb.core.snap.EMPTY_NODE.withIndex(this.index_);
  } else {
    if (this.limit_ * 2 < newSnap.numChildren() && newSnap.isIndexed(this.index_)) {
      filtered = fb.core.snap.EMPTY_NODE.withIndex(this.index_);
      var iterator;
      newSnap = (newSnap);
      if (this.reverse_) {
        iterator = newSnap.getReverseIteratorFrom(this.rangedFilter_.getEndPost(), this.index_);
      } else {
        iterator = newSnap.getIteratorFrom(this.rangedFilter_.getStartPost(), this.index_);
      }
      var count = 0;
      while (iterator.hasNext() && count < this.limit_) {
        var next = iterator.getNext();
        var inRange;
        if (this.reverse_) {
          inRange = this.index_.compare(this.rangedFilter_.getStartPost(), next) <= 0;
        } else {
          inRange = this.index_.compare(next, this.rangedFilter_.getEndPost()) <= 0;
        }
        if (inRange) {
          filtered = filtered.updateImmediateChild(next.name, next.node);
          count++;
        } else {
          break;
        }
      }
    } else {
      filtered = newSnap.withIndex(this.index_);
      filtered = (filtered.updatePriority(fb.core.snap.EMPTY_NODE));
      var startPost;
      var endPost;
      var cmp;
      if (this.reverse_) {
        iterator = filtered.getReverseIterator(this.index_);
        startPost = this.rangedFilter_.getEndPost();
        endPost = this.rangedFilter_.getStartPost();
        var indexCompare = this.index_.getCompare();
        cmp = function(a, b) {
          return indexCompare(b, a);
        };
      } else {
        iterator = filtered.getIterator(this.index_);
        startPost = this.rangedFilter_.getStartPost();
        endPost = this.rangedFilter_.getEndPost();
        cmp = this.index_.getCompare();
      }
      count = 0;
      var foundStartPost = false;
      while (iterator.hasNext()) {
        next = iterator.getNext();
        if (!foundStartPost && cmp(startPost, next) <= 0) {
          foundStartPost = true;
        }
        inRange = foundStartPost && count < this.limit_ && cmp(next, endPost) <= 0;
        if (inRange) {
          count++;
        } else {
          filtered = filtered.updateImmediateChild(next.name, fb.core.snap.EMPTY_NODE);
        }
      }
    }
  }
  return this.rangedFilter_.getIndexedFilter().updateFullNode(oldSnap, filtered, optChangeAccumulator);
};
fb.core.view.filter.LimitedFilter.prototype.updatePriority = function(oldSnap, newPriority) {
  return oldSnap;
};
fb.core.view.filter.LimitedFilter.prototype.filtersNodes = function() {
  return true;
};
fb.core.view.filter.LimitedFilter.prototype.getIndexedFilter = function() {
  return this.rangedFilter_.getIndexedFilter();
};
fb.core.view.filter.LimitedFilter.prototype.getIndex = function() {
  return this.index_;
};
fb.core.view.filter.LimitedFilter.prototype.fullLimitUpdateChild_ = function(snap, childKey, childSnap, source, optChangeAccumulator) {
  var Change = fb.core.view.Change;
  var cmp;
  if (this.reverse_) {
    var indexCmp = this.index_.getCompare();
    cmp = function(a, b) {
      return indexCmp(b, a);
    };
  } else {
    cmp = this.index_.getCompare();
  }
  var oldEventCache = (snap);
  fb.core.util.assert(oldEventCache.numChildren() == this.limit_, "");
  var newChildNamedNode = new fb.core.snap.NamedNode(childKey, childSnap);
  var windowBoundary = (this.reverse_ ? oldEventCache.getFirstChild(this.index_) : oldEventCache.getLastChild(this.index_));
  var inRange = this.rangedFilter_.matches(newChildNamedNode);
  if (oldEventCache.hasChild(childKey)) {
    var oldChildSnap = oldEventCache.getImmediateChild(childKey);
    var nextChild = source.getChildAfterChild(this.index_, windowBoundary, this.reverse_);
    while (nextChild != null && (nextChild.name == childKey || oldEventCache.hasChild(nextChild.name))) {
      nextChild = source.getChildAfterChild(this.index_, nextChild, this.reverse_);
    }
    var compareNext = nextChild == null ? 1 : cmp(nextChild, newChildNamedNode);
    var remainsInWindow = inRange && !childSnap.isEmpty() && compareNext >= 0;
    if (remainsInWindow) {
      if (optChangeAccumulator != null) {
        optChangeAccumulator.trackChildChange(Change.childChangedChange(childKey, childSnap, oldChildSnap));
      }
      return oldEventCache.updateImmediateChild(childKey, childSnap);
    } else {
      if (optChangeAccumulator != null) {
        optChangeAccumulator.trackChildChange(Change.childRemovedChange(childKey, oldChildSnap));
      }
      var newEventCache = oldEventCache.updateImmediateChild(childKey, fb.core.snap.EMPTY_NODE);
      var nextChildInRange = nextChild != null && this.rangedFilter_.matches(nextChild);
      if (nextChildInRange) {
        if (optChangeAccumulator != null) {
          optChangeAccumulator.trackChildChange(Change.childAddedChange(nextChild.name, nextChild.node));
        }
        return newEventCache.updateImmediateChild(nextChild.name, nextChild.node);
      } else {
        return newEventCache;
      }
    }
  } else {
    if (childSnap.isEmpty()) {
      return snap;
    } else {
      if (inRange) {
        if (cmp(windowBoundary, newChildNamedNode) >= 0) {
          if (optChangeAccumulator != null) {
            optChangeAccumulator.trackChildChange(Change.childRemovedChange(windowBoundary.name, windowBoundary.node));
            optChangeAccumulator.trackChildChange(Change.childAddedChange(childKey, childSnap));
          }
          return oldEventCache.updateImmediateChild(childKey, childSnap).updateImmediateChild(windowBoundary.name, fb.core.snap.EMPTY_NODE);
        } else {
          return snap;
        }
      } else {
        return snap;
      }
    }
  }
};
goog.provide("fb.core.view.ViewProcessor");
goog.require("fb.core.view.CompleteChildSource");
goog.require("fb.core.util");
fb.core.view.ProcessorResult = function(viewCache, changes) {
  this.viewCache = viewCache;
  this.changes = changes;
};
fb.core.view.ViewProcessor = function(filter) {
  this.filter_ = filter;
};
fb.core.view.ViewProcessor.prototype.assertIndexed = function(viewCache) {
  fb.core.util.assert(viewCache.getEventCache().getNode().isIndexed(this.filter_.getIndex()), "Event snap not indexed");
  fb.core.util.assert(viewCache.getServerCache().getNode().isIndexed(this.filter_.getIndex()), "Server snap not indexed");
};
fb.core.view.ViewProcessor.prototype.applyOperation = function(oldViewCache, operation, writesCache, optCompleteCache) {
  var accumulator = new fb.core.view.ChildChangeAccumulator;
  var newViewCache, filterServerNode;
  if (operation.type === fb.core.OperationType.OVERWRITE) {
    var overwrite = (operation);
    if (overwrite.source.fromUser) {
      newViewCache = this.applyUserOverwrite_(oldViewCache, overwrite.path, overwrite.snap, writesCache, optCompleteCache, accumulator);
    } else {
      fb.core.util.assert(overwrite.source.fromServer, "Unknown source.");
      filterServerNode = overwrite.source.tagged || oldViewCache.getServerCache().isFiltered() && !overwrite.path.isEmpty();
      newViewCache = this.applyServerOverwrite_(oldViewCache, overwrite.path, overwrite.snap, writesCache, optCompleteCache, filterServerNode, accumulator);
    }
  } else {
    if (operation.type === fb.core.OperationType.MERGE) {
      var merge = (operation);
      if (merge.source.fromUser) {
        newViewCache = this.applyUserMerge_(oldViewCache, merge.path, merge.children, writesCache, optCompleteCache, accumulator);
      } else {
        fb.core.util.assert(merge.source.fromServer, "Unknown source.");
        filterServerNode = merge.source.tagged || oldViewCache.getServerCache().isFiltered();
        newViewCache = this.applyServerMerge_(oldViewCache, merge.path, merge.children, writesCache, optCompleteCache, filterServerNode, accumulator);
      }
    } else {
      if (operation.type === fb.core.OperationType.ACK_USER_WRITE) {
        var ackUserWrite = (operation);
        if (!ackUserWrite.revert) {
          newViewCache = this.ackUserWrite_(oldViewCache, ackUserWrite.path, ackUserWrite.affectedTree, writesCache, optCompleteCache, accumulator);
        } else {
          newViewCache = this.revertUserWrite_(oldViewCache, ackUserWrite.path, writesCache, optCompleteCache, accumulator);
        }
      } else {
        if (operation.type === fb.core.OperationType.LISTEN_COMPLETE) {
          newViewCache = this.listenComplete_(oldViewCache, operation.path, writesCache, optCompleteCache, accumulator);
        } else {
          throw fb.core.util.assertionError("Unknown operation type: " + operation.type);
        }
      }
    }
  }
  var changes = accumulator.getChanges();
  this.maybeAddValueEvent_(oldViewCache, newViewCache, changes);
  return new fb.core.view.ProcessorResult(newViewCache, changes);
};
fb.core.view.ViewProcessor.prototype.maybeAddValueEvent_ = function(oldViewCache, newViewCache, accumulator) {
  var eventSnap = newViewCache.getEventCache();
  if (eventSnap.isFullyInitialized()) {
    var isLeafOrEmpty = eventSnap.getNode().isLeafNode() || eventSnap.getNode().isEmpty();
    var oldCompleteSnap = oldViewCache.getCompleteEventSnap();
    if (accumulator.length > 0 || !oldViewCache.getEventCache().isFullyInitialized() || isLeafOrEmpty && !eventSnap.getNode().equals((oldCompleteSnap)) || !eventSnap.getNode().getPriority().equals(oldCompleteSnap.getPriority())) {
      accumulator.push(fb.core.view.Change.valueChange((newViewCache.getCompleteEventSnap())));
    }
  }
};
fb.core.view.ViewProcessor.prototype.generateEventCacheAfterServerEvent_ = function(viewCache, changePath, writesCache, source, accumulator) {
  var oldEventSnap = viewCache.getEventCache();
  if (writesCache.shadowingWrite(changePath) != null) {
    return viewCache;
  } else {
    var newEventCache, serverNode;
    if (changePath.isEmpty()) {
      fb.core.util.assert(viewCache.getServerCache().isFullyInitialized(), "If change path is empty, we must have complete server data");
      if (viewCache.getServerCache().isFiltered()) {
        var serverCache = viewCache.getCompleteServerSnap();
        var completeChildren = serverCache instanceof fb.core.snap.ChildrenNode ? serverCache : fb.core.snap.EMPTY_NODE;
        var completeEventChildren = writesCache.calcCompleteEventChildren(completeChildren);
        newEventCache = this.filter_.updateFullNode(viewCache.getEventCache().getNode(), completeEventChildren, accumulator);
      } else {
        var completeNode = (writesCache.calcCompleteEventCache(viewCache.getCompleteServerSnap()));
        newEventCache = this.filter_.updateFullNode(viewCache.getEventCache().getNode(), completeNode, accumulator);
      }
    } else {
      var childKey = changePath.getFront();
      if (childKey == ".priority") {
        fb.core.util.assert(changePath.getLength() == 1, "Can't have a priority with additional path components");
        var oldEventNode = oldEventSnap.getNode();
        serverNode = viewCache.getServerCache().getNode();
        var updatedPriority = writesCache.calcEventCacheAfterServerOverwrite(changePath, oldEventNode, serverNode);
        if (updatedPriority != null) {
          newEventCache = this.filter_.updatePriority(oldEventNode, updatedPriority);
        } else {
          newEventCache = oldEventSnap.getNode();
        }
      } else {
        var childChangePath = changePath.popFront();
        var newEventChild;
        if (oldEventSnap.isCompleteForChild(childKey)) {
          serverNode = viewCache.getServerCache().getNode();
          var eventChildUpdate = writesCache.calcEventCacheAfterServerOverwrite(changePath, oldEventSnap.getNode(), serverNode);
          if (eventChildUpdate != null) {
            newEventChild = oldEventSnap.getNode().getImmediateChild(childKey).updateChild(childChangePath, eventChildUpdate);
          } else {
            newEventChild = oldEventSnap.getNode().getImmediateChild(childKey);
          }
        } else {
          newEventChild = writesCache.calcCompleteChild(childKey, viewCache.getServerCache());
        }
        if (newEventChild != null) {
          newEventCache = this.filter_.updateChild(oldEventSnap.getNode(), childKey, newEventChild, childChangePath, source, accumulator);
        } else {
          newEventCache = oldEventSnap.getNode();
        }
      }
    }
    return viewCache.updateEventSnap(newEventCache, oldEventSnap.isFullyInitialized() || changePath.isEmpty(), this.filter_.filtersNodes());
  }
};
fb.core.view.ViewProcessor.prototype.applyServerOverwrite_ = function(oldViewCache, changePath, changedSnap, writesCache, optCompleteCache, filterServerNode, accumulator) {
  var oldServerSnap = oldViewCache.getServerCache();
  var newServerCache;
  var serverFilter = filterServerNode ? this.filter_ : this.filter_.getIndexedFilter();
  if (changePath.isEmpty()) {
    newServerCache = serverFilter.updateFullNode(oldServerSnap.getNode(), changedSnap, null);
  } else {
    if (serverFilter.filtersNodes() && !oldServerSnap.isFiltered()) {
      var newServerNode = oldServerSnap.getNode().updateChild(changePath, changedSnap);
      newServerCache = serverFilter.updateFullNode(oldServerSnap.getNode(), newServerNode, null);
    } else {
      var childKey = changePath.getFront();
      if (!oldServerSnap.isCompleteForPath(changePath) && changePath.getLength() > 1) {
        return oldViewCache;
      }
      var childChangePath = changePath.popFront();
      var childNode = oldServerSnap.getNode().getImmediateChild(childKey);
      var newChildNode = childNode.updateChild(childChangePath, changedSnap);
      if (childKey == ".priority") {
        newServerCache = serverFilter.updatePriority(oldServerSnap.getNode(), newChildNode);
      } else {
        newServerCache = serverFilter.updateChild(oldServerSnap.getNode(), childKey, newChildNode, childChangePath, fb.core.view.NO_COMPLETE_CHILD_SOURCE, null);
      }
    }
  }
  var newViewCache = oldViewCache.updateServerSnap(newServerCache, oldServerSnap.isFullyInitialized() || changePath.isEmpty(), serverFilter.filtersNodes());
  var source = new fb.core.view.WriteTreeCompleteChildSource(writesCache, newViewCache, optCompleteCache);
  return this.generateEventCacheAfterServerEvent_(newViewCache, changePath, writesCache, source, accumulator);
};
fb.core.view.ViewProcessor.prototype.applyUserOverwrite_ = function(oldViewCache, changePath, changedSnap, writesCache, optCompleteCache, accumulator) {
  var oldEventSnap = oldViewCache.getEventCache();
  var newViewCache, newEventCache;
  var source = new fb.core.view.WriteTreeCompleteChildSource(writesCache, oldViewCache, optCompleteCache);
  if (changePath.isEmpty()) {
    newEventCache = this.filter_.updateFullNode(oldViewCache.getEventCache().getNode(), changedSnap, accumulator);
    newViewCache = oldViewCache.updateEventSnap(newEventCache, true, this.filter_.filtersNodes());
  } else {
    var childKey = changePath.getFront();
    if (childKey === ".priority") {
      newEventCache = this.filter_.updatePriority(oldViewCache.getEventCache().getNode(), changedSnap);
      newViewCache = oldViewCache.updateEventSnap(newEventCache, oldEventSnap.isFullyInitialized(), oldEventSnap.isFiltered());
    } else {
      var childChangePath = changePath.popFront();
      var oldChild = oldEventSnap.getNode().getImmediateChild(childKey);
      var newChild;
      if (childChangePath.isEmpty()) {
        newChild = changedSnap;
      } else {
        var childNode = source.getCompleteChild(childKey);
        if (childNode != null) {
          if (childChangePath.getBack() === ".priority" && childNode.getChild((childChangePath.parent())).isEmpty()) {
            newChild = childNode;
          } else {
            newChild = childNode.updateChild(childChangePath, changedSnap);
          }
        } else {
          newChild = fb.core.snap.EMPTY_NODE;
        }
      }
      if (!oldChild.equals(newChild)) {
        var newEventSnap = this.filter_.updateChild(oldEventSnap.getNode(), childKey, newChild, childChangePath, source, accumulator);
        newViewCache = oldViewCache.updateEventSnap(newEventSnap, oldEventSnap.isFullyInitialized(), this.filter_.filtersNodes());
      } else {
        newViewCache = oldViewCache;
      }
    }
  }
  return newViewCache;
};
fb.core.view.ViewProcessor.cacheHasChild_ = function(viewCache, childKey) {
  return viewCache.getEventCache().isCompleteForChild(childKey);
};
fb.core.view.ViewProcessor.prototype.applyUserMerge_ = function(viewCache, path, changedChildren, writesCache, serverCache, accumulator) {
  var self = this;
  var curViewCache = viewCache;
  changedChildren.foreach(function(relativePath, childNode) {
    var writePath = path.child(relativePath);
    if (fb.core.view.ViewProcessor.cacheHasChild_(viewCache, writePath.getFront())) {
      curViewCache = self.applyUserOverwrite_(curViewCache, writePath, childNode, writesCache, serverCache, accumulator);
    }
  });
  changedChildren.foreach(function(relativePath, childNode) {
    var writePath = path.child(relativePath);
    if (!fb.core.view.ViewProcessor.cacheHasChild_(viewCache, writePath.getFront())) {
      curViewCache = self.applyUserOverwrite_(curViewCache, writePath, childNode, writesCache, serverCache, accumulator);
    }
  });
  return curViewCache;
};
fb.core.view.ViewProcessor.prototype.applyMerge_ = function(node, merge) {
  merge.foreach(function(relativePath, childNode) {
    node = node.updateChild(relativePath, childNode);
  });
  return node;
};
fb.core.view.ViewProcessor.prototype.applyServerMerge_ = function(viewCache, path, changedChildren, writesCache, serverCache, filterServerNode, accumulator) {
  if (viewCache.getServerCache().getNode().isEmpty() && !viewCache.getServerCache().isFullyInitialized()) {
    return viewCache;
  }
  var curViewCache = viewCache;
  var viewMergeTree;
  if (path.isEmpty()) {
    viewMergeTree = changedChildren;
  } else {
    viewMergeTree = fb.core.util.ImmutableTree.Empty.setTree(path, changedChildren);
  }
  var serverNode = viewCache.getServerCache().getNode();
  var self = this;
  viewMergeTree.children.inorderTraversal(function(childKey, childTree) {
    if (serverNode.hasChild(childKey)) {
      var serverChild = viewCache.getServerCache().getNode().getImmediateChild(childKey);
      var newChild = self.applyMerge_(serverChild, childTree);
      curViewCache = self.applyServerOverwrite_(curViewCache, new fb.core.util.Path(childKey), newChild, writesCache, serverCache, filterServerNode, accumulator);
    }
  });
  viewMergeTree.children.inorderTraversal(function(childKey, childMergeTree) {
    var isUnknownDeepMerge = !viewCache.getServerCache().isCompleteForChild(childKey) && childMergeTree.value == null;
    if (!serverNode.hasChild(childKey) && !isUnknownDeepMerge) {
      var serverChild = viewCache.getServerCache().getNode().getImmediateChild(childKey);
      var newChild = self.applyMerge_(serverChild, childMergeTree);
      curViewCache = self.applyServerOverwrite_(curViewCache, new fb.core.util.Path(childKey), newChild, writesCache, serverCache, filterServerNode, accumulator);
    }
  });
  return curViewCache;
};
fb.core.view.ViewProcessor.prototype.ackUserWrite_ = function(viewCache, ackPath, affectedTree, writesCache, optCompleteCache, accumulator) {
  if (writesCache.shadowingWrite(ackPath) != null) {
    return viewCache;
  }
  var filterServerNode = viewCache.getServerCache().isFiltered();
  var serverCache = viewCache.getServerCache();
  if (affectedTree.value != null) {
    if (ackPath.isEmpty() && serverCache.isFullyInitialized() || serverCache.isCompleteForPath(ackPath)) {
      return this.applyServerOverwrite_(viewCache, ackPath, serverCache.getNode().getChild(ackPath), writesCache, optCompleteCache, filterServerNode, accumulator);
    } else {
      if (ackPath.isEmpty()) {
        var changedChildren = (fb.core.util.ImmutableTree.Empty);
        serverCache.getNode().forEachChild(fb.core.snap.KeyIndex, function(name, node) {
          changedChildren = changedChildren.set(new fb.core.util.Path(name), node);
        });
        return this.applyServerMerge_(viewCache, ackPath, changedChildren, writesCache, optCompleteCache, filterServerNode, accumulator);
      } else {
        return viewCache;
      }
    }
  } else {
    var changedChildren = (fb.core.util.ImmutableTree.Empty);
    affectedTree.foreach(function(mergePath, value) {
      var serverCachePath = ackPath.child(mergePath);
      if (serverCache.isCompleteForPath(serverCachePath)) {
        changedChildren = changedChildren.set(mergePath, serverCache.getNode().getChild(serverCachePath));
      }
    });
    return this.applyServerMerge_(viewCache, ackPath, changedChildren, writesCache, optCompleteCache, filterServerNode, accumulator);
  }
};
fb.core.view.ViewProcessor.prototype.revertUserWrite_ = function(viewCache, path, writesCache, optCompleteServerCache, accumulator) {
  var complete;
  if (writesCache.shadowingWrite(path) != null) {
    return viewCache;
  } else {
    var source = new fb.core.view.WriteTreeCompleteChildSource(writesCache, viewCache, optCompleteServerCache);
    var oldEventCache = viewCache.getEventCache().getNode();
    var newEventCache;
    if (path.isEmpty() || path.getFront() === ".priority") {
      var newNode;
      if (viewCache.getServerCache().isFullyInitialized()) {
        newNode = writesCache.calcCompleteEventCache(viewCache.getCompleteServerSnap());
      } else {
        var serverChildren = viewCache.getServerCache().getNode();
        fb.core.util.assert(serverChildren instanceof fb.core.snap.ChildrenNode, "serverChildren would be complete if leaf node");
        newNode = writesCache.calcCompleteEventChildren((serverChildren));
      }
      newNode = (newNode);
      newEventCache = this.filter_.updateFullNode(oldEventCache, newNode, accumulator);
    } else {
      var childKey = path.getFront();
      var newChild = writesCache.calcCompleteChild(childKey, viewCache.getServerCache());
      if (newChild == null && viewCache.getServerCache().isCompleteForChild(childKey)) {
        newChild = oldEventCache.getImmediateChild(childKey);
      }
      if (newChild != null) {
        newEventCache = this.filter_.updateChild(oldEventCache, childKey, newChild, path.popFront(), source, accumulator);
      } else {
        if (viewCache.getEventCache().getNode().hasChild(childKey)) {
          newEventCache = this.filter_.updateChild(oldEventCache, childKey, fb.core.snap.EMPTY_NODE, path.popFront(), source, accumulator);
        } else {
          newEventCache = oldEventCache;
        }
      }
      if (newEventCache.isEmpty() && viewCache.getServerCache().isFullyInitialized()) {
        complete = writesCache.calcCompleteEventCache(viewCache.getCompleteServerSnap());
        if (complete.isLeafNode()) {
          newEventCache = this.filter_.updateFullNode(newEventCache, complete, accumulator);
        }
      }
    }
    complete = viewCache.getServerCache().isFullyInitialized() || writesCache.shadowingWrite(fb.core.util.Path.Empty) != null;
    return viewCache.updateEventSnap(newEventCache, complete, this.filter_.filtersNodes());
  }
};
fb.core.view.ViewProcessor.prototype.listenComplete_ = function(viewCache, path, writesCache, serverCache, accumulator) {
  var oldServerNode = viewCache.getServerCache();
  var newViewCache = viewCache.updateServerSnap(oldServerNode.getNode(), oldServerNode.isFullyInitialized() || path.isEmpty(), oldServerNode.isFiltered());
  return this.generateEventCacheAfterServerEvent_(newViewCache, path, writesCache, fb.core.view.NO_COMPLETE_CHILD_SOURCE, accumulator);
};
goog.provide("fb.core.snap.Index");
goog.provide("fb.core.snap.KeyIndex");
goog.provide("fb.core.snap.PathIndex");
goog.provide("fb.core.snap.PriorityIndex");
goog.provide("fb.core.snap.ValueIndex");
goog.require("fb.core.util");
fb.core.snap.Index = function() {
};
fb.core.snap.Index.FallbackType;
fb.core.snap.Index.Fallback = {};
fb.core.snap.Index.prototype.compare = goog.abstractMethod;
fb.core.snap.Index.prototype.isDefinedOn = goog.abstractMethod;
fb.core.snap.Index.prototype.getCompare = function() {
  return goog.bind(this.compare, this);
};
fb.core.snap.Index.prototype.indexedValueChanged = function(oldNode, newNode) {
  var oldWrapped = new fb.core.snap.NamedNode(fb.core.util.MIN_NAME, oldNode);
  var newWrapped = new fb.core.snap.NamedNode(fb.core.util.MIN_NAME, newNode);
  return this.compare(oldWrapped, newWrapped) !== 0;
};
fb.core.snap.Index.prototype.minPost = function() {
  return fb.core.snap.NamedNode.MIN;
};
fb.core.snap.Index.prototype.maxPost = goog.abstractMethod;
fb.core.snap.Index.prototype.makePost = goog.abstractMethod;
fb.core.snap.Index.prototype.toString = goog.abstractMethod;
fb.core.snap.PathIndex = function(indexPath) {
  fb.core.snap.Index.call(this);
  fb.core.util.assert(!indexPath.isEmpty() && indexPath.getFront() !== ".priority", "Can't create PathIndex with empty path or .priority key");
  this.indexPath_ = indexPath;
};
goog.inherits(fb.core.snap.PathIndex, fb.core.snap.Index);
fb.core.snap.PathIndex.prototype.extractChild = function(snap) {
  return snap.getChild(this.indexPath_);
};
fb.core.snap.PathIndex.prototype.isDefinedOn = function(node) {
  return!node.getChild(this.indexPath_).isEmpty();
};
fb.core.snap.PathIndex.prototype.compare = function(a, b) {
  var aChild = this.extractChild(a.node);
  var bChild = this.extractChild(b.node);
  var indexCmp = aChild.compareTo(bChild);
  if (indexCmp === 0) {
    return fb.core.util.nameCompare(a.name, b.name);
  } else {
    return indexCmp;
  }
};
fb.core.snap.PathIndex.prototype.makePost = function(indexValue, name) {
  var valueNode = fb.core.snap.NodeFromJSON(indexValue);
  var node = fb.core.snap.EMPTY_NODE.updateChild(this.indexPath_, valueNode);
  return new fb.core.snap.NamedNode(name, node);
};
fb.core.snap.PathIndex.prototype.maxPost = function() {
  var node = fb.core.snap.EMPTY_NODE.updateChild(this.indexPath_, fb.core.snap.MAX_NODE);
  return new fb.core.snap.NamedNode(fb.core.util.MAX_NAME, node);
};
fb.core.snap.PathIndex.prototype.toString = function() {
  return this.indexPath_.slice().join("/");
};
fb.core.snap.PriorityIndex_ = function() {
  fb.core.snap.Index.call(this);
};
goog.inherits(fb.core.snap.PriorityIndex_, fb.core.snap.Index);
fb.core.snap.PriorityIndex_.prototype.compare = function(a, b) {
  var aPriority = a.node.getPriority();
  var bPriority = b.node.getPriority();
  var indexCmp = aPriority.compareTo(bPriority);
  if (indexCmp === 0) {
    return fb.core.util.nameCompare(a.name, b.name);
  } else {
    return indexCmp;
  }
};
fb.core.snap.PriorityIndex_.prototype.isDefinedOn = function(node) {
  return!node.getPriority().isEmpty();
};
fb.core.snap.PriorityIndex_.prototype.indexedValueChanged = function(oldNode, newNode) {
  return!oldNode.getPriority().equals(newNode.getPriority());
};
fb.core.snap.PriorityIndex_.prototype.minPost = function() {
  return fb.core.snap.NamedNode.MIN;
};
fb.core.snap.PriorityIndex_.prototype.maxPost = function() {
  return new fb.core.snap.NamedNode(fb.core.util.MAX_NAME, new fb.core.snap.LeafNode("[PRIORITY-POST]", fb.core.snap.MAX_NODE));
};
fb.core.snap.PriorityIndex_.prototype.makePost = function(indexValue, name) {
  var priorityNode = fb.core.snap.NodeFromJSON(indexValue);
  return new fb.core.snap.NamedNode(name, new fb.core.snap.LeafNode("[PRIORITY-POST]", priorityNode));
};
fb.core.snap.PriorityIndex_.prototype.toString = function() {
  return ".priority";
};
fb.core.snap.PriorityIndex = new fb.core.snap.PriorityIndex_;
fb.core.snap.KeyIndex_ = function() {
  fb.core.snap.Index.call(this);
};
goog.inherits(fb.core.snap.KeyIndex_, fb.core.snap.Index);
fb.core.snap.KeyIndex_.prototype.compare = function(a, b) {
  return fb.core.util.nameCompare(a.name, b.name);
};
fb.core.snap.KeyIndex_.prototype.isDefinedOn = function(node) {
  throw fb.core.util.assertionError("KeyIndex.isDefinedOn not expected to be called.");
};
fb.core.snap.KeyIndex_.prototype.indexedValueChanged = function(oldNode, newNode) {
  return false;
};
fb.core.snap.KeyIndex_.prototype.minPost = function() {
  return fb.core.snap.NamedNode.MIN;
};
fb.core.snap.KeyIndex_.prototype.maxPost = function() {
  return new fb.core.snap.NamedNode(fb.core.util.MAX_NAME, fb.core.snap.EMPTY_NODE);
};
fb.core.snap.KeyIndex_.prototype.makePost = function(indexValue, name) {
  fb.core.util.assert(goog.isString(indexValue), "KeyIndex indexValue must always be a string.");
  return new fb.core.snap.NamedNode((indexValue), fb.core.snap.EMPTY_NODE);
};
fb.core.snap.KeyIndex_.prototype.toString = function() {
  return ".key";
};
fb.core.snap.KeyIndex = new fb.core.snap.KeyIndex_;
fb.core.snap.ValueIndex_ = function() {
  fb.core.snap.Index.call(this);
};
goog.inherits(fb.core.snap.ValueIndex_, fb.core.snap.Index);
fb.core.snap.ValueIndex_.prototype.compare = function(a, b) {
  var indexCmp = a.node.compareTo(b.node);
  if (indexCmp === 0) {
    return fb.core.util.nameCompare(a.name, b.name);
  } else {
    return indexCmp;
  }
};
fb.core.snap.ValueIndex_.prototype.isDefinedOn = function(node) {
  return true;
};
fb.core.snap.ValueIndex_.prototype.indexedValueChanged = function(oldNode, newNode) {
  return!oldNode.equals(newNode);
};
fb.core.snap.ValueIndex_.prototype.minPost = function() {
  return fb.core.snap.NamedNode.MIN;
};
fb.core.snap.ValueIndex_.prototype.maxPost = function() {
  return fb.core.snap.NamedNode.MAX;
};
fb.core.snap.ValueIndex_.prototype.makePost = function(indexValue, name) {
  var valueNode = fb.core.snap.NodeFromJSON(indexValue);
  return new fb.core.snap.NamedNode(name, valueNode);
};
fb.core.snap.ValueIndex_.prototype.toString = function() {
  return ".value";
};
fb.core.snap.ValueIndex = new fb.core.snap.ValueIndex_;
goog.provide("fb.core.view.QueryParams");
goog.require("fb.core.snap.Index");
goog.require("fb.core.snap.PriorityIndex");
goog.require("fb.core.util");
goog.require("fb.core.view.filter.IndexedFilter");
goog.require("fb.core.view.filter.LimitedFilter");
goog.require("fb.core.view.filter.NodeFilter");
goog.require("fb.core.view.filter.RangedFilter");
fb.core.view.QueryParams = function() {
  this.limitSet_ = false;
  this.startSet_ = false;
  this.startNameSet_ = false;
  this.endSet_ = false;
  this.endNameSet_ = false;
  this.limit_ = 0;
  this.viewFrom_ = "";
  this.indexStartValue_ = null;
  this.indexStartName_ = "";
  this.indexEndValue_ = null;
  this.indexEndName_ = "";
  this.index_ = fb.core.snap.PriorityIndex;
};
fb.core.view.QueryParams.WIRE_PROTOCOL_CONSTANTS_ = {INDEX_START_VALUE:"sp", INDEX_START_NAME:"sn", INDEX_END_VALUE:"ep", INDEX_END_NAME:"en", LIMIT:"l", VIEW_FROM:"vf", VIEW_FROM_LEFT:"l", VIEW_FROM_RIGHT:"r", INDEX:"i"};
fb.core.view.QueryParams.REST_QUERY_CONSTANTS_ = {ORDER_BY:"orderBy", PRIORITY_INDEX:"$priority", VALUE_INDEX:"$value", KEY_INDEX:"$key", START_AT:"startAt", END_AT:"endAt", LIMIT_TO_FIRST:"limitToFirst", LIMIT_TO_LAST:"limitToLast"};
fb.core.view.QueryParams.DEFAULT = new fb.core.view.QueryParams;
fb.core.view.QueryParams.prototype.hasStart = function() {
  return this.startSet_;
};
fb.core.view.QueryParams.prototype.isViewFromLeft = function() {
  if (this.viewFrom_ === "") {
    return this.startSet_;
  } else {
    return this.viewFrom_ === fb.core.view.QueryParams.WIRE_PROTOCOL_CONSTANTS_.VIEW_FROM_LEFT;
  }
};
fb.core.view.QueryParams.prototype.getIndexStartValue = function() {
  fb.core.util.assert(this.startSet_, "Only valid if start has been set");
  return this.indexStartValue_;
};
fb.core.view.QueryParams.prototype.getIndexStartName = function() {
  fb.core.util.assert(this.startSet_, "Only valid if start has been set");
  if (this.startNameSet_) {
    return this.indexStartName_;
  } else {
    return fb.core.util.MIN_NAME;
  }
};
fb.core.view.QueryParams.prototype.hasEnd = function() {
  return this.endSet_;
};
fb.core.view.QueryParams.prototype.getIndexEndValue = function() {
  fb.core.util.assert(this.endSet_, "Only valid if end has been set");
  return this.indexEndValue_;
};
fb.core.view.QueryParams.prototype.getIndexEndName = function() {
  fb.core.util.assert(this.endSet_, "Only valid if end has been set");
  if (this.endNameSet_) {
    return this.indexEndName_;
  } else {
    return fb.core.util.MAX_NAME;
  }
};
fb.core.view.QueryParams.prototype.hasLimit = function() {
  return this.limitSet_;
};
fb.core.view.QueryParams.prototype.hasAnchoredLimit = function() {
  return this.limitSet_ && this.viewFrom_ !== "";
};
fb.core.view.QueryParams.prototype.getLimit = function() {
  fb.core.util.assert(this.limitSet_, "Only valid if limit has been set");
  return this.limit_;
};
fb.core.view.QueryParams.prototype.getIndex = function() {
  return this.index_;
};
fb.core.view.QueryParams.prototype.copy_ = function() {
  var copy = new fb.core.view.QueryParams;
  copy.limitSet_ = this.limitSet_;
  copy.limit_ = this.limit_;
  copy.startSet_ = this.startSet_;
  copy.indexStartValue_ = this.indexStartValue_;
  copy.startNameSet_ = this.startNameSet_;
  copy.indexStartName_ = this.indexStartName_;
  copy.endSet_ = this.endSet_;
  copy.indexEndValue_ = this.indexEndValue_;
  copy.endNameSet_ = this.endNameSet_;
  copy.indexEndName_ = this.indexEndName_;
  copy.index_ = this.index_;
  return copy;
};
fb.core.view.QueryParams.prototype.limit = function(newLimit) {
  var newParams = this.copy_();
  newParams.limitSet_ = true;
  newParams.limit_ = newLimit;
  newParams.viewFrom_ = "";
  return newParams;
};
fb.core.view.QueryParams.prototype.limitToFirst = function(newLimit) {
  var newParams = this.copy_();
  newParams.limitSet_ = true;
  newParams.limit_ = newLimit;
  newParams.viewFrom_ = fb.core.view.QueryParams.WIRE_PROTOCOL_CONSTANTS_.VIEW_FROM_LEFT;
  return newParams;
};
fb.core.view.QueryParams.prototype.limitToLast = function(newLimit) {
  var newParams = this.copy_();
  newParams.limitSet_ = true;
  newParams.limit_ = newLimit;
  newParams.viewFrom_ = fb.core.view.QueryParams.WIRE_PROTOCOL_CONSTANTS_.VIEW_FROM_RIGHT;
  return newParams;
};
fb.core.view.QueryParams.prototype.startAt = function(indexValue, key) {
  var newParams = this.copy_();
  newParams.startSet_ = true;
  if (!goog.isDef(indexValue)) {
    indexValue = null;
  }
  newParams.indexStartValue_ = indexValue;
  if (key != null) {
    newParams.startNameSet_ = true;
    newParams.indexStartName_ = key;
  } else {
    newParams.startNameSet_ = false;
    newParams.indexStartName_ = "";
  }
  return newParams;
};
fb.core.view.QueryParams.prototype.endAt = function(indexValue, key) {
  var newParams = this.copy_();
  newParams.endSet_ = true;
  if (!goog.isDef(indexValue)) {
    indexValue = null;
  }
  newParams.indexEndValue_ = indexValue;
  if (goog.isDef(key)) {
    newParams.endNameSet_ = true;
    newParams.indexEndName_ = key;
  } else {
    newParams.startEndSet_ = false;
    newParams.indexEndName_ = "";
  }
  return newParams;
};
fb.core.view.QueryParams.prototype.orderBy = function(index) {
  var newParams = this.copy_();
  newParams.index_ = index;
  return newParams;
};
fb.core.view.QueryParams.prototype.getQueryObject = function() {
  var WIRE_PROTOCOL_CONSTANTS = fb.core.view.QueryParams.WIRE_PROTOCOL_CONSTANTS_;
  var obj = {};
  if (this.startSet_) {
    obj[WIRE_PROTOCOL_CONSTANTS.INDEX_START_VALUE] = this.indexStartValue_;
    if (this.startNameSet_) {
      obj[WIRE_PROTOCOL_CONSTANTS.INDEX_START_NAME] = this.indexStartName_;
    }
  }
  if (this.endSet_) {
    obj[WIRE_PROTOCOL_CONSTANTS.INDEX_END_VALUE] = this.indexEndValue_;
    if (this.endNameSet_) {
      obj[WIRE_PROTOCOL_CONSTANTS.INDEX_END_NAME] = this.indexEndName_;
    }
  }
  if (this.limitSet_) {
    obj[WIRE_PROTOCOL_CONSTANTS.LIMIT] = this.limit_;
    var viewFrom = this.viewFrom_;
    if (viewFrom === "") {
      if (this.isViewFromLeft()) {
        viewFrom = WIRE_PROTOCOL_CONSTANTS.VIEW_FROM_LEFT;
      } else {
        viewFrom = WIRE_PROTOCOL_CONSTANTS.VIEW_FROM_RIGHT;
      }
    }
    obj[WIRE_PROTOCOL_CONSTANTS.VIEW_FROM] = viewFrom;
  }
  if (this.index_ !== fb.core.snap.PriorityIndex) {
    obj[WIRE_PROTOCOL_CONSTANTS.INDEX] = this.index_.toString();
  }
  return obj;
};
fb.core.view.QueryParams.prototype.loadsAllData = function() {
  return!(this.startSet_ || this.endSet_ || this.limitSet_);
};
fb.core.view.QueryParams.prototype.isDefault = function() {
  return this.loadsAllData() && this.index_ == fb.core.snap.PriorityIndex;
};
fb.core.view.QueryParams.prototype.getNodeFilter = function() {
  if (this.loadsAllData()) {
    return new fb.core.view.filter.IndexedFilter(this.getIndex());
  } else {
    if (this.hasLimit()) {
      return new fb.core.view.filter.LimitedFilter(this);
    } else {
      return new fb.core.view.filter.RangedFilter(this);
    }
  }
};
fb.core.view.QueryParams.prototype.toRestQueryStringParameters = function() {
  var REST_CONSTANTS = fb.core.view.QueryParams.REST_QUERY_CONSTANTS_;
  var qs = {};
  if (this.isDefault()) {
    return qs;
  }
  var orderBy;
  if (this.index_ === fb.core.snap.PriorityIndex) {
    orderBy = REST_CONSTANTS.PRIORITY_INDEX;
  } else {
    if (this.index_ === fb.core.snap.ValueIndex) {
      orderBy = REST_CONSTANTS.VALUE_INDEX;
    } else {
      if (this.index_ === fb.core.snap.KeyIndex) {
        orderBy = REST_CONSTANTS.KEY_INDEX;
      } else {
        fb.core.util.assert(this.index_ instanceof fb.core.snap.PathIndex, "Unrecognized index type!");
        orderBy = this.index_.toString();
      }
    }
  }
  qs[REST_CONSTANTS.ORDER_BY] = fb.util.json.stringify(orderBy);
  if (this.startSet_) {
    qs[REST_CONSTANTS.START_AT] = fb.util.json.stringify(this.indexStartValue_);
    if (this.startNameSet_) {
      qs[REST_CONSTANTS.START_AT] += "," + fb.util.json.stringify(this.indexStartName_);
    }
  }
  if (this.endSet_) {
    qs[REST_CONSTANTS.END_AT] = fb.util.json.stringify(this.indexEndValue_);
    if (this.endNameSet_) {
      qs[REST_CONSTANTS.END_AT] += "," + fb.util.json.stringify(this.indexEndName_);
    }
  }
  if (this.limitSet_) {
    if (this.isViewFromLeft()) {
      qs[REST_CONSTANTS.LIMIT_TO_FIRST] = this.limit_;
    } else {
      qs[REST_CONSTANTS.LIMIT_TO_LAST] = this.limit_;
    }
  }
  return qs;
};
if (goog.DEBUG) {
  fb.core.view.QueryParams.prototype.toString = function() {
    return fb.util.json.stringify(this.getQueryObject());
  };
}
;goog.provide("fb.core.snap.IndexMap");
goog.require("fb.core.snap.Index");
goog.require("fb.core.util");
fb.core.snap.IndexMap = function(indexes, indexSet) {
  this.indexes_ = indexes;
  this.indexSet_ = indexSet;
};
fb.core.snap.IndexMap.prototype.get = function(indexKey) {
  var sortedMap = fb.util.obj.get(this.indexes_, indexKey);
  if (!sortedMap) {
    throw new Error("No index defined for " + indexKey);
  }
  if (sortedMap === fb.core.snap.Index.Fallback) {
    return null;
  } else {
    return sortedMap;
  }
};
fb.core.snap.IndexMap.prototype.hasIndex = function(indexDefinition) {
  return goog.object.contains(this.indexSet_, indexDefinition.toString());
};
fb.core.snap.IndexMap.prototype.addIndex = function(indexDefinition, existingChildren) {
  fb.core.util.assert(indexDefinition !== fb.core.snap.KeyIndex, "KeyIndex always exists and isn't meant to be added to the IndexMap.");
  var childList = [];
  var sawIndexedValue = false;
  var iter = existingChildren.getIterator(fb.core.snap.NamedNode.Wrap);
  var next = iter.getNext();
  while (next) {
    sawIndexedValue = sawIndexedValue || indexDefinition.isDefinedOn(next.node);
    childList.push(next);
    next = iter.getNext();
  }
  var newIndex;
  if (sawIndexedValue) {
    newIndex = fb.core.snap.buildChildSet(childList, indexDefinition.getCompare());
  } else {
    newIndex = fb.core.snap.Index.Fallback;
  }
  var indexName = indexDefinition.toString();
  var newIndexSet = goog.object.clone(this.indexSet_);
  newIndexSet[indexName] = indexDefinition;
  var newIndexes = goog.object.clone(this.indexes_);
  newIndexes[indexName] = newIndex;
  return new fb.core.snap.IndexMap(newIndexes, newIndexSet);
};
fb.core.snap.IndexMap.prototype.addToIndexes = function(namedNode, existingChildren) {
  var self = this;
  var newIndexes = goog.object.map(this.indexes_, function(indexedChildren, indexName) {
    var index = fb.util.obj.get(self.indexSet_, indexName);
    fb.core.util.assert(index, "Missing index implementation for " + indexName);
    if (indexedChildren === fb.core.snap.Index.Fallback) {
      if (index.isDefinedOn(namedNode.node)) {
        var childList = [];
        var iter = existingChildren.getIterator(fb.core.snap.NamedNode.Wrap);
        var next = iter.getNext();
        while (next) {
          if (next.name != namedNode.name) {
            childList.push(next);
          }
          next = iter.getNext();
        }
        childList.push(namedNode);
        return fb.core.snap.buildChildSet(childList, index.getCompare());
      } else {
        return fb.core.snap.Index.Fallback;
      }
    } else {
      var existingSnap = existingChildren.get(namedNode.name);
      var newChildren = indexedChildren;
      if (existingSnap) {
        newChildren = newChildren.remove(new fb.core.snap.NamedNode(namedNode.name, existingSnap));
      }
      return newChildren.insert(namedNode, namedNode.node);
    }
  });
  return new fb.core.snap.IndexMap(newIndexes, this.indexSet_);
};
fb.core.snap.IndexMap.prototype.removeFromIndexes = function(namedNode, existingChildren) {
  var newIndexes = goog.object.map(this.indexes_, function(indexedChildren) {
    if (indexedChildren === fb.core.snap.Index.Fallback) {
      return indexedChildren;
    } else {
      var existingSnap = existingChildren.get(namedNode.name);
      if (existingSnap) {
        return indexedChildren.remove(new fb.core.snap.NamedNode(namedNode.name, existingSnap));
      } else {
        return indexedChildren;
      }
    }
  });
  return new fb.core.snap.IndexMap(newIndexes, this.indexSet_);
};
fb.core.snap.IndexMap.Default = new fb.core.snap.IndexMap({".priority":fb.core.snap.Index.Fallback}, {".priority":fb.core.snap.PriorityIndex});
goog.provide("fb.core.snap.LeafNode");
goog.require("fb.core.snap.Node");
goog.require("fb.core.util");
fb.core.snap.LeafNode = goog.defineClass(null, {constructor:function(value, opt_priorityNode) {
  this.value_ = value;
  fb.core.util.assert(goog.isDef(this.value_) && this.value_ !== null, "LeafNode shouldn't be created with null/undefined value.");
  this.priorityNode_ = opt_priorityNode || fb.core.snap.EMPTY_NODE;
  fb.core.snap.validatePriorityNode(this.priorityNode_);
  this.lazyHash_ = null;
}, statics:{VALUE_TYPE_ORDER:["object", "boolean", "number", "string"]}, isLeafNode:function() {
  return true;
}, getPriority:function() {
  return this.priorityNode_;
}, updatePriority:function(newPriorityNode) {
  return new fb.core.snap.LeafNode(this.value_, newPriorityNode);
}, getImmediateChild:function(childName) {
  if (childName === ".priority") {
    return this.priorityNode_;
  } else {
    return fb.core.snap.EMPTY_NODE;
  }
}, getChild:function(path) {
  if (path.isEmpty()) {
    return this;
  } else {
    if (path.getFront() === ".priority") {
      return this.priorityNode_;
    } else {
      return fb.core.snap.EMPTY_NODE;
    }
  }
}, hasChild:function() {
  return false;
}, getPredecessorChildName:function(childName, childNode) {
  return null;
}, updateImmediateChild:function(childName, newChildNode) {
  if (childName === ".priority") {
    return this.updatePriority(newChildNode);
  } else {
    if (newChildNode.isEmpty() && childName !== ".priority") {
      return this;
    } else {
      return fb.core.snap.EMPTY_NODE.updateImmediateChild(childName, newChildNode).updatePriority(this.priorityNode_);
    }
  }
}, updateChild:function(path, newChildNode) {
  var front = path.getFront();
  if (front === null) {
    return newChildNode;
  } else {
    if (newChildNode.isEmpty() && front !== ".priority") {
      return this;
    } else {
      fb.core.util.assert(front !== ".priority" || path.getLength() === 1, ".priority must be the last token in a path");
      return this.updateImmediateChild(front, fb.core.snap.EMPTY_NODE.updateChild(path.popFront(), newChildNode));
    }
  }
}, isEmpty:function() {
  return false;
}, numChildren:function() {
  return 0;
}, forEachChild:function(index, action) {
  return false;
}, val:function(opt_exportFormat) {
  if (opt_exportFormat && !this.getPriority().isEmpty()) {
    return{".value":this.getValue(), ".priority":this.getPriority().val()};
  } else {
    return this.getValue();
  }
}, hash:function() {
  if (this.lazyHash_ === null) {
    var toHash = "";
    if (!this.priorityNode_.isEmpty()) {
      toHash += "priority:" + fb.core.snap.priorityHashText((this.priorityNode_.val())) + ":";
    }
    var type = typeof this.value_;
    toHash += type + ":";
    if (type === "number") {
      toHash += fb.core.util.doubleToIEEE754String((this.value_));
    } else {
      toHash += this.value_;
    }
    this.lazyHash_ = fb.core.util.sha1(toHash);
  }
  return(this.lazyHash_);
}, getValue:function() {
  return this.value_;
}, compareTo:function(other) {
  if (other === fb.core.snap.EMPTY_NODE) {
    return 1;
  } else {
    if (other instanceof fb.core.snap.ChildrenNode) {
      return-1;
    } else {
      fb.core.util.assert(other.isLeafNode(), "Unknown node type");
      return this.compareToLeafNode_((other));
    }
  }
}, compareToLeafNode_:function(otherLeaf) {
  var otherLeafType = typeof otherLeaf.value_;
  var thisLeafType = typeof this.value_;
  var otherIndex = goog.array.indexOf(fb.core.snap.LeafNode.VALUE_TYPE_ORDER, otherLeafType);
  var thisIndex = goog.array.indexOf(fb.core.snap.LeafNode.VALUE_TYPE_ORDER, thisLeafType);
  fb.core.util.assert(otherIndex >= 0, "Unknown leaf type: " + otherLeafType);
  fb.core.util.assert(thisIndex >= 0, "Unknown leaf type: " + thisLeafType);
  if (otherIndex === thisIndex) {
    if (thisLeafType === "object") {
      return 0;
    } else {
      if (this.value_ < otherLeaf.value_) {
        return-1;
      } else {
        if (this.value_ === otherLeaf.value_) {
          return 0;
        } else {
          return 1;
        }
      }
    }
  } else {
    return thisIndex - otherIndex;
  }
}, withIndex:function() {
  return this;
}, isIndexed:function() {
  return true;
}, equals:function(other) {
  if (other === this) {
    return true;
  } else {
    if (other.isLeafNode()) {
      var otherLeaf = (other);
      return this.value_ === otherLeaf.value_ && this.priorityNode_.equals(otherLeaf.priorityNode_);
    } else {
      return false;
    }
  }
}});
if (goog.DEBUG) {
  fb.core.snap.LeafNode.prototype.toString = function() {
    return fb.util.json.stringify(this.val(true));
  };
}
;goog.provide("fb.core.snap.ChildrenNode");
goog.require("fb.core.snap.IndexMap");
goog.require("fb.core.snap.LeafNode");
goog.require("fb.core.snap.NamedNode");
goog.require("fb.core.snap.Node");
goog.require("fb.core.snap.PriorityIndex");
goog.require("fb.core.snap.comparators");
goog.require("fb.core.util");
goog.require("fb.core.util.SortedMap");
fb.core.snap.ChildrenNode = function(children, priorityNode, indexMap) {
  this.children_ = children;
  this.priorityNode_ = priorityNode;
  if (this.priorityNode_) {
    fb.core.snap.validatePriorityNode(this.priorityNode_);
  }
  if (children.isEmpty()) {
    fb.core.util.assert(!this.priorityNode_ || this.priorityNode_.isEmpty(), "An empty node cannot have a priority");
  }
  this.indexMap_ = indexMap;
  this.lazyHash_ = null;
};
fb.core.snap.ChildrenNode.prototype.isLeafNode = function() {
  return false;
};
fb.core.snap.ChildrenNode.prototype.getPriority = function() {
  return this.priorityNode_ || fb.core.snap.EMPTY_NODE;
};
fb.core.snap.ChildrenNode.prototype.updatePriority = function(newPriorityNode) {
  if (this.children_.isEmpty()) {
    return this;
  } else {
    return new fb.core.snap.ChildrenNode(this.children_, newPriorityNode, this.indexMap_);
  }
};
fb.core.snap.ChildrenNode.prototype.getImmediateChild = function(childName) {
  if (childName === ".priority") {
    return this.getPriority();
  } else {
    var child = this.children_.get(childName);
    return child === null ? fb.core.snap.EMPTY_NODE : child;
  }
};
fb.core.snap.ChildrenNode.prototype.getChild = function(path) {
  var front = path.getFront();
  if (front === null) {
    return this;
  }
  return this.getImmediateChild(front).getChild(path.popFront());
};
fb.core.snap.ChildrenNode.prototype.hasChild = function(childName) {
  return this.children_.get(childName) !== null;
};
fb.core.snap.ChildrenNode.prototype.updateImmediateChild = function(childName, newChildNode) {
  fb.core.util.assert(newChildNode, "We should always be passing snapshot nodes");
  if (childName === ".priority") {
    return this.updatePriority(newChildNode);
  } else {
    var namedNode = new fb.core.snap.NamedNode(childName, newChildNode);
    var newChildren, newIndexMap, newPriority;
    if (newChildNode.isEmpty()) {
      newChildren = this.children_.remove(childName);
      newIndexMap = this.indexMap_.removeFromIndexes(namedNode, this.children_);
    } else {
      newChildren = this.children_.insert(childName, newChildNode);
      newIndexMap = this.indexMap_.addToIndexes(namedNode, this.children_);
    }
    newPriority = newChildren.isEmpty() ? fb.core.snap.EMPTY_NODE : this.priorityNode_;
    return new fb.core.snap.ChildrenNode(newChildren, newPriority, newIndexMap);
  }
};
fb.core.snap.ChildrenNode.prototype.updateChild = function(path, newChildNode) {
  var front = path.getFront();
  if (front === null) {
    return newChildNode;
  } else {
    fb.core.util.assert(path.getFront() !== ".priority" || path.getLength() === 1, ".priority must be the last token in a path");
    var newImmediateChild = this.getImmediateChild(front).updateChild(path.popFront(), newChildNode);
    return this.updateImmediateChild(front, newImmediateChild);
  }
};
fb.core.snap.ChildrenNode.prototype.isEmpty = function() {
  return this.children_.isEmpty();
};
fb.core.snap.ChildrenNode.prototype.numChildren = function() {
  return this.children_.count();
};
fb.core.snap.ChildrenNode.INTEGER_REGEXP_ = /^(0|[1-9]\d*)$/;
fb.core.snap.ChildrenNode.prototype.val = function(opt_exportFormat) {
  if (this.isEmpty()) {
    return null;
  }
  var obj = {};
  var numKeys = 0, maxKey = 0, allIntegerKeys = true;
  this.forEachChild(fb.core.snap.PriorityIndex, function(key, childNode) {
    obj[key] = childNode.val(opt_exportFormat);
    numKeys++;
    if (allIntegerKeys && fb.core.snap.ChildrenNode.INTEGER_REGEXP_.test(key)) {
      maxKey = Math.max(maxKey, Number(key));
    } else {
      allIntegerKeys = false;
    }
  });
  if (!opt_exportFormat && allIntegerKeys && maxKey < 2 * numKeys) {
    var array = [];
    for (var key in obj) {
      array[key] = obj[key];
    }
    return array;
  } else {
    if (opt_exportFormat && !this.getPriority().isEmpty()) {
      obj[".priority"] = this.getPriority().val();
    }
    return obj;
  }
};
fb.core.snap.ChildrenNode.prototype.hash = function() {
  if (this.lazyHash_ === null) {
    var toHash = "";
    if (!this.getPriority().isEmpty()) {
      toHash += "priority:" + fb.core.snap.priorityHashText((this.getPriority().val())) + ":";
    }
    this.forEachChild(fb.core.snap.PriorityIndex, function(key, childNode) {
      var childHash = childNode.hash();
      if (childHash !== "") {
        toHash += ":" + key + ":" + childHash;
      }
    });
    this.lazyHash_ = toHash === "" ? "" : fb.core.util.sha1(toHash);
  }
  return this.lazyHash_;
};
fb.core.snap.ChildrenNode.prototype.getPredecessorChildName = function(childName, childNode, index) {
  var idx = this.resolveIndex_(index);
  if (idx) {
    var predecessor = idx.getPredecessorKey(new fb.core.snap.NamedNode(childName, childNode));
    return predecessor ? predecessor.name : null;
  } else {
    return this.children_.getPredecessorKey(childName);
  }
};
fb.core.snap.ChildrenNode.prototype.getFirstChildName = function(indexDefinition) {
  var idx = this.resolveIndex_(indexDefinition);
  if (idx) {
    var minKey = idx.minKey();
    return minKey && minKey.name;
  } else {
    return this.children_.minKey();
  }
};
fb.core.snap.ChildrenNode.prototype.getFirstChild = function(indexDefinition) {
  var minKey = this.getFirstChildName(indexDefinition);
  if (minKey) {
    return new fb.core.snap.NamedNode(minKey, this.children_.get(minKey));
  } else {
    return null;
  }
};
fb.core.snap.ChildrenNode.prototype.getLastChildName = function(indexDefinition) {
  var idx = this.resolveIndex_(indexDefinition);
  if (idx) {
    var maxKey = idx.maxKey();
    return maxKey && maxKey.name;
  } else {
    return this.children_.maxKey();
  }
};
fb.core.snap.ChildrenNode.prototype.getLastChild = function(indexDefinition) {
  var maxKey = this.getLastChildName(indexDefinition);
  if (maxKey) {
    return new fb.core.snap.NamedNode(maxKey, this.children_.get(maxKey));
  } else {
    return null;
  }
};
fb.core.snap.ChildrenNode.prototype.forEachChild = function(index, action) {
  var idx = this.resolveIndex_(index);
  if (idx) {
    return idx.inorderTraversal(function(wrappedNode) {
      return action(wrappedNode.name, wrappedNode.node);
    });
  } else {
    return this.children_.inorderTraversal(action);
  }
};
fb.core.snap.ChildrenNode.prototype.getIterator = function(indexDefinition) {
  return this.getIteratorFrom(indexDefinition.minPost(), indexDefinition);
};
fb.core.snap.ChildrenNode.prototype.getIteratorFrom = function(startPost, indexDefinition) {
  var idx = this.resolveIndex_(indexDefinition);
  if (idx) {
    return idx.getIteratorFrom(startPost, function(key) {
      return key;
    });
  } else {
    var iterator = this.children_.getIteratorFrom(startPost.name, fb.core.snap.NamedNode.Wrap);
    var next = iterator.peek();
    while (next != null && indexDefinition.compare(next, startPost) < 0) {
      iterator.getNext();
      next = iterator.peek();
    }
    return iterator;
  }
};
fb.core.snap.ChildrenNode.prototype.getReverseIterator = function(indexDefinition) {
  return this.getReverseIteratorFrom(indexDefinition.maxPost(), indexDefinition);
};
fb.core.snap.ChildrenNode.prototype.getReverseIteratorFrom = function(endPost, indexDefinition) {
  var idx = this.resolveIndex_(indexDefinition);
  if (idx) {
    return idx.getReverseIteratorFrom(endPost, function(key) {
      return key;
    });
  } else {
    var iterator = this.children_.getReverseIteratorFrom(endPost.name, fb.core.snap.NamedNode.Wrap);
    var next = iterator.peek();
    while (next != null && indexDefinition.compare(next, endPost) > 0) {
      iterator.getNext();
      next = iterator.peek();
    }
    return iterator;
  }
};
fb.core.snap.ChildrenNode.prototype.compareTo = function(other) {
  if (this.isEmpty()) {
    if (other.isEmpty()) {
      return 0;
    } else {
      return-1;
    }
  } else {
    if (other.isLeafNode() || other.isEmpty()) {
      return 1;
    } else {
      if (other === fb.core.snap.MAX_NODE) {
        return-1;
      } else {
        return 0;
      }
    }
  }
};
fb.core.snap.ChildrenNode.prototype.withIndex = function(indexDefinition) {
  if (indexDefinition === fb.core.snap.KeyIndex || this.indexMap_.hasIndex(indexDefinition)) {
    return this;
  } else {
    var newIndexMap = this.indexMap_.addIndex(indexDefinition, this.children_);
    return new fb.core.snap.ChildrenNode(this.children_, this.priorityNode_, newIndexMap);
  }
};
fb.core.snap.ChildrenNode.prototype.isIndexed = function(index) {
  return index === fb.core.snap.KeyIndex || this.indexMap_.hasIndex(index);
};
fb.core.snap.ChildrenNode.prototype.equals = function(other) {
  if (other === this) {
    return true;
  } else {
    if (other.isLeafNode()) {
      return false;
    } else {
      var otherChildrenNode = (other);
      if (!this.getPriority().equals(otherChildrenNode.getPriority())) {
        return false;
      } else {
        if (this.children_.count() === otherChildrenNode.children_.count()) {
          var thisIter = this.getIterator(fb.core.snap.PriorityIndex);
          var otherIter = otherChildrenNode.getIterator(fb.core.snap.PriorityIndex);
          var thisCurrent = thisIter.getNext();
          var otherCurrent = otherIter.getNext();
          while (thisCurrent && otherCurrent) {
            if (thisCurrent.name !== otherCurrent.name || !thisCurrent.node.equals(otherCurrent.node)) {
              return false;
            }
            thisCurrent = thisIter.getNext();
            otherCurrent = otherIter.getNext();
          }
          return thisCurrent === null && otherCurrent === null;
        } else {
          return false;
        }
      }
    }
  }
};
fb.core.snap.ChildrenNode.prototype.resolveIndex_ = function(indexDefinition) {
  if (indexDefinition === fb.core.snap.KeyIndex) {
    return null;
  } else {
    return this.indexMap_.get(indexDefinition.toString());
  }
};
if (goog.DEBUG) {
  fb.core.snap.ChildrenNode.prototype.toString = function() {
    return fb.util.json.stringify(this.val(true));
  };
}
;goog.provide("fb.core.snap");
goog.require("fb.core.snap.ChildrenNode");
goog.require("fb.core.snap.IndexMap");
goog.require("fb.core.snap.LeafNode");
goog.require("fb.core.util");
var USE_HINZE = true;
fb.core.snap.NodeFromJSON = function(json, opt_priority) {
  if (json === null) {
    return fb.core.snap.EMPTY_NODE;
  }
  var priority = null;
  if (typeof json === "object" && ".priority" in json) {
    priority = json[".priority"];
  } else {
    if (typeof opt_priority !== "undefined") {
      priority = opt_priority;
    }
  }
  fb.core.util.assert(priority === null || typeof priority === "string" || typeof priority === "number" || typeof priority === "object" && ".sv" in priority, "Invalid priority type found: " + typeof priority);
  if (typeof json === "object" && ".value" in json && json[".value"] !== null) {
    json = json[".value"];
  }
  if (typeof json !== "object" || ".sv" in json) {
    var jsonLeaf = (json);
    return new fb.core.snap.LeafNode(jsonLeaf, fb.core.snap.NodeFromJSON(priority));
  }
  if (!(json instanceof Array) && USE_HINZE) {
    var children = [];
    var childrenHavePriority = false;
    var hinzeJsonObj = (json);
    fb.util.obj.foreach(hinzeJsonObj, function(key, child) {
      if (typeof key !== "string" || key.substring(0, 1) !== ".") {
        var childNode = fb.core.snap.NodeFromJSON(hinzeJsonObj[key]);
        if (!childNode.isEmpty()) {
          childrenHavePriority = childrenHavePriority || !childNode.getPriority().isEmpty();
          children.push(new fb.core.snap.NamedNode(key, childNode));
        }
      }
    });
    if (children.length == 0) {
      return fb.core.snap.EMPTY_NODE;
    }
    var childSet = (fb.core.snap.buildChildSet(children, fb.core.snap.NAME_ONLY_COMPARATOR, function(namedNode) {
      return namedNode.name;
    }, fb.core.snap.NAME_COMPARATOR));
    if (childrenHavePriority) {
      var sortedChildSet = fb.core.snap.buildChildSet(children, fb.core.snap.PriorityIndex.getCompare());
      return new fb.core.snap.ChildrenNode(childSet, fb.core.snap.NodeFromJSON(priority), new fb.core.snap.IndexMap({".priority":sortedChildSet}, {".priority":fb.core.snap.PriorityIndex}));
    } else {
      return new fb.core.snap.ChildrenNode(childSet, fb.core.snap.NodeFromJSON(priority), fb.core.snap.IndexMap.Default);
    }
  } else {
    var node = fb.core.snap.EMPTY_NODE;
    var jsonObj = (json);
    goog.object.forEach(jsonObj, function(childData, key) {
      if (fb.util.obj.contains(jsonObj, key)) {
        if (key.substring(0, 1) !== ".") {
          var childNode = fb.core.snap.NodeFromJSON(childData);
          if (childNode.isLeafNode() || !childNode.isEmpty()) {
            node = node.updateImmediateChild(key, childNode);
          }
        }
      }
    });
    return node.updatePriority(fb.core.snap.NodeFromJSON(priority));
  }
};
var LOG_2 = Math.log(2);
fb.core.snap.Base12Num = function(length) {
  var logBase2 = function(num) {
    return parseInt(Math.log(num) / LOG_2, 10);
  };
  var bitMask = function(bits) {
    return parseInt(Array(bits + 1).join("1"), 2);
  };
  this.count = logBase2(length + 1);
  this.current_ = this.count - 1;
  var mask = bitMask(this.count);
  this.bits_ = length + 1 & mask;
};
fb.core.snap.Base12Num.prototype.nextBitIsOne = function() {
  var result = !(this.bits_ & 1 << this.current_);
  this.current_--;
  return result;
};
fb.core.snap.buildChildSet = function(childList, cmp, keyFn, mapSortFn) {
  childList.sort(cmp);
  var buildBalancedTree = function(low, high) {
    var length = high - low;
    if (length == 0) {
      return null;
    } else {
      if (length == 1) {
        var namedNode = childList[low];
        var key = keyFn ? keyFn(namedNode) : namedNode;
        return new fb.LLRBNode(key, namedNode.node, fb.LLRBNode.BLACK, null, null);
      } else {
        var middle = parseInt(length / 2, 10) + low;
        var left = buildBalancedTree(low, middle);
        var right = buildBalancedTree(middle + 1, high);
        namedNode = childList[middle];
        key = keyFn ? keyFn(namedNode) : namedNode;
        return new fb.LLRBNode(key, namedNode.node, fb.LLRBNode.BLACK, left, right);
      }
    }
  };
  var buildFrom12Array = function(base12) {
    var node = null;
    var root = null;
    var index = childList.length;
    var buildPennant = function(chunkSize, color) {
      var low = index - chunkSize;
      var high = index;
      index -= chunkSize;
      var childTree = buildBalancedTree(low + 1, high);
      var namedNode = childList[low];
      var key = keyFn ? keyFn(namedNode) : namedNode;
      attachPennant(new fb.LLRBNode(key, namedNode.node, color, null, childTree));
    };
    var attachPennant = function(pennant) {
      if (node) {
        node.left = pennant;
        node = pennant;
      } else {
        root = pennant;
        node = pennant;
      }
    };
    for (var i = 0;i < base12.count;++i) {
      var isOne = base12.nextBitIsOne();
      var chunkSize = Math.pow(2, base12.count - (i + 1));
      if (isOne) {
        buildPennant(chunkSize, fb.LLRBNode.BLACK);
      } else {
        buildPennant(chunkSize, fb.LLRBNode.BLACK);
        buildPennant(chunkSize, fb.LLRBNode.RED);
      }
    }
    return root;
  };
  var base12 = new fb.core.snap.Base12Num(childList.length);
  var root = buildFrom12Array(base12);
  if (root !== null) {
    return new fb.core.util.SortedMap(mapSortFn || cmp, root);
  } else {
    return new fb.core.util.SortedMap(mapSortFn || cmp);
  }
};
fb.core.snap.priorityHashText = function(priority) {
  if (typeof priority === "number") {
    return "number:" + fb.core.util.doubleToIEEE754String(priority);
  } else {
    return "string:" + priority;
  }
};
fb.core.snap.validatePriorityNode = function(priorityNode) {
  if (priorityNode.isLeafNode()) {
    var val = priorityNode.val();
    fb.core.util.assert(typeof val === "string" || typeof val === "number" || typeof val === "object" && fb.util.obj.contains(val, ".sv"), "Priority must be a string or number.");
  } else {
    fb.core.util.assert(priorityNode === fb.core.snap.MAX_NODE || priorityNode.isEmpty(), "priority of unexpected type.");
  }
  fb.core.util.assert(priorityNode === fb.core.snap.MAX_NODE || priorityNode.getPriority().isEmpty(), "Priority nodes can't have a priority of their own.");
};
fb.core.snap.EMPTY_NODE = new fb.core.snap.ChildrenNode(new fb.core.util.SortedMap(fb.core.snap.NAME_COMPARATOR), null, fb.core.snap.IndexMap.Default);
fb.core.snap.MAX_NODE_ = function() {
  fb.core.snap.ChildrenNode.call(this, new fb.core.util.SortedMap(fb.core.snap.NAME_COMPARATOR), fb.core.snap.EMPTY_NODE, fb.core.snap.IndexMap.Default);
};
goog.inherits(fb.core.snap.MAX_NODE_, fb.core.snap.ChildrenNode);
fb.core.snap.MAX_NODE_.prototype.compareTo = function(other) {
  if (other === this) {
    return 0;
  } else {
    return 1;
  }
};
fb.core.snap.MAX_NODE_.prototype.equals = function(other) {
  return other === this;
};
fb.core.snap.MAX_NODE_.prototype.getPriority = function() {
  return this;
};
fb.core.snap.MAX_NODE_.prototype.getImmediateChild = function(childName) {
  return fb.core.snap.EMPTY_NODE;
};
fb.core.snap.MAX_NODE_.prototype.isEmpty = function() {
  return false;
};
fb.core.snap.MAX_NODE = new fb.core.snap.MAX_NODE_;
fb.core.snap.NamedNode.MIN = new fb.core.snap.NamedNode(fb.core.util.MIN_NAME, fb.core.snap.EMPTY_NODE);
fb.core.snap.NamedNode.MAX = new fb.core.snap.NamedNode(fb.core.util.MAX_NAME, fb.core.snap.MAX_NODE);
goog.provide("fb.core.view.ViewCache");
goog.require("fb.core.view.CacheNode");
goog.require("fb.core.snap");
fb.core.view.ViewCache = function(eventCache, serverCache) {
  this.eventCache_ = eventCache;
  this.serverCache_ = serverCache;
};
fb.core.view.ViewCache.Empty = new fb.core.view.ViewCache(new fb.core.view.CacheNode(fb.core.snap.EMPTY_NODE, false, false), new fb.core.view.CacheNode(fb.core.snap.EMPTY_NODE, false, false));
fb.core.view.ViewCache.prototype.updateEventSnap = function(eventSnap, complete, filtered) {
  return new fb.core.view.ViewCache(new fb.core.view.CacheNode(eventSnap, complete, filtered), this.serverCache_);
};
fb.core.view.ViewCache.prototype.updateServerSnap = function(serverSnap, complete, filtered) {
  return new fb.core.view.ViewCache(this.eventCache_, new fb.core.view.CacheNode(serverSnap, complete, filtered));
};
fb.core.view.ViewCache.prototype.getEventCache = function() {
  return this.eventCache_;
};
fb.core.view.ViewCache.prototype.getCompleteEventSnap = function() {
  return this.eventCache_.isFullyInitialized() ? this.eventCache_.getNode() : null;
};
fb.core.view.ViewCache.prototype.getServerCache = function() {
  return this.serverCache_;
};
fb.core.view.ViewCache.prototype.getCompleteServerSnap = function() {
  return this.serverCache_.isFullyInitialized() ? this.serverCache_.getNode() : null;
};
goog.provide("fb.core.view.View");
goog.require("fb.core.view.EventGenerator");
goog.require("fb.core.view.ViewCache");
goog.require("fb.core.view.ViewProcessor");
goog.require("fb.core.util");
fb.core.view.View = function(query, initialViewCache) {
  this.query_ = query;
  var params = query.getQueryParams();
  var indexFilter = new fb.core.view.filter.IndexedFilter(params.getIndex());
  var filter = params.getNodeFilter();
  this.processor_ = new fb.core.view.ViewProcessor(filter);
  var initialServerCache = initialViewCache.getServerCache();
  var initialEventCache = initialViewCache.getEventCache();
  var serverSnap = indexFilter.updateFullNode(fb.core.snap.EMPTY_NODE, initialServerCache.getNode(), null);
  var eventSnap = filter.updateFullNode(fb.core.snap.EMPTY_NODE, initialEventCache.getNode(), null);
  var newServerCache = new fb.core.view.CacheNode(serverSnap, initialServerCache.isFullyInitialized(), indexFilter.filtersNodes());
  var newEventCache = new fb.core.view.CacheNode(eventSnap, initialEventCache.isFullyInitialized(), filter.filtersNodes());
  this.viewCache_ = new fb.core.view.ViewCache(newEventCache, newServerCache);
  this.eventRegistrations_ = [];
  this.eventGenerator_ = new fb.core.view.EventGenerator(query);
};
fb.core.view.View.prototype.getQuery = function() {
  return this.query_;
};
fb.core.view.View.prototype.getServerCache = function() {
  return this.viewCache_.getServerCache().getNode();
};
fb.core.view.View.prototype.getCompleteServerCache = function(path) {
  var cache = this.viewCache_.getCompleteServerSnap();
  if (cache) {
    if (this.query_.getQueryParams().loadsAllData() || !path.isEmpty() && !cache.getImmediateChild(path.getFront()).isEmpty()) {
      return cache.getChild(path);
    }
  }
  return null;
};
fb.core.view.View.prototype.isEmpty = function() {
  return this.eventRegistrations_.length === 0;
};
fb.core.view.View.prototype.addEventRegistration = function(eventRegistration) {
  this.eventRegistrations_.push(eventRegistration);
};
fb.core.view.View.prototype.removeEventRegistration = function(eventRegistration, cancelError) {
  var cancelEvents = [];
  if (cancelError) {
    fb.core.util.assert(eventRegistration == null, "A cancel should cancel all event registrations.");
    var path = this.query_.path;
    goog.array.forEach(this.eventRegistrations_, function(registration) {
      cancelError = (cancelError);
      var maybeEvent = registration.createCancelEvent(cancelError, path);
      if (maybeEvent) {
        cancelEvents.push(maybeEvent);
      }
    });
  }
  if (eventRegistration) {
    var remaining = [];
    for (var i = 0;i < this.eventRegistrations_.length;++i) {
      var existing = this.eventRegistrations_[i];
      if (!existing.matches(eventRegistration)) {
        remaining.push(existing);
      } else {
        if (eventRegistration.hasAnyCallback()) {
          remaining = remaining.concat(this.eventRegistrations_.slice(i + 1));
          break;
        }
      }
    }
    this.eventRegistrations_ = remaining;
  } else {
    this.eventRegistrations_ = [];
  }
  return cancelEvents;
};
fb.core.view.View.prototype.applyOperation = function(operation, writesCache, optCompleteServerCache) {
  if (operation.type === fb.core.OperationType.MERGE && operation.source.queryId !== null) {
    fb.core.util.assert(this.viewCache_.getCompleteServerSnap(), "We should always have a full cache before handling merges");
    fb.core.util.assert(this.viewCache_.getCompleteEventSnap(), "Missing event cache, even though we have a server cache");
  }
  var oldViewCache = this.viewCache_;
  var result = this.processor_.applyOperation(oldViewCache, operation, writesCache, optCompleteServerCache);
  this.processor_.assertIndexed(result.viewCache);
  fb.core.util.assert(result.viewCache.getServerCache().isFullyInitialized() || !oldViewCache.getServerCache().isFullyInitialized(), "Once a server snap is complete, it should never go back");
  this.viewCache_ = result.viewCache;
  return this.generateEventsForChanges_(result.changes, result.viewCache.getEventCache().getNode(), null);
};
fb.core.view.View.prototype.getInitialEvents = function(registration) {
  var eventSnap = this.viewCache_.getEventCache();
  var initialChanges = [];
  if (!eventSnap.getNode().isLeafNode()) {
    var eventNode = (eventSnap.getNode());
    eventNode.forEachChild(fb.core.snap.PriorityIndex, function(key, childNode) {
      initialChanges.push(fb.core.view.Change.childAddedChange(key, childNode));
    });
  }
  if (eventSnap.isFullyInitialized()) {
    initialChanges.push(fb.core.view.Change.valueChange(eventSnap.getNode()));
  }
  return this.generateEventsForChanges_(initialChanges, eventSnap.getNode(), registration);
};
fb.core.view.View.prototype.generateEventsForChanges_ = function(changes, eventCache, opt_eventRegistration) {
  var registrations = opt_eventRegistration ? [opt_eventRegistration] : this.eventRegistrations_;
  return this.eventGenerator_.generateEventsForChanges(changes, eventCache, registrations);
};
goog.provide("fb.core.operation.Merge");
goog.require("fb.core.util");
fb.core.operation.Merge = function(source, path, children) {
  this.type = fb.core.OperationType.MERGE;
  this.source = source;
  this.path = path;
  this.children = children;
};
fb.core.operation.Merge.prototype.operationForChild = function(childName) {
  if (this.path.isEmpty()) {
    var childTree = this.children.subtree(new fb.core.util.Path(childName));
    if (childTree.isEmpty()) {
      return null;
    } else {
      if (childTree.value) {
        return new fb.core.operation.Overwrite(this.source, fb.core.util.Path.Empty, childTree.value);
      } else {
        return new fb.core.operation.Merge(this.source, fb.core.util.Path.Empty, childTree);
      }
    }
  } else {
    fb.core.util.assert(this.path.getFront() === childName, "Can't get a merge for a child not on the path of the operation");
    return new fb.core.operation.Merge(this.source, this.path.popFront(), this.children);
  }
};
if (goog.DEBUG) {
  fb.core.operation.Merge.prototype.toString = function() {
    return "Operation(" + this.path + ": " + this.source.toString() + " merge: " + this.children.toString() + ")";
  };
}
;goog.provide("fb.core.ReadonlyRestClient");
goog.require("fb.core.util");
goog.require("fb.util");
goog.require("fb.util.json");
goog.require("fb.util.jwt");
goog.require("fb.util.obj");
fb.core.ReadonlyRestClient = goog.defineClass(null, {constructor:function(repoInfo, onDataUpdate) {
  this.log_ = fb.core.util.logWrapper("p:rest:");
  this.repoInfo_ = repoInfo;
  this.onDataUpdate_ = onDataUpdate;
  this.credential_ = null;
  this.listens_ = {};
}, listen:function(query, currentHashFn, tag, onComplete) {
  var pathString = query.path.toString();
  this.log_("Listen called for " + pathString + " " + query.queryIdentifier());
  var listenId = fb.core.ReadonlyRestClient.getListenId_(query, tag);
  var thisListen = new Object;
  this.listens_[listenId] = thisListen;
  var queryStringParamaters = query.getQueryParams().toRestQueryStringParameters();
  var self = this;
  this.restRequest_(pathString + ".json", queryStringParamaters, function(error, result) {
    var data = result;
    if (error === 404) {
      data = null;
      error = null;
    }
    if (error === null) {
      self.onDataUpdate_(pathString, data, false, tag);
    }
    if (fb.util.obj.get(self.listens_, listenId) === thisListen) {
      var status;
      if (!error) {
        status = "ok";
      } else {
        if (error == 401) {
          status = "permission_denied";
        } else {
          status = "rest_error:" + error;
        }
      }
      onComplete(status, null);
    }
  });
}, unlisten:function(query, tag) {
  var listenId = fb.core.ReadonlyRestClient.getListenId_(query, tag);
  delete this.listens_[listenId];
}, auth:function(cred, opt_callback, opt_cancelCallback) {
  this.credential_ = cred;
  var res = fb.util.jwt.decode(cred);
  var auth = res.data;
  var expires = res.claims && res.claims["exp"];
  if (opt_callback) {
    opt_callback("ok", {"auth":auth, "expires":expires});
  }
}, unauth:function(onComplete) {
  this.credential_ = null;
  onComplete("ok", null);
}, onDisconnectPut:function(pathString, data, opt_onComplete) {
}, onDisconnectMerge:function(pathString, data, opt_onComplete) {
}, onDisconnectCancel:function(pathString, opt_onComplete) {
}, put:function(pathString, data, opt_onComplete, opt_hash) {
}, merge:function(pathString, data, onComplete, opt_hash) {
}, reportStats:function(stats) {
}, restRequest_:function(pathString, queryStringParameters, callback) {
  queryStringParameters = queryStringParameters || {};
  queryStringParameters["format"] = "export";
  if (this.credential_) {
    queryStringParameters["auth"] = this.credential_;
  }
  var url = (this.repoInfo_.secure ? "https://" : "http://") + this.repoInfo_.host + pathString + "?" + fb.util.querystring(queryStringParameters);
  this.log_("Sending REST request for " + url);
  var xhr = new XMLHttpRequest;
  var self = this;
  xhr.onreadystatechange = function() {
    if (callback && xhr.readyState === 4) {
      self.log_("REST Response for " + url + " received. status:", xhr.status, "response:", xhr.responseText);
      var res = null;
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          res = fb.util.json.eval(xhr.responseText);
        } catch (e) {
          fb.core.util.warn("Failed to parse JSON response for " + url + ": " + xhr.responseText);
        }
        callback(null, res);
      } else {
        if (xhr.status !== 401 && xhr.status !== 404) {
          fb.core.util.warn("Got unsuccessful REST response for " + url + " Status: " + xhr.status);
        }
        callback(xhr.status);
      }
      callback = null;
    }
  };
  xhr.open("GET", url, true);
  xhr.send();
}, statics:{getListenId_:function(query, opt_tag) {
  if (goog.isDef(opt_tag)) {
    return "tag$" + opt_tag;
  } else {
    fb.core.util.assert(query.getQueryParams().isDefault(), "should have a tag if it's not a default query.");
    return query.path.toString();
  }
}}});
goog.provide("fb.core.util.EventEmitter");
goog.require("fb.core.util");
goog.require("goog.array");
fb.core.util.EventEmitter = goog.defineClass(null, {constructor:function(allowedEvents) {
  fb.core.util.assert(goog.isArray(allowedEvents) && allowedEvents.length > 0, "Requires a non-empty array");
  this.allowedEvents_ = allowedEvents;
  this.listeners_ = {};
}, getInitialEvent:goog.abstractMethod, trigger:function(eventType, var_args) {
  var listeners = goog.array.clone(this.listeners_[eventType] || []);
  for (var i = 0;i < listeners.length;i++) {
    listeners[i].callback.apply(listeners[i].context, Array.prototype.slice.call(arguments, 1));
  }
}, on:function(eventType, callback, context) {
  this.validateEventType_(eventType);
  this.listeners_[eventType] = this.listeners_[eventType] || [];
  this.listeners_[eventType].push({callback:callback, context:context});
  var eventData = this.getInitialEvent(eventType);
  if (eventData) {
    callback.apply(context, eventData);
  }
}, off:function(eventType, callback, context) {
  this.validateEventType_(eventType);
  var listeners = this.listeners_[eventType] || [];
  for (var i = 0;i < listeners.length;i++) {
    if (listeners[i].callback === callback && (!context || context === listeners[i].context)) {
      listeners.splice(i, 1);
      return;
    }
  }
}, validateEventType_:function(eventType) {
  fb.core.util.assert(goog.array.find(this.allowedEvents_, function(et) {
    return et === eventType;
  }), "Unknown event: " + eventType);
}});
goog.provide("fb.core.util.nextPushId");
goog.require("fb.core.util");
fb.core.util.nextPushId = function() {
  var PUSH_CHARS = "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz";
  var lastPushTime = 0;
  var lastRandChars = [];
  return function(now) {
    var duplicateTime = now === lastPushTime;
    lastPushTime = now;
    var timeStampChars = new Array(8);
    for (var i = 7;i >= 0;i--) {
      timeStampChars[i] = PUSH_CHARS.charAt(now % 64);
      now = Math.floor(now / 64);
    }
    fb.core.util.assert(now === 0, "Cannot push at time == 0");
    var id = timeStampChars.join("");
    if (!duplicateTime) {
      for (i = 0;i < 12;i++) {
        lastRandChars[i] = Math.floor(Math.random() * 64);
      }
    } else {
      for (i = 11;i >= 0 && lastRandChars[i] === 63;i--) {
        lastRandChars[i] = 0;
      }
      lastRandChars[i]++;
    }
    for (i = 0;i < 12;i++) {
      id += PUSH_CHARS.charAt(lastRandChars[i]);
    }
    fb.core.util.assert(id.length === 20, "nextPushId: Length should be 20.");
    return id;
  };
}();
goog.provide("fb.core.util.OnlineMonitor");
goog.require("fb.core.util");
goog.require("fb.core.util.EventEmitter");
fb.core.util.OnlineMonitor = goog.defineClass(fb.core.util.EventEmitter, {constructor:function() {
  fb.core.util.EventEmitter.call(this, ["online"]);
  this.online_ = true;
  if (typeof window !== "undefined" && typeof window.addEventListener !== "undefined") {
    var self = this;
    window.addEventListener("online", function() {
      if (!self.online_) {
        self.online_ = true;
        self.trigger("online", true);
      }
    }, false);
    window.addEventListener("offline", function() {
      if (self.online_) {
        self.online_ = false;
        self.trigger("online", false);
      }
    }, false);
  }
}, getInitialEvent:function(eventType) {
  fb.core.util.assert(eventType === "online", "Unknown event type: " + eventType);
  return[this.online_];
}, currentlyOnline:function() {
  return this.online_;
}});
goog.addSingletonGetter(fb.core.util.OnlineMonitor);
goog.provide("fb.core.util.VisibilityMonitor");
goog.require("fb.core.util");
goog.require("fb.core.util.EventEmitter");
fb.core.util.VisibilityMonitor = goog.defineClass(fb.core.util.EventEmitter, {constructor:function() {
  fb.core.util.EventEmitter.call(this, ["visible"]);
  var hidden, visibilityChange;
  if (typeof document !== "undefined" && typeof document.addEventListener !== "undefined") {
    if (typeof document["hidden"] !== "undefined") {
      visibilityChange = "visibilitychange";
      hidden = "hidden";
    } else {
      if (typeof document["mozHidden"] !== "undefined") {
        visibilityChange = "mozvisibilitychange";
        hidden = "mozHidden";
      } else {
        if (typeof document["msHidden"] !== "undefined") {
          visibilityChange = "msvisibilitychange";
          hidden = "msHidden";
        } else {
          if (typeof document["webkitHidden"] !== "undefined") {
            visibilityChange = "webkitvisibilitychange";
            hidden = "webkitHidden";
          }
        }
      }
    }
  }
  this.visible_ = true;
  if (visibilityChange) {
    var self = this;
    document.addEventListener(visibilityChange, function() {
      var visible = !document[hidden];
      if (visible !== self.visible_) {
        self.visible_ = visible;
        self.trigger("visible", visible);
      }
    }, false);
  }
}, getInitialEvent:function(eventType) {
  fb.core.util.assert(eventType === "visible", "Unknown event type: " + eventType);
  return[this.visible_];
}});
goog.addSingletonGetter(fb.core.util.VisibilityMonitor);
goog.provide("fb.core.util.Path");
goog.provide("fb.core.util.ValidationPath");
goog.require("fb.core.util");
goog.require("fb.util.utf8");
goog.require("goog.string");
fb.core.util.Path = goog.defineClass(null, {constructor:function(pathOrString, opt_pieceNum) {
  if (arguments.length == 1) {
    this.pieces_ = pathOrString.split("/");
    var copyTo = 0;
    for (var i = 0;i < this.pieces_.length;i++) {
      if (this.pieces_[i].length > 0) {
        this.pieces_[copyTo] = this.pieces_[i];
        copyTo++;
      }
    }
    this.pieces_.length = copyTo;
    this.pieceNum_ = 0;
  } else {
    this.pieces_ = pathOrString;
    this.pieceNum_ = opt_pieceNum;
  }
}, getFront:function() {
  if (this.pieceNum_ >= this.pieces_.length) {
    return null;
  }
  return this.pieces_[this.pieceNum_];
}, getLength:function() {
  return this.pieces_.length - this.pieceNum_;
}, popFront:function() {
  var pieceNum = this.pieceNum_;
  if (pieceNum < this.pieces_.length) {
    pieceNum++;
  }
  return new fb.core.util.Path(this.pieces_, pieceNum);
}, getBack:function() {
  if (this.pieceNum_ < this.pieces_.length) {
    return this.pieces_[this.pieces_.length - 1];
  }
  return null;
}, toString:function() {
  var pathString = "";
  for (var i = this.pieceNum_;i < this.pieces_.length;i++) {
    if (this.pieces_[i] !== "") {
      pathString += "/" + this.pieces_[i];
    }
  }
  return pathString || "/";
}, toUrlEncodedString:function() {
  var pathString = "";
  for (var i = this.pieceNum_;i < this.pieces_.length;i++) {
    if (this.pieces_[i] !== "") {
      pathString += "/" + goog.string.urlEncode(this.pieces_[i]);
    }
  }
  return pathString || "/";
}, slice:function(opt_begin) {
  var begin = opt_begin || 0;
  return this.pieces_.slice(this.pieceNum_ + begin);
}, parent:function() {
  if (this.pieceNum_ >= this.pieces_.length) {
    return null;
  }
  var pieces = [];
  for (var i = this.pieceNum_;i < this.pieces_.length - 1;i++) {
    pieces.push(this.pieces_[i]);
  }
  return new fb.core.util.Path(pieces, 0);
}, child:function(childPathObj) {
  var pieces = [];
  for (var i = this.pieceNum_;i < this.pieces_.length;i++) {
    pieces.push(this.pieces_[i]);
  }
  if (childPathObj instanceof fb.core.util.Path) {
    for (i = childPathObj.pieceNum_;i < childPathObj.pieces_.length;i++) {
      pieces.push(childPathObj.pieces_[i]);
    }
  } else {
    var childPieces = childPathObj.split("/");
    for (i = 0;i < childPieces.length;i++) {
      if (childPieces[i].length > 0) {
        pieces.push(childPieces[i]);
      }
    }
  }
  return new fb.core.util.Path(pieces, 0);
}, isEmpty:function() {
  return this.pieceNum_ >= this.pieces_.length;
}, statics:{relativePath:function(outerPath, innerPath) {
  var outer = outerPath.getFront(), inner = innerPath.getFront();
  if (outer === null) {
    return innerPath;
  } else {
    if (outer === inner) {
      return fb.core.util.Path.relativePath(outerPath.popFront(), innerPath.popFront());
    } else {
      throw new Error("INTERNAL ERROR: innerPath (" + innerPath + ") is not within " + "outerPath (" + outerPath + ")");
    }
  }
}, comparePaths:function(left, right) {
  var leftKeys = left.slice();
  var rightKeys = right.slice();
  for (var i = 0;i < leftKeys.length && i < rightKeys.length;i++) {
    var cmp = fb.core.util.nameCompare(leftKeys[i], rightKeys[i]);
    if (cmp !== 0) {
      return cmp;
    }
  }
  if (leftKeys.length === rightKeys.length) {
    return 0;
  }
  return leftKeys.length < rightKeys.length ? -1 : 1;
}}, equals:function(other) {
  if (this.getLength() !== other.getLength()) {
    return false;
  }
  for (var i = this.pieceNum_, j = other.pieceNum_;i <= this.pieces_.length;i++, j++) {
    if (this.pieces_[i] !== other.pieces_[j]) {
      return false;
    }
  }
  return true;
}, contains:function(other) {
  var i = this.pieceNum_;
  var j = other.pieceNum_;
  if (this.getLength() > other.getLength()) {
    return false;
  }
  while (i < this.pieces_.length) {
    if (this.pieces_[i] !== other.pieces_[j]) {
      return false;
    }
    ++i;
    ++j;
  }
  return true;
}});
fb.core.util.Path.Empty = new fb.core.util.Path("");
fb.core.util.ValidationPath = goog.defineClass(null, {constructor:function(path, errorPrefix) {
  this.parts_ = path.slice();
  this.byteLength_ = Math.max(1, this.parts_.length);
  this.errorPrefix_ = errorPrefix;
  for (var i = 0;i < this.parts_.length;i++) {
    this.byteLength_ += fb.util.utf8.stringLength(this.parts_[i]);
  }
  this.checkValid_();
}, statics:{MAX_PATH_DEPTH:32, MAX_PATH_LENGTH_BYTES:768}, push:function(child) {
  if (this.parts_.length > 0) {
    this.byteLength_ += 1;
  }
  this.parts_.push(child);
  this.byteLength_ += fb.util.utf8.stringLength(child);
  this.checkValid_();
}, pop:function() {
  var last = this.parts_.pop();
  this.byteLength_ -= fb.util.utf8.stringLength(last);
  if (this.parts_.length > 0) {
    this.byteLength_ -= 1;
  }
}, checkValid_:function() {
  if (this.byteLength_ > fb.core.util.ValidationPath.MAX_PATH_LENGTH_BYTES) {
    throw new Error(this.errorPrefix_ + "has a key path longer than " + fb.core.util.ValidationPath.MAX_PATH_LENGTH_BYTES + " bytes (" + this.byteLength_ + ").");
  }
  if (this.parts_.length > fb.core.util.ValidationPath.MAX_PATH_DEPTH) {
    throw new Error(this.errorPrefix_ + "path specified exceeds the maximum depth that can be written (" + fb.core.util.ValidationPath.MAX_PATH_DEPTH + ") or object contains a cycle " + this.toErrorString());
  }
}, toErrorString:function() {
  if (this.parts_.length == 0) {
    return "";
  }
  return "in property '" + this.parts_.join(".") + "'";
}});
goog.provide("fb.core.util.ImmutableTree");
goog.require("fb.core.util");
goog.require("fb.core.util.Path");
goog.require("fb.core.util.SortedMap");
goog.require("fb.util.json");
goog.require("fb.util.obj");
goog.require("goog.object");
fb.core.util.ImmutableTree = goog.defineClass(null, {constructor:function(value, opt_children) {
  this.value = value;
  this.children = opt_children || fb.core.util.ImmutableTree.EmptyChildren_;
}, statics:{EmptyChildren_:new fb.core.util.SortedMap(fb.core.util.stringCompare), fromObject:function(obj) {
  var tree = fb.core.util.ImmutableTree.Empty;
  goog.object.forEach(obj, function(childSnap, childPath) {
    tree = tree.set(new fb.core.util.Path(childPath), childSnap);
  });
  return tree;
}}, isEmpty:function() {
  return this.value === null && this.children.isEmpty();
}, findRootMostMatchingPathAndValue:function(relativePath, predicate) {
  if (this.value != null && predicate(this.value)) {
    return{path:fb.core.util.Path.Empty, value:this.value};
  } else {
    if (relativePath.isEmpty()) {
      return null;
    } else {
      var front = relativePath.getFront();
      var child = this.children.get(front);
      if (child !== null) {
        var childExistingPathAndValue = child.findRootMostMatchingPathAndValue(relativePath.popFront(), predicate);
        if (childExistingPathAndValue != null) {
          var fullPath = (new fb.core.util.Path(front)).child(childExistingPathAndValue.path);
          return{path:fullPath, value:childExistingPathAndValue.value};
        } else {
          return null;
        }
      } else {
        return null;
      }
    }
  }
}, findRootMostValueAndPath:function(relativePath) {
  return this.findRootMostMatchingPathAndValue(relativePath, function() {
    return true;
  });
}, subtree:function(relativePath) {
  if (relativePath.isEmpty()) {
    return this;
  } else {
    var front = relativePath.getFront();
    var childTree = this.children.get(front);
    if (childTree !== null) {
      return childTree.subtree(relativePath.popFront());
    } else {
      return fb.core.util.ImmutableTree.Empty;
    }
  }
}, set:function(relativePath, toSet) {
  if (relativePath.isEmpty()) {
    return new fb.core.util.ImmutableTree(toSet, this.children);
  } else {
    var front = relativePath.getFront();
    var child = this.children.get(front) || fb.core.util.ImmutableTree.Empty;
    var newChild = child.set(relativePath.popFront(), toSet);
    var newChildren = this.children.insert(front, newChild);
    return new fb.core.util.ImmutableTree(this.value, newChildren);
  }
}, remove:function(relativePath) {
  if (relativePath.isEmpty()) {
    if (this.children.isEmpty()) {
      return fb.core.util.ImmutableTree.Empty;
    } else {
      return new fb.core.util.ImmutableTree(null, this.children);
    }
  } else {
    var front = relativePath.getFront();
    var child = this.children.get(front);
    if (child) {
      var newChild = child.remove(relativePath.popFront());
      var newChildren;
      if (newChild.isEmpty()) {
        newChildren = this.children.remove(front);
      } else {
        newChildren = this.children.insert(front, newChild);
      }
      if (this.value === null && newChildren.isEmpty()) {
        return fb.core.util.ImmutableTree.Empty;
      } else {
        return new fb.core.util.ImmutableTree(this.value, newChildren);
      }
    } else {
      return this;
    }
  }
}, get:function(relativePath) {
  if (relativePath.isEmpty()) {
    return this.value;
  } else {
    var front = relativePath.getFront();
    var child = this.children.get(front);
    if (child) {
      return child.get(relativePath.popFront());
    } else {
      return null;
    }
  }
}, setTree:function(relativePath, newTree) {
  if (relativePath.isEmpty()) {
    return newTree;
  } else {
    var front = relativePath.getFront();
    var child = this.children.get(front) || fb.core.util.ImmutableTree.Empty;
    var newChild = child.setTree(relativePath.popFront(), newTree);
    var newChildren;
    if (newChild.isEmpty()) {
      newChildren = this.children.remove(front);
    } else {
      newChildren = this.children.insert(front, newChild);
    }
    return new fb.core.util.ImmutableTree(this.value, newChildren);
  }
}, fold:function(fn) {
  return this.fold_(fb.core.util.Path.Empty, fn);
}, fold_:function(pathSoFar, fn) {
  var accum = {};
  this.children.inorderTraversal(function(childKey, childTree) {
    accum[childKey] = childTree.fold_(pathSoFar.child(childKey), fn);
  });
  return fn(pathSoFar, this.value, accum);
}, findOnPath:function(path, f) {
  return this.findOnPath_(path, fb.core.util.Path.Empty, f);
}, findOnPath_:function(pathToFollow, pathSoFar, f) {
  var result = this.value ? f(pathSoFar, this.value) : false;
  if (result) {
    return result;
  } else {
    if (pathToFollow.isEmpty()) {
      return null;
    } else {
      var front = pathToFollow.getFront();
      var nextChild = this.children.get(front);
      if (nextChild) {
        return nextChild.findOnPath_(pathToFollow.popFront(), pathSoFar.child(front), f);
      } else {
        return null;
      }
    }
  }
}, foreachOnPathWhile:function(path, f) {
  return this.foreachOnPathWhile_(path, fb.core.util.Path.Empty, f);
}, foreachOnPathWhile_:function(pathToFollow, currentRelativePath, f) {
  if (pathToFollow.isEmpty()) {
    return currentRelativePath;
  } else {
    var shouldContinue = true;
    if (this.value) {
      shouldContinue = f(currentRelativePath, this.value);
    }
    if (shouldContinue === true) {
      var front = pathToFollow.getFront();
      var nextChild = this.children.get(front);
      if (nextChild) {
        return nextChild.foreachOnPath_(pathToFollow.popFront(), currentRelativePath.child(front), f);
      } else {
        return currentRelativePath;
      }
    } else {
      return currentRelativePath;
    }
  }
}, foreachOnPath:function(path, f) {
  return this.foreachOnPath_(path, fb.core.util.Path.Empty, f);
}, foreachOnPath_:function(pathToFollow, currentRelativePath, f) {
  if (pathToFollow.isEmpty()) {
    return this;
  } else {
    if (this.value) {
      f(currentRelativePath, this.value);
    }
    var front = pathToFollow.getFront();
    var nextChild = this.children.get(front);
    if (nextChild) {
      return nextChild.foreachOnPath_(pathToFollow.popFront(), currentRelativePath.child(front), f);
    } else {
      return fb.core.util.ImmutableTree.Empty;
    }
  }
}, foreach:function(f) {
  this.foreach_(fb.core.util.Path.Empty, f);
}, foreach_:function(currentRelativePath, f) {
  this.children.inorderTraversal(function(childName, childTree) {
    childTree.foreach_(currentRelativePath.child(childName), f);
  });
  if (this.value) {
    f(currentRelativePath, this.value);
  }
}, foreachChild:function(f) {
  this.children.inorderTraversal(function(childName, childTree) {
    if (childTree.value) {
      f(childName, childTree.value);
    }
  });
}});
fb.core.util.ImmutableTree.Empty = new fb.core.util.ImmutableTree(null);
if (goog.DEBUG) {
  fb.core.util.ImmutableTree.prototype.toString = function() {
    var json = {};
    this.foreach(function(relativePath, value) {
      var pathString = relativePath.toString();
      json[pathString] = value.toString();
    });
    return fb.util.json.stringify(json);
  };
}
;goog.provide("fb.core.operation.AckUserWrite");
goog.require("fb.core.util.ImmutableTree");
fb.core.operation.AckUserWrite = function(path, affectedTree, revert) {
  this.type = fb.core.OperationType.ACK_USER_WRITE;
  this.source = fb.core.OperationSource.User;
  this.path = path;
  this.affectedTree = affectedTree;
  this.revert = revert;
};
fb.core.operation.AckUserWrite.prototype.operationForChild = function(childName) {
  if (!this.path.isEmpty()) {
    fb.core.util.assert(this.path.getFront() === childName, "operationForChild called for unrelated child.");
    return new fb.core.operation.AckUserWrite(this.path.popFront(), this.affectedTree, this.revert);
  } else {
    if (this.affectedTree.value != null) {
      fb.core.util.assert(this.affectedTree.children.isEmpty(), "affectedTree should not have overlapping affected paths.");
      return this;
    } else {
      var childTree = this.affectedTree.subtree(new fb.core.util.Path(childName));
      return new fb.core.operation.AckUserWrite(fb.core.util.Path.Empty, childTree, this.revert);
    }
  }
};
if (goog.DEBUG) {
  fb.core.operation.AckUserWrite.prototype.toString = function() {
    return "Operation(" + this.path + ": " + this.source.toString() + " ack write revert=" + this.revert + " affectedTree=" + this.affectedTree + ")";
  };
}
;goog.provide("fb.core.Operation");
goog.require("fb.core.operation.AckUserWrite");
goog.require("fb.core.operation.Merge");
goog.require("fb.core.operation.Overwrite");
goog.require("fb.core.operation.ListenComplete");
goog.require("fb.core.util");
fb.core.OperationType = {OVERWRITE:0, MERGE:1, ACK_USER_WRITE:2, LISTEN_COMPLETE:3};
fb.core.Operation = function() {
};
fb.core.Operation.prototype.source;
fb.core.Operation.prototype.type;
fb.core.Operation.prototype.path;
fb.core.Operation.prototype.operationForChild = goog.abstractMethod;
fb.core.OperationSource = function(fromUser, fromServer, queryId, tagged) {
  this.fromUser = fromUser;
  this.fromServer = fromServer;
  this.queryId = queryId;
  this.tagged = tagged;
  fb.core.util.assert(!tagged || fromServer, "Tagged queries must be from server.");
};
fb.core.OperationSource.User = new fb.core.OperationSource(true, false, null, false);
fb.core.OperationSource.Server = new fb.core.OperationSource(false, true, null, false);
fb.core.OperationSource.forServerTaggedQuery = function(queryId) {
  return new fb.core.OperationSource(false, true, queryId, true);
};
if (goog.DEBUG) {
  fb.core.OperationSource.prototype.toString = function() {
    return this.fromUser ? "user" : this.tagged ? "server(queryID=" + this.queryId + ")" : "server";
  };
}
;goog.provide("fb.core.CompoundWrite");
goog.require("fb.core.snap.Node");
goog.require("fb.core.util");
goog.require("fb.core.util.ImmutableTree");
fb.core.CompoundWrite = function(writeTree) {
  this.writeTree_ = writeTree;
};
fb.core.CompoundWrite.Empty = new fb.core.CompoundWrite((new fb.core.util.ImmutableTree(null)));
fb.core.CompoundWrite.prototype.addWrite = function(path, node) {
  if (path.isEmpty()) {
    return new fb.core.CompoundWrite(new fb.core.util.ImmutableTree(node));
  } else {
    var rootmost = this.writeTree_.findRootMostValueAndPath(path);
    if (rootmost != null) {
      var rootMostPath = rootmost.path, value = rootmost.value;
      var relativePath = fb.core.util.Path.relativePath(rootMostPath, path);
      value = value.updateChild(relativePath, node);
      return new fb.core.CompoundWrite(this.writeTree_.set(rootMostPath, value));
    } else {
      var subtree = new fb.core.util.ImmutableTree(node);
      var newWriteTree = this.writeTree_.setTree(path, subtree);
      return new fb.core.CompoundWrite(newWriteTree);
    }
  }
};
fb.core.CompoundWrite.prototype.addWrites = function(path, updates) {
  var newWrite = this;
  fb.util.obj.foreach(updates, function(childKey, node) {
    newWrite = newWrite.addWrite(path.child(childKey), node);
  });
  return newWrite;
};
fb.core.CompoundWrite.prototype.removeWrite = function(path) {
  if (path.isEmpty()) {
    return fb.core.CompoundWrite.Empty;
  } else {
    var newWriteTree = this.writeTree_.setTree(path, fb.core.util.ImmutableTree.Empty);
    return new fb.core.CompoundWrite(newWriteTree);
  }
};
fb.core.CompoundWrite.prototype.hasCompleteWrite = function(path) {
  return this.getCompleteNode(path) != null;
};
fb.core.CompoundWrite.prototype.getCompleteNode = function(path) {
  var rootmost = this.writeTree_.findRootMostValueAndPath(path);
  if (rootmost != null) {
    return this.writeTree_.get(rootmost.path).getChild(fb.core.util.Path.relativePath(rootmost.path, path));
  } else {
    return null;
  }
};
fb.core.CompoundWrite.prototype.getCompleteChildren = function() {
  var children = [];
  var node = this.writeTree_.value;
  if (node != null) {
    if (!node.isLeafNode()) {
      node = (node);
      node.forEachChild(fb.core.snap.PriorityIndex, function(childName, childNode) {
        children.push(new fb.core.snap.NamedNode(childName, childNode));
      });
    }
  } else {
    this.writeTree_.children.inorderTraversal(function(childName, childTree) {
      if (childTree.value != null) {
        children.push(new fb.core.snap.NamedNode(childName, childTree.value));
      }
    });
  }
  return children;
};
fb.core.CompoundWrite.prototype.childCompoundWrite = function(path) {
  if (path.isEmpty()) {
    return this;
  } else {
    var shadowingNode = this.getCompleteNode(path);
    if (shadowingNode != null) {
      return new fb.core.CompoundWrite(new fb.core.util.ImmutableTree(shadowingNode));
    } else {
      return new fb.core.CompoundWrite(this.writeTree_.subtree(path));
    }
  }
};
fb.core.CompoundWrite.prototype.isEmpty = function() {
  return this.writeTree_.isEmpty();
};
fb.core.CompoundWrite.prototype.apply = function(node) {
  return fb.core.CompoundWrite.applySubtreeWrite_(fb.core.util.Path.Empty, this.writeTree_, node);
};
fb.core.CompoundWrite.applySubtreeWrite_ = function(relativePath, writeTree, node) {
  if (writeTree.value != null) {
    return node.updateChild(relativePath, writeTree.value);
  } else {
    var priorityWrite = null;
    writeTree.children.inorderTraversal(function(childKey, childTree) {
      if (childKey === ".priority") {
        fb.core.util.assert(childTree.value !== null, "Priority writes must always be leaf nodes");
        priorityWrite = childTree.value;
      } else {
        node = fb.core.CompoundWrite.applySubtreeWrite_(relativePath.child(childKey), childTree, node);
      }
    });
    if (!node.getChild(relativePath).isEmpty() && priorityWrite !== null) {
      node = node.updateChild(relativePath.child(".priority"), (priorityWrite));
    }
    return node;
  }
};
goog.provide("fb.core.WriteTree");
goog.require("fb.core.CompoundWrite");
goog.require("fb.core.util");
goog.require("fb.core.view.CacheNode");
fb.core.WriteRecord;
fb.core.WriteTree = function() {
  this.visibleWrites_ = (fb.core.CompoundWrite.Empty);
  this.allWrites_ = [];
  this.lastWriteId_ = -1;
};
fb.core.WriteTree.prototype.childWrites = function(path) {
  return new fb.core.WriteTreeRef(path, this);
};
fb.core.WriteTree.prototype.addOverwrite = function(path, snap, writeId, visible) {
  fb.core.util.assert(writeId > this.lastWriteId_, "Stacking an older write on top of newer ones");
  if (!goog.isDef(visible)) {
    visible = true;
  }
  this.allWrites_.push({path:path, snap:snap, writeId:writeId, visible:visible});
  if (visible) {
    this.visibleWrites_ = this.visibleWrites_.addWrite(path, snap);
  }
  this.lastWriteId_ = writeId;
};
fb.core.WriteTree.prototype.addMerge = function(path, changedChildren, writeId) {
  fb.core.util.assert(writeId > this.lastWriteId_, "Stacking an older merge on top of newer ones");
  this.allWrites_.push({path:path, children:changedChildren, writeId:writeId, visible:true});
  this.visibleWrites_ = this.visibleWrites_.addWrites(path, changedChildren);
  this.lastWriteId_ = writeId;
};
fb.core.WriteTree.prototype.getWrite = function(writeId) {
  for (var i = 0;i < this.allWrites_.length;i++) {
    var record = this.allWrites_[i];
    if (record.writeId === writeId) {
      return record;
    }
  }
  return null;
};
fb.core.WriteTree.prototype.removeWrite = function(writeId) {
  var idx = goog.array.findIndex(this.allWrites_, function(s) {
    return s.writeId === writeId;
  });
  fb.core.util.assert(idx >= 0, "removeWrite called with nonexistent writeId.");
  var writeToRemove = this.allWrites_[idx];
  this.allWrites_.splice(idx, 1);
  var removedWriteWasVisible = writeToRemove.visible;
  var removedWriteOverlapsWithOtherWrites = false;
  var i = this.allWrites_.length - 1;
  while (removedWriteWasVisible && i >= 0) {
    var currentWrite = this.allWrites_[i];
    if (currentWrite.visible) {
      if (i >= idx && this.recordContainsPath_(currentWrite, writeToRemove.path)) {
        removedWriteWasVisible = false;
      } else {
        if (writeToRemove.path.contains(currentWrite.path)) {
          removedWriteOverlapsWithOtherWrites = true;
        }
      }
    }
    i--;
  }
  if (!removedWriteWasVisible) {
    return false;
  } else {
    if (removedWriteOverlapsWithOtherWrites) {
      this.resetTree_();
      return true;
    } else {
      if (writeToRemove.snap) {
        this.visibleWrites_ = this.visibleWrites_.removeWrite(writeToRemove.path);
      } else {
        var children = writeToRemove.children;
        var self = this;
        goog.object.forEach(children, function(childSnap, childName) {
          self.visibleWrites_ = self.visibleWrites_.removeWrite(writeToRemove.path.child(childName));
        });
      }
      return true;
    }
  }
};
fb.core.WriteTree.prototype.getCompleteWriteData = function(path) {
  return this.visibleWrites_.getCompleteNode(path);
};
fb.core.WriteTree.prototype.calcCompleteEventCache = function(treePath, completeServerCache, writeIdsToExclude, includeHiddenWrites) {
  if (!writeIdsToExclude && !includeHiddenWrites) {
    var shadowingNode = this.visibleWrites_.getCompleteNode(treePath);
    if (shadowingNode != null) {
      return shadowingNode;
    } else {
      var subMerge = this.visibleWrites_.childCompoundWrite(treePath);
      if (subMerge.isEmpty()) {
        return completeServerCache;
      } else {
        if (completeServerCache == null && !subMerge.hasCompleteWrite(fb.core.util.Path.Empty)) {
          return null;
        } else {
          var layeredCache = completeServerCache || fb.core.snap.EMPTY_NODE;
          return subMerge.apply(layeredCache);
        }
      }
    }
  } else {
    var merge = this.visibleWrites_.childCompoundWrite(treePath);
    if (!includeHiddenWrites && merge.isEmpty()) {
      return completeServerCache;
    } else {
      if (!includeHiddenWrites && completeServerCache == null && !merge.hasCompleteWrite(fb.core.util.Path.Empty)) {
        return null;
      } else {
        var filter = function(write) {
          return(write.visible || includeHiddenWrites) && (!writeIdsToExclude || !goog.array.contains(writeIdsToExclude, write.writeId)) && (write.path.contains(treePath) || treePath.contains(write.path));
        };
        var mergeAtPath = fb.core.WriteTree.layerTree_(this.allWrites_, filter, treePath);
        layeredCache = completeServerCache || fb.core.snap.EMPTY_NODE;
        return mergeAtPath.apply(layeredCache);
      }
    }
  }
};
fb.core.WriteTree.prototype.calcCompleteEventChildren = function(treePath, completeServerChildren) {
  var completeChildren = fb.core.snap.EMPTY_NODE;
  var topLevelSet = this.visibleWrites_.getCompleteNode(treePath);
  if (topLevelSet) {
    if (!topLevelSet.isLeafNode()) {
      topLevelSet.forEachChild(fb.core.snap.PriorityIndex, function(childName, childSnap) {
        completeChildren = completeChildren.updateImmediateChild(childName, childSnap);
      });
    }
    return completeChildren;
  } else {
    if (completeServerChildren) {
      var merge = this.visibleWrites_.childCompoundWrite(treePath);
      completeServerChildren.forEachChild(fb.core.snap.PriorityIndex, function(childName, childNode) {
        var node = merge.childCompoundWrite(new fb.core.util.Path(childName)).apply(childNode);
        completeChildren = completeChildren.updateImmediateChild(childName, node);
      });
      goog.array.forEach(merge.getCompleteChildren(), function(namedNode) {
        completeChildren = completeChildren.updateImmediateChild(namedNode.name, namedNode.node);
      });
      return completeChildren;
    } else {
      merge = this.visibleWrites_.childCompoundWrite(treePath);
      goog.array.forEach(merge.getCompleteChildren(), function(namedNode) {
        completeChildren = completeChildren.updateImmediateChild(namedNode.name, namedNode.node);
      });
      return completeChildren;
    }
  }
};
fb.core.WriteTree.prototype.calcEventCacheAfterServerOverwrite = function(treePath, childPath, existingEventSnap, existingServerSnap) {
  fb.core.util.assert(existingEventSnap || existingServerSnap, "Either existingEventSnap or existingServerSnap must exist");
  var path = treePath.child(childPath);
  if (this.visibleWrites_.hasCompleteWrite(path)) {
    return null;
  } else {
    var childMerge = this.visibleWrites_.childCompoundWrite(path);
    if (childMerge.isEmpty()) {
      return existingServerSnap.getChild(childPath);
    } else {
      return childMerge.apply(existingServerSnap.getChild(childPath));
    }
  }
};
fb.core.WriteTree.prototype.calcCompleteChild = function(treePath, childKey, existingServerSnap) {
  var path = treePath.child(childKey);
  var shadowingNode = this.visibleWrites_.getCompleteNode(path);
  if (shadowingNode != null) {
    return shadowingNode;
  } else {
    if (existingServerSnap.isCompleteForChild(childKey)) {
      var childMerge = this.visibleWrites_.childCompoundWrite(path);
      return childMerge.apply(existingServerSnap.getNode().getImmediateChild(childKey));
    } else {
      return null;
    }
  }
};
fb.core.WriteTree.prototype.shadowingWrite = function(path) {
  return this.visibleWrites_.getCompleteNode(path);
};
fb.core.WriteTree.prototype.calcIndexedSlice = function(treePath, completeServerData, startPost, count, reverse, index) {
  var toIterate;
  var merge = this.visibleWrites_.childCompoundWrite(treePath);
  var shadowingNode = merge.getCompleteNode(fb.core.util.Path.Empty);
  if (shadowingNode != null) {
    toIterate = shadowingNode;
  } else {
    if (completeServerData != null) {
      toIterate = merge.apply(completeServerData);
    } else {
      return[];
    }
  }
  toIterate = toIterate.withIndex(index);
  if (!toIterate.isEmpty() && !toIterate.isLeafNode()) {
    var nodes = [];
    var cmp = index.getCompare();
    var iter = reverse ? toIterate.getReverseIteratorFrom(startPost, index) : toIterate.getIteratorFrom(startPost, index);
    var next = iter.getNext();
    while (next && nodes.length < count) {
      if (cmp(next, startPost) !== 0) {
        nodes.push(next);
      }
      next = iter.getNext();
    }
    return nodes;
  } else {
    return[];
  }
};
fb.core.WriteTree.prototype.recordContainsPath_ = function(writeRecord, path) {
  if (writeRecord.snap) {
    return writeRecord.path.contains(path);
  } else {
    return!!goog.object.findKey(writeRecord.children, function(childSnap, childName) {
      return writeRecord.path.child(childName).contains(path);
    });
  }
};
fb.core.WriteTree.prototype.resetTree_ = function() {
  this.visibleWrites_ = fb.core.WriteTree.layerTree_(this.allWrites_, fb.core.WriteTree.DefaultFilter_, fb.core.util.Path.Empty);
  if (this.allWrites_.length > 0) {
    this.lastWriteId_ = this.allWrites_[this.allWrites_.length - 1].writeId;
  } else {
    this.lastWriteId_ = -1;
  }
};
fb.core.WriteTree.DefaultFilter_ = function(write) {
  return write.visible;
};
fb.core.WriteTree.layerTree_ = function(writes, filter, treeRoot) {
  var compoundWrite = fb.core.CompoundWrite.Empty;
  for (var i = 0;i < writes.length;++i) {
    var write = writes[i];
    if (filter(write)) {
      var writePath = write.path;
      var relativePath;
      if (write.snap) {
        if (treeRoot.contains(writePath)) {
          relativePath = fb.core.util.Path.relativePath(treeRoot, writePath);
          compoundWrite = compoundWrite.addWrite(relativePath, write.snap);
        } else {
          if (writePath.contains(treeRoot)) {
            relativePath = fb.core.util.Path.relativePath(writePath, treeRoot);
            compoundWrite = compoundWrite.addWrite(fb.core.util.Path.Empty, write.snap.getChild(relativePath));
          } else {
          }
        }
      } else {
        if (write.children) {
          if (treeRoot.contains(writePath)) {
            relativePath = fb.core.util.Path.relativePath(treeRoot, writePath);
            compoundWrite = compoundWrite.addWrites(relativePath, write.children);
          } else {
            if (writePath.contains(treeRoot)) {
              relativePath = fb.core.util.Path.relativePath(writePath, treeRoot);
              if (relativePath.isEmpty()) {
                compoundWrite = compoundWrite.addWrites(fb.core.util.Path.Empty, write.children);
              } else {
                var child = fb.util.obj.get(write.children, relativePath.getFront());
                if (child) {
                  var deepNode = child.getChild(relativePath.popFront());
                  compoundWrite = compoundWrite.addWrite(fb.core.util.Path.Empty, deepNode);
                }
              }
            } else {
            }
          }
        } else {
          throw fb.core.util.assertionError("WriteRecord should have .snap or .children");
        }
      }
    }
  }
  return compoundWrite;
};
fb.core.WriteTreeRef = function(path, writeTree) {
  this.treePath_ = path;
  this.writeTree_ = writeTree;
};
fb.core.WriteTreeRef.prototype.calcCompleteEventCache = function(completeServerCache, writeIdsToExclude, includeHiddenWrites) {
  return this.writeTree_.calcCompleteEventCache(this.treePath_, completeServerCache, writeIdsToExclude, includeHiddenWrites);
};
fb.core.WriteTreeRef.prototype.calcCompleteEventChildren = function(completeServerChildren) {
  return this.writeTree_.calcCompleteEventChildren(this.treePath_, completeServerChildren);
};
fb.core.WriteTreeRef.prototype.calcEventCacheAfterServerOverwrite = function(path, existingEventSnap, existingServerSnap) {
  return this.writeTree_.calcEventCacheAfterServerOverwrite(this.treePath_, path, existingEventSnap, existingServerSnap);
};
fb.core.WriteTreeRef.prototype.shadowingWrite = function(path) {
  return this.writeTree_.shadowingWrite(this.treePath_.child(path));
};
fb.core.WriteTreeRef.prototype.calcIndexedSlice = function(completeServerData, startPost, count, reverse, index) {
  return this.writeTree_.calcIndexedSlice(this.treePath_, completeServerData, startPost, count, reverse, index);
};
fb.core.WriteTreeRef.prototype.calcCompleteChild = function(childKey, existingServerCache) {
  return this.writeTree_.calcCompleteChild(this.treePath_, childKey, existingServerCache);
};
fb.core.WriteTreeRef.prototype.child = function(childName) {
  return new fb.core.WriteTreeRef(this.treePath_.child(childName), this.writeTree_);
};
goog.provide("fb.core.SyncPoint");
goog.require("fb.core.util");
goog.require("fb.core.util.ImmutableTree");
goog.require("fb.core.view.ViewCache");
goog.require("fb.core.view.EventRegistration");
goog.require("fb.core.view.View");
goog.require("goog.array");
fb.core.SyncPoint = function() {
  this.views_ = {};
};
fb.core.SyncPoint.prototype.isEmpty = function() {
  return goog.object.isEmpty(this.views_);
};
fb.core.SyncPoint.prototype.applyOperation = function(operation, writesCache, optCompleteServerCache) {
  var queryId = operation.source.queryId;
  if (queryId !== null) {
    var view = fb.util.obj.get(this.views_, queryId);
    fb.core.util.assert(view != null, "SyncTree gave us an op for an invalid query.");
    return view.applyOperation(operation, writesCache, optCompleteServerCache);
  } else {
    var events = [];
    goog.object.forEach(this.views_, function(view) {
      events = events.concat(view.applyOperation(operation, writesCache, optCompleteServerCache));
    });
    return events;
  }
};
fb.core.SyncPoint.prototype.addEventRegistration = function(query, eventRegistration, writesCache, serverCache, serverCacheComplete) {
  var queryId = query.queryIdentifier();
  var view = fb.util.obj.get(this.views_, queryId);
  if (!view) {
    var eventCache = writesCache.calcCompleteEventCache(serverCacheComplete ? serverCache : null);
    var eventCacheComplete = false;
    if (eventCache) {
      eventCacheComplete = true;
    } else {
      if (serverCache instanceof fb.core.snap.ChildrenNode) {
        eventCache = writesCache.calcCompleteEventChildren(serverCache);
        eventCacheComplete = false;
      } else {
        eventCache = fb.core.snap.EMPTY_NODE;
        eventCacheComplete = false;
      }
    }
    var viewCache = new fb.core.view.ViewCache(new fb.core.view.CacheNode((eventCache), eventCacheComplete, false), new fb.core.view.CacheNode((serverCache), serverCacheComplete, false));
    view = new fb.core.view.View(query, viewCache);
    this.views_[queryId] = view;
  }
  view.addEventRegistration(eventRegistration);
  return view.getInitialEvents(eventRegistration);
};
fb.core.SyncPoint.prototype.removeEventRegistration = function(query, eventRegistration, cancelError) {
  var queryId = query.queryIdentifier();
  var removed = [];
  var cancelEvents = [];
  var hadCompleteView = this.hasCompleteView();
  if (queryId === "default") {
    var self = this;
    goog.object.forEach(this.views_, function(view, viewQueryId) {
      cancelEvents = cancelEvents.concat(view.removeEventRegistration(eventRegistration, cancelError));
      if (view.isEmpty()) {
        delete self.views_[viewQueryId];
        if (!view.getQuery().getQueryParams().loadsAllData()) {
          removed.push(view.getQuery());
        }
      }
    });
  } else {
    var view = fb.util.obj.get(this.views_, queryId);
    if (view) {
      cancelEvents = cancelEvents.concat(view.removeEventRegistration(eventRegistration, cancelError));
      if (view.isEmpty()) {
        delete this.views_[queryId];
        if (!view.getQuery().getQueryParams().loadsAllData()) {
          removed.push(view.getQuery());
        }
      }
    }
  }
  if (hadCompleteView && !this.hasCompleteView()) {
    removed.push(new Firebase(query.repo, query.path));
  }
  return{removed:removed, events:cancelEvents};
};
fb.core.SyncPoint.prototype.getQueryViews = function() {
  return goog.array.filter(goog.object.getValues(this.views_), function(view) {
    return!view.getQuery().getQueryParams().loadsAllData();
  });
};
fb.core.SyncPoint.prototype.getCompleteServerCache = function(path) {
  var serverCache = null;
  goog.object.forEach(this.views_, function(view) {
    serverCache = serverCache || view.getCompleteServerCache(path);
  });
  return serverCache;
};
fb.core.SyncPoint.prototype.viewForQuery = function(query) {
  var params = query.getQueryParams();
  if (params.loadsAllData()) {
    return this.getCompleteView();
  } else {
    var queryId = query.queryIdentifier();
    return fb.util.obj.get(this.views_, queryId);
  }
};
fb.core.SyncPoint.prototype.viewExistsForQuery = function(query) {
  return this.viewForQuery(query) != null;
};
fb.core.SyncPoint.prototype.hasCompleteView = function() {
  return this.getCompleteView() != null;
};
fb.core.SyncPoint.prototype.getCompleteView = function() {
  var completeView = goog.object.findValue(this.views_, function(view) {
    return view.getQuery().getQueryParams().loadsAllData();
  });
  return completeView || null;
};
goog.provide("fb.core.SyncTree");
goog.require("fb.core.Operation");
goog.require("fb.core.SyncPoint");
goog.require("fb.core.WriteTree");
goog.require("fb.core.util");
fb.core.ListenProvider;
fb.core.SyncTree = function(listenProvider) {
  this.syncPointTree_ = fb.core.util.ImmutableTree.Empty;
  this.pendingWriteTree_ = new fb.core.WriteTree;
  this.tagToQueryMap_ = {};
  this.queryToTagMap_ = {};
  this.listenProvider_ = listenProvider;
};
fb.core.SyncTree.prototype.applyUserOverwrite = function(path, newData, writeId, visible) {
  this.pendingWriteTree_.addOverwrite(path, newData, writeId, visible);
  if (!visible) {
    return[];
  } else {
    return this.applyOperationToSyncPoints_(new fb.core.operation.Overwrite(fb.core.OperationSource.User, path, newData));
  }
};
fb.core.SyncTree.prototype.applyUserMerge = function(path, changedChildren, writeId) {
  this.pendingWriteTree_.addMerge(path, changedChildren, writeId);
  var changeTree = fb.core.util.ImmutableTree.fromObject(changedChildren);
  return this.applyOperationToSyncPoints_(new fb.core.operation.Merge(fb.core.OperationSource.User, path, changeTree));
};
fb.core.SyncTree.prototype.ackUserWrite = function(writeId, revert) {
  revert = revert || false;
  var write = this.pendingWriteTree_.getWrite(writeId);
  var needToReevaluate = this.pendingWriteTree_.removeWrite(writeId);
  if (!needToReevaluate) {
    return[];
  } else {
    var affectedTree = fb.core.util.ImmutableTree.Empty;
    if (write.snap != null) {
      affectedTree = affectedTree.set(fb.core.util.Path.Empty, true);
    } else {
      fb.util.obj.foreach(write.children, function(pathString, node) {
        affectedTree = affectedTree.set(new fb.core.util.Path(pathString), node);
      });
    }
    return this.applyOperationToSyncPoints_(new fb.core.operation.AckUserWrite(write.path, affectedTree, revert));
  }
};
fb.core.SyncTree.prototype.applyServerOverwrite = function(path, newData) {
  return this.applyOperationToSyncPoints_(new fb.core.operation.Overwrite(fb.core.OperationSource.Server, path, newData));
};
fb.core.SyncTree.prototype.applyServerMerge = function(path, changedChildren) {
  var changeTree = fb.core.util.ImmutableTree.fromObject(changedChildren);
  return this.applyOperationToSyncPoints_(new fb.core.operation.Merge(fb.core.OperationSource.Server, path, changeTree));
};
fb.core.SyncTree.prototype.applyListenComplete = function(path) {
  return this.applyOperationToSyncPoints_(new fb.core.operation.ListenComplete(fb.core.OperationSource.Server, path));
};
fb.core.SyncTree.prototype.applyTaggedQueryOverwrite = function(path, snap, tag) {
  var queryKey = this.queryKeyForTag_(tag);
  if (queryKey != null) {
    var r = this.parseQueryKey_(queryKey);
    var queryPath = r.path, queryId = r.queryId;
    var relativePath = fb.core.util.Path.relativePath(queryPath, path);
    var op = new fb.core.operation.Overwrite(fb.core.OperationSource.forServerTaggedQuery(queryId), relativePath, snap);
    return this.applyTaggedOperation_(queryPath, queryId, op);
  } else {
    return[];
  }
};
fb.core.SyncTree.prototype.applyTaggedQueryMerge = function(path, changedChildren, tag) {
  var queryKey = this.queryKeyForTag_(tag);
  if (queryKey) {
    var r = this.parseQueryKey_(queryKey);
    var queryPath = r.path, queryId = r.queryId;
    var relativePath = fb.core.util.Path.relativePath(queryPath, path);
    var changeTree = fb.core.util.ImmutableTree.fromObject(changedChildren);
    var op = new fb.core.operation.Merge(fb.core.OperationSource.forServerTaggedQuery(queryId), relativePath, changeTree);
    return this.applyTaggedOperation_(queryPath, queryId, op);
  } else {
    return[];
  }
};
fb.core.SyncTree.prototype.applyTaggedListenComplete = function(path, tag) {
  var queryKey = this.queryKeyForTag_(tag);
  if (queryKey) {
    var r = this.parseQueryKey_(queryKey);
    var queryPath = r.path, queryId = r.queryId;
    var relativePath = fb.core.util.Path.relativePath(queryPath, path);
    var op = new fb.core.operation.ListenComplete(fb.core.OperationSource.forServerTaggedQuery(queryId), relativePath);
    return this.applyTaggedOperation_(queryPath, queryId, op);
  } else {
    return[];
  }
};
fb.core.SyncTree.prototype.addEventRegistration = function(query, eventRegistration) {
  var path = query.path;
  var serverCache = null;
  var foundAncestorDefaultView = false;
  this.syncPointTree_.foreachOnPathWhile(path, function(pathToSyncPoint, sp) {
    var relativePath = fb.core.util.Path.relativePath(pathToSyncPoint, path);
    serverCache = sp.getCompleteServerCache(relativePath);
    foundAncestorDefaultView = foundAncestorDefaultView || sp.hasCompleteView();
    return!serverCache;
  });
  var syncPoint = this.syncPointTree_.get(path);
  if (!syncPoint) {
    syncPoint = new fb.core.SyncPoint;
    this.syncPointTree_ = this.syncPointTree_.set(path, syncPoint);
  } else {
    foundAncestorDefaultView = foundAncestorDefaultView || syncPoint.hasCompleteView();
    serverCache = serverCache || syncPoint.getCompleteServerCache(fb.core.util.Path.Empty);
  }
  var serverCacheComplete;
  if (serverCache != null) {
    serverCacheComplete = true;
  } else {
    serverCacheComplete = false;
    serverCache = fb.core.snap.EMPTY_NODE;
    var subtree = this.syncPointTree_.subtree(path);
    subtree.foreachChild(function(childName, childSyncPoint) {
      var completeCache = childSyncPoint.getCompleteServerCache(fb.core.util.Path.Empty);
      if (completeCache) {
        serverCache = serverCache.updateImmediateChild(childName, completeCache);
      }
    });
  }
  var viewAlreadyExists = syncPoint.viewExistsForQuery(query);
  if (!viewAlreadyExists && !query.getQueryParams().loadsAllData()) {
    var queryKey = this.makeQueryKey_(query);
    fb.core.util.assert(!goog.object.containsKey(this.queryToTagMap_, queryKey), "View does not exist, but we have a tag");
    var tag = fb.core.SyncTree.getNextQueryTag_();
    this.queryToTagMap_[queryKey] = tag;
    this.tagToQueryMap_["_" + tag] = queryKey;
  }
  var writesCache = this.pendingWriteTree_.childWrites(path);
  var events = syncPoint.addEventRegistration(query, eventRegistration, writesCache, serverCache, serverCacheComplete);
  if (!viewAlreadyExists && !foundAncestorDefaultView) {
    var view = (syncPoint.viewForQuery(query));
    events = events.concat(this.setupListener_(query, view));
  }
  return events;
};
fb.core.SyncTree.prototype.removeEventRegistration = function(query, eventRegistration, cancelError) {
  var path = query.path;
  var maybeSyncPoint = this.syncPointTree_.get(path);
  var cancelEvents = [];
  if (maybeSyncPoint && (query.queryIdentifier() === "default" || maybeSyncPoint.viewExistsForQuery(query))) {
    var removedAndEvents = maybeSyncPoint.removeEventRegistration(query, eventRegistration, cancelError);
    if (maybeSyncPoint.isEmpty()) {
      this.syncPointTree_ = this.syncPointTree_.remove(path);
    }
    var removed = removedAndEvents.removed;
    cancelEvents = removedAndEvents.events;
    var removingDefault = -1 !== goog.array.findIndex(removed, function(query) {
      return query.getQueryParams().loadsAllData();
    });
    var covered = this.syncPointTree_.findOnPath(path, function(relativePath, parentSyncPoint) {
      return parentSyncPoint.hasCompleteView();
    });
    if (removingDefault && !covered) {
      var subtree = this.syncPointTree_.subtree(path);
      if (!subtree.isEmpty()) {
        var newViews = this.collectDistinctViewsForSubTree_(subtree);
        for (var i = 0;i < newViews.length;++i) {
          var view = newViews[i], newQuery = view.getQuery();
          var listener = this.createListenerForView_(view);
          this.listenProvider_.startListening(this.queryForListening_(newQuery), this.tagForQuery_(newQuery), listener.hashFn, listener.onComplete);
        }
      } else {
      }
    }
    if (!covered && removed.length > 0 && !cancelError) {
      if (removingDefault) {
        var defaultTag = null;
        this.listenProvider_.stopListening(this.queryForListening_(query), defaultTag);
      } else {
        var self = this;
        goog.array.forEach(removed, function(queryToRemove) {
          var queryIdToRemove = queryToRemove.queryIdentifier();
          var tagToRemove = self.queryToTagMap_[self.makeQueryKey_(queryToRemove)];
          self.listenProvider_.stopListening(self.queryForListening_(queryToRemove), tagToRemove);
        });
      }
    }
    this.removeTags_(removed);
  } else {
  }
  return cancelEvents;
};
fb.core.SyncTree.prototype.calcCompleteEventCache = function(path, writeIdsToExclude) {
  var includeHiddenSets = true;
  var writeTree = this.pendingWriteTree_;
  var serverCache = this.syncPointTree_.findOnPath(path, function(pathSoFar, syncPoint) {
    var relativePath = fb.core.util.Path.relativePath(pathSoFar, path);
    var serverCache = syncPoint.getCompleteServerCache(relativePath);
    if (serverCache) {
      return serverCache;
    }
  });
  return writeTree.calcCompleteEventCache(path, serverCache, writeIdsToExclude, includeHiddenSets);
};
fb.core.SyncTree.prototype.collectDistinctViewsForSubTree_ = function(subtree) {
  return subtree.fold(function(relativePath, maybeChildSyncPoint, childMap) {
    if (maybeChildSyncPoint && maybeChildSyncPoint.hasCompleteView()) {
      var completeView = maybeChildSyncPoint.getCompleteView();
      return[completeView];
    } else {
      var views = [];
      if (maybeChildSyncPoint) {
        views = maybeChildSyncPoint.getQueryViews();
      }
      goog.object.forEach(childMap, function(childViews) {
        views = views.concat(childViews);
      });
      return views;
    }
  });
};
fb.core.SyncTree.prototype.removeTags_ = function(queries) {
  for (var j = 0;j < queries.length;++j) {
    var removedQuery = queries[j];
    if (!removedQuery.getQueryParams().loadsAllData()) {
      var removedQueryKey = this.makeQueryKey_(removedQuery);
      var removedQueryTag = this.queryToTagMap_[removedQueryKey];
      delete this.queryToTagMap_[removedQueryKey];
      delete this.tagToQueryMap_["_" + removedQueryTag];
    }
  }
};
fb.core.SyncTree.prototype.queryForListening_ = function(query) {
  if (query.getQueryParams().loadsAllData() && !query.getQueryParams().isDefault()) {
    return(query.ref());
  } else {
    return query;
  }
};
fb.core.SyncTree.prototype.setupListener_ = function(query, view) {
  var path = query.path;
  var tag = this.tagForQuery_(query);
  var listener = this.createListenerForView_(view);
  var events = this.listenProvider_.startListening(this.queryForListening_(query), tag, listener.hashFn, listener.onComplete);
  var subtree = this.syncPointTree_.subtree(path);
  if (tag) {
    fb.core.util.assert(!subtree.value.hasCompleteView(), "If we're adding a query, it shouldn't be shadowed");
  } else {
    var queriesToStop = subtree.fold(function(relativePath, maybeChildSyncPoint, childMap) {
      if (!relativePath.isEmpty() && maybeChildSyncPoint && maybeChildSyncPoint.hasCompleteView()) {
        return[maybeChildSyncPoint.getCompleteView().getQuery()];
      } else {
        var queries = [];
        if (maybeChildSyncPoint) {
          queries = queries.concat(goog.array.map(maybeChildSyncPoint.getQueryViews(), function(view) {
            return view.getQuery();
          }));
        }
        goog.object.forEach(childMap, function(childQueries) {
          queries = queries.concat(childQueries);
        });
        return queries;
      }
    });
    for (var i = 0;i < queriesToStop.length;++i) {
      var queryToStop = queriesToStop[i];
      this.listenProvider_.stopListening(this.queryForListening_(queryToStop), this.tagForQuery_(queryToStop));
    }
  }
  return events;
};
fb.core.SyncTree.prototype.createListenerForView_ = function(view) {
  var self = this;
  var query = view.getQuery();
  var tag = this.tagForQuery_(query);
  return{hashFn:function() {
    var cache = view.getServerCache() || fb.core.snap.EMPTY_NODE;
    return cache.hash();
  }, onComplete:function(status, data) {
    if (status === "ok") {
      if (tag) {
        return self.applyTaggedListenComplete(query.path, tag);
      } else {
        return self.applyListenComplete(query.path);
      }
    } else {
      var error = fb.core.util.errorForServerCode(status);
      return self.removeEventRegistration(query, null, error);
    }
  }};
};
fb.core.SyncTree.prototype.makeQueryKey_ = function(query) {
  return query.path.toString() + "$" + query.queryIdentifier();
};
fb.core.SyncTree.prototype.parseQueryKey_ = function(queryKey) {
  var splitIndex = queryKey.indexOf("$");
  fb.core.util.assert(splitIndex !== -1 && splitIndex < queryKey.length - 1, "Bad queryKey.");
  return{queryId:queryKey.substr(splitIndex + 1), path:new fb.core.util.Path(queryKey.substr(0, splitIndex))};
};
fb.core.SyncTree.prototype.queryKeyForTag_ = function(tag) {
  return goog.object.get(this.tagToQueryMap_, "_" + tag);
};
fb.core.SyncTree.prototype.tagForQuery_ = function(query) {
  var queryKey = this.makeQueryKey_(query);
  return fb.util.obj.get(this.queryToTagMap_, queryKey);
};
fb.core.SyncTree.nextQueryTag_ = 1;
fb.core.SyncTree.getNextQueryTag_ = function() {
  return fb.core.SyncTree.nextQueryTag_++;
};
fb.core.SyncTree.prototype.applyTaggedOperation_ = function(queryPath, queryId, operation) {
  var syncPoint = this.syncPointTree_.get(queryPath);
  fb.core.util.assert(syncPoint, "Missing sync point for query tag that we're tracking");
  var writesCache = this.pendingWriteTree_.childWrites(queryPath);
  return syncPoint.applyOperation(operation, writesCache, null);
};
fb.core.SyncTree.prototype.applyOperationToSyncPoints_ = function(operation) {
  return this.applyOperationHelper_(operation, this.syncPointTree_, null, this.pendingWriteTree_.childWrites(fb.core.util.Path.Empty));
};
fb.core.SyncTree.prototype.applyOperationHelper_ = function(operation, syncPointTree, serverCache, writesCache) {
  if (operation.path.isEmpty()) {
    return this.applyOperationDescendantsHelper_(operation, syncPointTree, serverCache, writesCache);
  } else {
    var syncPoint = syncPointTree.get(fb.core.util.Path.Empty);
    if (serverCache == null && syncPoint != null) {
      serverCache = syncPoint.getCompleteServerCache(fb.core.util.Path.Empty);
    }
    var events = [];
    var childName = operation.path.getFront();
    var childOperation = operation.operationForChild(childName);
    var childTree = syncPointTree.children.get(childName);
    if (childTree && childOperation) {
      var childServerCache = serverCache ? serverCache.getImmediateChild(childName) : null;
      var childWritesCache = writesCache.child(childName);
      events = events.concat(this.applyOperationHelper_(childOperation, childTree, childServerCache, childWritesCache));
    }
    if (syncPoint) {
      events = events.concat(syncPoint.applyOperation(operation, writesCache, serverCache));
    }
    return events;
  }
};
fb.core.SyncTree.prototype.applyOperationDescendantsHelper_ = function(operation, syncPointTree, serverCache, writesCache) {
  var syncPoint = syncPointTree.get(fb.core.util.Path.Empty);
  if (serverCache == null && syncPoint != null) {
    serverCache = syncPoint.getCompleteServerCache(fb.core.util.Path.Empty);
  }
  var events = [];
  var self = this;
  syncPointTree.children.inorderTraversal(function(childName, childTree) {
    var childServerCache = serverCache ? serverCache.getImmediateChild(childName) : null;
    var childWritesCache = writesCache.child(childName);
    var childOperation = operation.operationForChild(childName);
    if (childOperation) {
      events = events.concat(self.applyOperationDescendantsHelper_(childOperation, childTree, childServerCache, childWritesCache));
    }
  });
  if (syncPoint) {
    events = events.concat(syncPoint.applyOperation(operation, writesCache, serverCache));
  }
  return events;
};
goog.provide("fb.core.util.Tree");
goog.require("fb.core.util");
goog.require("fb.core.util.Path");
goog.require("fb.util.obj");
goog.require("goog.object");
fb.core.util.TreeNode = goog.defineClass(null, {constructor:function() {
  this.children = {};
  this.childCount = 0;
  this.value = null;
}});
fb.core.util.Tree = goog.defineClass(null, {constructor:function(opt_name, opt_parent, opt_node) {
  this.name_ = opt_name ? opt_name : "";
  this.parent_ = opt_parent ? opt_parent : null;
  this.node_ = opt_node ? opt_node : new fb.core.util.TreeNode;
}, subTree:function(pathObj) {
  var path = pathObj instanceof fb.core.util.Path ? pathObj : new fb.core.util.Path(pathObj);
  var child = this, next;
  while ((next = path.getFront()) !== null) {
    var childNode = fb.util.obj.get(child.node_.children, next) || new fb.core.util.TreeNode;
    child = new fb.core.util.Tree(next, child, childNode);
    path = path.popFront();
  }
  return child;
}, getValue:function() {
  return this.node_.value;
}, setValue:function(value) {
  fb.core.util.assert(typeof value !== "undefined", "Cannot set value to undefined");
  this.node_.value = value;
  this.updateParents_();
}, clear:function() {
  this.node_.value = null;
  this.node_.children = {};
  this.node_.childCount = 0;
  this.updateParents_();
}, hasChildren:function() {
  return this.node_.childCount > 0;
}, isEmpty:function() {
  return this.getValue() === null && !this.hasChildren();
}, forEachChild:function(action) {
  var self = this;
  goog.object.forEach(this.node_.children, function(childTree, child) {
    action(new fb.core.util.Tree(child, self, childTree));
  });
}, forEachDescendant:function(action, opt_includeSelf, opt_childrenFirst) {
  if (opt_includeSelf && !opt_childrenFirst) {
    action(this);
  }
  this.forEachChild(function(child) {
    child.forEachDescendant(action, true, opt_childrenFirst);
  });
  if (opt_includeSelf && opt_childrenFirst) {
    action(this);
  }
}, forEachAncestor:function(action, opt_includeSelf) {
  var node = opt_includeSelf ? this : this.parent();
  while (node !== null) {
    if (action(node)) {
      return true;
    }
    node = node.parent();
  }
  return false;
}, forEachImmediateDescendantWithValue:function(action) {
  this.forEachChild(function(child) {
    if (child.getValue() !== null) {
      action(child);
    } else {
      child.forEachImmediateDescendantWithValue(action);
    }
  });
}, path:function() {
  return new fb.core.util.Path(this.parent_ === null ? this.name_ : this.parent_.path() + "/" + this.name_);
}, name:function() {
  return this.name_;
}, parent:function() {
  return this.parent_;
}, updateParents_:function() {
  if (this.parent_ !== null) {
    this.parent_.updateChild_(this.name_, this);
  }
}, updateChild_:function(childName, child) {
  var childEmpty = child.isEmpty();
  var childExists = fb.util.obj.contains(this.node_.children, childName);
  if (childEmpty && childExists) {
    delete this.node_.children[childName];
    this.node_.childCount--;
    this.updateParents_();
  } else {
    if (!childEmpty && !childExists) {
      this.node_.children[childName] = child.node_;
      this.node_.childCount++;
      this.updateParents_();
    }
  }
}});
goog.provide("fb.core.util.validation");
goog.require("fb.core.util");
goog.require("fb.core.util.Path");
goog.require("fb.core.util.ValidationPath");
goog.require("fb.util.obj");
goog.require("fb.util.utf8");
goog.require("fb.util.validation");
fb.core.util.validation = {INVALID_KEY_REGEX_:/[\[\].#$\/\u0000-\u001F\u007F]/, INVALID_PATH_REGEX_:/[\[\].#$\u0000-\u001F\u007F]/, VALID_AUTH_PROVIDER:/^[a-zA-Z][a-zA-Z._\-+]+$/, MAX_LEAF_SIZE_:10 * 1024 * 1024, isValidKey:function(key) {
  return goog.isString(key) && key.length !== 0 && !fb.core.util.validation.INVALID_KEY_REGEX_.test(key);
}, isValidPathString:function(pathString) {
  return goog.isString(pathString) && pathString.length !== 0 && !fb.core.util.validation.INVALID_PATH_REGEX_.test(pathString);
}, isValidRootPathString:function(pathString) {
  if (pathString) {
    pathString = pathString.replace(/^\/*\.info(\/|$)/, "/");
  }
  return fb.core.util.validation.isValidPathString(pathString);
}, isValidPriority:function(priority) {
  return priority === null || goog.isString(priority) || goog.isNumber(priority) && !fb.core.util.isInvalidJSONNumber(priority) || goog.isObject(priority) && fb.util.obj.contains(priority, ".sv");
}, validateFirebaseDataArg:function(fnName, argumentNumber, data, path, optional) {
  if (optional && !goog.isDef(data)) {
    return;
  }
  fb.core.util.validation.validateFirebaseData(fb.util.validation.errorPrefix(fnName, argumentNumber, optional), data, path);
}, validateFirebaseData:function(errorPrefix, data, path) {
  if (path instanceof fb.core.util.Path) {
    path = new fb.core.util.ValidationPath(path, errorPrefix);
  }
  if (!goog.isDef(data)) {
    throw new Error(errorPrefix + "contains undefined " + path.toErrorString());
  }
  if (goog.isFunction(data)) {
    throw new Error(errorPrefix + "contains a function " + path.toErrorString() + " with contents: " + data.toString());
  }
  if (fb.core.util.isInvalidJSONNumber(data)) {
    throw new Error(errorPrefix + "contains " + data.toString() + " " + path.toErrorString());
  }
  if (goog.isString(data) && data.length > fb.core.util.validation.MAX_LEAF_SIZE_ / 3 && fb.util.utf8.stringLength(data) > fb.core.util.validation.MAX_LEAF_SIZE_) {
    throw new Error(errorPrefix + "contains a string greater than " + fb.core.util.validation.MAX_LEAF_SIZE_ + " utf8 bytes " + path.toErrorString() + " ('" + data.substring(0, 50) + "...')");
  }
  if (goog.isObject(data)) {
    var hasDotValue = false, hasActualChild = false;
    fb.util.obj.foreach(data, function(key, value) {
      if (key === ".value") {
        hasDotValue = true;
      } else {
        if (key !== ".priority" && key !== ".sv") {
          hasActualChild = true;
          if (!fb.core.util.validation.isValidKey(key)) {
            throw new Error(errorPrefix + " contains an invalid key (" + key + ") " + path.toErrorString() + ".  Keys must be non-empty strings " + 'and can\'t contain ".", "#", "$", "/", "[", or "]"');
          }
        }
      }
      path.push(key);
      fb.core.util.validation.validateFirebaseData(errorPrefix, value, path);
      path.pop();
    });
    if (hasDotValue && hasActualChild) {
      throw new Error(errorPrefix + ' contains ".value" child ' + path.toErrorString() + " in addition to actual children.");
    }
  }
}, validateFirebaseMergePaths:function(errorPrefix, mergePaths) {
  var i, curPath;
  for (i = 0;i < mergePaths.length;i++) {
    curPath = mergePaths[i];
    var keys = curPath.slice();
    for (var j = 0;j < keys.length;j++) {
      if (keys[j] === ".priority" && j === keys.length - 1) {
      } else {
        if (!fb.core.util.validation.isValidKey(keys[j])) {
          throw new Error(errorPrefix + "contains an invalid key (" + keys[j] + ") in path " + curPath.toString() + ". Keys must be non-empty strings " + 'and can\'t contain ".", "#", "$", "/", "[", or "]"');
        }
      }
    }
  }
  mergePaths.sort(fb.core.util.Path.comparePaths);
  var prevPath = null;
  for (i = 0;i < mergePaths.length;i++) {
    curPath = mergePaths[i];
    if (prevPath !== null && prevPath.contains(curPath)) {
      throw new Error(errorPrefix + "contains a path " + prevPath.toString() + " that is ancestor of another path " + curPath.toString());
    }
    prevPath = curPath;
  }
}, validateFirebaseMergeDataArg:function(fnName, argumentNumber, data, path, optional) {
  if (optional && !goog.isDef(data)) {
    return;
  }
  var errorPrefix = fb.util.validation.errorPrefix(fnName, argumentNumber, optional);
  if (!goog.isObject(data) || goog.isArray(data)) {
    throw new Error(errorPrefix + " must be an object containing the children to replace.");
  }
  var mergePaths = [];
  fb.util.obj.foreach(data, function(key, value) {
    var curPath = new fb.core.util.Path(key);
    fb.core.util.validation.validateFirebaseData(errorPrefix, value, path.child(curPath));
    if (curPath.getBack() === ".priority") {
      if (!fb.core.util.validation.isValidPriority(value)) {
        throw new Error(errorPrefix + "contains an invalid value for '" + curPath.toString() + "', which must be a valid " + "Firebase priority (a string, finite number, server value, or null).");
      }
    }
    mergePaths.push(curPath);
  });
  fb.core.util.validation.validateFirebaseMergePaths(errorPrefix, mergePaths);
}, validatePriority:function(fnName, argumentNumber, priority, optional) {
  if (optional && !goog.isDef(priority)) {
    return;
  }
  if (fb.core.util.isInvalidJSONNumber(priority)) {
    throw new Error(fb.util.validation.errorPrefix(fnName, argumentNumber, optional) + "is " + priority.toString() + ", but must be a valid Firebase priority (a string, finite number, " + "server value, or null).");
  }
  if (!fb.core.util.validation.isValidPriority(priority)) {
    throw new Error(fb.util.validation.errorPrefix(fnName, argumentNumber, optional) + "must be a valid Firebase priority " + "(a string, finite number, server value, or null).");
  }
}, validateEventType:function(fnName, argumentNumber, eventType, optional) {
  if (optional && !goog.isDef(eventType)) {
    return;
  }
  switch(eventType) {
    case "value":
    ;
    case "child_added":
    ;
    case "child_removed":
    ;
    case "child_changed":
    ;
    case "child_moved":
      break;
    default:
      throw new Error(fb.util.validation.errorPrefix(fnName, argumentNumber, optional) + 'must be a valid event type: "value", "child_added", "child_removed", ' + '"child_changed", or "child_moved".');;
  }
}, validateKey:function(fnName, argumentNumber, key, optional) {
  if (optional && !goog.isDef(key)) {
    return;
  }
  if (!fb.core.util.validation.isValidKey(key)) {
    throw new Error(fb.util.validation.errorPrefix(fnName, argumentNumber, optional) + 'was an invalid key: "' + key + '".  Firebase keys must be non-empty strings and ' + 'can\'t contain ".", "#", "$", "/", "[", or "]").');
  }
}, validatePathString:function(fnName, argumentNumber, pathString, optional) {
  if (optional && !goog.isDef(pathString)) {
    return;
  }
  if (!fb.core.util.validation.isValidPathString(pathString)) {
    throw new Error(fb.util.validation.errorPrefix(fnName, argumentNumber, optional) + 'was an invalid path: "' + pathString + '". Paths must be non-empty strings and ' + 'can\'t contain ".", "#", "$", "[", or "]"');
  }
}, validateRootPathString:function(fnName, argumentNumber, pathString, optional) {
  if (pathString) {
    pathString = pathString.replace(/^\/*\.info(\/|$)/, "/");
  }
  fb.core.util.validation.validatePathString(fnName, argumentNumber, pathString, optional);
}, validateWritablePath:function(fnName, path) {
  if (path.getFront() === ".info") {
    throw new Error(fnName + " failed: Can't modify data under /.info/");
  }
}, validateUrl:function(fnName, argumentNumber, parsedUrl) {
  var pathString = parsedUrl.path.toString();
  if (!goog.isString(parsedUrl.repoInfo.host) || parsedUrl.repoInfo.host.length === 0 || !fb.core.util.validation.isValidKey(parsedUrl.repoInfo.namespace) || pathString.length !== 0 && !fb.core.util.validation.isValidRootPathString(pathString)) {
    throw new Error(fb.util.validation.errorPrefix(fnName, argumentNumber, false) + "must be a valid firebase URL and " + 'the path can\'t contain ".", "#", "$", "[", or "]".');
  }
}, validateCredential:function(fnName, argumentNumber, cred, optional) {
  if (optional && !goog.isDef(cred)) {
    return;
  }
  if (!goog.isString(cred)) {
    throw new Error(fb.util.validation.errorPrefix(fnName, argumentNumber, optional) + "must be a valid credential (a string).");
  }
}, validateBoolean:function(fnName, argumentNumber, bool, optional) {
  if (optional && !goog.isDef(bool)) {
    return;
  }
  if (!goog.isBoolean(bool)) {
    throw new Error(fb.util.validation.errorPrefix(fnName, argumentNumber, optional) + "must be a boolean.");
  }
}, validateString:function(fnName, argumentNumber, string, optional) {
  if (optional && !goog.isDef(string)) {
    return;
  }
  if (!goog.isString(string)) {
    throw new Error(fb.util.validation.errorPrefix(fnName, argumentNumber, optional) + "must be a valid string.");
  }
}, validateAuthProvider:function(fnName, argumentNumber, provider, optional) {
  if (optional && !goog.isDef(provider)) {
    return;
  }
  fb.core.util.validation.validateString(fnName, argumentNumber, provider, optional);
  if (!fb.core.util.validation.VALID_AUTH_PROVIDER.test(provider)) {
    throw new Error(fb.util.validation.errorPrefix(fnName, argumentNumber, optional) + "'" + provider + "' is not a valid authentication provider.");
  }
}, validateObject:function(fnName, argumentNumber, obj, optional) {
  if (optional && !goog.isDef(obj)) {
    return;
  }
  if (!goog.isObject(obj) || obj === null) {
    throw new Error(fb.util.validation.errorPrefix(fnName, argumentNumber, optional) + "must be a valid object.");
  }
}, validateObjectContainsKey:function(fnName, argumentNumber, obj, key, optional, opt_type) {
  var objectContainsKey = goog.isObject(obj) && fb.util.obj.contains(obj, key);
  if (!objectContainsKey) {
    if (optional) {
      return;
    } else {
      throw new Error(fb.util.validation.errorPrefix(fnName, argumentNumber, optional) + 'must contain the key "' + key + '"');
    }
  }
  if (opt_type) {
    var val = fb.util.obj.get(obj, key);
    if (opt_type === "number" && !goog.isNumber(val) || opt_type === "string" && !goog.isString(val) || opt_type === "boolean" && !goog.isBoolean(val) || opt_type === "function" && !goog.isFunction(val) || opt_type === "object" && !goog.isObject(val)) {
      if (optional) {
        throw new Error(fb.util.validation.errorPrefix(fnName, argumentNumber, optional) + 'contains invalid value for key "' + key + '" (must be of type "' + opt_type + '")');
      } else {
        throw new Error(fb.util.validation.errorPrefix(fnName, argumentNumber, optional) + 'must contain the key "' + key + '" with type "' + opt_type + '"');
      }
    }
  }
}};
goog.provide("fb.core.util.CountedSet");
goog.require("fb.core.util");
goog.require("fb.util.obj");
goog.require("goog.object");
fb.core.util.CountedSet = goog.defineClass(null, {constructor:function() {
  this.set = {};
}, add:function(item, val) {
  this.set[item] = val !== null ? val : true;
}, contains:function(key) {
  return fb.util.obj.contains(this.set, key);
}, get:function(item) {
  return this.contains(item) ? this.set[item] : undefined;
}, remove:function(item) {
  delete this.set[item];
}, clear:function() {
  this.set = {};
}, isEmpty:function() {
  return goog.object.isEmpty(this.set);
}, count:function() {
  return goog.object.getCount(this.set);
}, each:function(fn) {
  goog.object.forEach(this.set, function(v, k) {
    fn(k, v);
  });
}, keys:function() {
  var keys = [];
  goog.object.forEach(this.set, function(v, k) {
    keys.push(k);
  });
  return keys;
}});
goog.provide("fb.core.SparseSnapshotTree");
goog.require("fb.core.snap.Node");
goog.require("fb.core.snap.PriorityIndex");
goog.require("fb.core.util.CountedSet");
goog.require("fb.core.util.Path");
fb.core.SparseSnapshotTree = function() {
  this.value_ = null;
  this.children_ = null;
};
fb.core.SparseSnapshotTree.prototype.find = function(path) {
  if (this.value_ != null) {
    return this.value_.getChild(path);
  } else {
    if (!path.isEmpty() && this.children_ != null) {
      var childKey = path.getFront();
      path = path.popFront();
      if (this.children_.contains(childKey)) {
        var childTree = this.children_.get(childKey);
        return childTree.find(path);
      } else {
        return null;
      }
    } else {
      return null;
    }
  }
};
fb.core.SparseSnapshotTree.prototype.remember = function(path, data) {
  if (path.isEmpty()) {
    this.value_ = data;
    this.children_ = null;
  } else {
    if (this.value_ !== null) {
      this.value_ = this.value_.updateChild(path, data);
    } else {
      if (this.children_ == null) {
        this.children_ = new fb.core.util.CountedSet;
      }
      var childKey = path.getFront();
      if (!this.children_.contains(childKey)) {
        this.children_.add(childKey, new fb.core.SparseSnapshotTree);
      }
      var child = this.children_.get(childKey);
      path = path.popFront();
      child.remember(path, data);
    }
  }
};
fb.core.SparseSnapshotTree.prototype.forget = function(path) {
  if (path.isEmpty()) {
    this.value_ = null;
    this.children_ = null;
    return true;
  } else {
    if (this.value_ !== null) {
      if (this.value_.isLeafNode()) {
        return false;
      } else {
        var value = this.value_;
        this.value_ = null;
        var self = this;
        value.forEachChild(fb.core.snap.PriorityIndex, function(key, tree) {
          self.remember(new fb.core.util.Path(key), tree);
        });
        return this.forget(path);
      }
    } else {
      if (this.children_ !== null) {
        var childKey = path.getFront();
        path = path.popFront();
        if (this.children_.contains(childKey)) {
          var safeToRemove = this.children_.get(childKey).forget(path);
          if (safeToRemove) {
            this.children_.remove(childKey);
          }
        }
        if (this.children_.isEmpty()) {
          this.children_ = null;
          return true;
        } else {
          return false;
        }
      } else {
        return true;
      }
    }
  }
};
fb.core.SparseSnapshotTree.prototype.forEachTree = function(prefixPath, func) {
  if (this.value_ !== null) {
    func(prefixPath, this.value_);
  } else {
    this.forEachChild(function(key, tree) {
      var path = new fb.core.util.Path(prefixPath.toString() + "/" + key);
      tree.forEachTree(path, func);
    });
  }
};
fb.core.SparseSnapshotTree.prototype.forEachChild = function(func) {
  if (this.children_ !== null) {
    this.children_.each(function(key, tree) {
      func(key, tree);
    });
  }
};
goog.provide("fb.login.Constants");
fb.login.Constants = {SESSION_PERSISTENCE_KEY_PREFIX:"session", DEFAULT_SERVER_HOST:"auth.firebase.com", SERVER_HOST:"auth.firebase.com", API_VERSION:"v2", POPUP_PATH_TO_CHANNEL:"/auth/channel", POPUP_RELAY_FRAME_NAME:"__winchan_relay_frame", POPUP_CLOSE_CMD:"die", JSONP_CALLBACK_NAMESPACE:"__firebase_auth_jsonp", REDIR_REQUEST_ID_KEY:"redirect_request_id", REDIR_REQUEST_COMPLETION_KEY:"__firebase_request_key", REDIR_CLIENT_OPTIONS_KEY:"redirect_client_options", INTERNAL_REDIRECT_SENTINAL_PATH:"/blank/page.html", 
CLIENT_OPTION_SESSION_PERSISTENCE:"remember", CLIENT_OPTION_REDIRECT_TO:"redirectTo"};
goog.provide("fb.login.RequestInfo");
goog.require("fb.login.Constants");
fb.login.RequestInfo = function(opt_clientOptions, opt_transportOptions, opt_serverParams) {
  this.clientOptions = opt_clientOptions || {};
  this.transportOptions = opt_transportOptions || {};
  this.serverParams = opt_serverParams || {};
  if (!this.clientOptions[fb.login.Constants.CLIENT_OPTION_SESSION_PERSISTENCE]) {
    this.clientOptions[fb.login.Constants.CLIENT_OPTION_SESSION_PERSISTENCE] = "default";
  }
};
fb.login.RequestInfo.CLIENT_OPTIONS = [fb.login.Constants.CLIENT_OPTION_SESSION_PERSISTENCE, fb.login.Constants.CLIENT_OPTION_REDIRECT_TO];
fb.login.RequestInfo.fromParams = function(opt_params) {
  var clientOptions = {}, serverParams = {};
  fb.util.obj.foreach(opt_params || {}, function(param, value) {
    if (goog.array.contains(fb.login.RequestInfo.CLIENT_OPTIONS, param)) {
      clientOptions[param] = value;
    } else {
      serverParams[param] = value;
    }
  });
  return new fb.login.RequestInfo(clientOptions, {}, serverParams);
};
goog.provide("fb.login.SessionManager");
goog.require("fb.core.storage");
goog.require("fb.login.Constants");
goog.require("fb.util.json");
goog.require("fb.util.jwt");
fb.login.SessionManager = function(repoInfo, stores) {
  this.persistenceKey_ = [fb.login.Constants.SESSION_PERSISTENCE_KEY_PREFIX, repoInfo.persistenceKey, repoInfo.namespace].join(":");
  this.stores_ = stores;
};
fb.login.SessionManager.prototype.set = function(data, store) {
  if (!store) {
    if (this.stores_.length) {
      store = this.stores_[0];
    } else {
      throw new Error("fb.login.SessionManager : No storage options available!");
    }
  }
  store.set(this.persistenceKey_, data);
};
fb.login.SessionManager.prototype.get = function() {
  var sessions = goog.array.map(this.stores_, goog.bind(this.getFromStore_, this));
  sessions = goog.array.filter(sessions, function(session) {
    return session !== null;
  });
  goog.array.sort(sessions, function(a, b) {
    return fb.util.jwt.issuedAtTime(b["token"]) - fb.util.jwt.issuedAtTime(a["token"]);
  });
  if (sessions.length > 0) {
    return sessions.shift();
  }
  return null;
};
fb.login.SessionManager.prototype.getFromStore_ = function(store) {
  try {
    var session = store.get(this.persistenceKey_);
    if (session && session["token"]) {
      return session;
    }
  } catch (e) {
  }
  return null;
};
fb.login.SessionManager.prototype.clear = function(store) {
  var stores = store ? [store] : this.stores_, self = this;
  goog.array.forEach(this.stores_, function(store) {
    store.remove(self.persistenceKey_);
  });
};
goog.provide("fb.login.util.environment");
fb.login.util.environment.getUA = function() {
  if (typeof navigator !== "undefined" && typeof navigator["userAgent"] === "string") {
    return navigator["userAgent"];
  } else {
    return "";
  }
};
fb.login.util.environment.isMobileWrapper = function() {
  return fb.login.util.environment.isMobileCordova() || fb.login.util.environment.isMobileWindows() || fb.login.util.environment.isIosWebview();
};
fb.login.util.environment.isMobileCordova = function() {
  return typeof window !== "undefined" && !!(window["cordova"] || window["phonegap"] || window["PhoneGap"]) && /ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test(fb.login.util.environment.getUA());
};
fb.login.util.environment.isMobileWindows = function() {
  return typeof navigator !== "undefined" && (!!fb.login.util.environment.getUA().match(/Windows Phone/) || !!window["Windows"] && /^ms-appx:/.test(location.href));
};
fb.login.util.environment.isMobileFirefox = function() {
  var ua = fb.login.util.environment.getUA();
  return ua.indexOf("Fennec/") !== -1 || ua.indexOf("Firefox/") !== -1 && ua.indexOf("Android") !== -1;
};
fb.login.util.environment.isIosWebview = function() {
  var ua = fb.login.util.environment.getUA();
  return typeof navigator !== "undefined" && typeof window !== "undefined" && !!(ua.match(/(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i) || ua.match(/CriOS/) || ua.match(/Twitter for iPhone/) || ua.match(/FBAN\/FBIOS/) || window["navigator"]["standalone"]);
};
fb.login.util.environment.isHeadlessBrowser = function() {
  return!!fb.login.util.environment.getUA().match(/PhantomJS/);
};
fb.login.util.environment.isLocalFile = function() {
  return typeof location !== "undefined" && /^file:\//.test(location.href);
};
fb.login.util.environment.isIE = function() {
  var ua = fb.login.util.environment.getUA();
  return!!(ua.match(/MSIE/) || ua.match(/Trident/));
};
fb.login.util.environment.isIEVersionAtLeast = function(version) {
  var ua = fb.login.util.environment.getUA(), match;
  if (ua === "") {
    return false;
  }
  if (navigator["appName"] === "Microsoft Internet Explorer") {
    match = ua.match(/MSIE ([0-9]{1,}[\.0-9]{0,})/);
    if (match && match.length > 1) {
      return parseFloat(match[1]) >= version;
    }
  } else {
    if (ua.indexOf("Trident") > -1) {
      match = ua.match(/rv:([0-9]{2,2}[\.0-9]{0,})/);
      if (match && match.length > 1) {
        return parseFloat(match[1]) >= version;
      }
    }
  }
  return false;
};
goog.provide("fb.login.transports.util");
goog.require("fb.login.Constants");
goog.require("fb.util");
fb.login.transports.util.findRelay = function() {
  var loc = window["location"], frames = window["opener"]["frames"], i;
  for (i = frames.length - 1;i >= 0;i--) {
    try {
      if (frames[i]["location"]["protocol"] === window["location"]["protocol"] && frames[i]["location"]["host"] === window["location"]["host"] && frames[i]["name"] === fb.login.Constants.POPUP_RELAY_FRAME_NAME) {
        return frames[i];
      }
    } catch (e) {
    }
  }
  return null;
};
fb.login.transports.util.addListener = function(target, event, cb) {
  if (target["attachEvent"]) {
    target["attachEvent"]("on" + event, cb);
  } else {
    if (target["addEventListener"]) {
      target["addEventListener"](event, cb, false);
    }
  }
};
fb.login.transports.util.removeListener = function(target, event, cb) {
  if (target["detachEvent"]) {
    target["detachEvent"]("on" + event, cb);
  } else {
    if (target["removeEventListener"]) {
      target["removeEventListener"](event, cb, false);
    }
  }
};
fb.login.transports.util.extractOrigin = function(url) {
  if (!/^https?:\/\//.test(url)) {
    url = window["location"]["href"];
  }
  var m = /^(https?:\/\/[\-_a-zA-Z\.0-9:]+)/.exec(url);
  if (m) {
    return m[1];
  }
  return url;
};
fb.login.transports.util.extractRedirectCompletionHash = function(hashStr) {
  var hash = "";
  try {
    hashStr = hashStr.replace("#", "");
    var hashObj = fb.util.querystringDecode(hashStr);
    if (hashObj && fb.util.obj.contains(hashObj, fb.login.Constants.REDIR_REQUEST_COMPLETION_KEY)) {
      hash = fb.util.obj.get(hashObj, fb.login.Constants.REDIR_REQUEST_COMPLETION_KEY);
    }
  } catch (e) {
  }
  return hash;
};
fb.login.transports.util.replaceRedirectCompletionHash = function() {
  try {
    var exp = new RegExp("&" + fb.login.Constants.REDIR_REQUEST_COMPLETION_KEY + "=([a-zA-z0-9]*)");
    document.location.hash = document.location.hash.replace(exp, "");
  } catch (e) {
  }
};
fb.login.transports.util.getBaseUrl = function() {
  var parsedUrl = fb.core.util.parseURL(fb.login.Constants.SERVER_HOST);
  return parsedUrl.scheme + "://" + parsedUrl.host + "/" + fb.login.Constants.API_VERSION;
};
fb.login.transports.util.getPopupChannelUrl = function(namespace) {
  return fb.login.transports.util.getBaseUrl() + "/" + namespace + fb.login.Constants.POPUP_PATH_TO_CHANNEL;
};
goog.provide("fb.login.Transport");
fb.login.Transport = function(options) {
};
fb.login.Transport.isAvailable = function() {
};
fb.login.Transport.prototype.open = function(url, params, onComplete) {
};
fb.login.Transport.prototype.classification = function() {
};
goog.provide("fb.login.transports.PopupReceiver");
goog.require("fb.login.Constants");
goog.require("fb.login.Transport");
goog.require("fb.login.transports.util");
goog.require("fb.login.util.environment");
goog.require("fb.util.json");
fb.login.transports.PopupReceiver = function(cb) {
  var self = this;
  this.cb = cb;
  this.targetOrigin = "*";
  if (fb.login.util.environment.isIEVersionAtLeast(8)) {
    this.messageTarget = this.inboundTarget = fb.login.transports.util.findRelay();
  } else {
    this.messageTarget = window["opener"];
    this.inboundTarget = window;
  }
  if (!self.messageTarget) {
    throw "Unable to find relay frame";
  }
  fb.login.transports.util.addListener(this.inboundTarget, "message", goog.bind(this.onMessage_, this));
  fb.login.transports.util.addListener(this.inboundTarget, "message", goog.bind(this.onDie_, this));
  try {
    this.doPost_({"a":"ready"});
  } catch (e) {
    fb.login.transports.util.addListener(this.messageTarget, "load", function(e) {
      self.doPost_({"a":"ready"});
    });
  }
  fb.login.transports.util.addListener(window, "unload", goog.bind(this.onUnload_, this));
};
fb.login.transports.PopupReceiver.prototype.doPost_ = function(msg) {
  msg = fb.util.json.stringify(msg);
  if (fb.login.util.environment.isIEVersionAtLeast(8)) {
    this.messageTarget["doPost"](msg, this.targetOrigin);
  } else {
    this.messageTarget["postMessage"](msg, this.targetOrigin);
  }
};
fb.login.transports.PopupReceiver.prototype.onMessage_ = function(e) {
  var self = this, d;
  try {
    d = fb.util.json.eval(e["data"]);
  } catch (err) {
  }
  if (!d || d["a"] !== "request") {
    return;
  }
  fb.login.transports.util.removeListener(window, "message", this.onMessage_);
  this.targetOrigin = e["origin"];
  if (this.cb) {
    setTimeout(function() {
      self.cb(self.targetOrigin, d["d"], function(response, forceKeepWindowOpen) {
        self.autoClose = !forceKeepWindowOpen;
        self.cb = undefined;
        self.doPost_({"a":"response", "d":response, "forceKeepWindowOpen":forceKeepWindowOpen});
      });
    }, 0);
  }
};
fb.login.transports.PopupReceiver.prototype.onUnload_ = function() {
  try {
    fb.login.transports.util.removeListener(this.inboundTarget, "message", this.onDie_);
  } catch (err) {
  }
  if (this.cb) {
    this.doPost_({"a":"error", "d":"unknown closed window"});
    this.cb = undefined;
  }
  try {
    window.close();
  } catch (err) {
  }
};
fb.login.transports.PopupReceiver.prototype.onDie_ = function(e) {
  if (this.autoClose && e["data"] === fb.login.Constants.POPUP_CLOSE_CMD) {
    try {
      window.close();
    } catch (err) {
    }
  }
};
goog.provide("fb.login.transports.Redirect");
goog.require("fb.constants");
goog.require("fb.core.storage");
goog.require("fb.login.Transport");
goog.require("fb.login.transports.util");
goog.require("fb.util");
fb.login.transports.Redirect = function(options) {
  this.requestId_ = goog.string.getRandomString() + goog.string.getRandomString() + goog.string.getRandomString();
  this.options_ = options;
};
fb.login.transports.Redirect.prototype.open = function(url, params, cb) {
  fb.core.storage.SessionStorage.set(fb.login.Constants.REDIR_REQUEST_ID_KEY, this.requestId_);
  fb.core.storage.SessionStorage.set(fb.login.Constants.REDIR_REQUEST_ID_KEY, this.requestId_);
  params["requestId"] = this.requestId_;
  params["redirectTo"] = params["redirectTo"] || window["location"]["href"];
  url += (/\?/.test(url) ? "" : "?") + fb.util.querystring(params);
  window["location"] = url;
};
fb.login.transports.Redirect["isAvailable"] = function() {
  return!NODE_CLIENT && !fb.login.util.environment.isLocalFile() && !fb.login.util.environment.isMobileCordova();
};
fb.login.transports.Redirect.prototype.classification = function() {
  return "redirect";
};
goog.provide("fb.login.Errors");
var errors = {"NETWORK_ERROR":"Unable to contact the Firebase server.", "SERVER_ERROR":"An unknown server error occurred.", "TRANSPORT_UNAVAILABLE":"There are no login transports available for the requested method.", "REQUEST_INTERRUPTED":"The browser redirected the page before the login request could complete.", "USER_CANCELLED":"The user cancelled authentication."};
fb.login.Errors.get = function(code) {
  var msg = fb.util.obj.get(errors, code);
  var e = new Error(msg, code);
  e["code"] = code;
  return e;
};
goog.provide("fb.login.transports.Popup");
goog.require("fb.core.util");
goog.require("fb.login.Constants");
goog.require("fb.login.Errors");
goog.require("fb.login.Transport");
goog.require("fb.login.transports.util");
goog.require("fb.login.util.environment");
goog.require("fb.util");
goog.require("fb.util.json");
fb.login.transports.Popup = function(options) {
  if (!options["window_features"] || fb.login.util.environment.isMobileFirefox()) {
    options["window_features"] = undefined;
  }
  if (!options["window_name"]) {
    options["window_name"] = "_blank";
  }
  this.options = options;
};
fb.login.transports.Popup.prototype.open = function(url, params, cb) {
  var self = this, isIE = fb.login.util.environment.isIEVersionAtLeast(8), iframe, messageTarget;
  if (!this.options["relay_url"]) {
    return cb(new Error("invalid arguments: origin of url and relay_url must match"));
  }
  var origin = fb.login.transports.util.extractOrigin(url);
  if (origin !== fb.login.transports.util.extractOrigin(self.options["relay_url"])) {
    if (cb) {
      setTimeout(function() {
        cb(new Error("invalid arguments: origin of url and relay_url must match"));
      }, 0);
    }
    return;
  }
  if (isIE) {
    iframe = document.createElement("iframe");
    iframe["setAttribute"]("src", self.options["relay_url"]);
    iframe["style"]["display"] = "none";
    iframe["setAttribute"]("name", fb.login.Constants.POPUP_RELAY_FRAME_NAME);
    document["body"]["appendChild"](iframe);
    messageTarget = iframe["contentWindow"];
  }
  url += (/\?/.test(url) ? "" : "?") + fb.util.querystring(params);
  var popup = window.open(url, self.options["window_name"], self.options["window_features"]);
  if (!messageTarget) {
    messageTarget = popup;
  }
  var closeInterval = setInterval(function() {
    if (popup && popup["closed"]) {
      cleanup(false);
      if (cb) {
        cb(fb.login.Errors.get("USER_CANCELLED"));
        cb = null;
      }
      return;
    }
  }, 500);
  var req = fb.util.json.stringify({"a":"request", "d":params});
  function cleanup(forceKeepWindowOpen) {
    if (iframe) {
      document["body"]["removeChild"](iframe);
      iframe = undefined;
    }
    if (closeInterval) {
      closeInterval = clearInterval(closeInterval);
    }
    fb.login.transports.util.removeListener(window, "message", onMessage);
    fb.login.transports.util.removeListener(window, "unload", cleanup);
    if (popup && !forceKeepWindowOpen) {
      try {
        popup["close"]();
      } catch (securityViolation) {
        messageTarget["postMessage"](fb.login.Constants.POPUP_CLOSE_CMD, origin);
      }
    }
    popup = messageTarget = undefined;
  }
  fb.login.transports.util.addListener(window, "unload", cleanup);
  function onMessage(e) {
    if (e["origin"] !== origin) {
      return;
    }
    try {
      var d = fb.util.json.eval(e["data"]);
      if (d["a"] === "ready") {
        messageTarget["postMessage"](req, origin);
      } else {
        if (d["a"] === "error") {
          cleanup(false);
          if (cb) {
            cb(d["d"]);
            cb = null;
          }
        } else {
          if (d["a"] === "response") {
            cleanup(d["forceKeepWindowOpen"]);
            if (cb) {
              cb(null, d["d"]);
              cb = null;
            }
          }
        }
      }
    } catch (err) {
    }
  }
  fb.login.transports.util.addListener(window, "message", onMessage);
};
fb.login.transports.Popup["isAvailable"] = function() {
  return!NODE_CLIENT && "postMessage" in window && !fb.login.util.environment.isLocalFile() && !fb.login.util.environment.isMobileWrapper() && !fb.login.util.environment.isHeadlessBrowser();
};
fb.login.transports.Popup.prototype.classification = function() {
  return "popup";
};
goog.provide("fb.login.transports.NodeHttp");
goog.require("fb.login.Constants");
goog.require("fb.login.Errors");
goog.require("fb.login.Transport");
goog.require("fb.login.transports.util");
goog.require("fb.login.util.environment");
goog.require("fb.util");
goog.require("fb.util.json");
fb.login.transports.NodeHttp = function(options) {
  if (!options["method"]) {
    options["method"] = "GET";
  }
  if (!options["headers"]) {
    options["headers"] = {};
  }
  if (!options["headers"]["content_type"]) {
    options["headers"]["content_type"] = "application/json";
  }
  options["headers"]["content_type"] = options["headers"]["content_type"].toLowerCase();
  this.options = options;
};
fb.login.transports.NodeHttp.prototype.open = function(url, params, cb) {
  var self = this, parsedUrl = fb.core.util.parseURL(url), http = parsedUrl.scheme === "http" ? require("http") : require("https"), method = this.options["method"], payload;
  var headers = {"Accept":"application/json;text/plain"};
  goog.object.extend(headers, this.options["headers"]);
  var requestOpts = {"host":parsedUrl.host.split(":")[0], "port":parsedUrl.port, "path":parsedUrl.pathString, "method":this.options["method"].toUpperCase()};
  if (method === "GET") {
    requestOpts["path"] += (/\?/.test(requestOpts["path"]) ? "" : "?") + fb.util.querystring(params);
    payload = null;
  } else {
    var contentType = this.options["headers"]["content_type"];
    if (contentType === "application/json") {
      payload = fb.util.json.stringify(params);
    }
    if (contentType === "application/x-www-form-urlencoded") {
      payload = fb.util.querystring(params);
    }
    headers["Content-Length"] = Buffer["byteLength"](payload, "utf8");
  }
  requestOpts["headers"] = headers;
  var req = http["request"](requestOpts, function(response) {
    var res = "";
    response["setEncoding"]("utf8");
    response["on"]("data", function(d) {
      res += d;
    });
    response["on"]("end", function() {
      try {
        res = fb.util.json.eval(res + "");
      } catch (e) {
      }
      if (cb) {
        cb(null, res);
        cb = null;
      }
    });
  });
  if (method !== "GET") {
    req["write"](payload);
  }
  req["on"]("error", function(e) {
    if (e && e["code"] && (e["code"] === "ENOTFOUND" || e["code"] === "ENETDOWN")) {
      cb(fb.login.Errors.get("NETWORK_ERROR"));
    } else {
      cb(fb.login.Errors.get("SERVER_ERROR"));
    }
    cb = null;
  });
  req["end"]();
};
fb.login.transports.NodeHttp["isAvailable"] = function() {
  return NODE_CLIENT;
};
fb.login.transports.NodeHttp.prototype.classification = function() {
  return "json";
};
goog.provide("fb.login.transports.XHR");
goog.require("fb.login.Constants");
goog.require("fb.login.Errors");
goog.require("fb.login.Transport");
goog.require("fb.login.transports.util");
goog.require("fb.login.util.environment");
goog.require("fb.util");
goog.require("fb.util.json");
fb.login.transports.XHR = function(options) {
  if (!options["method"]) {
    options["method"] = "GET";
  }
  if (!options["headers"]) {
    options["headers"] = {};
  }
  if (!options["headers"]["content_type"]) {
    options["headers"]["content_type"] = "application/json";
  }
  options["headers"]["content_type"] = options["headers"]["content_type"].toLowerCase();
  this.options = options;
};
fb.login.transports.XHR.prototype.open = function(url, params, cb) {
  var self = this;
  var xhr = new XMLHttpRequest, method = this.options["method"].toUpperCase(), payload;
  function handleInterrupt_(e) {
    if (cb) {
      cb(fb.login.Errors.get("REQUEST_INTERRUPTED"));
      cb = null;
    }
  }
  fb.login.transports.util.addListener(window, "beforeunload", handleInterrupt_);
  xhr.onreadystatechange = function() {
    if (cb && xhr.readyState === 4) {
      var res;
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          res = fb.util.json.eval(xhr.responseText);
        } catch (e) {
        }
        cb(null, res);
      } else {
        if (xhr.status >= 500 && xhr.status < 600) {
          cb(fb.login.Errors.get("SERVER_ERROR"));
        } else {
          cb(fb.login.Errors.get("NETWORK_ERROR"));
        }
      }
      cb = null;
      fb.login.transports.util.removeListener(window, "beforeunload", handleInterrupt_);
    }
  };
  if (method === "GET") {
    url += (/\?/.test(url) ? "" : "?") + fb.util.querystring(params);
    payload = null;
  } else {
    var contentType = this.options["headers"]["content_type"];
    if (contentType === "application/json") {
      payload = fb.util.json.stringify(params);
    }
    if (contentType === "application/x-www-form-urlencoded") {
      payload = fb.util.querystring(params);
    }
  }
  xhr.open(method, url, true);
  var headers = {"X-Requested-With":"XMLHttpRequest", "Accept":"application/json;text/plain"};
  goog.object.extend(headers, this.options["headers"]);
  for (var header in headers) {
    xhr.setRequestHeader(header, headers[header]);
  }
  xhr.send(payload);
};
fb.login.transports.XHR["isAvailable"] = function() {
  return!NODE_CLIENT && !!window["XMLHttpRequest"] && (!fb.login.util.environment.isIE() || fb.login.util.environment.isIEVersionAtLeast(10));
};
fb.login.transports.XHR.prototype.classification = function() {
  return "json";
};
goog.provide("fb.login.transports.CordovaInAppBrowser");
goog.require("fb.core.util");
goog.require("fb.login.Constants");
goog.require("fb.login.Errors");
goog.require("fb.login.RequestInfo");
goog.require("fb.login.Transport");
goog.require("fb.login.transports.XHR");
goog.require("fb.login.transports.util");
goog.require("fb.login.util.environment");
goog.require("fb.util");
goog.require("fb.util.json");
fb.login.transports.CordovaInAppBrowser = function(options) {
  this.requestId_ = goog.string.getRandomString() + goog.string.getRandomString() + goog.string.getRandomString();
  this.options_ = options;
};
fb.login.transports.CordovaInAppBrowser.prototype.open = function(url, params, cb) {
  var self = this, parsedUrl = fb.core.util.parseURL(fb.login.Constants.SERVER_HOST), windowRef;
  function isSentinelPathMatch(url) {
    try {
      var a = document.createElement("a");
      a["href"] = url;
      return a["host"] === parsedUrl.host && a["pathname"] === fb.login.Constants.INTERNAL_REDIRECT_SENTINAL_PATH;
    } catch (e) {
    }
    return false;
  }
  function onClose_(e) {
    if (cb) {
      cb(fb.login.Errors.get("USER_CANCELLED"));
      cb = null;
    }
  }
  params["requestId"] = this.requestId_;
  params[fb.login.Constants.CLIENT_OPTION_REDIRECT_TO] = parsedUrl.scheme + "://" + parsedUrl.host + fb.login.Constants.INTERNAL_REDIRECT_SENTINAL_PATH;
  url += /\?/.test(url) ? "" : "?";
  url += fb.util.querystring(params);
  windowRef = window.open(url, "_blank", "location=no");
  if (!windowRef || !goog.isFunction(windowRef.addEventListener)) {
    cb(fb.login.Errors.get("TRANSPORT_UNAVAILABLE"));
    return;
  }
  windowRef.addEventListener("loadstart", function(e) {
    if (!e || !e["url"] || !isSentinelPathMatch(e["url"])) {
      return;
    }
    var reqKey = fb.login.transports.util.extractRedirectCompletionHash(e["url"]);
    windowRef.removeEventListener("exit", onClose_);
    windowRef.close();
    var path = "/auth/session";
    var requestInfo = new fb.login.RequestInfo(null, null, {"requestId":self.requestId_, "requestKey":reqKey});
    self.options_["requestWithCredential"](path, requestInfo, cb);
    cb = null;
  });
  windowRef.addEventListener("exit", onClose_);
};
fb.login.transports.CordovaInAppBrowser["isAvailable"] = function() {
  return!NODE_CLIENT && fb.login.util.environment.isMobileCordova();
};
fb.login.transports.CordovaInAppBrowser.prototype.classification = function() {
  return "redirect";
};
goog.provide("fb.login.transports.JSONP");
goog.require("fb.login.Constants");
goog.require("fb.login.Errors");
goog.require("fb.login.Transport");
goog.require("fb.login.transports.util");
goog.require("fb.util");
goog.require("fb.util.json");
fb.login.transports.JSONP = function(options) {
  if (!options["callback_parameter"]) {
    options["callback_parameter"] = "callback";
  }
  this.options = options;
  window[fb.login.Constants.JSONP_CALLBACK_NAMESPACE] = window[fb.login.Constants.JSONP_CALLBACK_NAMESPACE] || {};
};
fb.login.transports.JSONP.prototype.open = function(url, params, cb) {
  var id = "fn" + (new Date).getTime() + Math.floor(Math.random() * 99999);
  params[this.options["callback_parameter"]] = fb.login.Constants.JSONP_CALLBACK_NAMESPACE + "." + id;
  url += (/\?/.test(url) ? "" : "?") + fb.util.querystring(params);
  function handleInterrupt_(e) {
    if (cb) {
      cb(fb.login.Errors.get("REQUEST_INTERRUPTED"));
      cb = null;
    }
  }
  fb.login.transports.util.addListener(window, "beforeunload", handleInterrupt_);
  function cleanup_() {
    setTimeout(function() {
      window[fb.login.Constants.JSONP_CALLBACK_NAMESPACE][id] = undefined;
      if (goog.object.isEmpty(window[fb.login.Constants.JSONP_CALLBACK_NAMESPACE])) {
        window[fb.login.Constants.JSONP_CALLBACK_NAMESPACE] = undefined;
      }
      try {
        var el = document.getElementById(id);
        if (el) {
          el.parentNode.removeChild(el);
        }
      } catch (e) {
      }
    }, 1);
    fb.login.transports.util.removeListener(window, "beforeunload", handleInterrupt_);
  }
  function onload_(res) {
    if (cb) {
      cb(null, res);
      cb = null;
    }
    cleanup_();
  }
  window[fb.login.Constants.JSONP_CALLBACK_NAMESPACE][id] = onload_;
  this.writeScriptTag_(id, url, cb);
};
fb.login.transports.JSONP.prototype.writeScriptTag_ = function(id, url, cb) {
  setTimeout(function() {
    try {
      var js = document.createElement("script");
      js.type = "text/javascript";
      js.id = id;
      js.async = true;
      js.src = url;
      js.onerror = function() {
        var el = document.getElementById(id);
        if (el !== null) {
          el.parentNode.removeChild(el);
        }
        if (cb) {
          cb(fb.login.Errors.get("NETWORK_ERROR"));
        }
      };
      var ref;
      var headElements = document.getElementsByTagName("head");
      if (!headElements || goog.array.isEmpty(headElements)) {
        ref = document.documentElement;
      } else {
        ref = headElements[0];
      }
      ref.appendChild(js);
    } catch (e) {
      if (cb) {
        cb(fb.login.Errors.get("NETWORK_ERROR"));
      }
    }
  }, 0);
};
fb.login.transports.JSONP["isAvailable"] = function() {
  return typeof document !== "undefined" && goog.isDefAndNotNull(document.createElement);
};
fb.login.transports.JSONP.prototype.classification = function() {
  return "json";
};
goog.provide("fb.login.AuthenticationManager");
goog.require("fb.constants");
goog.require("fb.core.storage");
goog.require("fb.core.util");
goog.require("fb.core.util.EventEmitter");
goog.require("fb.login.Constants");
goog.require("fb.login.Errors");
goog.require("fb.login.RequestInfo");
goog.require("fb.login.SessionManager");
goog.require("fb.login.transports.CordovaInAppBrowser");
goog.require("fb.login.transports.JSONP");
goog.require("fb.login.transports.NodeHttp");
goog.require("fb.login.transports.Popup");
goog.require("fb.login.transports.Redirect");
goog.require("fb.login.transports.XHR");
fb.login.AuthenticationManager = function(repoInfo, auth, unauth, onAuthStatus) {
  fb.core.util.EventEmitter.call(this, ["auth_status"]);
  this.repoInfo_ = repoInfo;
  this.authConn_ = auth;
  this.unauthConn_ = unauth;
  this.onAuthStatus_ = onAuthStatus;
  this.sessionManager_ = new fb.login.SessionManager(repoInfo, [fb.core.storage.PersistentStorage, fb.core.storage.SessionStorage]);
  this.authData_ = null;
  this.redirectRestart_ = false;
  this.resumeSession();
};
goog.inherits(fb.login.AuthenticationManager, fb.core.util.EventEmitter);
fb.login.AuthenticationManager.prototype.getAuth = function() {
  return this.authData_ || null;
};
fb.login.AuthenticationManager.prototype.resumeSession = function() {
  var redirectRequestId = fb.core.storage.SessionStorage.get(fb.login.Constants.REDIR_REQUEST_ID_KEY), self = this;
  if (redirectRequestId) {
    this.finishOAuthRedirectLogin_();
  }
  var session = this.sessionManager_.get();
  if (session && session["token"]) {
    this.updateAuthStatus_(session);
    this.authConn_(session["token"], function(status, data) {
      self.authOnComplete_(status, data, false, session["token"], session);
    }, function(cancelStatus, cancelReason) {
      self.authOnCancel_("resumeSession()", cancelStatus, cancelReason);
    });
  } else {
    this.updateAuthStatus_(null);
  }
};
fb.login.AuthenticationManager.prototype.authenticate = function(cred, userProfile, clientOptions, opt_onComplete, opt_onCancel) {
  if (this.repoInfo_.isDemoHost()) {
    fb.core.util.warn("Firebase authentication is not supported on demo Firebases (*.firebaseio-demo.com). " + "To secure your Firebase, create a production Firebase at https://www.firebase.com.");
  }
  var self = this;
  this.authConn_(cred, function(status, data) {
    self.authOnComplete_(status, data, true, cred, userProfile, clientOptions || {}, opt_onComplete);
  }, function(cancelStatus, cancelReason) {
    self.authOnCancel_("auth()", cancelStatus, cancelReason, opt_onCancel);
  });
};
fb.login.AuthenticationManager.prototype.unauthenticate = function(opt_onComplete) {
  var self = this;
  this.sessionManager_.clear();
  self.updateAuthStatus_(null);
  this.unauthConn_(function(status, errorReason) {
    if (status === "ok") {
      fb.core.util.callUserCallback(opt_onComplete, null);
    } else {
      var code = (status || "error").toUpperCase();
      var message = code;
      if (errorReason) {
        message += ": " + errorReason;
      }
      var error = new Error(message);
      error["code"] = code;
      fb.core.util.callUserCallback(opt_onComplete, error);
    }
  });
};
fb.login.AuthenticationManager.prototype.authOnComplete_ = function(status, authConnResult, newSession, cred, authData, opt_clientOptions, opt_onComplete) {
  if (status === "ok") {
    if (newSession) {
      var tokenPayload = authConnResult["auth"];
      authData["auth"] = tokenPayload;
      authData["expires"] = authConnResult["expires"];
      authData["token"] = fb.util.jwt.isValidFormat(cred) ? cred : "";
      var uid = null;
      if (tokenPayload && fb.util.obj.contains(tokenPayload, "uid")) {
        uid = fb.util.obj.get(tokenPayload, "uid");
      } else {
        if (fb.util.obj.contains(authData, "uid")) {
          uid = fb.util.obj.get(authData, "uid");
        }
      }
      authData["uid"] = uid;
      var provider = "custom";
      if (tokenPayload && fb.util.obj.contains(tokenPayload, "provider")) {
        provider = fb.util.obj.get(tokenPayload, "provider");
      } else {
        if (fb.util.obj.contains(authData, "provider")) {
          provider = fb.util.obj.get(authData, "provider");
        }
      }
      authData["provider"] = provider;
      this.sessionManager_.clear();
      if (fb.util.jwt.isValidFormat(cred)) {
        opt_clientOptions = opt_clientOptions || {};
        var store = fb.core.storage.PersistentStorage;
        if (opt_clientOptions[fb.login.Constants.CLIENT_OPTION_SESSION_PERSISTENCE] === "sessionOnly") {
          store = fb.core.storage.SessionStorage;
        }
        if (opt_clientOptions[fb.login.Constants.CLIENT_OPTION_SESSION_PERSISTENCE] !== "none") {
          this.sessionManager_.set(authData, store);
        }
      }
      this.updateAuthStatus_(authData);
    }
    fb.core.util.callUserCallback(opt_onComplete, null, authData);
    return;
  }
  this.handleBadAuthStatus_();
  var code = (status || "error").toUpperCase();
  var message = code;
  if (authConnResult) {
    message += ": " + authConnResult;
  }
  var error = new Error(message);
  error["code"] = code;
  fb.core.util.callUserCallback(opt_onComplete, error);
};
fb.login.AuthenticationManager.prototype.authOnCancel_ = function(fromFunction, cancelStatus, cancelReason, opt_onCancel) {
  fb.core.util.warn(fromFunction + " was canceled: " + cancelReason);
  this.handleBadAuthStatus_();
  var err = new Error(cancelReason);
  err["code"] = cancelStatus.toUpperCase();
  fb.core.util.callUserCallback(opt_onCancel, err);
};
fb.login.AuthenticationManager.prototype.handleBadAuthStatus_ = function() {
  this.sessionManager_.clear();
  this.updateAuthStatus_(null);
};
fb.login.AuthenticationManager.prototype.authWithCredential = function(provider, opt_params, opt_options, opt_onComplete) {
  this.checkServerSettingsOrThrow();
  var requestInfo = new fb.login.RequestInfo(opt_options || {}, {}, opt_params || {});
  var transports;
  if (NODE_CLIENT) {
    transports = [fb.login.transports.NodeHttp];
  } else {
    transports = [fb.login.transports.XHR, fb.login.transports.JSONP];
  }
  this.authWithTransports_(transports, "/auth/" + provider, requestInfo, opt_onComplete);
};
fb.login.AuthenticationManager.prototype.authWithPopup = function(provider, opt_params, opt_onComplete) {
  this.checkServerSettingsOrThrow();
  var transports = [fb.login.transports.Popup, fb.login.transports.CordovaInAppBrowser], requestInfo = fb.login.RequestInfo.fromParams(opt_params), width = 625, height = 625;
  if (provider === "anonymous" || provider === "password") {
    setTimeout(function() {
      fb.core.util.callUserCallback(opt_onComplete, fb.login.Errors.get("TRANSPORT_UNAVAILABLE"));
    }, 0);
    return;
  }
  requestInfo.transportOptions["window_features"] = "" + "menubar=yes," + "modal=yes," + "alwaysRaised=yes" + "location=yes," + "resizable=yes," + "scrollbars=yes," + "status=yes," + "height=" + height + "," + "width=" + width + "," + "top=" + (typeof screen === "object" ? (screen["height"] - height) * .5 : 0) + "," + "left=" + (typeof screen === "object" ? (screen["width"] - width) * .5 : 0);
  requestInfo.transportOptions["relay_url"] = fb.login.transports.util.getPopupChannelUrl(this.repoInfo_.namespace);
  requestInfo.transportOptions["requestWithCredential"] = goog.bind(this.requestWithCredential, this);
  this.authWithTransports_(transports, "/auth/" + provider, requestInfo, opt_onComplete);
};
fb.login.AuthenticationManager.prototype.authWithRedirect = function(provider, opt_params, opt_onErr) {
  this.checkServerSettingsOrThrow();
  var transports = [fb.login.transports.Redirect], requestInfo = fb.login.RequestInfo.fromParams(opt_params);
  if (provider === "anonymous" || provider === "firebase") {
    fb.core.util.callUserCallback(opt_onErr, fb.login.Errors.get("TRANSPORT_UNAVAILABLE"));
    return;
  }
  fb.core.storage.SessionStorage.set(fb.login.Constants.REDIR_CLIENT_OPTIONS_KEY, requestInfo.clientOptions);
  this.authWithTransports_(transports, "/auth/" + provider, requestInfo, opt_onErr);
};
fb.login.AuthenticationManager.prototype.finishOAuthRedirectLogin_ = function() {
  var redirectRequestId = fb.core.storage.SessionStorage.get(fb.login.Constants.REDIR_REQUEST_ID_KEY);
  if (redirectRequestId) {
    var clientOptions = fb.core.storage.SessionStorage.get(fb.login.Constants.REDIR_CLIENT_OPTIONS_KEY);
    fb.core.storage.SessionStorage.remove(fb.login.Constants.REDIR_REQUEST_ID_KEY);
    fb.core.storage.SessionStorage.remove(fb.login.Constants.REDIR_CLIENT_OPTIONS_KEY);
    var transports = [fb.login.transports.XHR, fb.login.transports.JSONP], serverParams = {"requestId":redirectRequestId, "requestKey":fb.login.transports.util.extractRedirectCompletionHash(document.location.hash)}, transportOptions = {}, requestInfo = new fb.login.RequestInfo(clientOptions, transportOptions, serverParams);
    this.redirectRestart_ = true;
    fb.login.transports.util.replaceRedirectCompletionHash();
    this.authWithTransports_(transports, "/auth/session", requestInfo, function(error) {
      this.redirectRestart_ = false;
    }.bind(this));
  }
};
fb.login.AuthenticationManager.prototype.createUser = function(params, opt_onComplete) {
  this.checkServerSettingsOrThrow();
  var path = "/users";
  var requestInfo = fb.login.RequestInfo.fromParams(params);
  requestInfo.serverParams["_method"] = "POST";
  this.requestWithCredential(path, requestInfo, function(err, res) {
    if (err) {
      fb.core.util.callUserCallback(opt_onComplete, err);
    } else {
      fb.core.util.callUserCallback(opt_onComplete, err, res);
    }
  });
};
fb.login.AuthenticationManager.prototype.removeUser = function(params, opt_onComplete) {
  var self = this;
  this.checkServerSettingsOrThrow();
  var path = "/users/" + encodeURIComponent(params["email"]);
  var requestInfo = fb.login.RequestInfo.fromParams(params);
  requestInfo.serverParams["_method"] = "DELETE";
  this.requestWithCredential(path, requestInfo, function(err, res) {
    if (!err && res && res["uid"]) {
      if (self.authData_ && self.authData_["uid"] && self.authData_["uid"] === res["uid"]) {
        self.unauthenticate();
      }
    }
    fb.core.util.callUserCallback(opt_onComplete, err);
  });
};
fb.login.AuthenticationManager.prototype.changePassword = function(params, opt_onComplete) {
  this.checkServerSettingsOrThrow();
  var path = "/users/" + encodeURIComponent(params["email"]) + "/password";
  var requestInfo = fb.login.RequestInfo.fromParams(params);
  requestInfo.serverParams["_method"] = "PUT";
  requestInfo.serverParams["password"] = params["newPassword"];
  this.requestWithCredential(path, requestInfo, function(err, res) {
    fb.core.util.callUserCallback(opt_onComplete, err);
  });
};
fb.login.AuthenticationManager.prototype.changeEmail = function(params, opt_onComplete) {
  this.checkServerSettingsOrThrow();
  var path = "/users/" + encodeURIComponent(params["oldEmail"]) + "/email";
  var requestInfo = fb.login.RequestInfo.fromParams(params);
  requestInfo.serverParams["_method"] = "PUT";
  requestInfo.serverParams["email"] = params["newEmail"];
  requestInfo.serverParams["password"] = params["password"];
  this.requestWithCredential(path, requestInfo, function(err, res) {
    fb.core.util.callUserCallback(opt_onComplete, err);
  });
};
fb.login.AuthenticationManager.prototype.resetPassword = function(params, opt_onComplete) {
  this.checkServerSettingsOrThrow();
  var path = "/users/" + encodeURIComponent(params["email"]) + "/password";
  var requestInfo = fb.login.RequestInfo.fromParams(params);
  requestInfo.serverParams["_method"] = "POST";
  this.requestWithCredential(path, requestInfo, function(err, res) {
    fb.core.util.callUserCallback(opt_onComplete, err);
  });
};
fb.login.AuthenticationManager.prototype.requestWithCredential = function(path, requestInfo, opt_onComplete) {
  var transports;
  if (NODE_CLIENT) {
    transports = [fb.login.transports.NodeHttp];
  } else {
    transports = [fb.login.transports.XHR, fb.login.transports.JSONP];
  }
  this.requestWithTransports_(transports, path, requestInfo, opt_onComplete);
};
fb.login.AuthenticationManager.prototype.authWithTransports_ = function(transports, path, requestInfo, opt_onComplete) {
  var self = this;
  this.requestWithTransports_(transports, path, requestInfo, function onLoginReturned(err, res) {
    if (err || !(res && res["token"] && res["uid"])) {
      fb.core.util.callUserCallback(opt_onComplete, err || fb.login.Errors.get("UNKNOWN_ERROR"));
    } else {
      res = (res);
      self.authenticate(res["token"], res, requestInfo.clientOptions, function(err, authData) {
        if (err) {
          fb.core.util.callUserCallback(opt_onComplete, err);
        } else {
          fb.core.util.callUserCallback(opt_onComplete, null, authData);
        }
      });
    }
  });
};
fb.login.AuthenticationManager.prototype.requestWithTransports_ = function(transports, path, requestInfo, opt_onComplete) {
  var availableTransports = goog.array.filter(transports, function(transport) {
    return typeof transport["isAvailable"] === "function" && transport["isAvailable"]();
  });
  if (availableTransports.length === 0) {
    setTimeout(function() {
      fb.core.util.callUserCallback(opt_onComplete, fb.login.Errors.get("TRANSPORT_UNAVAILABLE"));
    }, 0);
    return;
  }
  var transport = availableTransports.shift();
  var transportObj = new transport(requestInfo.transportOptions);
  var request = fb.util.obj.clone(requestInfo.serverParams);
  request["v"] = this.versionString();
  request["transport"] = transportObj.classification();
  request["suppress_status_codes"] = true;
  var url = fb.login.transports.util.getBaseUrl() + "/" + this.repoInfo_.namespace + path;
  transportObj.open(url, request, function onTransportReturned(err, res) {
    if (err) {
      fb.core.util.callUserCallback(opt_onComplete, err);
    } else {
      if (res && res["error"]) {
        var e = new Error(res["error"]["message"]);
        e["code"] = res["error"]["code"];
        e["details"] = res["error"]["details"];
        fb.core.util.callUserCallback(opt_onComplete, e);
      } else {
        fb.core.util.callUserCallback(opt_onComplete, null, res);
      }
    }
  });
};
fb.login.AuthenticationManager.prototype.updateAuthStatus_ = function(authData) {
  var stateChanged = this.authData_ !== null || authData !== null;
  this.authData_ = authData;
  if (stateChanged) {
    this.trigger("auth_status", authData);
  }
  this.onAuthStatus_(authData !== null);
};
fb.login.AuthenticationManager.prototype.getInitialEvent = function(event) {
  fb.core.util.assert(event === "auth_status", 'initial event must be of type "auth_status"');
  if (this.redirectRestart_) {
    return null;
  }
  return[this.authData_];
};
fb.login.AuthenticationManager.prototype.versionString = function() {
  return(NODE_CLIENT ? "node-" : "js-") + CLIENT_VERSION;
};
fb.login.AuthenticationManager.prototype.checkServerSettingsOrThrow = function() {
  if (this.repoInfo_.isCustomHost() && fb.login.Constants.SERVER_HOST === fb.login.Constants.DEFAULT_SERVER_HOST) {
    throw new Error("This custom Firebase server ('" + this.repoInfo_.domain + "') does not support delegated login.");
  }
};
goog.provide("fb.realtime.Transport");
goog.require("fb.core.RepoInfo");
fb.realtime.Transport = function(connId, repoInfo, sessionId) {
};
fb.realtime.Transport.prototype.open = function(onMessage, onDisconnect) {
};
fb.realtime.Transport.prototype.start = function() {
};
fb.realtime.Transport.prototype.close = function() {
};
fb.realtime.Transport.prototype.send = function(data) {
};
fb.realtime.Transport.prototype.bytesReceived;
fb.realtime.Transport.prototype.bytesSent;
goog.provide("fb.realtime.Constants");
fb.realtime.Constants = {PROTOCOL_VERSION:"5", VERSION_PARAM:"v", TRANSPORT_SESSION_PARAM:"s", REFERER_PARAM:"r", FORGE_REF:"f", FORGE_DOMAIN:"firebaseio.com", LAST_SESSION_PARAM:"ls", WEBSOCKET:"websocket", LONG_POLLING:"long_polling"};
goog.provide("fb.realtime.polling.PacketReceiver");
fb.realtime.polling.PacketReceiver = function(onMessage) {
  this.onMessage_ = onMessage;
  this.pendingResponses = [];
  this.currentResponseNum = 0;
  this.closeAfterResponse = -1;
  this.onClose = null;
};
fb.realtime.polling.PacketReceiver.prototype.closeAfter = function(responseNum, callback) {
  this.closeAfterResponse = responseNum;
  this.onClose = callback;
  if (this.closeAfterResponse < this.currentResponseNum) {
    this.onClose();
    this.onClose = null;
  }
};
fb.realtime.polling.PacketReceiver.prototype.handleResponse = function(requestNum, data) {
  this.pendingResponses[requestNum] = data;
  while (this.pendingResponses[this.currentResponseNum]) {
    var toProcess = this.pendingResponses[this.currentResponseNum];
    delete this.pendingResponses[this.currentResponseNum];
    for (var i = 0;i < toProcess.length;++i) {
      if (toProcess[i]) {
        var self = this;
        fb.core.util.exceptionGuard(function() {
          self.onMessage_(toProcess[i]);
        });
      }
    }
    if (this.currentResponseNum === this.closeAfterResponse) {
      if (this.onClose) {
        clearTimeout(this.onClose);
        this.onClose();
        this.onClose = null;
      }
      break;
    }
    this.currentResponseNum++;
  }
};
goog.provide("fb.realtime.BrowserPollConnection");
goog.require("fb.constants");
goog.require("fb.core.stats.StatsManager");
goog.require("fb.core.util");
goog.require("fb.core.util.CountedSet");
goog.require("fb.realtime.Constants");
goog.require("fb.realtime.Transport");
goog.require("fb.realtime.polling.PacketReceiver");
goog.require("fb.util.json");
var FIREBASE_LONGPOLL_START_PARAM = "start";
var FIREBASE_LONGPOLL_CLOSE_COMMAND = "close";
var FIREBASE_LONGPOLL_COMMAND_CB_NAME = "pLPCommand";
var FIREBASE_LONGPOLL_DATA_CB_NAME = "pRTLPCB";
var FIREBASE_LONGPOLL_ID_PARAM = "id";
var FIREBASE_LONGPOLL_PW_PARAM = "pw";
var FIREBASE_LONGPOLL_SERIAL_PARAM = "ser";
var FIREBASE_LONGPOLL_CALLBACK_ID_PARAM = "cb";
var FIREBASE_LONGPOLL_SEGMENT_NUM_PARAM = "seg";
var FIREBASE_LONGPOLL_SEGMENTS_IN_PACKET = "ts";
var FIREBASE_LONGPOLL_DATA_PARAM = "d";
var FIREBASE_LONGPOLL_DISCONN_FRAME_PARAM = "disconn";
var FIREBASE_LONGPOLL_DISCONN_FRAME_REQUEST_PARAM = "dframe";
var MAX_URL_DATA_SIZE = 1870;
var SEG_HEADER_SIZE = 30;
var MAX_PAYLOAD_SIZE = MAX_URL_DATA_SIZE - SEG_HEADER_SIZE;
var KEEPALIVE_REQUEST_INTERVAL = 25E3;
var LP_CONNECT_TIMEOUT = 3E4;
fb.realtime.BrowserPollConnection = function(connId, repoInfo, opt_transportSessionId, opt_lastSessionId) {
  this.connId = connId;
  this.log_ = fb.core.util.logWrapper(connId);
  this.repoInfo = repoInfo;
  this.bytesSent = 0;
  this.bytesReceived = 0;
  this.stats_ = fb.core.stats.StatsManager.getCollection(repoInfo);
  this.transportSessionId = opt_transportSessionId;
  this.everConnected_ = false;
  this.lastSessionId = opt_lastSessionId;
  this.urlFn = function(params) {
    return repoInfo.connectionURL(fb.realtime.Constants.LONG_POLLING, params);
  };
};
fb.realtime.BrowserPollConnection.prototype.open = function(onMessage, onDisconnect) {
  this.curSegmentNum = 0;
  this.onDisconnect_ = onDisconnect;
  this.myPacketOrderer = new fb.realtime.polling.PacketReceiver(onMessage);
  this.isClosed_ = false;
  var self = this;
  this.connectTimeoutTimer_ = setTimeout(function() {
    self.log_("Timed out trying to connect.");
    self.onClosed_();
    self.connectTimeoutTimer_ = null;
  }, Math.floor(LP_CONNECT_TIMEOUT));
  fb.core.util.executeWhenDOMReady(function() {
    if (self.isClosed_) {
      return;
    }
    self.scriptTagHolder = new FirebaseIFrameScriptHolder(function(command, arg1, arg2, arg3, arg4) {
      self.incrementIncomingBytes_(arguments);
      if (!self.scriptTagHolder) {
        return;
      }
      if (self.connectTimeoutTimer_) {
        clearTimeout(self.connectTimeoutTimer_);
        self.connectTimeoutTimer_ = null;
      }
      self.everConnected_ = true;
      if (command == FIREBASE_LONGPOLL_START_PARAM) {
        self.id = arg1;
        self.password = arg2;
      } else {
        if (command === FIREBASE_LONGPOLL_CLOSE_COMMAND) {
          if (arg1) {
            self.scriptTagHolder.sendNewPolls = false;
            self.myPacketOrderer.closeAfter(arg1, function() {
              self.onClosed_();
            });
          } else {
            self.onClosed_();
          }
        } else {
          throw new Error("Unrecognized command received: " + command);
        }
      }
    }, function(pN, data) {
      self.incrementIncomingBytes_(arguments);
      self.myPacketOrderer.handleResponse(pN, data);
    }, function() {
      self.onClosed_();
    }, self.urlFn);
    var urlParams = {};
    urlParams[FIREBASE_LONGPOLL_START_PARAM] = "t";
    urlParams[FIREBASE_LONGPOLL_SERIAL_PARAM] = Math.floor(Math.random() * 1E8);
    if (self.scriptTagHolder.uniqueCallbackIdentifier) {
      urlParams[FIREBASE_LONGPOLL_CALLBACK_ID_PARAM] = self.scriptTagHolder.uniqueCallbackIdentifier;
    }
    urlParams[fb.realtime.Constants.VERSION_PARAM] = fb.realtime.Constants.PROTOCOL_VERSION;
    if (self.transportSessionId) {
      urlParams[fb.realtime.Constants.TRANSPORT_SESSION_PARAM] = self.transportSessionId;
    }
    if (self.lastSessionId) {
      urlParams[fb.realtime.Constants.LAST_SESSION_PARAM] = self.lastSessionId;
    }
    if (!NODE_CLIENT && typeof location !== "undefined" && location.href && location.href.indexOf(fb.realtime.Constants.FORGE_DOMAIN) !== -1) {
      urlParams[fb.realtime.Constants.REFERER_PARAM] = fb.realtime.Constants.FORGE_REF;
    }
    var connectURL = self.urlFn(urlParams);
    self.log_("Connecting via long-poll to " + connectURL);
    self.scriptTagHolder.addTag(connectURL, function() {
    });
  });
};
fb.realtime.BrowserPollConnection.prototype.start = function() {
  this.scriptTagHolder.startLongPoll(this.id, this.password);
  this.addDisconnectPingFrame(this.id, this.password);
};
fb.realtime.BrowserPollConnection.forceAllow = function() {
  fb.realtime.BrowserPollConnection.forceAllow_ = true;
};
fb.realtime.BrowserPollConnection.forceDisallow = function() {
  fb.realtime.BrowserPollConnection.forceDisallow_ = true;
};
fb.realtime.BrowserPollConnection["isAvailable"] = function() {
  return fb.realtime.BrowserPollConnection.forceAllow_ || !fb.realtime.BrowserPollConnection.forceDisallow_ && typeof document !== "undefined" && goog.isDefAndNotNull(document.createElement) && !fb.core.util.isChromeExtensionContentScript() && !fb.core.util.isWindowsStoreApp() && !NODE_CLIENT;
};
fb.realtime.BrowserPollConnection.prototype.markConnectionHealthy = function() {
};
fb.realtime.BrowserPollConnection.prototype.shutdown_ = function() {
  this.isClosed_ = true;
  if (this.scriptTagHolder) {
    this.scriptTagHolder.close();
    this.scriptTagHolder = null;
  }
  if (this.myDisconnFrame) {
    document.body.removeChild(this.myDisconnFrame);
    this.myDisconnFrame = null;
  }
  if (this.connectTimeoutTimer_) {
    clearTimeout(this.connectTimeoutTimer_);
    this.connectTimeoutTimer_ = null;
  }
};
fb.realtime.BrowserPollConnection.prototype.onClosed_ = function() {
  if (!this.isClosed_) {
    this.log_("Longpoll is closing itself");
    this.shutdown_();
    if (this.onDisconnect_) {
      this.onDisconnect_(this.everConnected_);
      this.onDisconnect_ = null;
    }
  }
};
fb.realtime.BrowserPollConnection.prototype.close = function() {
  if (!this.isClosed_) {
    this.log_("Longpoll is being closed.");
    this.shutdown_();
  }
};
fb.realtime.BrowserPollConnection.prototype.send = function(data) {
  var dataStr = fb.util.json.stringify(data);
  this.bytesSent += dataStr.length;
  this.stats_.incrementCounter("bytes_sent", dataStr.length);
  var base64data = fb.core.util.base64Encode(dataStr);
  var dataSegs = fb.core.util.splitStringBySize(base64data, MAX_PAYLOAD_SIZE);
  for (var i = 0;i < dataSegs.length;i++) {
    this.scriptTagHolder.enqueueSegment(this.curSegmentNum, dataSegs.length, dataSegs[i]);
    this.curSegmentNum++;
  }
};
fb.realtime.BrowserPollConnection.prototype.addDisconnectPingFrame = function(id, pw) {
  if (NODE_CLIENT) {
    return;
  }
  this.myDisconnFrame = document.createElement("iframe");
  var urlParams = {};
  urlParams[FIREBASE_LONGPOLL_DISCONN_FRAME_REQUEST_PARAM] = "t";
  urlParams[FIREBASE_LONGPOLL_ID_PARAM] = id;
  urlParams[FIREBASE_LONGPOLL_PW_PARAM] = pw;
  this.myDisconnFrame.src = this.urlFn(urlParams);
  this.myDisconnFrame.style.display = "none";
  document.body.appendChild(this.myDisconnFrame);
};
fb.realtime.BrowserPollConnection.prototype.incrementIncomingBytes_ = function(args) {
  var bytesReceived = fb.util.json.stringify(args).length;
  this.bytesReceived += bytesReceived;
  this.stats_.incrementCounter("bytes_received", bytesReceived);
};
function FirebaseIFrameScriptHolder(commandCB, onMessageCB, onDisconnectCB, urlFn) {
  this.urlFn = urlFn;
  this.onDisconnect = onDisconnectCB;
  this.outstandingRequests = new fb.core.util.CountedSet;
  this.pendingSegs = [];
  this.currentSerial = Math.floor(Math.random() * 1E8);
  this.sendNewPolls = true;
  if (!NODE_CLIENT) {
    this.uniqueCallbackIdentifier = fb.core.util.LUIDGenerator();
    window[FIREBASE_LONGPOLL_COMMAND_CB_NAME + this.uniqueCallbackIdentifier] = commandCB;
    window[FIREBASE_LONGPOLL_DATA_CB_NAME + this.uniqueCallbackIdentifier] = onMessageCB;
    this.myIFrame = this.createIFrame_();
    var script = "";
    if (this.myIFrame.src && this.myIFrame.src.substr(0, "javascript:".length) === "javascript:") {
      var currentDomain = document.domain;
      script = '<script>document.domain="' + currentDomain + '";\x3c/script>';
    }
    var iframeContents = "<html><body>" + script + "</body></html>";
    try {
      this.myIFrame.doc.open();
      this.myIFrame.doc.write(iframeContents);
      this.myIFrame.doc.close();
    } catch (e) {
      fb.core.util.log("frame writing exception");
      if (e.stack) {
        fb.core.util.log(e.stack);
      }
      fb.core.util.log(e);
    }
  } else {
    this.commandCB = commandCB;
    this.onMessageCB = onMessageCB;
  }
}
FirebaseIFrameScriptHolder.prototype.createIFrame_ = function() {
  var iframe = document.createElement("iframe");
  iframe.style.display = "none";
  if (document.body) {
    document.body.appendChild(iframe);
    try {
      var a = iframe.contentWindow.document;
      if (!a) {
        fb.core.util.log("No IE domain setting required");
      }
    } catch (e) {
      var domain = document.domain;
      iframe.src = "javascript:void((function(){document.open();document.domain='" + domain + "';document.close();})())";
    }
  } else {
    throw "Document body has not initialized. Wait to initialize Firebase until after the document is ready.";
  }
  if (iframe.contentDocument) {
    iframe.doc = iframe.contentDocument;
  } else {
    if (iframe.contentWindow) {
      iframe.doc = iframe.contentWindow.document;
    } else {
      if (iframe.document) {
        iframe.doc = iframe.document;
      }
    }
  }
  return iframe;
};
FirebaseIFrameScriptHolder.prototype.close = function() {
  this.alive = false;
  if (this.myIFrame) {
    this.myIFrame.doc.body.innerHTML = "";
    var self = this;
    setTimeout(function() {
      if (self.myIFrame !== null) {
        document.body.removeChild(self.myIFrame);
        self.myIFrame = null;
      }
    }, Math.floor(0));
  }
  if (NODE_CLIENT && this.myID) {
    var urlParams = {};
    urlParams[FIREBASE_LONGPOLL_DISCONN_FRAME_PARAM] = "t";
    urlParams[FIREBASE_LONGPOLL_ID_PARAM] = this.myID;
    urlParams[FIREBASE_LONGPOLL_PW_PARAM] = this.myPW;
    var theURL = this.urlFn(urlParams);
    FirebaseIFrameScriptHolder.nodeRestRequest(theURL);
  }
  var onDisconnect = this.onDisconnect;
  if (onDisconnect) {
    this.onDisconnect = null;
    onDisconnect();
  }
};
FirebaseIFrameScriptHolder.prototype.startLongPoll = function(id, pw) {
  this.myID = id;
  this.myPW = pw;
  this.alive = true;
  while (this.newRequest_()) {
  }
};
FirebaseIFrameScriptHolder.prototype.newRequest_ = function() {
  if (this.alive && this.sendNewPolls && this.outstandingRequests.count() < (this.pendingSegs.length > 0 ? 2 : 1)) {
    this.currentSerial++;
    var urlParams = {};
    urlParams[FIREBASE_LONGPOLL_ID_PARAM] = this.myID;
    urlParams[FIREBASE_LONGPOLL_PW_PARAM] = this.myPW;
    urlParams[FIREBASE_LONGPOLL_SERIAL_PARAM] = this.currentSerial;
    var theURL = this.urlFn(urlParams);
    var curDataString = "";
    var i = 0;
    while (this.pendingSegs.length > 0) {
      var nextSeg = this.pendingSegs[0];
      if (nextSeg.d.length + SEG_HEADER_SIZE + curDataString.length <= MAX_URL_DATA_SIZE) {
        var theSeg = this.pendingSegs.shift();
        curDataString = curDataString + "&" + FIREBASE_LONGPOLL_SEGMENT_NUM_PARAM + i + "=" + theSeg.seg + "&" + FIREBASE_LONGPOLL_SEGMENTS_IN_PACKET + i + "=" + theSeg.ts + "&" + FIREBASE_LONGPOLL_DATA_PARAM + i + "=" + theSeg.d;
        i++;
      } else {
        break;
      }
    }
    theURL = theURL + curDataString;
    this.addLongPollTag_(theURL, this.currentSerial);
    return true;
  } else {
    return false;
  }
};
FirebaseIFrameScriptHolder.prototype.enqueueSegment = function(segnum, totalsegs, data) {
  this.pendingSegs.push({seg:segnum, ts:totalsegs, d:data});
  if (this.alive) {
    this.newRequest_();
  }
};
FirebaseIFrameScriptHolder.prototype.addLongPollTag_ = function(url, serial) {
  var self = this;
  self.outstandingRequests.add(serial, 1);
  var doNewRequest = function() {
    self.outstandingRequests.remove(serial);
    self.newRequest_();
  };
  var keepaliveTimeout = setTimeout(doNewRequest, Math.floor(KEEPALIVE_REQUEST_INTERVAL));
  var readyStateCB = function() {
    clearTimeout(keepaliveTimeout);
    doNewRequest();
  };
  this.addTag(url, readyStateCB);
};
FirebaseIFrameScriptHolder.prototype.addTag = function(url, loadCB) {
  if (NODE_CLIENT) {
    this.doNodeLongPoll(url, loadCB);
  } else {
    var self = this;
    setTimeout(function() {
      try {
        if (!self.sendNewPolls) {
          return;
        }
        var newScript = self.myIFrame.doc.createElement("script");
        newScript.type = "text/javascript";
        newScript.async = true;
        newScript.src = url;
        newScript.onload = newScript.onreadystatechange = function() {
          var rstate = newScript.readyState;
          if (!rstate || rstate === "loaded" || rstate === "complete") {
            newScript.onload = newScript.onreadystatechange = null;
            if (newScript.parentNode) {
              newScript.parentNode.removeChild(newScript);
            }
            loadCB();
          }
        };
        newScript.onerror = function() {
          fb.core.util.log("Long-poll script failed to load: " + url);
          self.sendNewPolls = false;
          self.close();
        };
        self.myIFrame.doc.body.appendChild(newScript);
      } catch (e) {
      }
    }, Math.floor(1));
  }
};
if (typeof NODE_CLIENT !== "undefined" && NODE_CLIENT) {
  FirebaseIFrameScriptHolder.request = null;
  FirebaseIFrameScriptHolder.nodeRestRequest = function(req, onComplete) {
    if (!FirebaseIFrameScriptHolder.request) {
      FirebaseIFrameScriptHolder.request = (require("request"));
    }
    FirebaseIFrameScriptHolder.request(req, function(error, response, body) {
      if (error) {
        throw "Rest request for " + req.url + " failed.";
      }
      if (onComplete) {
        onComplete(body);
      }
    });
  };
  FirebaseIFrameScriptHolder.prototype.doNodeLongPoll = function(url, loadCB) {
    var self = this;
    FirebaseIFrameScriptHolder.nodeRestRequest({url:url, forever:true}, function(body) {
      self.evalBody(body);
      loadCB();
    });
  };
  FirebaseIFrameScriptHolder.prototype.evalBody = function(body) {
    eval("var jsonpCB = function(" + FIREBASE_LONGPOLL_COMMAND_CB_NAME + ", " + FIREBASE_LONGPOLL_DATA_CB_NAME + ") {" + body + "}");
    jsonpCB(this.commandCB, this.onMessageCB);
  };
}
;goog.provide("fb.realtime.WebSocketConnection");
goog.require("fb.constants");
goog.require("fb.core.stats.StatsManager");
goog.require("fb.core.storage");
goog.require("fb.core.util");
goog.require("fb.realtime.Constants");
goog.require("fb.realtime.Transport");
goog.require("fb.util.json");
var WEBSOCKET_MAX_FRAME_SIZE = 16384;
var WEBSOCKET_KEEPALIVE_INTERVAL = 45E3;
fb.WebSocket = null;
if (NODE_CLIENT) {
  goog.require("fb.core.util.NodePatches");
  fb.WebSocket = require("faye-websocket")["Client"];
} else {
  if (typeof MozWebSocket !== "undefined") {
    fb.WebSocket = MozWebSocket;
  } else {
    if (typeof WebSocket !== "undefined") {
      fb.WebSocket = WebSocket;
    }
  }
}
fb.realtime.WebSocketConnection = function(connId, repoInfo, opt_transportSessionId, opt_lastSessionId) {
  this.connId = connId;
  this.log_ = fb.core.util.logWrapper(this.connId);
  this.keepaliveTimer = null;
  this.frames = null;
  this.totalFrames = 0;
  this.bytesSent = 0;
  this.bytesReceived = 0;
  this.stats_ = fb.core.stats.StatsManager.getCollection(repoInfo);
  this.connURL = this.connectionURL_(repoInfo, opt_transportSessionId, opt_lastSessionId);
};
fb.realtime.WebSocketConnection.prototype.connectionURL_ = function(repoInfo, opt_transportSessionId, opt_lastSessionId) {
  var urlParams = {};
  urlParams[fb.realtime.Constants.VERSION_PARAM] = fb.realtime.Constants.PROTOCOL_VERSION;
  if (!NODE_CLIENT && typeof location !== "undefined" && location.href && location.href.indexOf(fb.realtime.Constants.FORGE_DOMAIN) !== -1) {
    urlParams[fb.realtime.Constants.REFERER_PARAM] = fb.realtime.Constants.FORGE_REF;
  }
  if (opt_transportSessionId) {
    urlParams[fb.realtime.Constants.TRANSPORT_SESSION_PARAM] = opt_transportSessionId;
  }
  if (opt_lastSessionId) {
    urlParams[fb.realtime.Constants.LAST_SESSION_PARAM] = opt_lastSessionId;
  }
  return repoInfo.connectionURL(fb.realtime.Constants.WEBSOCKET, urlParams);
};
fb.realtime.WebSocketConnection.prototype.open = function(onMess, onDisconn) {
  this.onDisconnect = onDisconn;
  this.onMessage = onMess;
  this.log_("Websocket connecting to " + this.connURL);
  this.everConnected_ = false;
  fb.core.storage.PersistentStorage.set("previous_websocket_failure", true);
  try {
    if (NODE_CLIENT) {
      var options = {"headers":{"User-Agent":"Firebase/" + fb.realtime.Constants.PROTOCOL_VERSION + "/" + CLIENT_VERSION + "/" + process.platform + "/Node"}};
      this.mySock = new fb.WebSocket(this.connURL, [], options);
    } else {
      this.mySock = new fb.WebSocket(this.connURL);
    }
  } catch (e) {
    this.log_("Error instantiating WebSocket.");
    var error = e.message || e.data;
    if (error) {
      this.log_(error);
    }
    this.onClosed_();
    return;
  }
  var self = this;
  this.mySock.onopen = function() {
    self.log_("Websocket connected.");
    self.everConnected_ = true;
  };
  this.mySock.onclose = function() {
    self.log_("Websocket connection was disconnected.");
    self.mySock = null;
    self.onClosed_();
  };
  this.mySock.onmessage = function(m) {
    self.handleIncomingFrame(m);
  };
  this.mySock.onerror = function(e) {
    self.log_("WebSocket error.  Closing connection.");
    var error = e.message || e.data;
    if (error) {
      self.log_(error);
    }
    self.onClosed_();
  };
};
fb.realtime.WebSocketConnection.prototype.start = function() {
};
fb.realtime.WebSocketConnection.forceDisallow = function() {
  fb.realtime.WebSocketConnection.forceDisallow_ = true;
};
fb.realtime.WebSocketConnection["isAvailable"] = function() {
  var isOldAndroid = false;
  if (typeof navigator !== "undefined" && navigator.userAgent) {
    var oldAndroidRegex = /Android ([0-9]{0,}\.[0-9]{0,})/;
    var oldAndroidMatch = navigator.userAgent.match(oldAndroidRegex);
    if (oldAndroidMatch && oldAndroidMatch.length > 1) {
      if (parseFloat(oldAndroidMatch[1]) < 4.4) {
        isOldAndroid = true;
      }
    }
  }
  return!isOldAndroid && fb.WebSocket !== null && !fb.realtime.WebSocketConnection.forceDisallow_;
};
fb.realtime.WebSocketConnection["responsesRequiredToBeHealthy"] = 2;
fb.realtime.WebSocketConnection["healthyTimeout"] = 3E4;
fb.realtime.WebSocketConnection.previouslyFailed = function() {
  return fb.core.storage.PersistentStorage.isInMemoryStorage || fb.core.storage.PersistentStorage.get("previous_websocket_failure") === true;
};
fb.realtime.WebSocketConnection.prototype.markConnectionHealthy = function() {
  fb.core.storage.PersistentStorage.remove("previous_websocket_failure");
};
fb.realtime.WebSocketConnection.prototype.appendFrame_ = function(data) {
  this.frames.push(data);
  if (this.frames.length == this.totalFrames) {
    var fullMess = this.frames.join("");
    this.frames = null;
    var jsonMess = fb.util.json.eval(fullMess);
    this.onMessage(jsonMess);
  }
};
fb.realtime.WebSocketConnection.prototype.handleNewFrameCount_ = function(frameCount) {
  this.totalFrames = frameCount;
  this.frames = [];
};
fb.realtime.WebSocketConnection.prototype.extractFrameCount_ = function(data) {
  fb.core.util.assert(this.frames === null, "We already have a frame buffer");
  if (data.length <= 6) {
    var frameCount = Number(data);
    if (!isNaN(frameCount)) {
      this.handleNewFrameCount_(frameCount);
      return null;
    }
  }
  this.handleNewFrameCount_(1);
  return data;
};
fb.realtime.WebSocketConnection.prototype.handleIncomingFrame = function(mess) {
  if (this.mySock === null) {
    return;
  }
  var data = mess["data"];
  this.bytesReceived += data.length;
  this.stats_.incrementCounter("bytes_received", data.length);
  this.resetKeepAlive();
  if (this.frames !== null) {
    this.appendFrame_(data);
  } else {
    var remainingData = this.extractFrameCount_(data);
    if (remainingData !== null) {
      this.appendFrame_(remainingData);
    }
  }
};
fb.realtime.WebSocketConnection.prototype.send = function(data) {
  this.resetKeepAlive();
  var dataStr = fb.util.json.stringify(data);
  this.bytesSent += dataStr.length;
  this.stats_.incrementCounter("bytes_sent", dataStr.length);
  var dataSegs = fb.core.util.splitStringBySize(dataStr, WEBSOCKET_MAX_FRAME_SIZE);
  if (dataSegs.length > 1) {
    this.mySock.send(String(dataSegs.length));
  }
  for (var i = 0;i < dataSegs.length;i++) {
    this.mySock.send(dataSegs[i]);
  }
};
fb.realtime.WebSocketConnection.prototype.shutdown_ = function() {
  this.isClosed_ = true;
  if (this.keepaliveTimer) {
    clearInterval(this.keepaliveTimer);
    this.keepaliveTimer = null;
  }
  if (this.mySock) {
    this.mySock.close();
    this.mySock = null;
  }
};
fb.realtime.WebSocketConnection.prototype.onClosed_ = function() {
  if (!this.isClosed_) {
    this.log_("WebSocket is closing itself");
    this.shutdown_();
    if (this.onDisconnect) {
      this.onDisconnect(this.everConnected_);
      this.onDisconnect = null;
    }
  }
};
fb.realtime.WebSocketConnection.prototype.close = function() {
  if (!this.isClosed_) {
    this.log_("WebSocket is being closed");
    this.shutdown_();
  }
};
fb.realtime.WebSocketConnection.prototype.resetKeepAlive = function() {
  var self = this;
  clearInterval(this.keepaliveTimer);
  this.keepaliveTimer = setInterval(function() {
    if (self.mySock) {
      self.mySock.send("0");
    }
    self.resetKeepAlive();
  }, Math.floor(WEBSOCKET_KEEPALIVE_INTERVAL));
};
goog.require("fb.constants");
goog.require("fb.realtime.BrowserPollConnection");
goog.require("fb.realtime.Transport");
goog.provide("fb.realtime.TransportManager");
goog.require("fb.realtime.WebSocketConnection");
fb.realtime.TransportManager = function(repoInfo) {
  this.initTransports_(repoInfo);
};
fb.realtime.TransportManager.ALL_TRANSPORTS = [fb.realtime.BrowserPollConnection, fb.realtime.WebSocketConnection];
fb.realtime.TransportManager.prototype.initTransports_ = function(repoInfo) {
  var isWebSocketsAvailable = fb.realtime.WebSocketConnection && fb.realtime.WebSocketConnection["isAvailable"]();
  var isSkipPollConnection = isWebSocketsAvailable && !fb.realtime.WebSocketConnection.previouslyFailed();
  if (repoInfo.webSocketOnly) {
    if (!isWebSocketsAvailable) {
      fb.core.util.warn("wss:// URL used, but browser isn't known to support websockets.  Trying anyway.");
    }
    isSkipPollConnection = true;
  }
  if (isSkipPollConnection) {
    this.transports_ = [fb.realtime.WebSocketConnection];
  } else {
    var transports = this.transports_ = [];
    fb.core.util.each(fb.realtime.TransportManager.ALL_TRANSPORTS, function(i, transport) {
      if (transport && transport["isAvailable"]()) {
        transports.push(transport);
      }
    });
  }
};
fb.realtime.TransportManager.prototype.initialTransport = function() {
  if (this.transports_.length > 0) {
    return this.transports_[0];
  } else {
    throw new Error("No transports available");
  }
};
fb.realtime.TransportManager.prototype.upgradeTransport = function() {
  if (this.transports_.length > 1) {
    return this.transports_[1];
  } else {
    return null;
  }
};
goog.provide("fb.realtime.Connection");
goog.require("fb.core.storage");
goog.require("fb.core.util");
goog.require("fb.realtime.Constants");
goog.require("fb.realtime.TransportManager");
var UPGRADE_TIMEOUT = 6E4;
var DELAY_BEFORE_SENDING_EXTRA_REQUESTS = 5E3;
var BYTES_SENT_HEALTHY_OVERRIDE = 10 * 1024;
var BYTES_RECEIVED_HEALTHY_OVERRIDE = 100 * 1024;
var REALTIME_STATE_CONNECTING = 0;
var REALTIME_STATE_CONNECTED = 1;
var REALTIME_STATE_DISCONNECTED = 2;
var MESSAGE_TYPE = "t";
var MESSAGE_DATA = "d";
var CONTROL_SHUTDOWN = "s";
var CONTROL_RESET = "r";
var CONTROL_ERROR = "e";
var CONTROL_PONG = "o";
var SWITCH_ACK = "a";
var END_TRANSMISSION = "n";
var PING = "p";
var SERVER_HELLO = "h";
fb.realtime.Connection = function(connId, repoInfo, onMessage, onReady, onDisconnect, onKill, lastSessionId) {
  this.id = connId;
  this.log_ = fb.core.util.logWrapper("c:" + this.id + ":");
  this.onMessage_ = onMessage;
  this.onReady_ = onReady;
  this.onDisconnect_ = onDisconnect;
  this.onKill_ = onKill;
  this.repoInfo_ = repoInfo;
  this.pendingDataMessages = [];
  this.connectionCount = 0;
  this.transportManager_ = new fb.realtime.TransportManager(repoInfo);
  this.state_ = REALTIME_STATE_CONNECTING;
  this.lastSessionId = lastSessionId;
  this.log_("Connection created");
  this.start_();
};
fb.realtime.Connection.prototype.start_ = function() {
  var conn = this.transportManager_.initialTransport();
  this.conn_ = new conn(this.nextTransportId_(), this.repoInfo_, undefined, this.lastSessionId);
  this.primaryResponsesRequired_ = conn["responsesRequiredToBeHealthy"] || 0;
  var onMessageReceived = this.connReceiver_(this.conn_);
  var onConnectionLost = this.disconnReceiver_(this.conn_);
  this.tx_ = this.conn_;
  this.rx_ = this.conn_;
  this.secondaryConn_ = null;
  this.isHealthy_ = false;
  var self = this;
  setTimeout(function() {
    self.conn_ && self.conn_.open(onMessageReceived, onConnectionLost);
  }, Math.floor(0));
  var healthyTimeout_ms = conn["healthyTimeout"] || 0;
  if (healthyTimeout_ms > 0) {
    this.healthyTimeout_ = setTimeout(function() {
      self.healthyTimeout_ = null;
      if (!self.isHealthy_) {
        if (self.conn_ && self.conn_.bytesReceived > BYTES_RECEIVED_HEALTHY_OVERRIDE) {
          self.log_("Connection exceeded healthy timeout but has received " + self.conn_.bytesReceived + " bytes.  Marking connection healthy.");
          self.isHealthy_ = true;
          self.conn_.markConnectionHealthy();
        } else {
          if (self.conn_ && self.conn_.bytesSent > BYTES_SENT_HEALTHY_OVERRIDE) {
            self.log_("Connection exceeded healthy timeout but has sent " + self.conn_.bytesSent + " bytes.  Leaving connection alive.");
          } else {
            self.log_("Closing unhealthy connection after timeout.");
            self.close();
          }
        }
      }
    }, Math.floor(healthyTimeout_ms));
  }
};
fb.realtime.Connection.prototype.nextTransportId_ = function() {
  return "c:" + this.id + ":" + this.connectionCount++;
};
fb.realtime.Connection.prototype.disconnReceiver_ = function(conn) {
  var self = this;
  return function(everConnected) {
    if (conn === self.conn_) {
      self.onConnectionLost_(everConnected);
    } else {
      if (conn === self.secondaryConn_) {
        self.log_("Secondary connection lost.");
        self.onSecondaryConnectionLost_();
      } else {
        self.log_("closing an old connection");
      }
    }
  };
};
fb.realtime.Connection.prototype.connReceiver_ = function(conn) {
  var self = this;
  return function(message) {
    if (self.state_ != REALTIME_STATE_DISCONNECTED) {
      if (conn === self.rx_) {
        self.onPrimaryMessageReceived_(message);
      } else {
        if (conn === self.secondaryConn_) {
          self.onSecondaryMessageReceived_(message);
        } else {
          self.log_("message on old connection");
        }
      }
    }
  };
};
fb.realtime.Connection.prototype.sendRequest = function(dataMsg) {
  var msg = {"t":"d", "d":dataMsg};
  this.sendData_(msg);
};
fb.realtime.Connection.prototype.tryCleanupConnection = function() {
  if (this.tx_ === this.secondaryConn_ && this.rx_ === this.secondaryConn_) {
    this.log_("cleaning up and promoting a connection: " + this.secondaryConn_.connId);
    this.conn_ = this.secondaryConn_;
    this.secondaryConn_ = null;
  }
};
fb.realtime.Connection.prototype.onSecondaryControl_ = function(controlData) {
  if (MESSAGE_TYPE in controlData) {
    var cmd = controlData[MESSAGE_TYPE];
    if (cmd === SWITCH_ACK) {
      this.upgradeIfSecondaryHealthy_();
    } else {
      if (cmd === CONTROL_RESET) {
        this.log_("Got a reset on secondary, closing it");
        this.secondaryConn_.close();
        if (this.tx_ === this.secondaryConn_ || this.rx_ === this.secondaryConn_) {
          this.close();
        }
      } else {
        if (cmd === CONTROL_PONG) {
          this.log_("got pong on secondary.");
          this.secondaryResponsesRequired_--;
          this.upgradeIfSecondaryHealthy_();
        }
      }
    }
  }
};
fb.realtime.Connection.prototype.onSecondaryMessageReceived_ = function(parsedData) {
  var layer = fb.core.util.requireKey("t", parsedData);
  var data = fb.core.util.requireKey("d", parsedData);
  if (layer == "c") {
    this.onSecondaryControl_(data);
  } else {
    if (layer == "d") {
      this.pendingDataMessages.push(data);
    } else {
      throw new Error("Unknown protocol layer: " + layer);
    }
  }
};
fb.realtime.Connection.prototype.upgradeIfSecondaryHealthy_ = function() {
  if (this.secondaryResponsesRequired_ <= 0) {
    this.log_("Secondary connection is healthy.");
    this.isHealthy_ = true;
    this.secondaryConn_.markConnectionHealthy();
    this.proceedWithUpgrade_();
  } else {
    this.log_("sending ping on secondary.");
    this.secondaryConn_.send({"t":"c", "d":{"t":PING, "d":{}}});
  }
};
fb.realtime.Connection.prototype.proceedWithUpgrade_ = function() {
  this.secondaryConn_.start();
  this.log_("sending client ack on secondary");
  this.secondaryConn_.send({"t":"c", "d":{"t":SWITCH_ACK, "d":{}}});
  this.log_("Ending transmission on primary");
  this.conn_.send({"t":"c", "d":{"t":END_TRANSMISSION, "d":{}}});
  this.tx_ = this.secondaryConn_;
  this.tryCleanupConnection();
};
fb.realtime.Connection.prototype.onPrimaryMessageReceived_ = function(parsedData) {
  var layer = fb.core.util.requireKey("t", parsedData);
  var data = fb.core.util.requireKey("d", parsedData);
  if (layer == "c") {
    this.onControl_(data);
  } else {
    if (layer == "d") {
      this.onDataMessage_(data);
    }
  }
};
fb.realtime.Connection.prototype.onDataMessage_ = function(message) {
  this.onPrimaryResponse_();
  this.onMessage_(message);
};
fb.realtime.Connection.prototype.onPrimaryResponse_ = function() {
  if (!this.isHealthy_) {
    this.primaryResponsesRequired_--;
    if (this.primaryResponsesRequired_ <= 0) {
      this.log_("Primary connection is healthy.");
      this.isHealthy_ = true;
      this.conn_.markConnectionHealthy();
    }
  }
};
fb.realtime.Connection.prototype.onControl_ = function(controlData) {
  var cmd = fb.core.util.requireKey(MESSAGE_TYPE, controlData);
  if (MESSAGE_DATA in controlData) {
    var payload = controlData[MESSAGE_DATA];
    if (cmd === SERVER_HELLO) {
      this.onHandshake_(payload);
    } else {
      if (cmd === END_TRANSMISSION) {
        this.log_("recvd end transmission on primary");
        this.rx_ = this.secondaryConn_;
        for (var i = 0;i < this.pendingDataMessages.length;++i) {
          this.onDataMessage_(this.pendingDataMessages[i]);
        }
        this.pendingDataMessages = [];
        this.tryCleanupConnection();
      } else {
        if (cmd === CONTROL_SHUTDOWN) {
          this.onConnectionShutdown_(payload);
        } else {
          if (cmd === CONTROL_RESET) {
            this.onReset_(payload);
          } else {
            if (cmd === CONTROL_ERROR) {
              fb.core.util.error("Server Error: " + payload);
            } else {
              if (cmd === CONTROL_PONG) {
                this.log_("got pong on primary.");
                this.onPrimaryResponse_();
                this.sendPingOnPrimaryIfNecessary_();
              } else {
                fb.core.util.error("Unknown control packet command: " + cmd);
              }
            }
          }
        }
      }
    }
  }
};
fb.realtime.Connection.prototype.onHandshake_ = function(handshake) {
  var timestamp = handshake["ts"];
  var version = handshake["v"];
  var host = handshake["h"];
  this.sessionId = handshake["s"];
  this.repoInfo_.updateHost(host);
  if (this.state_ == REALTIME_STATE_CONNECTING) {
    this.conn_.start();
    this.onConnectionEstablished_(this.conn_, timestamp);
    if (fb.realtime.Constants.PROTOCOL_VERSION !== version) {
      fb.core.util.warn("Protocol version mismatch detected");
    }
    this.tryStartUpgrade_();
  }
};
fb.realtime.Connection.prototype.tryStartUpgrade_ = function() {
  var conn = this.transportManager_.upgradeTransport();
  if (conn) {
    this.startUpgrade_(conn);
  }
};
fb.realtime.Connection.prototype.startUpgrade_ = function(conn) {
  this.secondaryConn_ = new conn(this.nextTransportId_(), this.repoInfo_, this.sessionId);
  this.secondaryResponsesRequired_ = conn["responsesRequiredToBeHealthy"] || 0;
  var onMessage = this.connReceiver_(this.secondaryConn_);
  var onDisconnect = this.disconnReceiver_(this.secondaryConn_);
  this.secondaryConn_.open(onMessage, onDisconnect);
  var self = this;
  setTimeout(function() {
    if (self.secondaryConn_) {
      self.log_("Timed out trying to upgrade.");
      self.secondaryConn_.close();
    }
  }, Math.floor(UPGRADE_TIMEOUT));
};
fb.realtime.Connection.prototype.onReset_ = function(host) {
  this.log_("Reset packet received.  New host: " + host);
  this.repoInfo_.updateHost(host);
  if (this.state_ === REALTIME_STATE_CONNECTED) {
    this.close();
  } else {
    this.closeConnections_();
    this.start_();
  }
};
fb.realtime.Connection.prototype.onConnectionEstablished_ = function(conn, timestamp) {
  this.log_("Realtime connection established.");
  this.conn_ = conn;
  this.state_ = REALTIME_STATE_CONNECTED;
  if (this.onReady_) {
    this.onReady_(timestamp, this.sessionId);
    this.onReady_ = null;
  }
  var self = this;
  if (this.primaryResponsesRequired_ === 0) {
    this.log_("Primary connection is healthy.");
    this.isHealthy_ = true;
  } else {
    setTimeout(function() {
      self.sendPingOnPrimaryIfNecessary_();
    }, Math.floor(DELAY_BEFORE_SENDING_EXTRA_REQUESTS));
  }
};
fb.realtime.Connection.prototype.sendPingOnPrimaryIfNecessary_ = function() {
  if (!this.isHealthy_ && this.state_ === REALTIME_STATE_CONNECTED) {
    this.log_("sending ping on primary.");
    this.sendData_({"t":"c", "d":{"t":PING, "d":{}}});
  }
};
fb.realtime.Connection.prototype.onSecondaryConnectionLost_ = function() {
  var conn = this.secondaryConn_;
  this.secondaryConn_ = null;
  if (this.tx_ === conn || this.rx_ === conn) {
    this.close();
  }
};
fb.realtime.Connection.prototype.onConnectionLost_ = function(everConnected) {
  this.conn_ = null;
  if (!everConnected && this.state_ === REALTIME_STATE_CONNECTING) {
    this.log_("Realtime connection failed.");
    if (this.repoInfo_.isCacheableHost()) {
      fb.core.storage.PersistentStorage.remove("host:" + this.repoInfo_.host);
      this.repoInfo_.internalHost = this.repoInfo_.host;
    }
  } else {
    if (this.state_ === REALTIME_STATE_CONNECTED) {
      this.log_("Realtime connection lost.");
    }
  }
  this.close();
};
fb.realtime.Connection.prototype.onConnectionShutdown_ = function(reason) {
  this.log_("Connection shutdown command received. Shutting down...");
  if (this.onKill_) {
    this.onKill_(reason);
    this.onKill_ = null;
  }
  this.onDisconnect_ = null;
  this.close();
};
fb.realtime.Connection.prototype.sendData_ = function(data) {
  if (this.state_ !== REALTIME_STATE_CONNECTED) {
    throw "Connection is not connected";
  } else {
    this.tx_.send(data);
  }
};
fb.realtime.Connection.prototype.close = function() {
  if (this.state_ !== REALTIME_STATE_DISCONNECTED) {
    this.log_("Closing realtime connection.");
    this.state_ = REALTIME_STATE_DISCONNECTED;
    this.closeConnections_();
    if (this.onDisconnect_) {
      this.onDisconnect_();
      this.onDisconnect_ = null;
    }
  }
};
fb.realtime.Connection.prototype.closeConnections_ = function() {
  this.log_("Shutting down all connections");
  if (this.conn_) {
    this.conn_.close();
    this.conn_ = null;
  }
  if (this.secondaryConn_) {
    this.secondaryConn_.close();
    this.secondaryConn_ = null;
  }
  if (this.healthyTimeout_) {
    clearTimeout(this.healthyTimeout_);
    this.healthyTimeout_ = null;
  }
};
goog.provide("fb.core.PersistentConnection");
goog.require("fb.core.ServerActions");
goog.require("fb.core.util");
goog.require("fb.core.util.OnlineMonitor");
goog.require("fb.core.util.VisibilityMonitor");
goog.require("fb.login.util.environment");
goog.require("fb.realtime.Connection");
goog.require("fb.util.json");
goog.require("fb.util.jwt");
var RECONNECT_MIN_DELAY = 1E3;
var RECONNECT_MAX_DELAY_DEFAULT = 60 * 5 * 1E3;
var RECONNECT_MAX_DELAY_FOR_ADMINS = 30 * 1E3;
var RECONNECT_DELAY_MULTIPLIER = 1.3;
var RECONNECT_DELAY_RESET_TIMEOUT = 3E4;
fb.core.PersistentConnection = goog.defineClass(null, {constructor:function(repoInfo, onDataUpdate, onConnectStatus, onServerInfoUpdate) {
  this.id = fb.core.PersistentConnection.nextPersistentConnectionId_++;
  this.log_ = fb.core.util.logWrapper("p:" + this.id + ":");
  this.interrupted_ = false;
  this.killed_ = false;
  this.listens_ = {};
  this.outstandingPuts_ = [];
  this.outstandingPutCount_ = 0;
  this.onDisconnectRequestQueue_ = [];
  this.connected_ = false;
  this.reconnectDelay_ = RECONNECT_MIN_DELAY;
  this.maxReconnectDelay_ = RECONNECT_MAX_DELAY_DEFAULT;
  this.onDataUpdate_ = onDataUpdate;
  this.onConnectStatus_ = onConnectStatus;
  this.onServerInfoUpdate_ = onServerInfoUpdate;
  this.repoInfo_ = repoInfo;
  this.securityDebugCallback_ = null;
  this.lastSessionId = null;
  this.realtime_ = null;
  this.credential_ = null;
  this.establishConnectionTimer_ = null;
  this.visible_ = false;
  this.requestCBHash_ = {};
  this.requestNumber_ = 0;
  this.firstConnection_ = true;
  this.lastConnectionAttemptTime_ = null;
  this.lastConnectionEstablishedTime_ = null;
  this.scheduleConnect_(0);
  fb.core.util.VisibilityMonitor.getInstance().on("visible", this.onVisible_, this);
  if (repoInfo.host.indexOf("fblocal") === -1) {
    fb.core.util.OnlineMonitor.getInstance().on("online", this.onOnline_, this);
  }
}, statics:{nextPersistentConnectionId_:0, nextConnectionId_:0}, sendRequest:function(action, body, onResponse) {
  var curReqNum = ++this.requestNumber_;
  var msg = {"r":curReqNum, "a":action, "b":body};
  this.log_(fb.util.json.stringify(msg));
  fb.core.util.assert(this.connected_, "sendRequest call when we're not connected not allowed.");
  this.realtime_.sendRequest(msg);
  if (onResponse) {
    this.requestCBHash_[curReqNum] = onResponse;
  }
}, listen:function(query, currentHashFn, tag, onComplete) {
  var queryId = query.queryIdentifier();
  var pathString = query.path.toString();
  this.log_("Listen called for " + pathString + " " + queryId);
  this.listens_[pathString] = this.listens_[pathString] || {};
  fb.core.util.assert(query.getQueryParams().isDefault() || !query.getQueryParams().loadsAllData(), "listen() called for non-default but complete query");
  fb.core.util.assert(!this.listens_[pathString][queryId], "listen() called twice for same path/queryId.");
  var listenSpec = {onComplete:onComplete, hashFn:currentHashFn, query:query, tag:tag};
  this.listens_[pathString][queryId] = listenSpec;
  if (this.connected_) {
    this.sendListen_(listenSpec);
  }
}, sendListen_:function(listenSpec) {
  var query = listenSpec.query;
  var pathString = query.path.toString();
  var queryId = query.queryIdentifier();
  var self = this;
  this.log_("Listen on " + pathString + " for " + queryId);
  var req = {"p":pathString};
  var action = "q";
  if (listenSpec.tag) {
    req["q"] = query.queryObject();
    req["t"] = listenSpec.tag;
  }
  req["h"] = listenSpec.hashFn();
  this.sendRequest(action, req, function(message) {
    var payload = message["d"];
    var status = message["s"];
    self.warnOnListenWarnings_(payload, query);
    var currentListenSpec = self.listens_[pathString] && self.listens_[pathString][queryId];
    if (currentListenSpec === listenSpec) {
      self.log_("listen response", message);
      if (status !== "ok") {
        self.removeListen_(pathString, queryId);
      }
      if (listenSpec.onComplete) {
        listenSpec.onComplete(status, payload);
      }
    }
  });
}, warnOnListenWarnings_:function(payload, query) {
  if (payload && typeof payload === "object" && fb.util.obj.contains(payload, "w")) {
    var warnings = fb.util.obj.get(payload, "w");
    if (goog.isArray(warnings) && goog.array.contains(warnings, "no_index")) {
      var indexSpec = '".indexOn": "' + query.getQueryParams().getIndex().toString() + '"';
      var indexPath = query.path.toString();
      fb.core.util.warn("Using an unspecified index. Consider adding " + indexSpec + " at " + indexPath + " to your security rules for better performance");
    }
  }
}, auth:function(cred, opt_callback, opt_cancelCallback) {
  this.credential_ = {cred:cred, firstRequestSent:false, callback:opt_callback, cancelCallback:opt_cancelCallback};
  this.log_("Authenticating using credential: " + cred);
  this.tryAuth();
  this.reduceReconnectDelayIfAdminCredential_(cred);
}, reduceReconnectDelayIfAdminCredential_:function(credential) {
  var isFirebaseSecret = credential.length == 40;
  if (isFirebaseSecret || fb.util.jwt.isAdmin(credential)) {
    this.log_("Admin auth credential detected.  Reducing max reconnect time.");
    this.maxReconnectDelay_ = RECONNECT_MAX_DELAY_FOR_ADMINS;
  }
}, unauth:function(onComplete) {
  delete this.credential_;
  if (this.connected_) {
    this.sendRequest("unauth", {}, function(result) {
      var status = result["s"];
      var errorReason = result["d"];
      onComplete(status, errorReason);
    });
  }
}, tryAuth:function() {
  var authdata = this.credential_;
  var self = this;
  if (this.connected_ && authdata) {
    var requestData = {"cred":authdata.cred};
    this.sendRequest("auth", requestData, function(res) {
      var status = res["s"];
      var data = res["d"] || "error";
      if (status !== "ok" && self.credential_ === authdata) {
        delete self.credential_;
      }
      if (!authdata.firstRequestSent) {
        authdata.firstRequestSent = true;
        if (authdata.callback) {
          authdata.callback(status, data);
        }
      } else {
        if (status !== "ok" && authdata.cancelCallback) {
          authdata.cancelCallback(status, data);
        }
      }
    });
  }
}, unlisten:function(query, tag) {
  var pathString = query.path.toString();
  var queryId = query.queryIdentifier();
  this.log_("Unlisten called for " + pathString + " " + queryId);
  fb.core.util.assert(query.getQueryParams().isDefault() || !query.getQueryParams().loadsAllData(), "unlisten() called for non-default but complete query");
  var listen = this.removeListen_(pathString, queryId);
  if (listen && this.connected_) {
    this.sendUnlisten_(pathString, queryId, query.queryObject(), tag);
  }
}, sendUnlisten_:function(pathString, queryId, queryObj, tag) {
  this.log_("Unlisten on " + pathString + " for " + queryId);
  var self = this;
  var req = {"p":pathString};
  var action = "n";
  if (tag) {
    req["q"] = queryObj;
    req["t"] = tag;
  }
  this.sendRequest(action, req);
}, onDisconnectPut:function(pathString, data, opt_onComplete) {
  if (this.connected_) {
    this.sendOnDisconnect_("o", pathString, data, opt_onComplete);
  } else {
    this.onDisconnectRequestQueue_.push({pathString:pathString, action:"o", data:data, onComplete:opt_onComplete});
  }
}, onDisconnectMerge:function(pathString, data, opt_onComplete) {
  if (this.connected_) {
    this.sendOnDisconnect_("om", pathString, data, opt_onComplete);
  } else {
    this.onDisconnectRequestQueue_.push({pathString:pathString, action:"om", data:data, onComplete:opt_onComplete});
  }
}, onDisconnectCancel:function(pathString, opt_onComplete) {
  if (this.connected_) {
    this.sendOnDisconnect_("oc", pathString, null, opt_onComplete);
  } else {
    this.onDisconnectRequestQueue_.push({pathString:pathString, action:"oc", data:null, onComplete:opt_onComplete});
  }
}, sendOnDisconnect_:function(action, pathString, data, opt_onComplete) {
  var self = this;
  var request = {"p":pathString, "d":data};
  self.log_("onDisconnect " + action, request);
  this.sendRequest(action, request, function(response) {
    if (opt_onComplete) {
      setTimeout(function() {
        opt_onComplete(response["s"], response["d"]);
      }, Math.floor(0));
    }
  });
}, put:function(pathString, data, opt_onComplete, opt_hash) {
  this.putInternal("p", pathString, data, opt_onComplete, opt_hash);
}, merge:function(pathString, data, onComplete, opt_hash) {
  this.putInternal("m", pathString, data, onComplete, opt_hash);
}, putInternal:function(action, pathString, data, opt_onComplete, opt_hash) {
  var request = {"p":pathString, "d":data};
  if (goog.isDef(opt_hash)) {
    request["h"] = opt_hash;
  }
  this.outstandingPuts_.push({action:action, request:request, onComplete:opt_onComplete});
  this.outstandingPutCount_++;
  var index = this.outstandingPuts_.length - 1;
  if (this.connected_) {
    this.sendPut_(index);
  } else {
    this.log_("Buffering put: " + pathString);
  }
}, sendPut_:function(index) {
  var self = this;
  var action = this.outstandingPuts_[index].action;
  var request = this.outstandingPuts_[index].request;
  var onComplete = this.outstandingPuts_[index].onComplete;
  this.outstandingPuts_[index].queued = this.connected_;
  this.sendRequest(action, request, function(message) {
    self.log_(action + " response", message);
    delete self.outstandingPuts_[index];
    self.outstandingPutCount_--;
    if (self.outstandingPutCount_ === 0) {
      self.outstandingPuts_ = [];
    }
    if (onComplete) {
      onComplete(message["s"], message["d"]);
    }
  });
}, reportStats:function(stats) {
  if (this.connected_) {
    var request = {"c":stats};
    this.log_("reportStats", request);
    this.sendRequest("s", request, function(result) {
      var status = result["s"];
      if (status !== "ok") {
        var errorReason = result["d"];
        this.log_("reportStats", "Error sending stats: " + errorReason);
      }
    });
  }
}, onDataMessage_:function(message) {
  if ("r" in message) {
    this.log_("from server: " + fb.util.json.stringify(message));
    var reqNum = message["r"];
    var onResponse = this.requestCBHash_[reqNum];
    if (onResponse) {
      delete this.requestCBHash_[reqNum];
      onResponse(message["b"]);
    }
  } else {
    if ("error" in message) {
      throw "A server-side error has occurred: " + message["error"];
    } else {
      if ("a" in message) {
        this.onDataPush_(message["a"], message["b"]);
      }
    }
  }
}, onDataPush_:function(action, body) {
  this.log_("handleServerMessage", action, body);
  if (action === "d") {
    this.onDataUpdate_(body["p"], body["d"], false, body["t"]);
  } else {
    if (action === "m") {
      this.onDataUpdate_(body["p"], body["d"], true, body["t"]);
    } else {
      if (action === "c") {
        this.onListenRevoked_(body["p"], body["q"]);
      } else {
        if (action === "ac") {
          this.onAuthRevoked_(body["s"], body["d"]);
        } else {
          if (action === "sd") {
            this.onSecurityDebugPacket_(body);
          } else {
            fb.core.util.error("Unrecognized action received from server: " + fb.util.json.stringify(action) + "\nAre you using the latest client?");
          }
        }
      }
    }
  }
}, onReady_:function(timestamp, sessionId) {
  this.log_("connection ready");
  this.connected_ = true;
  this.lastConnectionEstablishedTime_ = (new Date).getTime();
  this.handleTimestamp_(timestamp);
  this.lastSessionId = sessionId;
  if (this.firstConnection_) {
    this.sendConnectStats_();
  }
  this.restoreState_();
  this.firstConnection_ = false;
  this.onConnectStatus_(true);
}, scheduleConnect_:function(timeout) {
  fb.core.util.assert(!this.realtime_, "Scheduling a connect when we're already connected/ing?");
  if (this.establishConnectionTimer_) {
    clearTimeout(this.establishConnectionTimer_);
  }
  var self = this;
  this.establishConnectionTimer_ = setTimeout(function() {
    self.establishConnectionTimer_ = null;
    self.establishConnection_();
  }, Math.floor(timeout));
}, onVisible_:function(visible) {
  if (visible && !this.visible_ && this.reconnectDelay_ === this.maxReconnectDelay_) {
    this.log_("Window became visible.  Reducing delay.");
    this.reconnectDelay_ = RECONNECT_MIN_DELAY;
    if (!this.realtime_) {
      this.scheduleConnect_(0);
    }
  }
  this.visible_ = visible;
}, onOnline_:function(online) {
  if (online) {
    this.log_("Browser went online.");
    this.reconnectDelay_ = RECONNECT_MIN_DELAY;
    if (!this.realtime_) {
      this.scheduleConnect_(0);
    }
  } else {
    this.log_("Browser went offline.  Killing connection.");
    if (this.realtime_) {
      this.realtime_.close();
    }
  }
}, onRealtimeDisconnect_:function() {
  this.log_("data client disconnected");
  this.connected_ = false;
  this.realtime_ = null;
  this.cancelSentTransactions_();
  this.requestCBHash_ = {};
  if (this.shouldReconnect_()) {
    if (!this.visible_) {
      this.log_("Window isn't visible.  Delaying reconnect.");
      this.reconnectDelay_ = this.maxReconnectDelay_;
      this.lastConnectionAttemptTime_ = (new Date).getTime();
    } else {
      if (this.lastConnectionEstablishedTime_) {
        var timeSinceLastConnectSucceeded = (new Date).getTime() - this.lastConnectionEstablishedTime_;
        if (timeSinceLastConnectSucceeded > RECONNECT_DELAY_RESET_TIMEOUT) {
          this.reconnectDelay_ = RECONNECT_MIN_DELAY;
        }
        this.lastConnectionEstablishedTime_ = null;
      }
    }
    var timeSinceLastConnectAttempt = (new Date).getTime() - this.lastConnectionAttemptTime_;
    var reconnectDelay = Math.max(0, this.reconnectDelay_ - timeSinceLastConnectAttempt);
    reconnectDelay = Math.random() * reconnectDelay;
    this.log_("Trying to reconnect in " + reconnectDelay + "ms");
    this.scheduleConnect_(reconnectDelay);
    this.reconnectDelay_ = Math.min(this.maxReconnectDelay_, this.reconnectDelay_ * RECONNECT_DELAY_MULTIPLIER);
  }
  this.onConnectStatus_(false);
}, establishConnection_:function() {
  if (this.shouldReconnect_()) {
    this.log_("Making a connection attempt");
    this.lastConnectionAttemptTime_ = (new Date).getTime();
    this.lastConnectionEstablishedTime_ = null;
    var onDataMessage = goog.bind(this.onDataMessage_, this);
    var onReady = goog.bind(this.onReady_, this);
    var onDisconnect = goog.bind(this.onRealtimeDisconnect_, this);
    var connId = this.id + ":" + fb.core.PersistentConnection.nextConnectionId_++;
    var self = this;
    var lastSessionId = this.lastSessionId;
    this.realtime_ = new fb.realtime.Connection(connId, this.repoInfo_, onDataMessage, onReady, onDisconnect, function(reason) {
      fb.core.util.warn(reason + " (" + self.repoInfo_.toString() + ")");
      self.killed_ = true;
    }, lastSessionId);
  }
}, interrupt:function() {
  this.interrupted_ = true;
  if (this.realtime_) {
    this.realtime_.close();
  } else {
    if (this.establishConnectionTimer_) {
      clearTimeout(this.establishConnectionTimer_);
      this.establishConnectionTimer_ = null;
    }
    if (this.connected_) {
      this.onRealtimeDisconnect_();
    }
  }
}, resume:function() {
  this.interrupted_ = false;
  this.reconnectDelay_ = RECONNECT_MIN_DELAY;
  if (!this.realtime_) {
    this.scheduleConnect_(0);
  }
}, handleTimestamp_:function(timestamp) {
  var delta = timestamp - (new Date).getTime();
  this.onServerInfoUpdate_({"serverTimeOffset":delta});
}, cancelSentTransactions_:function() {
  for (var i = 0;i < this.outstandingPuts_.length;i++) {
    var put = this.outstandingPuts_[i];
    if (put && "h" in put.request && put.queued) {
      if (put.onComplete) {
        put.onComplete("disconnect");
      }
      delete this.outstandingPuts_[i];
      this.outstandingPutCount_--;
    }
  }
  if (this.outstandingPutCount_ === 0) {
    this.outstandingPuts_ = [];
  }
}, onListenRevoked_:function(pathString, opt_query) {
  var queryId;
  if (!opt_query) {
    queryId = "default";
  } else {
    queryId = goog.array.map(opt_query, function(q) {
      return fb.core.util.ObjectToUniqueKey(q);
    }).join("$");
  }
  var listen = this.removeListen_(pathString, queryId);
  if (listen && listen.onComplete) {
    listen.onComplete("permission_denied");
  }
}, removeListen_:function(pathString, queryId) {
  var normalizedPathString = (new fb.core.util.Path(pathString)).toString();
  var listen;
  if (goog.isDef(this.listens_[normalizedPathString])) {
    listen = this.listens_[normalizedPathString][queryId];
    delete this.listens_[normalizedPathString][queryId];
    if (goog.object.getCount(this.listens_[normalizedPathString]) === 0) {
      delete this.listens_[normalizedPathString];
    }
  } else {
    listen = undefined;
  }
  return listen;
}, onAuthRevoked_:function(statusCode, explanation) {
  var cred = this.credential_;
  delete this.credential_;
  if (cred && cred.cancelCallback) {
    cred.cancelCallback(statusCode, explanation);
  }
}, onSecurityDebugPacket_:function(body) {
  if (this.securityDebugCallback_) {
    this.securityDebugCallback_(body);
  } else {
    if ("msg" in body && typeof console !== "undefined") {
      console.log("FIREBASE: " + body["msg"].replace("\n", "\nFIREBASE: "));
    }
  }
}, restoreState_:function() {
  this.tryAuth();
  var self = this;
  goog.object.forEach(this.listens_, function(queries, pathString) {
    goog.object.forEach(queries, function(listenSpec) {
      self.sendListen_(listenSpec);
    });
  });
  for (var i = 0;i < this.outstandingPuts_.length;i++) {
    if (this.outstandingPuts_[i]) {
      this.sendPut_(i);
    }
  }
  while (this.onDisconnectRequestQueue_.length) {
    var request = this.onDisconnectRequestQueue_.shift();
    this.sendOnDisconnect_(request.action, request.pathString, request.data, request.onComplete);
  }
}, sendConnectStats_:function() {
  var stats = {};
  stats["sdk.js." + CLIENT_VERSION.replace(/\./g, "-")] = 1;
  if (fb.login.util.environment.isMobileCordova()) {
    stats["framework.cordova"] = 1;
  }
  this.reportStats(stats);
}, shouldReconnect_:function() {
  var online = fb.core.util.OnlineMonitor.getInstance().currentlyOnline();
  return!this.killed_ && !this.interrupted_ && online;
}});
goog.provide("fb.api.INTERNAL");
goog.require("fb.core.PersistentConnection");
goog.require("fb.realtime.Connection");
goog.require("fb.login.transports.PopupReceiver");
goog.require("fb.login.Constants");
fb.api.INTERNAL = {};
fb.api.INTERNAL.forceLongPolling = function() {
  fb.realtime.WebSocketConnection.forceDisallow();
  fb.realtime.BrowserPollConnection.forceAllow();
};
goog.exportProperty(fb.api.INTERNAL, "forceLongPolling", fb.api.INTERNAL.forceLongPolling);
fb.api.INTERNAL.forceWebSockets = function() {
  fb.realtime.BrowserPollConnection.forceDisallow();
};
goog.exportProperty(fb.api.INTERNAL, "forceWebSockets", fb.api.INTERNAL.forceWebSockets);
fb.api.INTERNAL.setSecurityDebugCallback = function(ref, callback) {
  ref.repo.persistentConnection_.securityDebugCallback_ = callback;
};
goog.exportProperty(fb.api.INTERNAL, "setSecurityDebugCallback", fb.api.INTERNAL.setSecurityDebugCallback);
fb.api.INTERNAL.stats = function(ref, showDelta) {
  ref.repo.stats(showDelta);
};
goog.exportProperty(fb.api.INTERNAL, "stats", fb.api.INTERNAL.stats);
fb.api.INTERNAL.statsIncrementCounter = function(ref, metric) {
  ref.repo.statsIncrementCounter(metric);
};
goog.exportProperty(fb.api.INTERNAL, "statsIncrementCounter", fb.api.INTERNAL.statsIncrementCounter);
fb.api.INTERNAL.dataUpdateCount = function(ref) {
  return ref.repo.dataUpdateCount;
};
goog.exportProperty(fb.api.INTERNAL, "dataUpdateCount", fb.api.INTERNAL.dataUpdateCount);
fb.api.INTERNAL.interceptServerData = function(ref, callback) {
  return ref.repo.interceptServerData_(callback);
};
goog.exportProperty(fb.api.INTERNAL, "interceptServerData", fb.api.INTERNAL.interceptServerData);
fb.api.INTERNAL.onLoginPopupOpen = function(callback) {
  new fb.login.transports.PopupReceiver(callback);
};
goog.exportProperty(fb.api.INTERNAL, "onPopupOpen", fb.api.INTERNAL.onLoginPopupOpen);
fb.api.INTERNAL.setAuthenticationServer = function(host) {
  fb.login.Constants.SERVER_HOST = host;
};
goog.exportProperty(fb.api.INTERNAL, "setAuthenticationServer", fb.api.INTERNAL.setAuthenticationServer);
goog.provide("fb.api.DataSnapshot");
goog.require("fb.core.snap");
goog.require("fb.core.util.SortedMap");
goog.require("fb.core.util.validation");
fb.api.DataSnapshot = function(node, ref, index) {
  this.node_ = node;
  this.query_ = ref;
  this.index_ = index;
};
fb.api.DataSnapshot.prototype.val = function() {
  fb.util.validation.validateArgCount("Firebase.DataSnapshot.val", 0, 0, arguments.length);
  return this.node_.val();
};
goog.exportProperty(fb.api.DataSnapshot.prototype, "val", fb.api.DataSnapshot.prototype.val);
fb.api.DataSnapshot.prototype.exportVal = function() {
  fb.util.validation.validateArgCount("Firebase.DataSnapshot.exportVal", 0, 0, arguments.length);
  return this.node_.val(true);
};
goog.exportProperty(fb.api.DataSnapshot.prototype, "exportVal", fb.api.DataSnapshot.prototype.exportVal);
fb.api.DataSnapshot.prototype.exists = function() {
  fb.util.validation.validateArgCount("Firebase.DataSnapshot.exists", 0, 0, arguments.length);
  return!this.node_.isEmpty();
};
goog.exportProperty(fb.api.DataSnapshot.prototype, "exists", fb.api.DataSnapshot.prototype.exists);
fb.api.DataSnapshot.prototype.child = function(childPathString) {
  fb.util.validation.validateArgCount("Firebase.DataSnapshot.child", 0, 1, arguments.length);
  if (goog.isNumber(childPathString)) {
    childPathString = String(childPathString);
  }
  fb.core.util.validation.validatePathString("Firebase.DataSnapshot.child", 1, childPathString, false);
  var childPath = new fb.core.util.Path(childPathString);
  var childRef = this.query_.child(childPath);
  return new fb.api.DataSnapshot(this.node_.getChild(childPath), childRef, fb.core.snap.PriorityIndex);
};
goog.exportProperty(fb.api.DataSnapshot.prototype, "child", fb.api.DataSnapshot.prototype.child);
fb.api.DataSnapshot.prototype.hasChild = function(childPathString) {
  fb.util.validation.validateArgCount("Firebase.DataSnapshot.hasChild", 1, 1, arguments.length);
  fb.core.util.validation.validatePathString("Firebase.DataSnapshot.hasChild", 1, childPathString, false);
  var childPath = new fb.core.util.Path(childPathString);
  return!this.node_.getChild(childPath).isEmpty();
};
goog.exportProperty(fb.api.DataSnapshot.prototype, "hasChild", fb.api.DataSnapshot.prototype.hasChild);
fb.api.DataSnapshot.prototype.getPriority = function() {
  fb.util.validation.validateArgCount("Firebase.DataSnapshot.getPriority", 0, 0, arguments.length);
  return(this.node_.getPriority().val());
};
goog.exportProperty(fb.api.DataSnapshot.prototype, "getPriority", fb.api.DataSnapshot.prototype.getPriority);
fb.api.DataSnapshot.prototype.forEach = function(action) {
  fb.util.validation.validateArgCount("Firebase.DataSnapshot.forEach", 1, 1, arguments.length);
  fb.util.validation.validateCallback("Firebase.DataSnapshot.forEach", 1, action, false);
  if (this.node_.isLeafNode()) {
    return false;
  }
  var childrenNode = (this.node_);
  var self = this;
  return!!childrenNode.forEachChild(this.index_, function(key, node) {
    return action(new fb.api.DataSnapshot(node, self.query_.child(key), fb.core.snap.PriorityIndex));
  });
};
goog.exportProperty(fb.api.DataSnapshot.prototype, "forEach", fb.api.DataSnapshot.prototype.forEach);
fb.api.DataSnapshot.prototype.hasChildren = function() {
  fb.util.validation.validateArgCount("Firebase.DataSnapshot.hasChildren", 0, 0, arguments.length);
  if (this.node_.isLeafNode()) {
    return false;
  } else {
    return!this.node_.isEmpty();
  }
};
goog.exportProperty(fb.api.DataSnapshot.prototype, "hasChildren", fb.api.DataSnapshot.prototype.hasChildren);
fb.api.DataSnapshot.prototype.name = function() {
  fb.core.util.warn("Firebase.DataSnapshot.name() being deprecated. " + "Please use Firebase.DataSnapshot.key() instead.");
  fb.util.validation.validateArgCount("Firebase.DataSnapshot.name", 0, 0, arguments.length);
  return this.key();
};
goog.exportProperty(fb.api.DataSnapshot.prototype, "name", fb.api.DataSnapshot.prototype.name);
fb.api.DataSnapshot.prototype.key = function() {
  fb.util.validation.validateArgCount("Firebase.DataSnapshot.key", 0, 0, arguments.length);
  return this.query_.key();
};
goog.exportProperty(fb.api.DataSnapshot.prototype, "key", fb.api.DataSnapshot.prototype.key);
fb.api.DataSnapshot.prototype.numChildren = function() {
  fb.util.validation.validateArgCount("Firebase.DataSnapshot.numChildren", 0, 0, arguments.length);
  return this.node_.numChildren();
};
goog.exportProperty(fb.api.DataSnapshot.prototype, "numChildren", fb.api.DataSnapshot.prototype.numChildren);
fb.api.DataSnapshot.prototype.ref = function() {
  fb.util.validation.validateArgCount("Firebase.DataSnapshot.ref", 0, 0, arguments.length);
  return this.query_;
};
goog.exportProperty(fb.api.DataSnapshot.prototype, "ref", fb.api.DataSnapshot.prototype.ref);
goog.provide("fb.core.Repo");
goog.require("fb.api.DataSnapshot");
goog.require("fb.core.PersistentConnection");
goog.require("fb.core.ReadonlyRestClient");
goog.require("fb.core.SnapshotHolder");
goog.require("fb.core.SparseSnapshotTree");
goog.require("fb.core.SyncTree");
goog.require("fb.core.stats.StatsCollection");
goog.require("fb.core.stats.StatsListener");
goog.require("fb.core.stats.StatsManager");
goog.require("fb.core.stats.StatsReporter");
goog.require("fb.core.util");
goog.require("fb.core.util.ServerValues");
goog.require("fb.core.util.Tree");
goog.require("fb.core.view.EventQueue");
goog.require("fb.login.AuthenticationManager");
goog.require("fb.util.json");
goog.require("fb.util.jwt");
goog.require("goog.string");
fb.core.Repo = goog.defineClass(null, {constructor:function(repoInfo, forceRestClient) {
  this.repoInfo_ = repoInfo;
  this.stats_ = fb.core.stats.StatsManager.getCollection(repoInfo);
  this.statsListener_ = null;
  this.eventQueue_ = new fb.core.view.EventQueue;
  this.nextWriteId_ = 1;
  this.persistentConnection_ = null;
  this.server_;
  if (forceRestClient || fb.core.util.beingCrawled()) {
    this.server_ = new fb.core.ReadonlyRestClient(this.repoInfo_, goog.bind(this.onDataUpdate_, this));
    setTimeout(goog.bind(this.onConnectStatus_, this, true), 0);
  } else {
    this.persistentConnection_ = new fb.core.PersistentConnection(this.repoInfo_, goog.bind(this.onDataUpdate_, this), goog.bind(this.onConnectStatus_, this), goog.bind(this.onServerInfoUpdate_, this));
    this.server_ = this.persistentConnection_;
  }
  this.statsReporter_ = fb.core.stats.StatsManager.getOrCreateReporter(repoInfo, goog.bind(function() {
    return new fb.core.stats.StatsReporter(this.stats_, this.server_);
  }, this));
  this.transactions_init_();
  this.infoData_ = new fb.core.SnapshotHolder;
  var self = this;
  this.infoSyncTree_ = new fb.core.SyncTree({startListening:function(query, tag, currentHashFn, onComplete) {
    var infoEvents = [];
    var node = self.infoData_.getNode(query.path);
    if (!node.isEmpty()) {
      infoEvents = self.infoSyncTree_.applyServerOverwrite(query.path, node);
      setTimeout(function() {
        onComplete("ok");
      }, 0);
    }
    return infoEvents;
  }, stopListening:goog.nullFunction});
  this.updateInfo_("connected", false);
  this.onDisconnect_ = new fb.core.SparseSnapshotTree;
  this.auth = new fb.login.AuthenticationManager(repoInfo, goog.bind(this.server_.auth, this.server_), goog.bind(this.server_.unauth, this.server_), goog.bind(this.onAuthStatus_, this));
  this.dataUpdateCount = 0;
  this.interceptServerDataCallback_ = null;
  this.serverSyncTree_ = new fb.core.SyncTree({startListening:function(query, tag, currentHashFn, onComplete) {
    self.server_.listen(query, currentHashFn, tag, function(status, data) {
      var events = onComplete(status, data);
      self.eventQueue_.raiseEventsForChangedPath(query.path, events);
    });
    return[];
  }, stopListening:function(query, tag) {
    self.server_.unlisten(query, tag);
  }});
}, toString:function() {
  return(this.repoInfo_.secure ? "https://" : "http://") + this.repoInfo_.host;
}, name:function() {
  return this.repoInfo_.namespace;
}, serverTime:function() {
  var offsetNode = this.infoData_.getNode(new fb.core.util.Path(".info/serverTimeOffset"));
  var offset = (offsetNode.val()) || 0;
  return(new Date).getTime() + offset;
}, generateServerValues:function() {
  return fb.core.util.ServerValues.generateWithValues({"timestamp":this.serverTime()});
}, onDataUpdate_:function(pathString, data, isMerge, tag) {
  this.dataUpdateCount++;
  var path = new fb.core.util.Path(pathString);
  data = this.interceptServerDataCallback_ ? this.interceptServerDataCallback_(pathString, data) : data;
  var events = [];
  if (tag) {
    if (isMerge) {
      var taggedChildren = goog.object.map((data), function(raw) {
        return fb.core.snap.NodeFromJSON(raw);
      });
      events = this.serverSyncTree_.applyTaggedQueryMerge(path, taggedChildren, tag);
    } else {
      var taggedSnap = fb.core.snap.NodeFromJSON(data);
      events = this.serverSyncTree_.applyTaggedQueryOverwrite(path, taggedSnap, tag);
    }
  } else {
    if (isMerge) {
      var changedChildren = goog.object.map((data), function(raw) {
        return fb.core.snap.NodeFromJSON(raw);
      });
      events = this.serverSyncTree_.applyServerMerge(path, changedChildren);
    } else {
      var snap = fb.core.snap.NodeFromJSON(data);
      events = this.serverSyncTree_.applyServerOverwrite(path, snap);
    }
  }
  var affectedPath = path;
  if (events.length > 0) {
    affectedPath = this.rerunTransactions_(path);
  }
  this.eventQueue_.raiseEventsForChangedPath(affectedPath, events);
}, interceptServerData_:function(callback) {
  this.interceptServerDataCallback_ = callback;
}, onConnectStatus_:function(connectStatus) {
  this.updateInfo_("connected", connectStatus);
  if (connectStatus === false) {
    this.runOnDisconnectEvents_();
  }
}, onServerInfoUpdate_:function(updates) {
  var self = this;
  fb.core.util.each(updates, function(value, key) {
    self.updateInfo_(key, value);
  });
}, onAuthStatus_:function(authStatus) {
  this.updateInfo_("authenticated", authStatus);
}, updateInfo_:function(pathString, value) {
  var path = new fb.core.util.Path("/.info/" + pathString);
  var newNode = fb.core.snap.NodeFromJSON(value);
  this.infoData_.updateSnapshot(path, newNode);
  var events = this.infoSyncTree_.applyServerOverwrite(path, newNode);
  this.eventQueue_.raiseEventsForChangedPath(path, events);
}, getNextWriteId_:function() {
  return this.nextWriteId_++;
}, setWithPriority:function(path, newVal, newPriority, onComplete) {
  this.log_("set", {path:path.toString(), value:newVal, priority:newPriority});
  var serverValues = this.generateServerValues();
  var newNodeUnresolved = fb.core.snap.NodeFromJSON(newVal, newPriority);
  var newNode = fb.core.util.ServerValues.resolveDeferredValueSnapshot(newNodeUnresolved, serverValues);
  var writeId = this.getNextWriteId_();
  var events = this.serverSyncTree_.applyUserOverwrite(path, newNode, writeId, true);
  this.eventQueue_.queueEvents(events);
  var self = this;
  this.server_.put(path.toString(), newNodeUnresolved.val(true), function(status, errorReason) {
    var success = status === "ok";
    if (!success) {
      fb.core.util.warn("set at " + path + " failed: " + status);
    }
    var clearEvents = self.serverSyncTree_.ackUserWrite(writeId, !success);
    self.eventQueue_.raiseEventsForChangedPath(path, clearEvents);
    self.callOnCompleteCallback(onComplete, status, errorReason);
  });
  var affectedPath = this.abortTransactions_(path);
  this.rerunTransactions_(affectedPath);
  this.eventQueue_.raiseEventsForChangedPath(affectedPath, []);
}, update:function(path, childrenToMerge, onComplete) {
  this.log_("update", {path:path.toString(), value:childrenToMerge});
  var empty = true;
  var serverValues = this.generateServerValues();
  var changedChildren = {};
  goog.object.forEach(childrenToMerge, function(changedValue, changedKey) {
    empty = false;
    var newNodeUnresolved = fb.core.snap.NodeFromJSON(changedValue);
    changedChildren[changedKey] = fb.core.util.ServerValues.resolveDeferredValueSnapshot(newNodeUnresolved, serverValues);
  });
  if (!empty) {
    var writeId = this.getNextWriteId_();
    var events = this.serverSyncTree_.applyUserMerge(path, changedChildren, writeId);
    this.eventQueue_.queueEvents(events);
    var self = this;
    this.server_.merge(path.toString(), childrenToMerge, function(status, errorReason) {
      var success = status === "ok";
      if (!success) {
        fb.core.util.warn("update at " + path + " failed: " + status);
      }
      var clearEvents = self.serverSyncTree_.ackUserWrite(writeId, !success);
      var affectedPath = path;
      if (clearEvents.length > 0) {
        affectedPath = self.rerunTransactions_(path);
      }
      self.eventQueue_.raiseEventsForChangedPath(affectedPath, clearEvents);
      self.callOnCompleteCallback(onComplete, status, errorReason);
    });
    var affectedPath = this.abortTransactions_(path);
    this.rerunTransactions_(affectedPath);
    this.eventQueue_.raiseEventsForChangedPath(path, []);
  } else {
    fb.core.util.log("update() called with empty data.  Don't do anything.");
    this.callOnCompleteCallback(onComplete, "ok");
  }
}, runOnDisconnectEvents_:function() {
  this.log_("onDisconnectEvents");
  var self = this;
  var serverValues = this.generateServerValues();
  var resolvedOnDisconnectTree = fb.core.util.ServerValues.resolveDeferredValueTree(this.onDisconnect_, serverValues);
  var events = [];
  resolvedOnDisconnectTree.forEachTree(fb.core.util.Path.Empty, function(path, snap) {
    events = events.concat(self.serverSyncTree_.applyServerOverwrite(path, snap));
    var affectedPath = self.abortTransactions_(path);
    self.rerunTransactions_(affectedPath);
  });
  this.onDisconnect_ = new fb.core.SparseSnapshotTree;
  this.eventQueue_.raiseEventsForChangedPath(fb.core.util.Path.Empty, events);
}, onDisconnectCancel:function(path, onComplete) {
  var self = this;
  this.server_.onDisconnectCancel(path.toString(), function(status, errorReason) {
    if (status === "ok") {
      self.onDisconnect_.forget(path);
    }
    self.callOnCompleteCallback(onComplete, status, errorReason);
  });
}, onDisconnectSet:function(path, value, onComplete) {
  var self = this;
  var newNode = fb.core.snap.NodeFromJSON(value);
  this.server_.onDisconnectPut(path.toString(), newNode.val(true), function(status, errorReason) {
    if (status === "ok") {
      self.onDisconnect_.remember(path, newNode);
    }
    self.callOnCompleteCallback(onComplete, status, errorReason);
  });
}, onDisconnectSetWithPriority:function(path, value, priority, onComplete) {
  var self = this;
  var newNode = fb.core.snap.NodeFromJSON(value, priority);
  this.server_.onDisconnectPut(path.toString(), newNode.val(true), function(status, errorReason) {
    if (status === "ok") {
      self.onDisconnect_.remember(path, newNode);
    }
    self.callOnCompleteCallback(onComplete, status, errorReason);
  });
}, onDisconnectUpdate:function(path, childrenToMerge, onComplete) {
  var empty = true;
  for (var childName in childrenToMerge) {
    empty = false;
  }
  if (empty) {
    fb.core.util.log("onDisconnect().update() called with empty data.  Don't do anything.");
    this.callOnCompleteCallback(onComplete, "ok");
    return;
  }
  var self = this;
  this.server_.onDisconnectMerge(path.toString(), childrenToMerge, function(status, errorReason) {
    if (status === "ok") {
      for (var childName in childrenToMerge) {
        var newChildNode = fb.core.snap.NodeFromJSON(childrenToMerge[childName]);
        self.onDisconnect_.remember(path.child(childName), newChildNode);
      }
    }
    self.callOnCompleteCallback(onComplete, status, errorReason);
  });
}, addEventCallbackForQuery:function(query, eventRegistration) {
  var events;
  if (query.path.getFront() === ".info") {
    events = this.infoSyncTree_.addEventRegistration(query, eventRegistration);
  } else {
    events = this.serverSyncTree_.addEventRegistration(query, eventRegistration);
  }
  this.eventQueue_.raiseEventsAtPath(query.path, events);
}, removeEventCallbackForQuery:function(query, eventRegistration) {
  var events;
  if (query.path.getFront() === ".info") {
    events = this.infoSyncTree_.removeEventRegistration(query, eventRegistration);
  } else {
    events = this.serverSyncTree_.removeEventRegistration(query, eventRegistration);
  }
  this.eventQueue_.raiseEventsAtPath(query.path, events);
}, interrupt:function() {
  if (this.persistentConnection_) {
    this.persistentConnection_.interrupt();
  }
}, resume:function() {
  if (this.persistentConnection_) {
    this.persistentConnection_.resume();
  }
}, stats:function(showDelta) {
  if (typeof console === "undefined") {
    return;
  }
  var stats;
  if (showDelta) {
    if (!this.statsListener_) {
      this.statsListener_ = new fb.core.stats.StatsListener(this.stats_);
    }
    stats = this.statsListener_.get();
  } else {
    stats = this.stats_.get();
  }
  var longestName = goog.array.reduce(goog.object.getKeys(stats), function(previousValue, currentValue, index, array) {
    return Math.max(currentValue.length, previousValue);
  }, 0);
  for (var stat in stats) {
    var value = stats[stat];
    for (var i = stat.length;i < longestName + 2;i++) {
      stat += " ";
    }
    console.log(stat + value);
  }
}, statsIncrementCounter:function(metric) {
  this.stats_.incrementCounter(metric);
  this.statsReporter_.includeStat(metric);
}, log_:function(var_args) {
  var prefix = "";
  if (this.persistentConnection_) {
    prefix = this.persistentConnection_.id + ":";
  }
  fb.core.util.log(prefix, arguments);
}, callOnCompleteCallback:function(callback, status, errorReason) {
  if (callback) {
    fb.core.util.exceptionGuard(function() {
      if (status == "ok") {
        callback(null);
      } else {
        var code = (status || "error").toUpperCase();
        var message = code;
        if (errorReason) {
          message += ": " + errorReason;
        }
        var error = new Error(message);
        error.code = code;
        callback(error);
      }
    });
  }
}});
goog.provide("fb.core.Repo_transaction");
goog.require("fb.core.Repo");
goog.require("fb.core.snap.PriorityIndex");
goog.require("fb.core.util");
fb.core.TransactionStatus = {RUN:1, SENT:2, COMPLETED:3, SENT_NEEDS_ABORT:4, NEEDS_ABORT:5};
fb.core.Repo.MAX_TRANSACTION_RETRIES_ = 25;
fb.core.Transaction;
fb.core.Repo.prototype.transactions_init_ = function() {
  this.transactionQueueTree_ = new fb.core.util.Tree;
};
fb.core.Repo.prototype.startTransaction = function(path, transactionUpdate, onComplete, applyLocally) {
  this.log_("transaction on " + path);
  var valueCallback = function() {
  };
  var watchRef = new Firebase(this, path);
  watchRef.on("value", valueCallback);
  var unwatcher = function() {
    watchRef.off("value", valueCallback);
  };
  var transaction = ({path:path, update:transactionUpdate, onComplete:onComplete, status:null, order:fb.core.util.LUIDGenerator(), applyLocally:applyLocally, retryCount:0, unwatcher:unwatcher, abortReason:null, currentWriteId:null, currentInputSnapshot:null, currentOutputSnapshotRaw:null, currentOutputSnapshotResolved:null});
  var currentState = this.getLatestState_(path);
  transaction.currentInputSnapshot = currentState;
  var newVal = transaction.update(currentState.val());
  if (!goog.isDef(newVal)) {
    transaction.unwatcher();
    transaction.currentOutputSnapshotRaw = null;
    transaction.currentOutputSnapshotResolved = null;
    if (transaction.onComplete) {
      var snapshot = new fb.api.DataSnapshot((transaction.currentInputSnapshot), new Firebase(this, transaction.path), fb.core.snap.PriorityIndex);
      transaction.onComplete(null, false, snapshot);
    }
  } else {
    fb.core.util.validation.validateFirebaseData("transaction failed: Data returned ", newVal, transaction.path);
    transaction.status = fb.core.TransactionStatus.RUN;
    var queueNode = this.transactionQueueTree_.subTree(path);
    var nodeQueue = queueNode.getValue() || [];
    nodeQueue.push(transaction);
    queueNode.setValue(nodeQueue);
    var priorityForNode;
    if (typeof newVal === "object" && newVal !== null && fb.util.obj.contains(newVal, ".priority")) {
      priorityForNode = fb.util.obj.get(newVal, ".priority");
      fb.core.util.assert(fb.core.util.validation.isValidPriority(priorityForNode), "Invalid priority returned by transaction. " + "Priority must be a valid string, finite number, server value, or null.");
    } else {
      var currentNode = this.serverSyncTree_.calcCompleteEventCache(path) || fb.core.snap.EMPTY_NODE;
      priorityForNode = currentNode.getPriority().val();
    }
    priorityForNode = (priorityForNode);
    var serverValues = this.generateServerValues();
    var newNodeUnresolved = fb.core.snap.NodeFromJSON(newVal, priorityForNode);
    var newNode = fb.core.util.ServerValues.resolveDeferredValueSnapshot(newNodeUnresolved, serverValues);
    transaction.currentOutputSnapshotRaw = newNodeUnresolved;
    transaction.currentOutputSnapshotResolved = newNode;
    transaction.currentWriteId = this.getNextWriteId_();
    var events = this.serverSyncTree_.applyUserOverwrite(path, newNode, transaction.currentWriteId, transaction.applyLocally);
    this.eventQueue_.raiseEventsForChangedPath(path, events);
    this.sendReadyTransactions_();
  }
};
fb.core.Repo.prototype.getLatestState_ = function(path, excludeSets) {
  return this.serverSyncTree_.calcCompleteEventCache(path, excludeSets) || fb.core.snap.EMPTY_NODE;
};
fb.core.Repo.prototype.sendReadyTransactions_ = function(opt_node) {
  var node = (opt_node || this.transactionQueueTree_);
  if (!opt_node) {
    this.pruneCompletedTransactionsBelowNode_(node);
  }
  if (node.getValue() !== null) {
    var queue = this.buildTransactionQueue_(node);
    fb.core.util.assert(queue.length > 0, "Sending zero length transaction queue");
    var allRun = goog.array.every(queue, function(transaction) {
      return transaction.status === fb.core.TransactionStatus.RUN;
    });
    if (allRun) {
      this.sendTransactionQueue_(node.path(), queue);
    }
  } else {
    if (node.hasChildren()) {
      var self = this;
      node.forEachChild(function(childNode) {
        self.sendReadyTransactions_(childNode);
      });
    }
  }
};
fb.core.Repo.prototype.sendTransactionQueue_ = function(path, queue) {
  var setsToIgnore = goog.array.map(queue, function(txn) {
    return txn.currentWriteId;
  });
  var latestState = this.getLatestState_(path, setsToIgnore);
  var snapToSend = latestState;
  var latestHash = latestState.hash();
  for (var i = 0;i < queue.length;i++) {
    var txn = queue[i];
    fb.core.util.assert(txn.status === fb.core.TransactionStatus.RUN, "tryToSendTransactionQueue_: items in queue should all be run.");
    txn.status = fb.core.TransactionStatus.SENT;
    txn.retryCount++;
    var relativePath = fb.core.util.Path.relativePath(path, txn.path);
    snapToSend = snapToSend.updateChild(relativePath, (txn.currentOutputSnapshotRaw));
  }
  var dataToSend = snapToSend.val(true);
  var pathToSend = path;
  var self = this;
  this.server_.put(pathToSend.toString(), dataToSend, function(status) {
    self.log_("transaction put response", {path:pathToSend.toString(), status:status});
    var events = [];
    if (status === "ok") {
      var callbacks = [];
      for (i = 0;i < queue.length;i++) {
        queue[i].status = fb.core.TransactionStatus.COMPLETED;
        events = events.concat(self.serverSyncTree_.ackUserWrite(queue[i].currentWriteId));
        if (queue[i].onComplete) {
          var node = (queue[i].currentOutputSnapshotResolved);
          var ref = new Firebase(self, queue[i].path);
          var snapshot = new fb.api.DataSnapshot(node, ref, fb.core.snap.PriorityIndex);
          callbacks.push(goog.bind(queue[i].onComplete, null, null, true, snapshot));
        }
        queue[i].unwatcher();
      }
      self.pruneCompletedTransactionsBelowNode_(self.transactionQueueTree_.subTree(path));
      self.sendReadyTransactions_();
      self.eventQueue_.raiseEventsForChangedPath(path, events);
      for (i = 0;i < callbacks.length;i++) {
        fb.core.util.exceptionGuard(callbacks[i]);
      }
    } else {
      if (status === "datastale") {
        for (i = 0;i < queue.length;i++) {
          if (queue[i].status === fb.core.TransactionStatus.SENT_NEEDS_ABORT) {
            queue[i].status = fb.core.TransactionStatus.NEEDS_ABORT;
          } else {
            queue[i].status = fb.core.TransactionStatus.RUN;
          }
        }
      } else {
        fb.core.util.warn("transaction at " + pathToSend.toString() + " failed: " + status);
        for (i = 0;i < queue.length;i++) {
          queue[i].status = fb.core.TransactionStatus.NEEDS_ABORT;
          queue[i].abortReason = status;
        }
      }
      self.rerunTransactions_(path);
    }
  }, latestHash);
};
fb.core.Repo.prototype.rerunTransactions_ = function(changedPath) {
  var rootMostTransactionNode = this.getAncestorTransactionNode_(changedPath);
  var path = rootMostTransactionNode.path();
  var queue = this.buildTransactionQueue_(rootMostTransactionNode);
  this.rerunTransactionQueue_(queue, path);
  return path;
};
fb.core.Repo.prototype.rerunTransactionQueue_ = function(queue, path) {
  if (queue.length === 0) {
    return;
  }
  var callbacks = [];
  var events = [];
  var setsToIgnore = goog.array.map(queue, function(q) {
    return q.currentWriteId;
  });
  for (var i = 0;i < queue.length;i++) {
    var transaction = queue[i];
    var relativePath = fb.core.util.Path.relativePath(path, transaction.path);
    var abortTransaction = false, abortReason;
    fb.core.util.assert(relativePath !== null, "rerunTransactionsUnderNode_: relativePath should not be null.");
    if (transaction.status === fb.core.TransactionStatus.NEEDS_ABORT) {
      abortTransaction = true;
      abortReason = transaction.abortReason;
      events = events.concat(this.serverSyncTree_.ackUserWrite(transaction.currentWriteId, true));
    } else {
      if (transaction.status === fb.core.TransactionStatus.RUN) {
        if (transaction.retryCount >= fb.core.Repo.MAX_TRANSACTION_RETRIES_) {
          abortTransaction = true;
          abortReason = "maxretry";
          events = events.concat(this.serverSyncTree_.ackUserWrite(transaction.currentWriteId, true));
        } else {
          var currentNode = this.getLatestState_(transaction.path, setsToIgnore);
          transaction.currentInputSnapshot = currentNode;
          var newData = queue[i].update(currentNode.val());
          if (goog.isDef(newData)) {
            fb.core.util.validation.validateFirebaseData("transaction failed: Data returned ", newData, transaction.path);
            var newDataNode = fb.core.snap.NodeFromJSON(newData);
            var hasExplicitPriority = typeof newData === "object" && newData != null && fb.util.obj.contains(newData, ".priority");
            if (!hasExplicitPriority) {
              newDataNode = newDataNode.updatePriority(currentNode.getPriority());
            }
            var oldWriteId = transaction.currentWriteId;
            var serverValues = this.generateServerValues();
            var newNodeResolved = fb.core.util.ServerValues.resolveDeferredValueSnapshot(newDataNode, serverValues);
            transaction.currentOutputSnapshotRaw = newDataNode;
            transaction.currentOutputSnapshotResolved = newNodeResolved;
            transaction.currentWriteId = this.getNextWriteId_();
            goog.array.remove(setsToIgnore, oldWriteId);
            events = events.concat(this.serverSyncTree_.applyUserOverwrite(transaction.path, newNodeResolved, transaction.currentWriteId, transaction.applyLocally));
            events = events.concat(this.serverSyncTree_.ackUserWrite(oldWriteId, true));
          } else {
            abortTransaction = true;
            abortReason = "nodata";
            events = events.concat(this.serverSyncTree_.ackUserWrite(transaction.currentWriteId, true));
          }
        }
      }
    }
    this.eventQueue_.raiseEventsForChangedPath(path, events);
    events = [];
    if (abortTransaction) {
      queue[i].status = fb.core.TransactionStatus.COMPLETED;
      (function(unwatcher) {
        setTimeout(unwatcher, Math.floor(0));
      })(queue[i].unwatcher);
      if (queue[i].onComplete) {
        if (abortReason === "nodata") {
          var ref = new Firebase(this, queue[i].path);
          var lastInput = (queue[i].currentInputSnapshot);
          var snapshot = new fb.api.DataSnapshot(lastInput, ref, fb.core.snap.PriorityIndex);
          callbacks.push(goog.bind(queue[i].onComplete, null, null, false, snapshot));
        } else {
          callbacks.push(goog.bind(queue[i].onComplete, null, new Error(abortReason), false, null));
        }
      }
    }
  }
  this.pruneCompletedTransactionsBelowNode_(this.transactionQueueTree_);
  for (i = 0;i < callbacks.length;i++) {
    fb.core.util.exceptionGuard(callbacks[i]);
  }
  this.sendReadyTransactions_();
};
fb.core.Repo.prototype.getAncestorTransactionNode_ = function(path) {
  var front;
  var transactionNode = this.transactionQueueTree_;
  while ((front = path.getFront()) !== null && transactionNode.getValue() === null) {
    transactionNode = transactionNode.subTree(front);
    path = path.popFront();
  }
  return transactionNode;
};
fb.core.Repo.prototype.buildTransactionQueue_ = function(transactionNode) {
  var transactionQueue = [];
  this.aggregateTransactionQueuesForNode_(transactionNode, transactionQueue);
  transactionQueue.sort(function(a, b) {
    return a.order - b.order;
  });
  return transactionQueue;
};
fb.core.Repo.prototype.aggregateTransactionQueuesForNode_ = function(node, queue) {
  var nodeQueue = node.getValue();
  if (nodeQueue !== null) {
    for (var i = 0;i < nodeQueue.length;i++) {
      queue.push(nodeQueue[i]);
    }
  }
  var self = this;
  node.forEachChild(function(child) {
    self.aggregateTransactionQueuesForNode_(child, queue);
  });
};
fb.core.Repo.prototype.pruneCompletedTransactionsBelowNode_ = function(node) {
  var queue = node.getValue();
  if (queue) {
    var to = 0;
    for (var from = 0;from < queue.length;from++) {
      if (queue[from].status !== fb.core.TransactionStatus.COMPLETED) {
        queue[to] = queue[from];
        to++;
      }
    }
    queue.length = to;
    node.setValue(queue.length > 0 ? queue : null);
  }
  var self = this;
  node.forEachChild(function(childNode) {
    self.pruneCompletedTransactionsBelowNode_(childNode);
  });
};
fb.core.Repo.prototype.abortTransactions_ = function(path) {
  var affectedPath = this.getAncestorTransactionNode_(path).path();
  var transactionNode = this.transactionQueueTree_.subTree(path);
  var self = this;
  transactionNode.forEachAncestor(function(node) {
    self.abortTransactionsOnNode_(node);
  });
  this.abortTransactionsOnNode_(transactionNode);
  transactionNode.forEachDescendant(function(node) {
    self.abortTransactionsOnNode_(node);
  });
  return affectedPath;
};
fb.core.Repo.prototype.abortTransactionsOnNode_ = function(node) {
  var queue = node.getValue();
  if (queue !== null) {
    var callbacks = [];
    var events = [];
    var lastSent = -1;
    for (var i = 0;i < queue.length;i++) {
      if (queue[i].status === fb.core.TransactionStatus.SENT_NEEDS_ABORT) {
      } else {
        if (queue[i].status === fb.core.TransactionStatus.SENT) {
          fb.core.util.assert(lastSent === i - 1, "All SENT items should be at beginning of queue.");
          lastSent = i;
          queue[i].status = fb.core.TransactionStatus.SENT_NEEDS_ABORT;
          queue[i].abortReason = "set";
        } else {
          fb.core.util.assert(queue[i].status === fb.core.TransactionStatus.RUN, "Unexpected transaction status in abort");
          queue[i].unwatcher();
          events = events.concat(this.serverSyncTree_.ackUserWrite(queue[i].currentWriteId, true));
          if (queue[i].onComplete) {
            var snapshot = null;
            callbacks.push(goog.bind(queue[i].onComplete, null, new Error("set"), false, snapshot));
          }
        }
      }
    }
    if (lastSent === -1) {
      node.setValue(null);
    } else {
      queue.length = lastSent + 1;
    }
    this.eventQueue_.raiseEventsForChangedPath(node.path(), events);
    for (i = 0;i < callbacks.length;i++) {
      fb.core.util.exceptionGuard(callbacks[i]);
    }
  }
};
goog.provide("fb.core.RepoManager");
goog.require("fb.core.Repo");
goog.require("fb.core.Repo_transaction");
goog.require("fb.util.obj");
fb.core.RepoManager = goog.defineClass(null, {constructor:function() {
  this.repos_ = {};
  this.useRestClient_ = false;
}, interrupt:function() {
  for (var repo in this.repos_) {
    this.repos_[repo].interrupt();
  }
}, resume:function() {
  for (var repo in this.repos_) {
    this.repos_[repo].resume();
  }
}, getRepo:function(repoInfo) {
  var repoHashString = repoInfo.toString();
  var repo = fb.util.obj.get(this.repos_, repoHashString);
  if (!repo) {
    repo = new fb.core.Repo(repoInfo, this.useRestClient_);
    this.repos_[repoHashString] = repo;
  }
  return repo;
}, forceRestClient:function() {
  this.useRestClient_ = true;
}});
goog.addSingletonGetter(fb.core.RepoManager);
goog.exportProperty(fb.core.RepoManager.prototype, "interrupt", fb.core.RepoManager.prototype.interrupt);
goog.exportProperty(fb.core.RepoManager.prototype, "resume", fb.core.RepoManager.prototype.resume);
goog.provide("fb.api.OnDisconnect");
goog.require("fb.constants");
goog.require("fb.core.Repo");
goog.require("fb.core.util.validation");
goog.require("fb.util.validation");
fb.api.OnDisconnect = function(repo, path) {
  this.repo_ = repo;
  this.path_ = path;
};
fb.api.OnDisconnect.prototype.cancel = function(opt_onComplete) {
  fb.util.validation.validateArgCount("Firebase.onDisconnect().cancel", 0, 1, arguments.length);
  fb.util.validation.validateCallback("Firebase.onDisconnect().cancel", 1, opt_onComplete, true);
  this.repo_.onDisconnectCancel(this.path_, opt_onComplete || null);
};
goog.exportProperty(fb.api.OnDisconnect.prototype, "cancel", fb.api.OnDisconnect.prototype.cancel);
fb.api.OnDisconnect.prototype.remove = function(opt_onComplete) {
  fb.util.validation.validateArgCount("Firebase.onDisconnect().remove", 0, 1, arguments.length);
  fb.core.util.validation.validateWritablePath("Firebase.onDisconnect().remove", this.path_);
  fb.util.validation.validateCallback("Firebase.onDisconnect().remove", 1, opt_onComplete, true);
  this.repo_.onDisconnectSet(this.path_, null, opt_onComplete);
};
goog.exportProperty(fb.api.OnDisconnect.prototype, "remove", fb.api.OnDisconnect.prototype.remove);
fb.api.OnDisconnect.prototype.set = function(value, opt_onComplete) {
  fb.util.validation.validateArgCount("Firebase.onDisconnect().set", 1, 2, arguments.length);
  fb.core.util.validation.validateWritablePath("Firebase.onDisconnect().set", this.path_);
  fb.core.util.validation.validateFirebaseDataArg("Firebase.onDisconnect().set", 1, value, this.path_, false);
  fb.util.validation.validateCallback("Firebase.onDisconnect().set", 2, opt_onComplete, true);
  this.repo_.onDisconnectSet(this.path_, value, opt_onComplete);
};
goog.exportProperty(fb.api.OnDisconnect.prototype, "set", fb.api.OnDisconnect.prototype.set);
fb.api.OnDisconnect.prototype.setWithPriority = function(value, priority, opt_onComplete) {
  fb.util.validation.validateArgCount("Firebase.onDisconnect().setWithPriority", 2, 3, arguments.length);
  fb.core.util.validation.validateWritablePath("Firebase.onDisconnect().setWithPriority", this.path_);
  fb.core.util.validation.validateFirebaseDataArg("Firebase.onDisconnect().setWithPriority", 1, value, this.path_, false);
  fb.core.util.validation.validatePriority("Firebase.onDisconnect().setWithPriority", 2, priority, false);
  fb.util.validation.validateCallback("Firebase.onDisconnect().setWithPriority", 3, opt_onComplete, true);
  this.repo_.onDisconnectSetWithPriority(this.path_, value, priority, opt_onComplete);
};
goog.exportProperty(fb.api.OnDisconnect.prototype, "setWithPriority", fb.api.OnDisconnect.prototype.setWithPriority);
fb.api.OnDisconnect.prototype.update = function(objectToMerge, opt_onComplete) {
  fb.util.validation.validateArgCount("Firebase.onDisconnect().update", 1, 2, arguments.length);
  fb.core.util.validation.validateWritablePath("Firebase.onDisconnect().update", this.path_);
  if (goog.isArray(objectToMerge)) {
    var newObjectToMerge = {};
    for (var i = 0;i < objectToMerge.length;++i) {
      newObjectToMerge["" + i] = objectToMerge[i];
    }
    objectToMerge = newObjectToMerge;
    fb.core.util.warn("Passing an Array to Firebase.onDisconnect().update() is deprecated. Use set() if you want to overwrite the " + "existing data, or an Object with integer keys if you really do want to only update some of the children.");
  }
  fb.core.util.validation.validateFirebaseMergeDataArg("Firebase.onDisconnect().update", 1, objectToMerge, this.path_, false);
  fb.util.validation.validateCallback("Firebase.onDisconnect().update", 2, opt_onComplete, true);
  this.repo_.onDisconnectUpdate(this.path_, objectToMerge, opt_onComplete);
};
goog.exportProperty(fb.api.OnDisconnect.prototype, "update", fb.api.OnDisconnect.prototype.update);
goog.provide("fb.api.Query");
goog.require("fb.api.DataSnapshot");
goog.require("fb.core.snap");
goog.require("fb.core.util");
goog.require("fb.core.util.validation");
goog.require("fb.core.view.EventRegistration");
goog.require("fb.core.view.QueryParams");
goog.require("fb.util.json");
goog.require("fb.util.validation");
fb.api.Query = goog.defineClass(null, {constructor:function(repo, path, queryParams, orderByCalled) {
  this.repo = repo;
  this.path = path;
  this.queryParams_ = queryParams;
  this.orderByCalled_ = orderByCalled;
}, validateQueryEndpoints_:function(params) {
  var startNode = null;
  var endNode = null;
  if (params.hasStart()) {
    startNode = params.getIndexStartValue();
  }
  if (params.hasEnd()) {
    endNode = params.getIndexEndValue();
  }
  if (params.getIndex() === fb.core.snap.KeyIndex) {
    var tooManyArgsError = "Query: When ordering by key, you may only pass one argument to " + "startAt(), endAt(), or equalTo().";
    var wrongArgTypeError = "Query: When ordering by key, the argument passed to startAt(), endAt()," + "or equalTo() must be a string.";
    if (params.hasStart()) {
      var startName = params.getIndexStartName();
      if (startName != fb.core.util.MIN_NAME) {
        throw new Error(tooManyArgsError);
      } else {
        if (typeof startNode !== "string") {
          throw new Error(wrongArgTypeError);
        }
      }
    }
    if (params.hasEnd()) {
      var endName = params.getIndexEndName();
      if (endName != fb.core.util.MAX_NAME) {
        throw new Error(tooManyArgsError);
      } else {
        if (typeof endNode !== "string") {
          throw new Error(wrongArgTypeError);
        }
      }
    }
  } else {
    if (params.getIndex() === fb.core.snap.PriorityIndex) {
      if (startNode != null && !fb.core.util.validation.isValidPriority(startNode) || endNode != null && !fb.core.util.validation.isValidPriority(endNode)) {
        throw new Error("Query: When ordering by priority, the first argument passed to startAt(), " + "endAt(), or equalTo() must be a valid priority value (null, a number, or a string).");
      }
    } else {
      fb.core.util.assert(params.getIndex() instanceof fb.core.snap.PathIndex || params.getIndex() === fb.core.snap.ValueIndex, "unknown index type.");
      if (startNode != null && typeof startNode === "object" || endNode != null && typeof endNode === "object") {
        throw new Error("Query: First argument passed to startAt(), endAt(), or equalTo() cannot be " + "an object.");
      }
    }
  }
}, validateLimit_:function(params) {
  if (params.hasStart() && params.hasEnd() && params.hasLimit() && !params.hasAnchoredLimit()) {
    throw new Error("Query: Can't combine startAt(), endAt(), and limit(). Use limitToFirst() or limitToLast() instead.");
  }
}, validateNoPreviousOrderByCall_:function(fnName) {
  if (this.orderByCalled_ === true) {
    throw new Error(fnName + ": You can't combine multiple orderBy calls.");
  }
}, getQueryParams:function() {
  return this.queryParams_;
}, ref:function() {
  fb.util.validation.validateArgCount("Query.ref", 0, 0, arguments.length);
  return new Firebase(this.repo, this.path);
}, on:function(eventType, callback, cancelCallbackOrContext, context) {
  fb.util.validation.validateArgCount("Query.on", 2, 4, arguments.length);
  fb.core.util.validation.validateEventType("Query.on", 1, eventType, false);
  fb.util.validation.validateCallback("Query.on", 2, callback, false);
  var ret = this.getCancelAndContextArgs_("Query.on", cancelCallbackOrContext, context);
  if (eventType === "value") {
    this.onValueEvent(callback, ret.cancel, ret.context);
  } else {
    var callbacks = {};
    callbacks[eventType] = callback;
    this.onChildEvent(callbacks, ret.cancel, ret.context);
  }
  return callback;
}, onValueEvent:function(callback, cancelCallback, context) {
  var container = new fb.core.view.ValueEventRegistration(callback, cancelCallback || null, context || null);
  this.repo.addEventCallbackForQuery(this, container);
}, onChildEvent:function(callbacks, cancelCallback, context) {
  var container = new fb.core.view.ChildEventRegistration(callbacks, cancelCallback, context);
  this.repo.addEventCallbackForQuery(this, container);
}, off:function(eventType, callback, opt_context) {
  fb.util.validation.validateArgCount("Query.off", 0, 3, arguments.length);
  fb.core.util.validation.validateEventType("Query.off", 1, eventType, true);
  fb.util.validation.validateCallback("Query.off", 2, callback, true);
  fb.util.validation.validateContextObject("Query.off", 3, opt_context, true);
  var container = null;
  var callbacks = null;
  if (eventType === "value") {
    var valueCallback = (callback) || null;
    container = new fb.core.view.ValueEventRegistration(valueCallback, null, opt_context || null);
  } else {
    if (eventType) {
      if (callback) {
        callbacks = {};
        callbacks[eventType] = callback;
      }
      container = new fb.core.view.ChildEventRegistration(callbacks, null, opt_context || null);
    }
  }
  this.repo.removeEventCallbackForQuery(this, container);
}, once:function(eventType, userCallback) {
  fb.util.validation.validateArgCount("Query.once", 2, 4, arguments.length);
  fb.core.util.validation.validateEventType("Query.once", 1, eventType, false);
  fb.util.validation.validateCallback("Query.once", 2, userCallback, false);
  var ret = this.getCancelAndContextArgs_("Query.once", arguments[2], arguments[3]);
  var self = this, firstCall = true;
  var onceCallback = function(snapshot) {
    if (firstCall) {
      firstCall = false;
      self.off(eventType, onceCallback);
      goog.bind(userCallback, ret.context)(snapshot);
    }
  };
  this.on(eventType, onceCallback, function(err) {
    self.off(eventType, onceCallback);
    if (ret.cancel) {
      goog.bind(ret.cancel, ret.context)(err);
    }
  });
}, limit:function(limit) {
  fb.core.util.warn("Query.limit() being deprecated. " + "Please use Query.limitToFirst() or Query.limitToLast() instead.");
  fb.util.validation.validateArgCount("Query.limit", 1, 1, arguments.length);
  if (!goog.isNumber(limit) || Math.floor(limit) !== limit || limit <= 0) {
    throw new Error("Query.limit: First argument must be a positive integer.");
  }
  if (this.queryParams_.hasLimit()) {
    throw new Error("Query.limit: Limit was already set (by another call to limit, limitToFirst, or" + "limitToLast.");
  }
  var newParams = this.queryParams_.limit(limit);
  this.validateLimit_(newParams);
  return new fb.api.Query(this.repo, this.path, newParams, this.orderByCalled_);
}, limitToFirst:function(limit) {
  fb.util.validation.validateArgCount("Query.limitToFirst", 1, 1, arguments.length);
  if (!goog.isNumber(limit) || Math.floor(limit) !== limit || limit <= 0) {
    throw new Error("Query.limitToFirst: First argument must be a positive integer.");
  }
  if (this.queryParams_.hasLimit()) {
    throw new Error("Query.limitToFirst: Limit was already set (by another call to limit, " + "limitToFirst, or limitToLast).");
  }
  return new fb.api.Query(this.repo, this.path, this.queryParams_.limitToFirst(limit), this.orderByCalled_);
}, limitToLast:function(limit) {
  fb.util.validation.validateArgCount("Query.limitToLast", 1, 1, arguments.length);
  if (!goog.isNumber(limit) || Math.floor(limit) !== limit || limit <= 0) {
    throw new Error("Query.limitToLast: First argument must be a positive integer.");
  }
  if (this.queryParams_.hasLimit()) {
    throw new Error("Query.limitToLast: Limit was already set (by another call to limit, " + "limitToFirst, or limitToLast).");
  }
  return new fb.api.Query(this.repo, this.path, this.queryParams_.limitToLast(limit), this.orderByCalled_);
}, orderByChild:function(path) {
  fb.util.validation.validateArgCount("Query.orderByChild", 1, 1, arguments.length);
  if (path === "$key") {
    throw new Error('Query.orderByChild: "$key" is invalid.  Use Query.orderByKey() instead.');
  } else {
    if (path === "$priority") {
      throw new Error('Query.orderByChild: "$priority" is invalid.  Use Query.orderByPriority() instead.');
    } else {
      if (path === "$value") {
        throw new Error('Query.orderByChild: "$value" is invalid.  Use Query.orderByValue() instead.');
      }
    }
  }
  fb.core.util.validation.validatePathString("Query.orderByChild", 1, path, false);
  this.validateNoPreviousOrderByCall_("Query.orderByChild");
  var parsedPath = new fb.core.util.Path(path);
  if (parsedPath.isEmpty()) {
    throw new Error("Query.orderByChild: cannot pass in empty path.  Use Query.orderByValue() instead.");
  }
  var index = new fb.core.snap.PathIndex(parsedPath);
  var newParams = this.queryParams_.orderBy(index);
  this.validateQueryEndpoints_(newParams);
  return new fb.api.Query(this.repo, this.path, newParams, true);
}, orderByKey:function() {
  fb.util.validation.validateArgCount("Query.orderByKey", 0, 0, arguments.length);
  this.validateNoPreviousOrderByCall_("Query.orderByKey");
  var newParams = this.queryParams_.orderBy(fb.core.snap.KeyIndex);
  this.validateQueryEndpoints_(newParams);
  return new fb.api.Query(this.repo, this.path, newParams, true);
}, orderByPriority:function() {
  fb.util.validation.validateArgCount("Query.orderByPriority", 0, 0, arguments.length);
  this.validateNoPreviousOrderByCall_("Query.orderByPriority");
  var newParams = this.queryParams_.orderBy(fb.core.snap.PriorityIndex);
  this.validateQueryEndpoints_(newParams);
  return new fb.api.Query(this.repo, this.path, newParams, true);
}, orderByValue:function() {
  fb.util.validation.validateArgCount("Query.orderByValue", 0, 0, arguments.length);
  this.validateNoPreviousOrderByCall_("Query.orderByValue");
  var newParams = this.queryParams_.orderBy(fb.core.snap.ValueIndex);
  this.validateQueryEndpoints_(newParams);
  return new fb.api.Query(this.repo, this.path, newParams, true);
}, startAt:function(value, name) {
  fb.util.validation.validateArgCount("Query.startAt", 0, 2, arguments.length);
  fb.core.util.validation.validateFirebaseDataArg("Query.startAt", 1, value, this.path, true);
  fb.core.util.validation.validateKey("Query.startAt", 2, name, true);
  var newParams = this.queryParams_.startAt(value, name);
  this.validateLimit_(newParams);
  this.validateQueryEndpoints_(newParams);
  if (this.queryParams_.hasStart()) {
    throw new Error("Query.startAt: Starting point was already set (by another call to startAt " + "or equalTo).");
  }
  if (!goog.isDef(value)) {
    value = null;
    name = null;
  }
  return new fb.api.Query(this.repo, this.path, newParams, this.orderByCalled_);
}, endAt:function(value, name) {
  fb.util.validation.validateArgCount("Query.endAt", 0, 2, arguments.length);
  fb.core.util.validation.validateFirebaseDataArg("Query.endAt", 1, value, this.path, true);
  fb.core.util.validation.validateKey("Query.endAt", 2, name, true);
  var newParams = this.queryParams_.endAt(value, name);
  this.validateLimit_(newParams);
  this.validateQueryEndpoints_(newParams);
  if (this.queryParams_.hasEnd()) {
    throw new Error("Query.endAt: Ending point was already set (by another call to endAt or " + "equalTo).");
  }
  return new fb.api.Query(this.repo, this.path, newParams, this.orderByCalled_);
}, equalTo:function(value, name) {
  fb.util.validation.validateArgCount("Query.equalTo", 1, 2, arguments.length);
  fb.core.util.validation.validateFirebaseDataArg("Query.equalTo", 1, value, this.path, false);
  fb.core.util.validation.validateKey("Query.equalTo", 2, name, true);
  if (this.queryParams_.hasStart()) {
    throw new Error("Query.equalTo: Starting point was already set (by another call to endAt or " + "equalTo).");
  }
  if (this.queryParams_.hasEnd()) {
    throw new Error("Query.equalTo: Ending point was already set (by another call to endAt or " + "equalTo).");
  }
  return this.startAt(value, name).endAt(value, name);
}, toString:function() {
  fb.util.validation.validateArgCount("Query.toString", 0, 0, arguments.length);
  return this.repo.toString() + this.path.toUrlEncodedString();
}, queryObject:function() {
  return this.queryParams_.getQueryObject();
}, queryIdentifier:function() {
  var obj = this.queryObject();
  var id = fb.core.util.ObjectToUniqueKey(obj);
  return id === "{}" ? "default" : id;
}, getCancelAndContextArgs_:function(fnName, cancelOrContext, context) {
  var ret = {cancel:null, context:null};
  if (cancelOrContext && context) {
    ret.cancel = (cancelOrContext);
    fb.util.validation.validateCallback(fnName, 3, ret.cancel, true);
    ret.context = context;
    fb.util.validation.validateContextObject(fnName, 4, ret.context, true);
  } else {
    if (cancelOrContext) {
      if (typeof cancelOrContext === "object" && cancelOrContext !== null) {
        ret.context = cancelOrContext;
      } else {
        if (typeof cancelOrContext === "function") {
          ret.cancel = cancelOrContext;
        } else {
          throw new Error(fb.util.validation.errorPrefix(fnName, 3, true) + " must either be a cancel callback or a context object.");
        }
      }
    }
  }
  return ret;
}});
goog.exportProperty(fb.api.Query.prototype, "ref", fb.api.Query.prototype.ref);
goog.exportProperty(fb.api.Query.prototype, "on", fb.api.Query.prototype.on);
goog.exportProperty(fb.api.Query.prototype, "off", fb.api.Query.prototype.off);
goog.exportProperty(fb.api.Query.prototype, "once", fb.api.Query.prototype.once);
goog.exportProperty(fb.api.Query.prototype, "limit", fb.api.Query.prototype.limit);
goog.exportProperty(fb.api.Query.prototype, "limitToFirst", fb.api.Query.prototype.limitToFirst);
goog.exportProperty(fb.api.Query.prototype, "limitToLast", fb.api.Query.prototype.limitToLast);
goog.exportProperty(fb.api.Query.prototype, "orderByChild", fb.api.Query.prototype.orderByChild);
goog.exportProperty(fb.api.Query.prototype, "orderByKey", fb.api.Query.prototype.orderByKey);
goog.exportProperty(fb.api.Query.prototype, "orderByPriority", fb.api.Query.prototype.orderByPriority);
goog.exportProperty(fb.api.Query.prototype, "orderByValue", fb.api.Query.prototype.orderByValue);
goog.exportProperty(fb.api.Query.prototype, "startAt", fb.api.Query.prototype.startAt);
goog.exportProperty(fb.api.Query.prototype, "endAt", fb.api.Query.prototype.endAt);
goog.exportProperty(fb.api.Query.prototype, "equalTo", fb.api.Query.prototype.equalTo);
goog.exportProperty(fb.api.Query.prototype, "toString", fb.api.Query.prototype.toString);
goog.provide("fb.api.TEST_ACCESS");
goog.require("fb.core.PersistentConnection");
fb.api.TEST_ACCESS.DataConnection = fb.core.PersistentConnection;
goog.exportProperty(fb.api.TEST_ACCESS, "DataConnection", fb.api.TEST_ACCESS.DataConnection);
fb.core.PersistentConnection.prototype.simpleListen = function(pathString, onComplete) {
  this.sendRequest("q", {"p":pathString}, onComplete);
};
goog.exportProperty(fb.api.TEST_ACCESS.DataConnection.prototype, "simpleListen", fb.api.TEST_ACCESS.DataConnection.prototype.simpleListen);
fb.core.PersistentConnection.prototype.echo = function(data, onEcho) {
  this.sendRequest("echo", {"d":data}, onEcho);
};
goog.exportProperty(fb.api.TEST_ACCESS.DataConnection.prototype, "echo", fb.api.TEST_ACCESS.DataConnection.prototype.echo);
goog.exportProperty(fb.core.PersistentConnection.prototype, "interrupt", fb.core.PersistentConnection.prototype.interrupt);
fb.api.TEST_ACCESS.RealTimeConnection = fb.realtime.Connection;
goog.exportProperty(fb.api.TEST_ACCESS, "RealTimeConnection", fb.api.TEST_ACCESS.RealTimeConnection);
goog.exportProperty(fb.realtime.Connection.prototype, "sendRequest", fb.realtime.Connection.prototype.sendRequest);
goog.exportProperty(fb.realtime.Connection.prototype, "close", fb.realtime.Connection.prototype.close);
fb.api.TEST_ACCESS.hijackHash = function(newHash) {
  var oldPut = fb.core.PersistentConnection.prototype.put;
  fb.core.PersistentConnection.prototype.put = function(pathString, data, opt_onComplete, opt_hash) {
    if (goog.isDef(opt_hash)) {
      opt_hash = newHash();
    }
    oldPut.call(this, pathString, data, opt_onComplete, opt_hash);
  };
  return function() {
    fb.core.PersistentConnection.prototype.put = oldPut;
  };
};
goog.exportProperty(fb.api.TEST_ACCESS, "hijackHash", fb.api.TEST_ACCESS.hijackHash);
fb.api.TEST_ACCESS.ConnectionTarget = fb.core.RepoInfo;
goog.exportProperty(fb.api.TEST_ACCESS, "ConnectionTarget", fb.api.TEST_ACCESS.ConnectionTarget);
fb.api.TEST_ACCESS.queryIdentifier = function(query) {
  return query.queryIdentifier();
};
goog.exportProperty(fb.api.TEST_ACCESS, "queryIdentifier", fb.api.TEST_ACCESS.queryIdentifier);
fb.api.TEST_ACCESS.listens = function(firebaseRef) {
  return firebaseRef.repo.persistentConnection_.listens_;
};
goog.exportProperty(fb.api.TEST_ACCESS, "listens", fb.api.TEST_ACCESS.listens);
fb.api.TEST_ACCESS.forceRestClient = function(repoManager) {
  repoManager.forceRestClient();
};
goog.exportProperty(fb.api.TEST_ACCESS, "forceRestClient", fb.api.TEST_ACCESS.forceRestClient);
goog.provide("Firebase");
goog.require("fb.api.INTERNAL");
goog.require("fb.api.OnDisconnect");
goog.require("fb.api.Query");
goog.require("fb.api.TEST_ACCESS");
goog.require("fb.constants");
goog.require("fb.core.Repo");
goog.require("fb.core.RepoManager");
goog.require("fb.core.storage");
goog.require("fb.core.util");
goog.require("fb.core.util.nextPushId");
goog.require("fb.core.util.validation");
goog.require("goog.string");
Firebase = goog.defineClass(fb.api.Query, {constructor:function(urlOrRepo, pathOrContext) {
  var repo, path, repoManager;
  if (urlOrRepo instanceof fb.core.Repo) {
    repo = urlOrRepo;
    path = (pathOrContext);
  } else {
    fb.util.validation.validateArgCount("new Firebase", 1, 2, arguments.length);
    var parsedUrl = fb.core.util.parseRepoInfo(arguments[0]), repoInfo = parsedUrl.repoInfo;
    fb.core.util.validation.validateUrl("new Firebase", 1, parsedUrl);
    if (pathOrContext) {
      if (pathOrContext instanceof fb.core.RepoManager) {
        repoManager = (pathOrContext);
      } else {
        if (goog.isString(pathOrContext)) {
          repoManager = fb.core.RepoManager.getInstance();
          repoInfo.persistenceKey = pathOrContext;
        } else {
          throw new Error("Expected a valid Firebase.Context for second argument to new Firebase()");
        }
      }
    } else {
      repoManager = fb.core.RepoManager.getInstance();
    }
    repo = repoManager.getRepo(repoInfo);
    path = parsedUrl.path;
  }
  fb.api.Query.call(this, repo, path, fb.core.view.QueryParams.DEFAULT, false);
}, statics:{goOffline:function() {
  fb.util.validation.validateArgCount("Firebase.goOffline", 0, 0, arguments.length);
  fb.core.RepoManager.getInstance().interrupt();
}, goOnline:function() {
  fb.util.validation.validateArgCount("Firebase.goOnline", 0, 0, arguments.length);
  fb.core.RepoManager.getInstance().resume();
}, enableLogging:function(logger, persistent) {
  fb.core.util.assert(!persistent || (logger === true || logger === false), "Can't turn on custom loggers persistently.");
  if (logger === true) {
    if (typeof console !== "undefined") {
      if (typeof console.log === "function") {
        fb.core.util.logger = goog.bind(console.log, console);
      } else {
        if (typeof console.log === "object") {
          fb.core.util.logger = function(message) {
            console.log(message);
          };
        }
      }
    }
    if (persistent) {
      fb.core.storage.SessionStorage.set("logging_enabled", true);
    }
  } else {
    if (logger) {
      fb.core.util.logger = logger;
    } else {
      fb.core.util.logger = null;
      fb.core.storage.SessionStorage.remove("logging_enabled");
    }
  }
}, ServerValue:{"TIMESTAMP":{".sv":"timestamp"}}, SDK_VERSION:CLIENT_VERSION, INTERNAL:fb.api.INTERNAL, Context:fb.core.RepoManager, TEST_ACCESS:fb.api.TEST_ACCESS}, name:function() {
  fb.core.util.warn("Firebase.name() being deprecated. Please use Firebase.key() instead.");
  fb.util.validation.validateArgCount("Firebase.name", 0, 0, arguments.length);
  return this.key();
}, key:function() {
  fb.util.validation.validateArgCount("Firebase.key", 0, 0, arguments.length);
  if (this.path.isEmpty()) {
    return null;
  } else {
    return this.path.getBack();
  }
}, child:function(pathString) {
  fb.util.validation.validateArgCount("Firebase.child", 1, 1, arguments.length);
  if (goog.isNumber(pathString)) {
    pathString = String(pathString);
  } else {
    if (!(pathString instanceof fb.core.util.Path)) {
      if (this.path.getFront() === null) {
        fb.core.util.validation.validateRootPathString("Firebase.child", 1, pathString, false);
      } else {
        fb.core.util.validation.validatePathString("Firebase.child", 1, pathString, false);
      }
    }
  }
  return new Firebase(this.repo, this.path.child(pathString));
}, parent:function() {
  fb.util.validation.validateArgCount("Firebase.parent", 0, 0, arguments.length);
  var parentPath = this.path.parent();
  return parentPath === null ? null : new Firebase(this.repo, parentPath);
}, root:function() {
  fb.util.validation.validateArgCount("Firebase.ref", 0, 0, arguments.length);
  var ref = this;
  while (ref.parent() !== null) {
    ref = ref.parent();
  }
  return ref;
}, set:function(newVal, onComplete) {
  fb.util.validation.validateArgCount("Firebase.set", 1, 2, arguments.length);
  fb.core.util.validation.validateWritablePath("Firebase.set", this.path);
  fb.core.util.validation.validateFirebaseDataArg("Firebase.set", 1, newVal, this.path, false);
  fb.util.validation.validateCallback("Firebase.set", 2, onComplete, true);
  this.repo.setWithPriority(this.path, newVal, null, onComplete || null);
}, update:function(objectToMerge, onComplete) {
  fb.util.validation.validateArgCount("Firebase.update", 1, 2, arguments.length);
  fb.core.util.validation.validateWritablePath("Firebase.update", this.path);
  if (goog.isArray(objectToMerge)) {
    var newObjectToMerge = {};
    for (var i = 0;i < objectToMerge.length;++i) {
      newObjectToMerge["" + i] = objectToMerge[i];
    }
    objectToMerge = newObjectToMerge;
    fb.core.util.warn("Passing an Array to Firebase.update() is deprecated. " + "Use set() if you want to overwrite the existing data, or " + "an Object with integer keys if you really do want to " + "only update some of the children.");
  }
  fb.core.util.validation.validateFirebaseMergeDataArg("Firebase.update", 1, objectToMerge, this.path, false);
  fb.util.validation.validateCallback("Firebase.update", 2, onComplete, true);
  this.repo.update(this.path, objectToMerge, onComplete || null);
}, setWithPriority:function(newVal, newPriority, onComplete) {
  fb.util.validation.validateArgCount("Firebase.setWithPriority", 2, 3, arguments.length);
  fb.core.util.validation.validateWritablePath("Firebase.setWithPriority", this.path);
  fb.core.util.validation.validateFirebaseDataArg("Firebase.setWithPriority", 1, newVal, this.path, false);
  fb.core.util.validation.validatePriority("Firebase.setWithPriority", 2, newPriority, false);
  fb.util.validation.validateCallback("Firebase.setWithPriority", 3, onComplete, true);
  if (this.key() === ".length" || this.key() === ".keys") {
    throw "Firebase.setWithPriority failed: " + this.key() + " is a read-only object.";
  }
  this.repo.setWithPriority(this.path, newVal, newPriority, onComplete || null);
}, remove:function(onComplete) {
  fb.util.validation.validateArgCount("Firebase.remove", 0, 1, arguments.length);
  fb.core.util.validation.validateWritablePath("Firebase.remove", this.path);
  fb.util.validation.validateCallback("Firebase.remove", 1, onComplete, true);
  this.set(null, onComplete);
}, transaction:function(transactionUpdate, onComplete, applyLocally) {
  fb.util.validation.validateArgCount("Firebase.transaction", 1, 3, arguments.length);
  fb.core.util.validation.validateWritablePath("Firebase.transaction", this.path);
  fb.util.validation.validateCallback("Firebase.transaction", 1, transactionUpdate, false);
  fb.util.validation.validateCallback("Firebase.transaction", 2, onComplete, true);
  fb.core.util.validation.validateBoolean("Firebase.transaction", 3, applyLocally, true);
  if (this.key() === ".length" || this.key() === ".keys") {
    throw "Firebase.transaction failed: " + this.key() + " is a read-only object.";
  }
  if (typeof applyLocally === "undefined") {
    applyLocally = true;
  }
  this.repo.startTransaction(this.path, transactionUpdate, onComplete || null, applyLocally);
}, setPriority:function(priority, opt_onComplete) {
  fb.util.validation.validateArgCount("Firebase.setPriority", 1, 2, arguments.length);
  fb.core.util.validation.validateWritablePath("Firebase.setPriority", this.path);
  fb.core.util.validation.validatePriority("Firebase.setPriority", 1, priority, false);
  fb.util.validation.validateCallback("Firebase.setPriority", 2, opt_onComplete, true);
  this.repo.setWithPriority(this.path.child(".priority"), priority, null, opt_onComplete);
}, push:function(value, onComplete) {
  fb.util.validation.validateArgCount("Firebase.push", 0, 2, arguments.length);
  fb.core.util.validation.validateWritablePath("Firebase.push", this.path);
  fb.core.util.validation.validateFirebaseDataArg("Firebase.push", 1, value, this.path, true);
  fb.util.validation.validateCallback("Firebase.push", 2, onComplete, true);
  var now = this.repo.serverTime();
  var name = fb.core.util.nextPushId(now);
  var pushedRef = this.child(name);
  if (typeof value !== "undefined" && value !== null) {
    pushedRef.set(value, onComplete);
  }
  return pushedRef;
}, onDisconnect:function() {
  fb.core.util.validation.validateWritablePath("Firebase.onDisconnect", this.path);
  return new fb.api.OnDisconnect(this.repo, this.path);
}, auth:function(cred, opt_onComplete, opt_onCancel) {
  fb.core.util.warn("FirebaseRef.auth() being deprecated. " + "Please use FirebaseRef.authWithCustomToken() instead.");
  fb.util.validation.validateArgCount("Firebase.auth", 1, 3, arguments.length);
  fb.core.util.validation.validateCredential("Firebase.auth", 1, cred, false);
  fb.util.validation.validateCallback("Firebase.auth", 2, opt_onComplete, true);
  fb.util.validation.validateCallback("Firebase.auth", 3, opt_onComplete, true);
  var clientOptions = {};
  clientOptions[fb.login.Constants.CLIENT_OPTION_SESSION_PERSISTENCE] = "none";
  this.repo.auth.authenticate(cred, {}, clientOptions, opt_onComplete, opt_onCancel);
}, unauth:function(opt_onComplete) {
  fb.util.validation.validateArgCount("Firebase.unauth", 0, 1, arguments.length);
  fb.util.validation.validateCallback("Firebase.unauth", 1, opt_onComplete, true);
  this.repo.auth.unauthenticate(opt_onComplete);
}, getAuth:function() {
  fb.util.validation.validateArgCount("Firebase.getAuth", 0, 0, arguments.length);
  return this.repo.auth.getAuth();
}, onAuth:function(callback, opt_context) {
  fb.util.validation.validateArgCount("Firebase.onAuth", 1, 2, arguments.length);
  fb.util.validation.validateCallback("Firebase.onAuth", 1, callback, false);
  fb.util.validation.validateContextObject("Firebase.onAuth", 2, opt_context, true);
  this.repo.auth.on("auth_status", callback, opt_context);
}, offAuth:function(callback, opt_context) {
  fb.util.validation.validateArgCount("Firebase.offAuth", 1, 2, arguments.length);
  fb.util.validation.validateCallback("Firebase.offAuth", 1, callback, false);
  fb.util.validation.validateContextObject("Firebase.offAuth", 2, opt_context, true);
  this.repo.auth.off("auth_status", callback, opt_context);
}, authWithCustomToken:function(token, onComplete, opt_options) {
  fb.util.validation.validateArgCount("Firebase.authWithCustomToken", 2, 3, arguments.length);
  fb.core.util.validation.validateCredential("Firebase.authWithCustomToken", 1, token, false);
  fb.util.validation.validateCallback("Firebase.authWithCustomToken", 2, onComplete, false);
  fb.core.util.validation.validateObject("Firebase.authWithCustomToken", 3, opt_options, true);
  this.repo.auth.authenticate(token, {}, opt_options || {}, onComplete);
}, authWithOAuthPopup:function(provider, onComplete, opt_options) {
  fb.util.validation.validateArgCount("Firebase.authWithOAuthPopup", 2, 3, arguments.length);
  fb.core.util.validation.validateAuthProvider("Firebase.authWithOAuthPopup", 1, provider, false);
  fb.util.validation.validateCallback("Firebase.authWithOAuthPopup", 2, onComplete, false);
  fb.core.util.validation.validateObject("Firebase.authWithOAuthPopup", 3, opt_options, true);
  this.repo.auth.authWithPopup(provider, opt_options, onComplete);
}, authWithOAuthRedirect:function(provider, onErr, opt_options) {
  fb.util.validation.validateArgCount("Firebase.authWithOAuthRedirect", 2, 3, arguments.length);
  fb.core.util.validation.validateAuthProvider("Firebase.authWithOAuthRedirect", 1, provider, false);
  fb.util.validation.validateCallback("Firebase.authWithOAuthRedirect", 2, onErr, false);
  fb.core.util.validation.validateObject("Firebase.authWithOAuthRedirect", 3, opt_options, true);
  this.repo.auth.authWithRedirect(provider, opt_options, onErr);
}, authWithOAuthToken:function(provider, params, onComplete, opt_options) {
  fb.util.validation.validateArgCount("Firebase.authWithOAuthToken", 3, 4, arguments.length);
  fb.core.util.validation.validateAuthProvider("Firebase.authWithOAuthToken", 1, provider, false);
  fb.util.validation.validateCallback("Firebase.authWithOAuthToken", 3, onComplete, false);
  fb.core.util.validation.validateObject("Firebase.authWithOAuthToken", 4, opt_options, true);
  if (goog.isString(params)) {
    fb.core.util.validation.validateString("Firebase.authWithOAuthToken", 2, params, false);
    this.repo.auth.authWithCredential(provider + "/token", {"access_token":params}, opt_options, onComplete);
  } else {
    fb.core.util.validation.validateObject("Firebase.authWithOAuthToken", 2, params, false);
    this.repo.auth.authWithCredential(provider + "/token", params, opt_options, onComplete);
  }
}, authAnonymously:function(onComplete, opt_options) {
  fb.util.validation.validateArgCount("Firebase.authAnonymously", 1, 2, arguments.length);
  fb.util.validation.validateCallback("Firebase.authAnonymously", 1, onComplete, false);
  fb.core.util.validation.validateObject("Firebase.authAnonymously", 2, opt_options, true);
  this.repo.auth.authWithCredential("anonymous", {}, opt_options, onComplete);
}, authWithPassword:function(params, onComplete, opt_options) {
  fb.util.validation.validateArgCount("Firebase.authWithPassword", 2, 3, arguments.length);
  fb.core.util.validation.validateObject("Firebase.authWithPassword", 1, params, false);
  fb.core.util.validation.validateObjectContainsKey("Firebase.authWithPassword", 1, params, "email", false, "string");
  fb.core.util.validation.validateObjectContainsKey("Firebase.authWithPassword", 1, params, "password", false, "string");
  fb.util.validation.validateCallback("Firebase.authWithPassword", 2, onComplete, false);
  fb.core.util.validation.validateObject("Firebase.authWithPassword", 3, opt_options, true);
  this.repo.auth.authWithCredential("password", params, opt_options, onComplete);
}, createUser:function(params, onComplete) {
  fb.util.validation.validateArgCount("Firebase.createUser", 2, 2, arguments.length);
  fb.core.util.validation.validateObject("Firebase.createUser", 1, params, false);
  fb.core.util.validation.validateObjectContainsKey("Firebase.createUser", 1, params, "email", false, "string");
  fb.core.util.validation.validateObjectContainsKey("Firebase.createUser", 1, params, "password", false, "string");
  fb.util.validation.validateCallback("Firebase.createUser", 2, onComplete, false);
  this.repo.auth.createUser(params, onComplete);
}, removeUser:function(params, onComplete) {
  fb.util.validation.validateArgCount("Firebase.removeUser", 2, 2, arguments.length);
  fb.core.util.validation.validateObject("Firebase.removeUser", 1, params, false);
  fb.core.util.validation.validateObjectContainsKey("Firebase.removeUser", 1, params, "email", false, "string");
  fb.core.util.validation.validateObjectContainsKey("Firebase.removeUser", 1, params, "password", false, "string");
  fb.util.validation.validateCallback("Firebase.removeUser", 2, onComplete, false);
  this.repo.auth.removeUser(params, onComplete);
}, changePassword:function(params, onComplete) {
  fb.util.validation.validateArgCount("Firebase.changePassword", 2, 2, arguments.length);
  fb.core.util.validation.validateObject("Firebase.changePassword", 1, params, false);
  fb.core.util.validation.validateObjectContainsKey("Firebase.changePassword", 1, params, "email", false, "string");
  fb.core.util.validation.validateObjectContainsKey("Firebase.changePassword", 1, params, "oldPassword", false, "string");
  fb.core.util.validation.validateObjectContainsKey("Firebase.changePassword", 1, params, "newPassword", false, "string");
  fb.util.validation.validateCallback("Firebase.changePassword", 2, onComplete, false);
  this.repo.auth.changePassword(params, onComplete);
}, changeEmail:function(params, onComplete) {
  fb.util.validation.validateArgCount("Firebase.changeEmail", 2, 2, arguments.length);
  fb.core.util.validation.validateObject("Firebase.changeEmail", 1, params, false);
  fb.core.util.validation.validateObjectContainsKey("Firebase.changeEmail", 1, params, "oldEmail", false, "string");
  fb.core.util.validation.validateObjectContainsKey("Firebase.changeEmail", 1, params, "newEmail", false, "string");
  fb.core.util.validation.validateObjectContainsKey("Firebase.changeEmail", 1, params, "password", false, "string");
  fb.util.validation.validateCallback("Firebase.changeEmail", 2, onComplete, false);
  this.repo.auth.changeEmail(params, onComplete);
}, resetPassword:function(params, onComplete) {
  fb.util.validation.validateArgCount("Firebase.resetPassword", 2, 2, arguments.length);
  fb.core.util.validation.validateObject("Firebase.resetPassword", 1, params, false);
  fb.core.util.validation.validateObjectContainsKey("Firebase.resetPassword", 1, params, "email", false, "string");
  fb.util.validation.validateCallback("Firebase.resetPassword", 2, onComplete, false);
  this.repo.auth.resetPassword(params, onComplete);
}});
if (NODE_CLIENT) {
  module["exports"] = Firebase;
}
;
  }
  ns.wrapper(ns.goog, ns.fb);
}({goog:{}, fb:{}}));

