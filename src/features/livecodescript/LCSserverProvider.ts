import * as vscode from "vscode";
import LivecodescriptSender from "./LCSsendToLiveCode";

export default class LivecodescriptServerProvider {
	private enabled: boolean;
	private sender: LivecodescriptSender;

	constructor(sender: LivecodescriptSender) {
		this.loadConfiguration();
		this.sender = sender;
	}

	public activate(subscriptions: vscode.Disposable[]) {
		subscriptions.push(this);
		subscriptions.push(
			vscode.workspace.onDidSaveTextDocument(
                async ({ fileName, languageId, lineAt }) => {
                    console.log("DOCUMENT SAVED");
                    if (this.enabled && languageId === "livecodescript") {
                        const regex = /"([-.:a-zA-Z0-9_\s?!]+)"/;
                        const match = lineAt(0).text.match(regex)
                        /* if the regex finds nothing it returns null so we run a check to avoid erroring out */
                        const scriptName = match ? match[1] : null 
                        const query = {
                            command: scriptName === null ? `Error parsing script name from file ${fileName}!` : "reload script",
                            stack: scriptName,
                            filename: fileName,
                        };

                        await this.sender.send(query);
                    }
                }
            )
        );
		subscriptions.push(
			vscode.workspace.onDidChangeConfiguration(() =>
				this.loadConfiguration()
			)
		);
	}

	public dispose(): void {}

	private loadConfiguration() {
		console.log("CONFIG CHANGED");
		const section = vscode.workspace.getConfiguration("livecodescript");
		this.enabled = section.get("server.enable", false);
	}
}
