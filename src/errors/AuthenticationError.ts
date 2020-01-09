import { AxiosError } from "axios";

export class AuthenticationError extends Error {
  public static fromAxiosError(e: AxiosError) {
    let message = `Request Failed: ${e.message}`;

    switch (true) {
      case e.response?.data?.errorMessages?.length: {
        const { errorMessages } = e.response?.data;
        message = ["Login failed:", ...errorMessages].join("\n");
        break;
      }
      case e.response?.headers["x-seraph-loginreason"]: {
        message = "CAPTCHA Error: Please complete the Captcha in your Browser";
        break;
      }
    }

    return new AuthenticationError(message);
  }
}
