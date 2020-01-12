import axios from "axios";
import { Logger } from "./Logger";
import { handleError } from "./handleError";

const REGISTRY_URL = "https://registry.npmjs.org/juli";

export const checkForUpdates = async () => {
  try {
    const result = await axios.get(REGISTRY_URL);
    const latestVersion = result.data["dist-tags"].latest;
    const { version: currentVersion } = require("./../../package.json");

    if (latestVersion !== currentVersion) {
      Logger.info(`There is a new Version of this package available!`);
      console.log(`Update with npm i -g juli@${latestVersion}`);
      console.log(`Or with yarn global add juli@${latestVersion}\n`);
    }
  } catch (e) {
    handleError(e, "Could not reach npm registry", "warning");
  }
};
