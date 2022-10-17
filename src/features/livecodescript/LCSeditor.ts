import * as vscode from "vscode";
import { Disposable } from "../utils/dispose";
import LivecodescriptSender from "./LCSsendToLiveCode";
import { TextDecoder } from "text-encoding";
import * as cp from "child_process";
import * as path from "path";

class LiveCodeStack extends Disposable implements vscode.CustomDocument {
	static async create(
		uri: vscode.Uri,
		backupId: string | undefined
	): Promise<LiveCodeStack | PromiseLike<LiveCodeStack>> {
		const dataFile =
			typeof backupId === "string" ? vscode.Uri.parse(backupId) : uri;
		const fileData = await LiveCodeStack.readFile(dataFile);
		return new LiveCodeStack(uri, fileData);
	}

	private static async readFile(uri: vscode.Uri): Promise<Uint8Array> {
		if (uri.scheme === "untitled") {
			return new Uint8Array();
		}
		return new Uint8Array(await vscode.workspace.fs.readFile(uri));
	}

	private readonly _uri: vscode.Uri;
	private _documentData: Uint8Array;

	private constructor(uri: vscode.Uri, initialContent: Uint8Array) {
		super();
		this._uri = uri;
		this._documentData = initialContent;
	}

	public get uri() {
		return this._uri;
	}

	public get documentData(): Uint8Array {
		return this._documentData;
	}

	dispose(): void {
		super.dispose();
	}
}

export class LiveCodeStackEditorProvider
	implements vscode.CustomReadonlyEditorProvider<LiveCodeStack>
{
	private sender: LivecodescriptSender;

	public static register(
		context: vscode.ExtensionContext,
		sender: LivecodescriptSender
	): vscode.Disposable {
		return vscode.window.registerCustomEditorProvider(
			LiveCodeStackEditorProvider.viewType,
			new LiveCodeStackEditorProvider(context, sender),
			{
				webviewOptions: {
					retainContextWhenHidden: true,
				},
				supportsMultipleEditorsPerDocument: false,
			}
		);
	}

	private static readonly viewType = "LiveCodeStack.livecode";

	constructor(
		private readonly _context: vscode.ExtensionContext,
		sender: LivecodescriptSender
	) {
		this.sender = sender;
	}

	async openCustomDocument(
		uri: vscode.Uri,
		openContext: { backupId?: string },
		_token: vscode.CancellationToken
	): Promise<LiveCodeStack> {
		const document: LiveCodeStack = await LiveCodeStack.create(
			uri,
			openContext.backupId
		);

		const query = { command: "open", filename: document.uri.path };

		await this.sender.send(query);

		return document;
	}

	async resolveCustomEditor(
		document: LiveCodeStack,
		webviewPanel: vscode.WebviewPanel,
		_token: vscode.CancellationToken
	): Promise<void> {
		let config = vscode.workspace.getConfiguration("livecodescript");
		let executable = config.get("LivecodeServerExecutablePath", "noServer");

		if (executable.length !== 0) {
			let args: string[] = [
				path
					.resolve(__dirname, "../../../tools/Snapshot.lc")
					.replace(/[\\]+/g, "/"),
				document.uri.path,
			];

			let child = cp.spawn(executable, args, {
				cwd: vscode.workspace.rootPath,
			});

			let stdout = "";
			child.stdout.on("data", async (out: Buffer) => {
				stdout += out.toString();
			});

			child.stdout.on("end", async () => {
				let result = new TextDecoder().decode(document.documentData);

				let stdoutElements = stdout.split("\n");
				let stackTitle = stdoutElements[0];
				let stackName = stdoutElements[1];
				stdoutElements.splice(0, 2);
				let stackImage = stdoutElements.join("\n");

				let stackDisplay = `${stackTitle} (stack ${stackName})`;

				webviewPanel.webview.html = `<html>
				<body>
					<div class="container">
						<div class="showImageDiv">
							<img id="stackImage" src="data:image/png;base64, ${stackImage}">
						</div>
						<div class="stackTitle">
							<h2>${stackTitle ? stackDisplay : stackName}</h2>
						</div>
						<div class="showButtonDiv">
							<button id="showSource" onclick="showHide()">Show Source</button>
						</div>
						<div id="code">
							<pre>${result}</pre>
						</div>
					</div>
					
					<style>
						* {
							margin: 0;
							padding: 0;
						}
						
						#code {
							display: none;
						}
						
						#showSource {
							display: inline-block;
							outline: none;
							cursor: pointer;
							font-size: 14px;
							padding: 0 12px;
							line-height: 20px;
							height: 30px;
							max-height: 30px;
							background: none;
							font-weight: 700;
							border: 0;
							border-radius: 0;
							color: #0d6efd;
							transition-timing-function: ease-in-out;
							transition-property: background;
							transition-duration: 150ms;
							box-shadow: none;
						}
						
						#showSource:hover {
							text-decoration: underline;
						}
						
						.showButtonDiv {
							margin-top: 10px;
							display: flex;
							justify-content: center;
							align-items: center;
						}
						
						.showImageDiv {
							display: flex;
							justify-content: center;
							align-items: center;
							object-fit: cover;
						}
						
						.showImageDiv img {
							height: 500px;
						}
						
						.stackTitle {
							display: flex;
							justify-content: center;
							align-items: center;
							margin-top: 10px;
						}					
					</style>

					<script>
						function showHide() {
							const codeDisplayType = document.getElementById("code").style.display;
							const showButton = document.getElementById("showSource");
							const stackImage = document.getElementById("stackImage");
						
							if (codeDisplayType != "block") {
								document.getElementById("code").style.display = "block";
								stackImage.style.display = "none";
								showButton.innerHTML = 'Hide Source';
							} else {
								document.getElementById("code").style.display = "none";
								stackImage.style.display = "block";
								showButton.innerHTML = 'Show Source';
							}
						}
					</script>
				</body>
			</html>`;
			});
		} else {
			let result = new TextDecoder().decode(document.documentData);

			webviewPanel.webview.html = `<html>
				<body>
					<div id="code">
						<pre>${result}</pre>
					</div>
				</body>
			</html>`;
		}

		webviewPanel.webview.options = {
			enableScripts: true,
		};
	}
}
