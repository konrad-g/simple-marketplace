import { StoreUser } from "../store/StoreUser";

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

export class PassportConfig {
  constructor() {
    passport.serializeUser((user, done) => {
      done(null, user._id);
    });

    passport.deserializeUser(async (id, done) => {
      let user = await StoreUser.findUserById(id);
      done(null, user);
    });

    /**
     * Sign in using Email and Password.
     */
    passport.use(
      new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
        let user = await StoreUser.findUserByEmail(email.toLowerCase());

        if (!user) {
          return done(null, false, { msg: `Email ${email} not found.` });
        }
        user.comparePassword(password, (err, isMatch) => {
          if (err) {
            return done(err);
          }
          if (isMatch) {
            return done(null, user);
          }
          return done(null, false, { msg: "Invalid email or password." });
        });
      })
    );
  }
}
