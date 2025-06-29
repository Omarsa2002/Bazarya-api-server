class customError extends Error {
    constructor(message, data) {
      super(message);
      this.arguments = data;
      // assign the error class name in your custom error (as a shortcut)
      this.name = this.constructor.name;
    }
}
module.exports = customError;