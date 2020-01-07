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
- `: <DESCRIPTION>` can be omitted, if there is an existing issue-definition on the same day already.

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

### Be aware

You can execute the command multiple times to update your remote logs. juli uses the specified logfile as a source of truth (for the last week). That means, **entries you delete in the logfile will be deleted in jira as well**, as long as they are in the current tempo week.

Entries, that were added manually or through other tools are not affected by this.

### Additional commands

- `updateHost`: Update the saved Jira host.
- `updateCredentials`: Update the saved credentials.

## Todo

- Support One-line definitions.
- Make the deletion of old items optional to not force the user to keep his logs for one week
- Add the possibility to define reoccurring entries in a config
- Let the user specify a custom entry range
- Add a default host for jira
- Use a better Framework for CLI-Parsing
- Improve error handling

**If you want to help, visit the [Repo](https://github.com/Agreon/juli)**
