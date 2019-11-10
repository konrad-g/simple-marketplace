#!/usr/bin/env node
import { AppMode } from "./elements/server/AppServer";
import { Boot } from "./Boot";

let boot = new Boot(AppMode.PROD);
boot.start();
