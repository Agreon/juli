import * as commander from "commander";
import { readFileSync } from "fs";
import { Parser } from "./Parser";
import { JiraApiConnector } from "./jira/JiraApiConnector";
import { FormatError } from "./errors";
import { checkForUpdates } from "./util/checkForUpdates";
import { Logger } from "./util/Logger";
import { handleError } from "./util/handleError";
import { JiraStore } from "./jira/JiraStore";
import { InvalidArgumentError } from "./errors/InvalidArgumentError";
import { AliasStore } from "./repository/AliasStore";
import { IAliases } from "./types";

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
    .command("alias [pair]")
    .description("Upsert an alias with <name>=[issueId]")
    .action(async (alias: string) => {
      executed = true;

      const printAliases = (aliases: IAliases | null) =>
        aliases
          ? Object.entries(aliases).forEach(([name, { key, comment }]) =>
              console.log(`${name}=${key}${comment ? `,${comment}` : ""}`)
            )
          : console.log("No aliases found");

      const repository = new AliasStore();
      if (!alias) {
        printAliases(await repository.getIssueAliases());
        return;
      }

      try {
        const aliases = await repository.updateAlias(alias);
        printAliases(aliases);
      } catch (e) {
        console.error(e.message);
        if (e instanceof InvalidArgumentError) {
          process.exit(129);
        }
        process.exit(1);
      }
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

  await commander.parseAsync(process.argv);

  if (!executed) {
    Logger.error("Please specify a timesheet file");
    process.exit(1);
  }
};

execute().catch(e => {
  handleError(e);
  process.exit(1);
});
