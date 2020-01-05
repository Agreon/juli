import * as commander from "commander";
import { readFileSync } from "fs";
import { Parser } from "./Parser";
import { JiraApiConnector } from "./jira/JiraApiConnector";

export const execute = () => {
  let executed = false;

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
    .version("0.0.1")
    .arguments("<file>")
    .option(
      "-s, --saveCredentials",
      "Save the user credentials in the home directory",
      false
    )
    .action(async (file: string, obj: any) => {
      executed = true;
      const connector = new JiraApiConnector(obj.saveCredentials);

      const fileContent = readFileSync(file, "utf8");
      const dates = Parser.parse(fileContent);

      await connector.importLogs(dates);

      console.log("Import was successful");
    })
    .parse(process.argv);

  if (!executed) {
    console.error("Please specify a timesheet file");
    process.exit(1);
  }
};

execute();
