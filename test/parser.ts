import "reflect-metadata";
import "jest";

import { getHours, getDate, getMinutes } from "date-fns";
import { Parser } from "../src/Parser";

describe("parser", () => {
  it("should parse one worklog correctly", () => {
    const testData = `
    # 13.1.
    + 7:50
	    + TEST-52: Test-Description
    + 8:20
`;

    const parsed = Parser.parse(testData);

    expect(parsed.length).toBe(1);
    expect(getDate(parsed[0].date)).toEqual(13);

    const { workEntries } = parsed[0];

    expect(workEntries.length).toBe(1);
    expect(workEntries[0].description).toEqual("Test-Description");
    expect(workEntries[0].ticketId).toEqual("TEST-52");
    expect(getHours(workEntries[0].startTime)).toEqual(7);
    expect(getMinutes(workEntries[0].startTime)).toEqual(50);
    expect(getHours(workEntries[0].endTime)).toEqual(8);
    expect(getMinutes(workEntries[0].endTime)).toEqual(20);
  });

  it("should parse multiple worklogs correctly", () => {
    const testData = `
    # 13.1.
    + 7:50
	    + TEST-52: Test-Description
    + 8:20
    12        
        JIRA-123: some description
    13
`;

    const parsed = Parser.parse(testData);

    expect(parsed.length).toBe(1);
    expect(getDate(parsed[0].date)).toEqual(13);

    const { workEntries } = parsed[0];

    expect(workEntries.length).toBe(2);
    expect(workEntries[0].description).toEqual("Test-Description");
    expect(workEntries[0].ticketId).toEqual("TEST-52");
    expect(getHours(workEntries[0].startTime)).toEqual(7);
    expect(getHours(workEntries[0].endTime)).toEqual(8);

    expect(workEntries[1].description).toEqual("some description");
    expect(workEntries[1].ticketId).toEqual("JIRA-123");
    expect(getHours(workEntries[1].startTime)).toEqual(12);
    expect(getHours(workEntries[1].endTime)).toEqual(13);
  });

  it("should parse multiple worklogs correctly without pause", () => {
    const testData = `
    # 13.1.
    + 7:50
	    + TEST-52: Test-Description
    12        
        JIRA-123: some description
    13
`;

    const parsed = Parser.parse(testData);

    expect(parsed.length).toBe(1);
    expect(getDate(parsed[0].date)).toEqual(13);

    const { workEntries } = parsed[0];

    expect(workEntries.length).toBe(2);
    expect(workEntries[0].description).toEqual("Test-Description");
    expect(workEntries[0].ticketId).toEqual("TEST-52");
    expect(getHours(workEntries[0].startTime)).toEqual(7);
    expect(getHours(workEntries[0].endTime)).toEqual(12);

    expect(workEntries[1].description).toEqual("some description");
    expect(workEntries[1].ticketId).toEqual("JIRA-123");
    expect(getHours(workEntries[1].startTime)).toEqual(12);
    expect(getHours(workEntries[1].endTime)).toEqual(13);
  });

  it("should parse multiple days correctly", () => {
    const testData = `
    # 13.1.
    + 7:50
	    + TEST-52: Test-Description
    + 8:20
    #1.1.
    12        
        JIRA-123: some description
    13
`;

    const parsed = Parser.parse(testData);

    expect(parsed.length).toBe(2);
    expect(getDate(parsed[0].date)).toEqual(13);

    const { workEntries } = parsed[0];
    const { workEntries: workEntriesOfDay2 } = parsed[1];

    expect(workEntries.length).toBe(1);
    expect(workEntries[0].description).toEqual("Test-Description");
    expect(workEntries[0].ticketId).toEqual("TEST-52");
    expect(getHours(workEntries[0].startTime)).toEqual(7);
    expect(getHours(workEntries[0].endTime)).toEqual(8);

    expect(workEntriesOfDay2.length).toBe(1);
    expect(workEntriesOfDay2[0].description).toEqual("some description");
    expect(workEntriesOfDay2[0].ticketId).toEqual("JIRA-123");
    expect(getHours(workEntriesOfDay2[0].startTime)).toEqual(12);
    expect(getHours(workEntriesOfDay2[0].endTime)).toEqual(13);
  });

  it("should infer the last description of a issue correctly", () => {
    const testData = `
    # 13.1.
    + 7:50
	    + TEST-52: Test-Description
    + 8:20
        + JIRA-123: Other-Description
    + 9
        + TEST-52: Test-Description2
    + 9:30
        + TEST-52
    + 11
`;

    const parsed = Parser.parse(testData);

    expect(parsed.length).toBe(1);

    const { workEntries } = parsed[0];

    expect(workEntries.length).toBe(4);
    expect(workEntries[3].description).toEqual("Test-Description2");
    expect(workEntries[3].ticketId).toEqual("TEST-52");
    expect(getHours(workEntries[3].startTime)).toEqual(9);
    expect(getHours(workEntries[3].endTime)).toEqual(11);
  });

  it("should throw a correct error if description is missing", () => {
    const testData = `
    # 13.1.
    + 7:50
	    + TEST-52
    + 8:20
`;

    let errorMessage: string | null = null;

    try {
      Parser.parse(testData);
    } catch (e) {
      errorMessage = e.message;
    }

    expect(errorMessage).toBeTruthy();
    expect(errorMessage).toEqual(
      `Missing Description for Issue 'TEST-52' on 13.1.`
    );
  });

  it("should throw a correct error if a time is not right", () => {
    const testData = `
    # 13.1.
    + 7:50
	    + TEST-52: Test-Description
    + 8:20

    # 14.1.
    + 750
`;

    let errorMessage: string | null = null;

    try {
      Parser.parse(testData);
    } catch (e) {
      errorMessage = e.message;
    }

    expect(errorMessage).toBeTruthy();
    expect(errorMessage).toEqual(`Time '750' is not in right format`);
  });
});
