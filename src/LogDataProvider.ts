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
    public readonly command?: vscode.Command
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
            const match = line.match(/at\s+.*\((.*):(\d+)\)/);
            if (match) {
              const [, file, line] = match;
              return new LogTreeItem(
                line,
                vscode.TreeItemCollapsibleState.None,
                {
                  command: "vscode.open",
                  arguments: [
                    vscode.Uri.file(file),
                    {selection: new vscode.Range(+line - 1, 0, +line - 1, 0)},
                  ],
                  title: "Open File",
                }
              );
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
        this.logMessages.map((logMessage) => {
					let icon = this.getIcon(logMessage.type);
          return new LogTreeItem(
            logMessage.context,
            vscode.TreeItemCollapsibleState.Collapsed,
            undefined
          );
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
    }
  }

  addLogMessage(logMessage: LogMessage) {
    this.logMessages.push(logMessage);
    this._onDidChangeTreeData.fire(undefined);
  }
}
