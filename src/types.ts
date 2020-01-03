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
