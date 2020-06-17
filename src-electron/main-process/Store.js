const path = require("path");
const fs = require("fs");
const { app } = require("electron");
export default class Store {
  constructor(opts) {
    const userDataPath = opts.userDataPath;
    this.path = path.join(userDataPath, opts.configName + ".json");
    this.defaults = opts.defaults;
    this.data = this.parseDataFile(this.path, opts.defaults);
  }

  get(key) {
    return this.data[key];
  }
  set(key, val) {
    this.data[key] = val;
    fs.writeFileSync(this.path, JSON.stringify(this.data));
  }
  parseDataFile() {
    // We'll try/catch it in case the file doesn't exist yet, which will be the case on the first application run.
    // `fs.readFileSync` will return a JSON string which we then parse into a Javascript object
    try {
      return JSON.parse(fs.readFileSync(this.filePath));
    } catch (error) {
      // if there was some kind of error, return the passed in defaults instead.
      return this.defaults;
    }
  }
}
