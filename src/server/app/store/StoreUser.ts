import { AppListener } from "../main/AppListener";
const bcrypt = require("bcrypt-nodejs");
const mongoose = require("mongoose");

export class StoreUser {
  private static instance;

  public static getInstance() {
    if (!StoreUser.instance) {
      StoreUser.instance = StoreUser.createInstance();
    }

    return StoreUser.instance;
  }

  private static createInstance(): any {
    const schema = new mongoose.Schema(
      {
        email: { type: String, unique: true },
        password: String,
        passwordResetToken: String,
        passwordResetExpires: Date
      },
      { timestamps: true, usePushEach: true }
    );

    schema.index({
      email: "text"
    });

    /**
     * Password hash middleware.
     */
    schema.pre("save", async function save(next) {
      const user = this;
      if (!user.isModified("password")) {
        return next();
      }

      bcrypt.genSalt(10, (err, salt) => {
        if (err) {
          return next(err);
        }
        bcrypt.hash(user.password, salt, null, (err, hash) => {
          if (err) {
            return next(err);
          }
          user.password = hash;
          next();
        });
      });
    });

    /**
     * Helper method for validating user's password.
     */
    schema.methods.comparePassword = function comparePassword(candidatePassword, cb) {
      bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
        cb(err, isMatch);
      });
    };

    const instance = mongoose.model("User", schema);
    return instance;
  }

  public static createUser(email: string, password: string): Promise<any> {
    return new Promise((resolve, reject) => {
      let User = StoreUser.getInstance();
      let newInstance = new User({
        email: email,
        password: password
      });

      newInstance.save(err => {
        if (err) {
          let errorMsg = "Couldn't create user. " + err;
          AppListener.onError("Couldn't create user", errorMsg);
          reject(errorMsg);
        } else {
          resolve(newInstance);
        }
      });
    });
  }

  public static async findUser(email: string): Promise<any> {
    try {
      let query = StoreUser.getInstance().findOne({ email: email });

      let result = await query.sort({ timestamp: 1 }).exec();
      return result;
    } catch (error) {
      console.warn("Couldn't complete StoreUser.findUser. " + error);
      return null;
    }
  }

  public static async findUserByEmail(email: string): Promise<any> {
    try {
      let query = StoreUser.getInstance().findOne({ email: email });

      let result = await query.sort({ timestamp: 1 }).exec();
      return result;
    } catch (error) {
      console.warn("Couldn't complete StoreUser.findUserByEmail. " + error);
      return null;
    }
  }

  public static async findUserById(id: string) {
    if (!id) return null;

    try {
      let query = StoreUser.getInstance().findOne({ _id: id });

      let result = await query.exec();
      return result;
    } catch (error) {
      console.warn("Couldn't complete StoreUser.findUserById. " + error);
      return null;
    }
  }

  public static async findAll(): Promise<any> {
    try {
      let result = await StoreUser.getInstance()
        .find()
        .lean()
        .exec();
      return result;
    } catch (error) {
      console.warn("Couldn't complete StoreUser.findAllUsers. " + error);
      return null;
    }
  }

  public static async countAll(): Promise<any> {
    try {
      let result = await StoreUser.getInstance().count();
      return result;
    } catch (error) {
      console.warn("Couldn't complete StoreUser.countAllUsers. " + error);
      return 0;
    }
  }
}
