const express = require("express");
const chalk = require("chalk");

export enum AppMode {
  DEV,
  PROD,
  TEST
}

export class AppServer {
  port;
  server;
  expressApp;
  workers;
  debug = require("debug")("final:server");
  http = require("http");
  cluster = require("cluster");
  numCPUs = require("os").cpus().length;
  appMode: AppMode;

  constructor(appMode: AppMode) {
    this.appMode = appMode;
    this.expressApp = express({ mergeParams: true });
    this.workers = [];
  }

  isMasterProcess(): boolean {
    return !this.isProduction() || this.cluster.isMaster;
  }

  start(port?: any) {
    const self = this;

    self.expressApp.enable("trust proxy");
    self.port = self.normalizePort(port || "3000");
    self.expressApp.set("port", self.port);
    self.server = self.http.createServer(self.expressApp);
    if (this.appMode === AppMode.TEST) return;

    // Use multi-core on production
    if (self.isProduction() && self.cluster.isMaster) {
      console.log("Master cluster setting up " + self.numCPUs + " workers...");
      for (let i = 0; i < self.numCPUs; i++) {
        self.createWorker();
      }

      self.cluster.on("online", function(worker) {
        console.log("Worker " + worker.process.pid + " is online");
      });

      self.cluster.on("exit", function(worker, code, signal) {
        if (self.workers.length > 0 && self.workers.indexOf(worker) >= 0) {
          this.workers.splice(self.workers.indexOf(worker), 1);
        }

        console.log("Worker " + worker.process.pid + " died with code: " + code + ", and signal: " + signal);
        console.log("Starting a new worker");
        self.createWorker();
      });
    } else {
      // Listen only in development and production
      self.server.listen(self.port, () => {
        let appName = "App";
        if (self.cluster.isWorker) {
          appName = "Worker " + self.cluster.worker.id;
        }

        console.log("%s %s is running at http://localhost:%d in %s mode", chalk.green("✓"), appName, self.expressApp.get("port"), self.expressApp.get("env"));
        if (self.appMode === AppMode.DEV) console.log("  Press CTRL-C to stop\n");
      });
      self.server.on("error", error => {
        self.onError(error);
      });
      self.server.on("listening", () => {
        self.onListening();
      });
    }
  }

  private createWorker() {
    const self = this;
    let worker = self.cluster.fork();
    this.workers.push(worker);
    worker.on("message", function(msg) {
      self.sendMessageToAllWorkers(msg);
    });
  }

  private sendMessageToAllWorkers(msg) {
    for (let worker of this.workers) {
      worker.send(msg);
    }
  }

  /**
   * Normalize a port into a number, string, or false.
   */
  normalizePort(val) {
    let port = parseInt(val, 10);

    if (isNaN(port)) {
      // named pipe
      return val;
    }

    if (port >= 0) {
      // port number
      return port;
    }

    return false;
  }

  /**
   * Event listener for HTTP server "error" event.
   */
  onError(error) {
    if (error.syscall !== "listen") {
      throw error;
    }

    let bind = typeof this.port === "string" ? "Pipe " + this.port : "Port " + this.port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
      case "EACCES":
        console.error(bind + " requires elevated privileges");
        process.exit(1);
        break;
      case "EADDRINUSE":
        console.error(bind + " is already in use");
        process.exit(1);
        break;
      default:
        throw error;
    }
  }

  /**
   * Event listener for HTTP server "listening" event.
   */
  onListening() {
    let addr = this.server.address();
    let bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
    this.debug("Listening on " + bind);
  }

  private isProduction() {
    return this.appMode === AppMode.PROD;
  }
}
