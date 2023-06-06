import * as vscode from "vscode";
import * as dgram from "dgram";
import {LogDataProvider, LogMessage} from "./LogDataProvider";

const PORT = 10248;
const server = dgram.createSocket("udp4");

export function activate(context: vscode.ExtensionContext) {
  const logDataProvider = new LogDataProvider();
  vscode.window.createTreeView("unity-log-tree", {
    treeDataProvider: logDataProvider,
  });
  console.log("init sever");
  server.on("listening", () => {
    const address = server.address();
    console.log(`server listening ${address.address}:${address.port}`);
  });

  server.on("message", (msg, rinfo) => {
    let logMessage = JSON.parse(msg.toString()) as LogMessage;
    logDataProvider.addLogMessage(logMessage);
    console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
  });

  server.bind(PORT);

  context.subscriptions.push(
    vscode.commands.registerCommand("unicoer.stopServer", () => {
      server.close();
    })
  );
}

export function deactivate() {
  server.close();
}
