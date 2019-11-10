import { AppMode, AppServer } from "./elements/server/AppServer";
import { AppEvolutions } from "./app/evolution/AppEvolutions";
import { AppRouter } from "./app/main/AppRouter";
import { Store } from "./elements/store/Store";

const dotenv = require("dotenv");

export class Boot {
  appMode: AppMode;

  constructor(appMode: AppMode) {
    this.appMode = appMode;
  }

  start() {
    let store: Store = new Store();
    const self = this;

    let initProcess = async function() {
      let server = new AppServer(self.appMode);
      let isMasterProcess: boolean = server.isMasterProcess();
      let router = new AppRouter(server.expressApp, self.appMode);

      let appEvolutions = new AppEvolutions(isMasterProcess, store, self.appMode);
      await appEvolutions.initDatabaseContent();

      server.start(process.env.PORT);
      router.start();
    };

    this.loadConfiguration();
    store.init(process.env.MONGODB_URI, self.appMode === AppMode.PROD, initProcess.bind(self));
  }

  private loadConfiguration() {
    if (this.appMode === AppMode.TEST) {
      dotenv.load({ path: ".env.test" });
    } else if (this.appMode === AppMode.DEV) {
      dotenv.load({ path: ".env.dev" });
    } else if (this.appMode === AppMode.PROD) {
      dotenv.load({ path: ".env.prod" });
    }
  }
}
