const mongoose = require("mongoose");

export class StoreUserSession {
  private static DEFAULT_EXPERIATION_TIME_MS = 2 * 365 * 24 * 60 * 60 * 1000; // One year by default
  private static instance;

  public static getInstance() {
    if (!StoreUserSession.instance) {
      StoreUserSession.instance = StoreUserSession.createInstance();
    }

    return StoreUserSession.instance;
  }

  private static createInstance(): any {
    const schema = new mongoose.Schema(
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        sessionId: { type: String, unique: true },
        userAgent: String,
        expiresDate: Date
      },
      { timestamps: true, usePushEach: true }
    );
    schema.index({
      userId: "text",
      sessionId: "text"
    });

    schema.methods.isValid = function() {
      let expiriesTime = this.expiresDate.getTime() - Date.now();
      if (expiriesTime < 0) return false;
      return true;
    };

    const instance = mongoose.model("UserSession", schema);
    return instance;
  }

  public static async createUserSession(userId: any, sessionId: string, userAgent: string): Promise<any> {
    const self = this;

    // Remove previous session if exists
    await StoreUserSession.removeSession(sessionId);

    // Create new session
    let UserSession = StoreUserSession.getInstance();
    let expiresDate = new Date(new Date().getTime() + self.DEFAULT_EXPERIATION_TIME_MS);

    let newInstance = new UserSession({
      userId: userId,
      sessionId: sessionId,
      userAgent: userAgent,
      expiresDate: expiresDate
    });

    await newInstance.save();
    return newInstance;
  }

  public static async findSessions(userId: any): Promise<any> {
    if (!userId) return null;

    try {
      let result = await StoreUserSession.getInstance()
        .find({ userId: userId })
        .sort({ timestamp: 1 })
        .exec();
      return result;
    } catch (error) {
      console.warn("Couldn't complete StoreUserSession.findSessions. " + error);
      return null;
    }
  }

  public static async findUserSession(userId: any, sessionId: string): Promise<any> {
    if (!userId) return null;

    try {
      let result = await StoreUserSession.getInstance()
        .findOne({ userId: userId, sessionId: sessionId })
        .sort({ timestamp: 1 })
        .exec();
      return result;
    } catch (error) {
      console.warn("Couldn't complete StoreUserSession.findUserSession. " + error);
      return null;
    }
  }

  public static async findSession(sessionId: string): Promise<any> {
    if (!sessionId) return null;

    try {
      let result = await StoreUserSession.getInstance()
        .findOne({ sessionId: sessionId })
        .sort({ timestamp: 1 })
        .exec();
      return result;
    } catch (error) {
      console.warn("Couldn't complete StoreUserSession.findSession. " + error);
      return null;
    }
  }

  public static async removeUserSession(userId: any, sessionId: string) {
    if (!userId) return null;

    try {
      let result = await StoreUserSession.getInstance().remove({
        userId: userId,
        sessionId: sessionId
      });
      return result;
    } catch (error) {
      console.warn("Couldn't complete StoreUserSession.removeUserSession. " + error);
      return null;
    }
  }

  public static async removeSession(sessionId: string) {
    if (!sessionId) return null;

    try {
      let result = await StoreUserSession.getInstance().remove({
        sessionId: sessionId
      });
      return result;
    } catch (error) {
      console.warn("Couldn't complete StoreUserSession.removeSession. " + error);
      return null;
    }
  }

  public static async removeAllUserSessions(userId: any) {
    if (!userId) return null;

    try {
      let result = await StoreUserSession.getInstance().remove({
        userId: userId
      });
      return result;
    } catch (error) {
      console.warn("Couldn't complete StoreUserSession.removeAllUserSessions. " + error);
      return null;
    }
  }
}
