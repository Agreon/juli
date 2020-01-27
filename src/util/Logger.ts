import { rgb, red, blue, green, yellow } from "chalk";

const lightGrey = rgb(119, 136, 153);

export class Logger {
  public static info(message: string) {
    console.log(`${blue("Info")} ${message}`);
  }
  public static warn(message: string) {
    console.log(`${yellow("Warn")} ${message}`);
  }
  public static success(message: string) {
    console.log(`${green("Success")} ${message}`);
  }
  public static error(message: string) {
    console.log(`${red("Error")} ${message}`);
  }
  public static withStep(message: string, step: number, max: number) {
    console.log(`${lightGrey(`[${step}/${max}]`)} ${message}`);
  }
}
