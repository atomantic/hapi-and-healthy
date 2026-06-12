'use strict'

// Small owned replacements for the handful of lodash helpers this package used
// (_.merge, _.cloneDeep, _.last). Kept intentionally minimal and matched to the
// actual call sites: config objects that mix plain objects/arrays with function
// values (test hooks), which is why structuredClone is unsuitable here.

// Returns true for plain objects and arrays — the only containers we recurse
// into. Functions, Promises, Dates, null, and primitives are treated as leaves
// and passed through by reference (matching lodash's behavior for our usage).
function isPlainContainer (value) {
    if (value === null || typeof value !== 'object') return false
    if (Array.isArray(value)) return true
    const proto = Object.getPrototypeOf(value)
    return proto === Object.prototype || proto === null
}

// Recursive deep merge of source onto target, mutating and returning target —
// the same contract index.js relied on from _.merge(config, opts). Arrays and
// non-plain values from source replace the target value rather than being
// deep-merged element-by-element, which is sufficient for the config shapes
// this plugin merges (and avoids lodash's surprising array-index merge).
function merge (target, source) {
    if (!isPlainContainer(source)) return source
    for (const key of Object.keys(source)) {
        const sourceVal = source[key]
        const targetVal = target[key]
        if (isPlainContainer(sourceVal) && !Array.isArray(sourceVal) &&
            isPlainContainer(targetVal) && !Array.isArray(targetVal)) {
            merge(targetVal, sourceVal)
        } else {
            target[key] = sourceVal
        }
    }
    return target
}

// Deep clone of plain objects/arrays. Function values (test hooks live in the
// config) and other non-plain values are shared by reference, matching how the
// tests use the cloned config.
function cloneDeep (value) {
    if (!isPlainContainer(value)) return value
    if (Array.isArray(value)) return value.map(cloneDeep)
    const out = {}
    for (const key of Object.keys(value)) {
        out[key] = cloneDeep(value[key])
    }
    return out
}

// Last element of an array (or array-like). Mirrors _.last for our call sites,
// which only ever pass the result of String.prototype.split.
function last (arr) {
    if (arr == null || arr.length === 0) return undefined
    return arr[arr.length - 1]
}

module.exports = { merge, cloneDeep, last }
