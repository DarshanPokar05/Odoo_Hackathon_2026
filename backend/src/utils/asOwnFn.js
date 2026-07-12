/**
 * Utility functions for AssetFlow tag generation and formatting
 */

/**
 * Generates an asset tag in the format AF-XXXX or custom prefix
 * @param {string} prefix - Optional prefix (default 'AF')
 * @param {number} sequenceNumber - Sequential number
 * @returns {string} - Formatted asset tag (e.g. 'AF-1042')
 */
function generateAssetTag(sequenceNumber, prefix = 'AF') {
  const padded = String(sequenceNumber).padStart(4, '0');
  return `${prefix.toUpperCase()}-${padded}`;
}

/**
 * Validates whether a tag string matches the expected AssetFlow format
 * @param {string} tag
 * @returns {boolean}
 */
function isValidAssetTag(tag) {
  return /^[A-Z]{2,4}-\d{4,}$/.test(tag);
}

module.exports = {
  generateAssetTag,
  isValidAssetTag,
};
