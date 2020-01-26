import * as fs from "fs-extra";
import { CREATE_PATH } from "../const";
import * as path from "path";
import { InvalidArgumentError } from "../errors/InvalidArgumentError";
import { IAlias, IAliases } from "../types";

export const ALIAS_FILE = path.join("alias.json");

export class AliasStore {
  private aliases: IAliases =
    fs.readJsonSync(CREATE_PATH(ALIAS_FILE), {
      encoding: "UTF-8",
      throws: false
    }) || {};

  public setIssueAliases(entries: IAliases) {
    fs.outputJsonSync(CREATE_PATH(ALIAS_FILE), entries);
    this.aliases = entries;
  }

  public getIssueAliases(): IAliases | null {
    return this.aliases;
  }

  public async updateAlias(alias: string): Promise<IAliases> {
    const aliasRegex = /^(?<name>.*)\s*=(?:\s*(?<ticketId>[\w-]+)(?:\s*,\s*(?<description>.*))?)?/;

    const matchObj = aliasRegex.exec(alias);
    if (!matchObj?.groups) {
      throw new InvalidArgumentError(
        `${alias} does not match <name>=<issueId>,[comment]`
      );
    }

    const { name, ticketId, description } = matchObj.groups;
    if (!name) {
      throw new InvalidArgumentError(
        `${alias} does not match <name>=<issueId>`
      );
    }

    const aliases: IAliases = this.getIssueAliases() || {};

    if (!ticketId) {
      const { [name]: _, ...remainingAliases } = aliases;
      await this.setIssueAliases(remainingAliases);
      return remainingAliases;
    }

    const updatedAliases = { ...aliases, [name]: { ticketId, description } };
    await this.setIssueAliases(updatedAliases);
    return updatedAliases;
  }

  public resolveAlias: (idOrName: string) => IAlias = (idOrName: string) => {
    const alias = this.aliases?.[idOrName];
    return alias || { ticketId: idOrName };
  };
}
