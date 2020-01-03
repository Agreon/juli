import * as fs from "fs-extra";
import * as path from "path";

/**
 * TODO: Rewrite
 */
export class GlobalConfigManager {
  static setSync(applicationId: string, fileName: string, content: any) {
    const path = this._createPath(applicationId, fileName);
    fs.outputJsonSync(path, content);
  }

  public static getSync(applicationId: string, fileName: string): any | null {
    const path = this._createPath(applicationId, fileName);
    return fs.readJsonSync(path, { encoding: "UTF-8", throws: false });
  }

  static _createPath(applicationId: string, fileName: string) {
    // Win32
    if (process.env.APPDATA) {
      return path.join(process.env.APPDATA, applicationId, fileName);
    }
    // Unix
    else if (process.env.HOME) {
      return path.join(process.env.HOME, `.${applicationId}`, fileName);
    } else {
      console.log("You don't have a supported OS");
      return path.join(__filename, "../config", applicationId, fileName);
    }
  }
}
