import * as vscode from "vscode";

export interface LogMessage {
  type: string;
  context: string;
  stacktrace: string;
}

class LogTreeItem extends vscode.TreeItem {
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

  private logMessages: LogMessage[] = [];

  getTreeItem(element: LogTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: LogTreeItem): Thenable<LogTreeItem[]> {
    if (element) {
      const logMessage = this.logMessages.find(
        (logMessage) => logMessage.context === element.label
      );
      if (logMessage) {
        const lines = logMessage.stacktrace.split("\n");
        return Promise.resolve(
          lines.map((line) => {
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
            }
            else {
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
        this.logMessages.map((logMessage) => {
          const treeItem: LogTreeItem = new LogTreeItem(
            logMessage.context,
            vscode.TreeItemCollapsibleState.Collapsed,
            undefined
          );
          treeItem.iconPath = this.getIcon(logMessage.type);
          return treeItem;
        })
      );
    }
  }
  getIcon(msgtype: string): vscode.ThemeIcon | undefined {
    switch (msgtype) {
      case "Log":
        return new vscode.ThemeIcon("info");
        break;
      case "Warning":
        return new vscode.ThemeIcon("warning");
        break;
      case "Error":
        return new vscode.ThemeIcon("error");
        break;
      default:
        return new vscode.ThemeIcon("debug-stackframe-dot");
    }
  }
  getPath(line: string): [string, string]|undefined {
    const match = line.match(/\(at\s+(.*):(\d+)\)/);
    if (match) {
      const [, file, lineNum] = match;
      if (file.startsWith("Assets")) {
        return [file, lineNum];
      }
      else {
        return undefined;
      }
    }
    return undefined;      
  }
  addLogMessage(logMessage: LogMessage) {
    this.logMessages.push(logMessage);
    this._onDidChangeTreeData.fire(undefined);
  }
}

