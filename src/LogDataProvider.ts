import {log} from "console";
import * as vscode from "vscode";

export interface LogMessage {
  type: LogType;
  message: string;
  stackTrace: string;
}
enum LogType {
  error = 0,
  assert = 1,
  warning = 2,
  log = 3,
  exception = 4,
}
interface LogEntry extends LogMessage {
  count: number;
  // date: Date;
}

export class LogTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command // public readonly iconPath?: vscode.ThemeIcon | undefined|string
  ) {
    super(label, collapsibleState);
  }
}
export class LogDataProvider implements vscode.TreeDataProvider<LogTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<LogTreeItem | undefined> =
    new vscode.EventEmitter<LogTreeItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<LogTreeItem | undefined> =
    this._onDidChangeTreeData.event;

  private logEntries: LogEntry[] = [];
  // private updateTimer: NodeJS.Timeout | undefined;
  private timerRuning = false;
  getTreeItem(element: LogTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: LogTreeItem): Thenable<LogTreeItem[]> {
    if (element) {
      const logEntry = this.logEntries.find(
        (logEntry) => logEntry.message === element.label
      );
      if (logEntry) {
        const lines = logEntry.stackTrace.split("\n");
        return Promise.resolve(
          lines.map((line) => {
            //TODO: remove blank lines
            const path = this.getPath(line);
            if (path) {
              const [file, lineNum] = path;
              const treeItem: LogTreeItem = new LogTreeItem(
                line,
                vscode.TreeItemCollapsibleState.None,
                {
                  command: "vscode.open",
                  arguments: [
                    vscode.Uri.file(vscode.workspace.rootPath + "/" + file),
                    {
                      selection: new vscode.Range(
                        +lineNum - 1,
                        0,
                        +lineNum - 1,
                        0
                      ),
                    },
                  ],
                  title: "Open File",
                }
              );
              treeItem.iconPath = new vscode.ThemeIcon("file-symlink-file");
              return treeItem;
            } else {
              return new LogTreeItem(
                line,
                vscode.TreeItemCollapsibleState.None
              );
            }
          })
        );
      } else {
        return Promise.resolve([]);
      }
    } else {
      return Promise.resolve(
        this.logEntries.map((logMessage) => {
          const treeItem: LogTreeItem = new LogTreeItem(
            logMessage.message,
            vscode.TreeItemCollapsibleState.Collapsed,
            undefined
          );
          treeItem.iconPath = this.getIcon(logMessage.type);
          return treeItem;
        })
      );
    }
  }
  getIcon(msgtype: LogType): vscode.ThemeIcon | undefined {
    switch (msgtype) {
      case LogType.log:
        return new vscode.ThemeIcon("info");
        break;
      case LogType.warning:
        return new vscode.ThemeIcon("warning");
        break;
      case LogType.error:
        return new vscode.ThemeIcon("error");
        break;
      case LogType.assert:
        return new vscode.ThemeIcon("debug-stackframe-dot");
        break;
      case LogType.exception:
        return new vscode.ThemeIcon("close");
        break;
      default:
        return new vscode.ThemeIcon("question");
    }
  }
  getPath(line: string): [string, string] | undefined {
    const match = line.match(/\(at\s+(.*):(\d+)\)/);
    if (match) {
      const [, file, lineNum] = match;
      if (file.startsWith("Assets")) {
        return [file, lineNum];
      } else {
        return undefined;
      }
    }
    return undefined;
  }
  addLogMessage(logMessage: LogMessage) {
    //Add logmessage to logEntries
    //TODO: Check checkSameLog
    const logEntry = {...logMessage, count: 0};
    if (!this.timerRuning) {
      this._onDidChangeTreeData.fire(undefined);
      this.timerRuning = true;
      setTimeout(() => {
        this._onDidChangeTreeData.fire(undefined);
        this.timerRuning = false;
      }, 1000);
    }
  }
  //TODO: add cache stack to recent log,so we can check if the log is same
  //Method 1 lamada
  //Most likely will be dead...
  // checkSameLog(logMessage: LogMessage): boolean {
  //   const sameLog = this.logMessages.find(
  //     (log) =>
  //       log.message === logMessage.message &&
  //       log.stackTrace === logMessage.stackTrace
  //   );
  //   if (sameLog) {
  //    return true;
  //   }
  //   else {
  //     return false;
  //   }
  // }
  //Method 2 use map
  //Method 3 use hash for stacktrace
  clearLogMessages() {
    this.logEntries = [];
    this._onDidChangeTreeData.fire(undefined);
  }
}
