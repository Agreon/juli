import axios from "axios";

const REGISTRY_URL = "https://registry.npmjs.org/juli";

export class UpdateChecker {
  public static async checkForUpdates() {
    try {
      const result = await axios.get(REGISTRY_URL);
      const latestVersion = result.data["dist-tags"].latest;
      const { version: currentVersion } = require("./../package.json");

      if (latestVersion !== currentVersion) {
        console.log(`There is a new Version of this package available!`);
        console.log(`Update with npm i -g juli@${latestVersion}`);
        console.log(`Or with yarn global add juli@${latestVersion}\n`);
      }
    } catch (e) {
      throw new Error("Could not reach npm registry");
    }
  }
}
