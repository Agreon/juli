import * as commander from "commander";
import { readFileSync } from "fs";
import { Parser } from "./Parser";
import { JiraApiConnector } from "./jira/JiraApiConnector";
import { FormatError } from "./errors";
import { checkForUpdates } from "./util/checkForUpdates";
import { Logger } from "./util/Logger";
import { handleError } from "./util/handleError";

export const execute = async () => {
  let executed = false;

  await checkForUpdates();

  commander
    .command("updateCredentials")
    .description("Update the saved credentials")
    .action(() => {
      JiraApiConnector.updateCredentials(true);
      executed = true;
    });

  commander
    .command("updateHost")
    .description("Update the saved host")
    .action(() => {
      JiraApiConnector.updateHost();
      executed = true;
    });

  commander
    .version("0.0.13")
    .arguments("<file>")
    .option(
      "-s, --saveCredentials",
      "Save the user credentials in the home directory",
      false
    )
    .option(
      "-a, --syncAll",
      "Sync every day in the timesheet file, ignoring the default of one week",
      false
    )
    .action(async (file: string, { saveCredentials, syncAll }: any) => {
      executed = true;
      const connector = new JiraApiConnector(saveCredentials, syncAll);
      try {
        const fileContent = readFileSync(file, "utf8");
        const dates = Parser.parse(fileContent);

        await connector.importLogs(dates);
        Logger.success("Import was successful");
      } catch (e) {
        handleError(e);
        if (e instanceof FormatError) {
          process.exit(128);
        }
        process.exit(1);
      }
    });

  commander.parse(process.argv);

  if (!executed) {
    Logger.error("Please specify a timesheet file");
    process.exit(1);
  }
};

execute().catch(e => {
  handleError(e);
  process.exit(1);
});
