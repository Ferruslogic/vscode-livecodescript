import * as vscode from "vscode";
import { TextDecoder } from "text-encoding";
import { PromiseSocket } from "promise-socket";

export default class LivecodescriptServerProvider {
	private enabled: boolean;
	private host: string;
	private port: number;

	constructor() {
		this.loadConfiguration();
	}

	public activate(subscriptions: vscode.Disposable[]) {
		subscriptions.push(this);
		subscriptions.push(
			vscode.workspace.onDidSaveTextDocument(
				async ({ fileName, languageId, lineAt }) => {
					console.log("DOCUMENT SAVED");
					if (this.enabled && languageId === "livecodescript") {
						const regex = '"([-.:a-zA-Z0-9_s?!]+)"';
						const scriptName = lineAt(0).text.match(regex)[1];
						const query = {
							command: "reload script",
							stack: scriptName,
							filename: fileName,
						};

						this.sendToLiveCode(query);
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
		this.host = section.get("server.host", "localhost");
		this.port = section.get("server.port", 61373);
	}

	private async sendToLiveCode(query) {
		let prms = new URLSearchParams(query);
		const socket = new PromiseSocket();
		socket.setTimeout(300);

		try {
			await socket.connect(this.port, this.host);
			await socket.write(`${prms.toString()}\n`);

			const data = await socket.read();
			socket.destroy();
			let result = new TextDecoder().decode(data);

			if (result !== "success") {
				if (result.includes("error: 360")) {
					vscode.window.showInformationMessage(
						"error: script is being executed within Livecode"
					);
				} else {
					vscode.window
						.showErrorMessage(
							`error running command in LiveCode: ${result}`,
							...["Retry"]
						)
						.then((selection) => {
							console.log(selection);
							if (selection === "Retry") {
								this.sendToLiveCode(query);
							}
						});
				}
			} else {
				vscode.window.showInformationMessage(
					"command successfully sent to LiveCode"
				);
			}
		} catch (err) {
			socket.destroy();
			console.log(err);
			vscode.window
				.showErrorMessage(
					"An error occurred while updating LiveCode.",
					...["Retry"]
				)
				.then((selection) => {
					console.log(selection);
					if (selection === "Retry") {
						this.sendToLiveCode(query);
					}
				});
		}
	}
}
