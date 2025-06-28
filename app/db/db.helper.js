const { v4: uuidv4 } = require('uuid');

const addPrefixedIdPlugin = function (schema, options) {
  const { prefix, field } = options;

  schema.add({ [field]: { type: String } }); // Dynamically add the field

  // Pre-save middleware to automatically add or modify ID before saving
  schema.pre('save', function (next) {
    if (!this[field]) { // Check if the field is not set
      this[field] = prefix + uuidv4(); // Generate a prefixed UUID
    }
    next();
  });
};

module.exports = addPrefixedIdPlugin;
