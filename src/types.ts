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

export interface IWorklogEntry {
  id: string;
  date: Date;
}

export interface IStore<TCRED_TYPE> {
  getCredentials(): TCRED_TYPE | null;
  setCredentials(credentials: TCRED_TYPE): void;

  getExistingEntries(): IWorklogEntry[] | null;
  setExistingEntries(entires: IWorklogEntry[]): void;
}
