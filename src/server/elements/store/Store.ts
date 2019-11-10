import { StoreEvolution } from "./StoreEvolution";
const mongoose = require("mongoose");

export enum QueryType {
  INCLUDE = "inlcude",
  EXCLUDE = "exclude",
  IGNORE = "ignore"
}

export class Store {
  public static IGNORE_NUMBER: number = -1;

  private static RECONNECT_AFTER_MS = 20000;
  private static RECONNECT_MAX_TRIES = 10;
  private static MSG_CLEAR_CACHE: string = "clearCache";

  public static isTest: boolean = false;

  private static onClearCache;

  public reconnect: boolean;
  public mongoDbUri;
  public reconnectedTries = 0;
  public reconnectTimer;
  public ModelEvolution;

  constructor() {}

  public static getEntryId(entry): any {
    if (!entry) return null;
    if (entry._id) entry = entry._id;
    entry = entry.toString();
    return entry;
  }

  public static async createOrGetRef(instance: any, propertyName, createNew: () => Promise<any>, findById: (id) => Promise<any>): Promise<any> {
    if (!instance[propertyName]) {
      let newInstance = await createNew();
      instance[propertyName] = newInstance._id;
      await instance.save();
      return newInstance;
    }

    if (instance[propertyName]._id) return instance[propertyName];
    instance[propertyName] = await findById(instance[propertyName]);
    return instance[propertyName];
  }

  public static async generateKey(_id, initialKey, findByKey: (key) => Promise<any>, accentsToLatin: (text: string) => string, generateRandomString: (textLength: number) => string): Promise<string> {
    let key = "";

    if (initialKey) {
      key = initialKey.toLowerCase();
    } else {
      let defaultKeyLength = 12;
      key = generateRandomString(defaultKeyLength);
    }

    // Include user data
    key = accentsToLatin(key);
    key = key.replace(/[.,;:\s]/g, "-").replace(/[^A-Z0-9\-_]/gi, "");

    let currentId = null;
    if (_id) currentId = _id.toString();

    // Check for already existing user with this key
    try {
      let addedDash = false;
      let isDuplicate = true;
      let keyBase = key;
      let anotherNumber = 0;

      while (isDuplicate) {
        let entryWithSameKey = await findByKey(key);
        isDuplicate = (!currentId && !!entryWithSameKey) || (currentId && !!entryWithSameKey && entryWithSameKey._id.toString() !== currentId);
        if (!isDuplicate) break;

        if (!addedDash) {
          addedDash = true;
          keyBase = key + "-";
        }
        key = keyBase + anotherNumber;
        anotherNumber++;
      }
    } catch (exception) {
      console.error("couldn't check if there is already user with this key. " + exception);
    }

    return key;
  }

  public init(mongoDbUri: string, reconnect: boolean, callback: () => void) {
    const self = this;
    this.reconnect = reconnect;
    this.reconnectedTries = 0;
    this.mongoDbUri = mongoDbUri;
    mongoose.Promise = global.Promise;

    if (mongoDbUri.indexOf("mongodb://") < 0) {
      // Tests
      Store.isTest = true;
      let Mockgoose = require("mockgoose").Mockgoose;
      let mockgoose = new Mockgoose(mongoose);

      mockgoose.prepareStorage().then(function() {
        self.setupConnection(callback);
      });
    } else {
      // Development or production
      this.setupConnection(callback);
    }
  }

  public static clearCache() {
    if (!!process.send) {
      process.send({
        task: Store.MSG_CLEAR_CACHE
      });
    } else {
      if (Store.onClearCache) Store.onClearCache();
    }
  }

  public onClearCache(onClearCache: () => void) {
    Store.onClearCache = onClearCache;
    process.on("message", function(msg) {
      if (msg.task === Store.MSG_CLEAR_CACHE) {
        if (Store.onClearCache) Store.onClearCache();
      }
    });
  }

  private setupConnection(callback) {
    const self = this;

    this.connectToMongoDb();

    // Set connection
    let db = mongoose.connection;

    db.on("error", console.error.bind(console, "connection error:"));
    db.once("open", function() {
      // We're connected!
      console.log("Mongoose connection is open");

      // Set models
      self.ModelEvolution = StoreEvolution.generate(mongoose);
      callback();
    });

    db.on("connected", function() {
      console.log("Mongoose default connection open to " + self.mongoDbUri);
    });

    db.on("error", function(err) {
      console.log("Mongoose default connection error: " + err);
      mongoose.disconnect();

      if (self.reconnectedTries >= Store.RECONNECT_MAX_TRIES) return;
      if (!self.reconnect) return;

      self.reconnectTimer = setTimeout(() => {
        self.connectToMongoDb();
        self.reconnectedTries++;
      }, Store.RECONNECT_AFTER_MS);
    });

    db.on("disconnected", function() {
      console.log("Mongoose default connection disconnected");
    });

    // If the Node process ends, close the Mongoose connection
    process.on("SIGINT", function() {
      db.close(function() {
        console.log("Mongoose default connection disconnected through app termination");
        if (self.reconnectTimer) clearTimeout(self.reconnectTimer);
        process.exit(0);
      });
    });
  }

  public updateDbVersion(newVersion: number, description: string, onDbVersionChangedCallback: (currentVersion: number) => Promise<any>): Promise<any> {
    const self = this;

    return new Promise(async (resolve, reject) => {
      self.ModelEvolution.findOne({}, null, { sort: { date: -1 } }, async function(err, evolution) {
        let dbVersionChanged: boolean = false;

        if (err) {
          console.error("Error on checking current database version: " + err);
          return resolve();
        }
        if (!evolution) {
          // First version
          dbVersionChanged = true;
          console.log("Initial database created. Scheme ver.: " + newVersion);
          await onDbVersionChangedCallback(newVersion);
        } else {
          let currentVersion: number = evolution.number;
          if (currentVersion < newVersion) {
            dbVersionChanged = true;
            console.log("Database version changed: " + currentVersion + " -> " + newVersion);
            await onDbVersionChangedCallback(currentVersion);
          }
        }

        if (dbVersionChanged) {
          // Set new database version
          let evolution = new self.ModelEvolution({
            number: newVersion,
            comments: description,
            date: new Date()
          });
          await evolution.save();
        }

        return resolve();
      });
    });
  }

  private connectToMongoDb() {
    mongoose.connect(this.mongoDbUri, {
      useMongoClient: true
    });
  }
}
