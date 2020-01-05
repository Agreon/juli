# Jira Ultimate Log Importer

Imports Worklogs from a Timesheet-File into Jira Tempo.

**Be aware that this is a early alpha and may alter your worklogs in an unpredicted way!**

## Installation

- `npm i -g juli`
- `yarn global add juli`

## Usage

```
$ juli <timesheet-file> [Params]
```

**Params**

- `-s`: Save the credentials entered in the home directory for the next use.

### Syntax of the Timesheet

```
# <DATE>
<START_TIME>
    <ISSUE-KEY>: <DESCRIPTION>
<END_TIME / START_TIME_OF_NEXT>
    <ISSUE-KEY>: <DESCRIPTION>
<END_TIME>
    /** An empty body represents a break **/
<START_TIME>
    <ISSUE-KEY>: <DESCRIPTION>
<END_TIME>

# <DATE>
...
```

- Format of the date: `d.M.[YY]`
- Format of the the time: `h[:m]`

**Example**

```
# 22.1.
8
    XYZ-60: Wrote Readme
9:20
10
    XYZ-60: Published Package
11
```

You can execute the command multiple times to update your remote logs. If there are previous worklogs written by juli, the old versions will be deleted.

### Additional commands

- `updateHost`: Update the saved Jira host.
- `updateCredentials`: Update the saved credentials.

## Todo

- Let the user specify a custom entry range
- Add a default host for jira
- Use a better Framework for CLI-Parsing
- Improve error handling

**If you want to help, visit the [Repo](https://github.com/Agreon/juli)**
