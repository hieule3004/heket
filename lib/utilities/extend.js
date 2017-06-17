

/**
 * Extends one object with the properties of another.
 *
 * @param   {object} target
 * @param   {object} source
 * @returns {object}
 */
function extend(target, source) {
	var key;

	for (key in source) {
		target[key] = source[key];
	}

	return target;
}

module.exports = extend;
