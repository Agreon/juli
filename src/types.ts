export interface IWorkDay {
  date: Date;
  workEntries: IWorkEntry[];
}

export interface IWorkEntry {
  startTime: Date;
  endTime: Date;
  ticketId: string;
  description: string;
}

export interface IApiConnector {
  importLogs(days: IWorkDay[]): Promise<void>;
}

export interface IStore<TCRED_TYPE, TENTRY_TYPE> {
  getHost(): string | null;
  setHost(host: string): void;

  getCredentials(): TCRED_TYPE | null;
  setCredentials(credentials: TCRED_TYPE): void;

  getExistingEntries(): TENTRY_TYPE[] | null;
  setExistingEntries(entires: TENTRY_TYPE[]): void;
}
