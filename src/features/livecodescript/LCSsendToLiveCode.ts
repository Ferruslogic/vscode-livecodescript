import * as vscode from "vscode";
import { TextDecoder } from "text-encoding";
import { PromiseSocket } from "promise-socket";

export default class LivecodescriptSender {
	private host: string;
	private port: number;
	private hideError: boolean = false;
	private ignoreConnectionErrors: boolean

	constructor() {
		this.loadConfiguration();
	}

	public dispose(): void {}

	public async send(query: any) {
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
					vscode.window
						.showErrorMessage(
							"Error: Script is being executed within Livecode",
							...["Retry"]
						)
						.then((selection) => {
							console.log(selection);
							if (selection === "Retry") {
								this.send(query);
							}
						});
				} else if (result !== "ignored") {
					vscode.window
						.showErrorMessage(
							`Error running command in LiveCode: ${result}`,
							...["Retry"]
						)
						.then((selection) => {
							console.log(selection);
							if (selection === "Retry") {
								this.send(query);
							}
						});
				}
			} else {
				vscode.window.showInformationMessage(
					"LiveCode updated successfully"
				);
			}
		} catch (err) {
			socket.destroy();
			console.log(err);
			if (err.code === "ECONNREFUSED") {
				if (!this.hideError && !this.ignoreConnectionErrors) {
					vscode.window
						.showErrorMessage(
							"Could not connect to LiveCode. Make sure LiveCode is running and listening on the correct port",
							...["Retry", "Don't show again"]
						)
						.then((selection) => {
							console.log(selection);
							if (selection === "Retry") {
								this.send(query);
							} else if (selection === "Don't show again") {
								this.hideError = true;
							}
						});
				}
			} else {
				vscode.window
					.showErrorMessage(
						"An error occurred while updating LiveCode.",
						...["Retry"]
					)
					.then((selection) => {
						console.log(selection);
						if (selection === "Retry") {
							this.send(query);
						}
					});
			}
		}
	}

	public activate(subscriptions: vscode.Disposable[]) {
		subscriptions.push(this);
		subscriptions.push(
			vscode.workspace.onDidChangeConfiguration(() =>
				this.loadConfiguration()
			)
		);
	}

	private loadConfiguration() {
		console.log("CONFIG CHANGED");
		const section = vscode.workspace.getConfiguration("livecodescript");
		this.host = section.get("server.host", "localhost");
		this.port = section.get("server.port", 61373);
		this.ignoreConnectionErrors = section.get("server.ignoreConnectionErrors");
	}
}
