import { AppListener } from "../main/AppListener";
import { Store } from "../../elements/store/Store";

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const hbs = require("hbs");

export enum ViewType {
  PAGE = "page",
  VIEW = "view",
  JSON = "json"
}

export class StoreView {
  private static instance;
  private static cache;
  private static cacheCompiled;

  public viewPaths: Array<string>;

  public static getInstance(viewPaths: Array<string> = []) {
    if (!StoreView.instance) {
      StoreView.instance = StoreView.createInstance();
    }

    if (viewPaths && viewPaths.length > 0) {
      StoreView.instance.viewPaths = viewPaths;
    }

    return StoreView.instance;
  }

  private static createInstance(): any {
    const schema = new mongoose.Schema(
      {
        order: Number,
        key: String,
        title: String,
        description: String,
        keywords: String,
        defaultView: String,
        viewData: String,
        type: {
          type: String,
          enum: [ViewType.PAGE, ViewType.VIEW, ViewType.JSON],
          default: ViewType.PAGE
        }
      },
      { timestamps: true, usePushEach: true }
    );

    schema.methods.getContent = function(): any {
      if (this.type === ViewType.JSON) {
        return this.getContentJson();
      } else {
        if (this.viewData && this.viewData.length > 0) {
          return this.viewData;
        }
      }

      return this.getInitialContent();
    };

    schema.methods.getContentJson = function(): any {
      return StoreView.loadContentJson(this.key);
    };

    schema.methods.getContentJsonValue = function(key, parameters: Array<string> = []): any {
      let contentJson = this.getContentJson();
      let value = contentJson[key];
      if (!!value && value.length > 0 && !!parameters && parameters.length > 0) {
        for (let parameter of parameters) {
          value = value.replace("@@@", parameter);
        }
      }
      return value;
    };

    schema.methods.getInitialContent = function(): any {
      if (this.type === ViewType.JSON) {
        return StoreView.loadContentJson(this.key);
      }

      let content = "";
      let viewPaths = StoreView.getInstance().viewPaths;
      for (let viewPath of viewPaths) {
        viewPath = viewPath + path.sep + this.defaultView + ".hbs";

        if (fs.existsSync(viewPath)) {
          content = fs.readFileSync(viewPath, "utf8");
          return content;
        }
      }

      AppListener.onError("Couldn't load view", "Couldn't load view: " + this.key + ". It wasn't found! ");
      return "";
    };

    schema.methods.didInitialContentChanged = function(viewDataNew): any {
      if (this.type === ViewType.JSON) return true;
      if (!viewDataNew) return true;
      viewDataNew = viewDataNew.replace(/[\r\n]+/g, "");

      let initialContent = this.getInitialContent();
      initialContent = initialContent.replace(/[\r\n]+/g, "");

      let isDifferent = initialContent !== viewDataNew;

      return isDifferent;
    };

    schema.methods.getContentJsonText = function(): string {
      let contentJson = this.getContentJson();
      if (!contentJson) return "";
      if (typeof contentJson !== "string") {
        contentJson = JSON.stringify(contentJson);
      }
      return contentJson;
    };

    schema.pre("save", function save(next) {
      this.keywords = "";
      if (this.title) {
        this.keywords = StoreView.generateKeywords(this.title);
      }

      StoreView.clearCache();
      Store.clearCache();

      return next();
    });

    StoreView.clearCache();

    const instance = mongoose.model("View", schema);
    return instance;
  }

  public static clearCache() {
    StoreView.cache = [];
    StoreView.cacheCompiled = [];
  }

  public static async createWithNextOrder(key: string, type: ViewType, title: string = "", description: string = "", defaultView: string = ""): Promise<any> {
    let order = await StoreView.getAllCount();
    return StoreView.create(order, key, type, title, description, defaultView);
  }

  public static create(order: number, key: string, type: ViewType, title: string = "", description: string = "", defaultView: string = ""): Promise<any> {
    return new Promise(async (resolve, reject) => {
      key = key.toLowerCase();

      if (!defaultView || defaultView.length === 0) defaultView = key;

      // Calculate files MD5
      let existing = await StoreView.getInstance()
        .findOne({ key: key })
        .exec();
      if (existing) {
        console.error("View with key " + key + " already exist.");
        return resolve(existing);
      }

      // Create new file
      let View = StoreView.getInstance();
      let view = new View({
        order: order,
        key: key,
        type: type,
        title: title,
        description: description,
        defaultView: defaultView
      });

      view = await view.save();
      return resolve(view);
    });
  }

  public static loadContentJson(contentViewName: string): string {
    let content = "";
    let viewPaths = StoreView.getInstance().viewPaths;
    for (let viewPath of viewPaths) {
      viewPath = viewPath + path.sep + contentViewName + ".json";

      try {
        if (fs.existsSync(viewPath)) {
          content = fs.readFileSync(viewPath, "utf8");
          content = JSON.parse(content);
          return content;
        }
      } catch (err) {
        AppListener.onError("Couldn't render view", "Error on rendering: " + contentViewName + ". " + err);
      }
    }

    StoreView.findByKey(contentViewName).then(view => {
      if (view && view.type === ViewType.JSON) {
        AppListener.onError("Couldn't load JSON", "Couldn't load JSON: " + contentViewName + ". It wasn't found! ");
      }
    });

    return "";
  }

  public static async getTemplateCompiled(viewName: string): Promise<any> {
    let cacheKey = viewName;
    if (StoreView.cacheCompiled[cacheKey] && StoreView.cacheCompiled[cacheKey].length > 0) {
      return StoreView.cacheCompiled[cacheKey];
    }

    let view = await StoreView.findByKey(viewName);
    if (!view) {
      AppListener.onError("View wasn't found", "View " + viewName + " could not be found!");
      return null;
    }
    let template = hbs.compile(view.getContent());
    StoreView.cacheCompiled[cacheKey] = template;
    return template;
  }

  public static async findViews(filter: string, fromPosition: number, max: number): Promise<any> {
    try {
      let query = StoreView.getInstance();

      if (filter && filter.length > 0) {
        query = query.find({ $or: StoreView.getFilterQuery(filter) });
      } else {
        query = query.find();
      }

      let result = await query
        .where()
        .skip(fromPosition)
        .limit(max)
        .sort({ order: 1, timestamp: 1 })
        .exec();
      return result;
    } catch (error) {
      console.warn("Couldn't complete StoreView.findViews. " + error);
      return null;
    }
  }

  public static async findAll(): Promise<Array<any>> {
    try {
      let result = await StoreView.getInstance()
        .find()
        .sort({ order: 1, timestamp: 1 })
        .exec();
      return result;
    } catch (error) {
      console.warn("Couldn't complete StoreView.findAll. " + error);
      return null;
    }
  }

  public static async getAllCount(filter?: string): Promise<number> {
    try {
      let query = StoreView.getInstance();

      if (filter && filter.length > 0) {
        query = query.find({ $or: StoreView.getFilterQuery(filter) });
      } else {
        query = query.find();
      }

      let result = await query.where().count();
      return result;
    } catch (error) {
      console.warn("Couldn't complete StoreView.getAllCount. " + error);
      return null;
    }
  }

  public static async getContentByKey(key: string): Promise<any> {
    let view = await StoreView.findByKey(key);
    let content = view.getContent();
    return content;
  }

  public static async getContentJsonValue(keyView: string, keyWord: string, parameters: Array<string> = []): Promise<any> {
    let view = await StoreView.findByKey(keyView);
    let value = view.getContentJsonValue(keyWord, parameters);
    return value;
  }

  public static async findByKey(key: string): Promise<any> {
    try {
      if (!key) return null;
      key = decodeURIComponent(key);

      let cacheKey = key;

      StoreView.cache = [];
      if (StoreView.cache[cacheKey]) return StoreView.cache[cacheKey];

      let result = await StoreView.getInstance()
        .findOne({ key: key })
        .exec();

      if (result) {
        StoreView.cache[cacheKey] = result;
        return result;
      }

      return null;
    } catch (error) {
      console.warn("Couldn't complete StoreView.findByKey. " + error);
      return null;
    }
  }

  public static generateKeywords(text) {
    let keywords = text
      .toLowerCase()
      .replace(/[^a-z0-9À-ÿ]+/gi, ",")
      .replace(/^-+/, "")
      .replace(/-+$/, "");

    return keywords;
  }

  private static getFilterQuery(filter) {
    let regex = new RegExp(filter, "i");
    let query = [{ key: regex }, { title: regex }, { description: regex }, { keywords: regex }];
    return query;
  }
}
