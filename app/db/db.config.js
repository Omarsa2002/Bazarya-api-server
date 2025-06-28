const CONFIG = require("../../config/config");
const username = CONFIG.DB_USER;
const password = CONFIG.DB_PASSWORD;
const cluster = CONFIG.DB_CLUSTER;
const db_name = CONFIG.DB_NAME;

module.exports = {
  url: `mongodb+srv://${username}:${password}@${cluster}.mongodb.net/${db_name}?retryWrites=true&w=majority`,
};