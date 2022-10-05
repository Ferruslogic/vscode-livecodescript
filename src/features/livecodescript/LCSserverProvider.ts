import * as vscode from "vscode";
import { TextDecoder } from "text-encoding";
import { PromiseSocket } from "promise-socket";

const enum Setting {
	Enable = "livecodescript.server.enable",
	Host = "livecodescript.server.host",
	Port = "livecodescript.server.port",
}

export default class LivecodescriptServerProvider {
	private enabled: boolean;
	private host: string;
	private port: number;

	constructor() {}

	public activate(subscriptions: vscode.Disposable[]) {
		subscriptions.push(this);
		subscriptions.push(
			vscode.workspace.onDidSaveTextDocument(
				async ({ fileName, languageId, lineAt }) => {
					if (this.enabled === undefined) {
						await this.loadConfiguration();
					}

					if (this.enabled && languageId === "livecodescript") {
						const regex = '"([-.:a-zA-Z0-9_s?!]+)"';
						const scriptName = lineAt(0).text.match(regex)[1];
						const query = {
							command: "reload script",
							stack: scriptName,
							filename: fileName,
						};

						let prms = new URLSearchParams(query);

						const socket = new PromiseSocket();
						socket.setTimeout(300);

						try {
							await socket.connect(this.port, this.host);
							await socket.write(`${prms.toString()}\n`);

							const data = await socket.read();
							let result = new TextDecoder().decode(data);

							if (result !== "success") {
								if (result.includes("error: 360")) {
									console.log(
										"error: script is being executed within Livecode"
									);
								} else {
									console.log(
										`error running command in LiveCode: ${result}`
									);
								}
							} else {
								console.log(
									"command successfully sent to LiveCode"
								);
							}
							socket.destroy();
						} catch (err) {
							console.log(err);
							socket.destroy();
						}
					}
				}
			)
		);
	}

	public dispose(): void {}

	private async loadConfiguration(): Promise<void> {
		const section = vscode.workspace.getConfiguration();
		this.enabled = this.getSettingValue<boolean>(
			section,
			Setting.Enable,
			false
		);
		this.host = this.getSettingValue<string>(
			section,
			Setting.Host,
			"localhost"
		);
		this.port = this.getSettingValue<number>(section, Setting.Port, 61373);
	}

	private getSettingValue<T>(
		section: vscode.WorkspaceConfiguration,
		setting: Setting,
		def: T
	): T {
		const value = section.inspect<T>(setting);
		if (value === undefined) {
			return def;
		} else if (value.workspaceValue !== undefined) {
			return value.workspaceValue;
		} else if (value.globalValue !== undefined) {
			return value.globalValue;
		} else if (value.defaultValue !== undefined) {
			return value.defaultValue;
		} else {
			return def;
		}
	}
}
