/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as cp from 'child_process';
import * as which from 'which';
import * as path from 'path';
import * as vscode from 'vscode';
import { ThrottledDelayer } from '../utils/async';
import { LineDecoder } from '../utils/lineDecoder';
import * as nls from 'vscode-nls';
let localize = nls.loadMessageBundle();

const enum Setting {
	Run = 'livecodescript.validate.run',
	Enable = 'livecodescript.validate.enable',
	LivecodeServerExecutablePath = 'livecodescript.LivecodeServerExecutablePath',
}


enum RunLCSTrigger {
	onSave,
	onType
}

namespace RunLCSTrigger {
	export let strings = {
		onSave: 'onSave',
		onType: 'onType'
	};
	export let from = function (value: string): RunLCSTrigger {
		if (value === 'onType') {
			return RunLCSTrigger.onType;
		} else {
			return RunLCSTrigger.onSave;
		}
	};
}

export default class LivecodescriptValidationProvider {
	
	private static MatchExpression: RegExp = /(?:(?:Parse|Fatal) error): (.*)(?: in )(.*?)(?: on line )(\d+)/;
	private static BufferArgs: string[] = [(path.resolve(__dirname, '../../../tools/Linter.lc')).replace(/[\\]+/g,"/"), '-scope=.source.livecodescript','-explicitVariables=true'];
	private static FileArgs: string[] = [path.resolve(__dirname, '../../../tools/Linter.lc').replace(/[\\]+/g,"/"), '-scope=.source.livecodescript','-explicitVariables=true'];

	private validationEnabled: boolean;
	private pauseValidation: boolean;
	private config: ILivecodescriptConfig | undefined;
	private loadConfigP: Promise<void>;

	private documentListener: vscode.Disposable | null = null;
	private diagnosticCollection?: vscode.DiagnosticCollection;
	private delayers?: { [key: string]: ThrottledDelayer<void> };

	constructor() {
		this.validationEnabled = true;
		this.pauseValidation = false;
		this.loadConfigP = this.loadConfiguration();
	}

	public activate(subscriptions: vscode.Disposable[]) {
		this.diagnosticCollection = vscode.languages.createDiagnosticCollection();
		subscriptions.push(this);
		subscriptions.push(vscode.workspace.onDidChangeConfiguration(() => this.loadConfigP = this.loadConfiguration()));

		vscode.workspace.onDidOpenTextDocument(this.triggerValidateLCS, this, subscriptions);
		vscode.workspace.onDidCloseTextDocument((textDocument) => {
			this.diagnosticCollection!.delete(textDocument.uri);
			delete this.delayers![textDocument.uri.toString()];
		}, null, subscriptions);
	}

	public dispose(): void {
		if (this.diagnosticCollection) {
			this.diagnosticCollection.clear();
			this.diagnosticCollection.dispose();
		}
		if (this.documentListener) {
			this.documentListener.dispose();
			this.documentListener = null;
		}
	}

	private async loadConfiguration(): Promise<void> {
		const section = vscode.workspace.getConfiguration();
		const oldExecutable = this.config?.executable;
		this.validationEnabled = section.get<boolean>(Setting.Enable, true);

		this.config = await getLCSConfig();

		this.delayers = Object.create(null);
		if (this.pauseValidation) {
			this.pauseValidation = oldExecutable === this.config.executable;
		}
		if (this.documentListener) {
			this.documentListener.dispose();
			this.documentListener = null;
		}
		this.diagnosticCollection!.clear();
		if (this.validationEnabled) {
			if (this.config.trigger === RunLCSTrigger.onType) {
				this.documentListener = vscode.workspace.onDidChangeTextDocument((e) => {
					this.triggerValidateLCS(e.document);
				});
			} else {
				this.documentListener = vscode.workspace.onDidSaveTextDocument(this.triggerValidateLCS, this);
			}
			// Configuration has changed. Reevaluate all documents.
			vscode.workspace.textDocuments.forEach(this.triggerValidateLCS, this);
		}
	}

	private async triggerValidateLCS(textDocument: vscode.TextDocument): Promise<void> {
		await this.loadConfigP;
		if (textDocument.languageId !== 'livecodescript' || this.pauseValidation || !this.validationEnabled) {
			return;
		}

		if (vscode.workspace.isTrusted) {
			let key = textDocument.uri.toString();
			let delayer = this.delayers![key];
			if (!delayer) {
				delayer = new ThrottledDelayer<void>(this.config?.trigger === RunLCSTrigger.onType ? 250 : 0);
				this.delayers![key] = delayer;
			}
			delayer.trigger(() => this.doValidateLCS(textDocument));
		}
	}

	private doValidateLCS(textDocument: vscode.TextDocument): Promise<void> {
		return new Promise<void>(resolve => {
			const executable = this.config!.executable;
			if (!executable) {
				this.showErrorMessageLCS(localize('noLivecode', 'Cannot validate since a Livecode installation could not be found. Use the setting \'livecodescript.LivecodeServerExecutablePath\' to configure the Livecode executable.'));
				this.pauseValidation = true;
				resolve();
				return;
			}

			if (!path.isAbsolute(executable)) {
				// executable should either be resolved to an absolute path or undefined.
				// This is just to be sure.
				return;
			}

			let decoder = new LineDecoder();
			let diagnostics: vscode.Diagnostic[] = [];
			let processLine = (line: string) => {
				let matches = line.match(LivecodescriptValidationProvider.MatchExpression);
				if (matches) {
					let message = matches[1];
					let line = parseInt(matches[3]) - 1;
					let diagnostic: vscode.Diagnostic = new vscode.Diagnostic(
						new vscode.Range(line, 0, line, Number.MAX_VALUE),
						message
					);
					diagnostics.push(diagnostic);
				}
			};

			let options = (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0]) ? { cwd: vscode.workspace.workspaceFolders[0].uri.fsPath } : undefined;
			let args: string[];
			// TODO: This could be improved some how
		//	if (this.config!.trigger === RunLCSTrigger.onSave) {
		//		args = LivecodescriptValidationProvider.FileArgs.slice(0);
		//		args.push(textDocument.fileName);
		//	} else {
				args = LivecodescriptValidationProvider.BufferArgs;
		//	}
			try {
				let childProcess = cp.spawn(executable, args, options);
				childProcess.on('error', (error: Error) => {
					if (this.pauseValidation) {
						resolve(); 
						return;
					}
					this.showErroLCS(error, executable);
					this.pauseValidation = true;
					resolve();
				});
				if (childProcess.pid) {
					///if (this.config!.trigger === RunLCSTrigger.onType) {
						childProcess.stdin.write(textDocument.getText());
						childProcess.stdin.end();
					///}
					childProcess.stdout.on('data', (data: Buffer) => {
						decoder.write(data).forEach(processLine);
					});
					childProcess.stdout.on('end', () => {
						let line = decoder.end();
						if (line) {
							processLine(line);
						}
						this.diagnosticCollection!.set(textDocument.uri, diagnostics);
						resolve();
					});
				} else {
					resolve();
				}
			} catch (error) {
				this.showErroLCS(error, executable);
			}
		});
	}

	private async showErroLCS(error: any, executable: string): Promise<void> {
		let message: string | null = null;
		if (error.code === 'ENOENT') {
			if (this.config!.executable) {
				message = localize('wrongExecutable', 'Cannot validate since {0} is not a valid Livecode executable. Use the setting \'livecodescript.LivecodeServerExecutablePath\' to configure the Livecode executable.', executable);
			} else {
				message = localize('noExecutable', 'Cannot validate since no Livecode executable is set. Use the setting \'livecodescript.LivecodeServerExecutablePath\' to configure the Livecode executable.');
			}
		} else {
			message = error.message ? error.message : localize('unknownReason', 'Failed to run Livecode using path: {0}. Reason is unknown.', executable);
		}
		if (!message) {
			return;
		}

		return this.showErrorMessageLCS(message);
	}

	private async showErrorMessageLCS(message: string): Promise<void> {
		const openSettings = localize('goToSetting', 'Open Settings');
		if (await vscode.window.showInformationMessage(message, openSettings) === openSettings) {
			vscode.commands.executeCommand('workbench.action.openSettings', Setting.LivecodeServerExecutablePath);
		}
	}
}

interface ILivecodescriptConfig {
	readonly executable: string | undefined;
	readonly executableIsUserDefined: boolean | undefined;
	readonly trigger: RunLCSTrigger;
}

async function getLCSConfig(): Promise<ILivecodescriptConfig> {
	const section = vscode.workspace.getConfiguration();

	let executable: string | undefined;
	let executableIsUserDefined: boolean | undefined;
	const inspect = section.inspect<string>(Setting.LivecodeServerExecutablePath);
	if (inspect && inspect.workspaceValue) {
		executable = inspect.workspaceValue;
		executableIsUserDefined = false;
	} else if (inspect && inspect.globalValue) {
		executable = inspect.globalValue;
		executableIsUserDefined = true;
	} else if (inspect && inspect.defaultValue) {
		executable = inspect.defaultValue;
		executableIsUserDefined = false;
	} else {
		executable = undefined;
		executableIsUserDefined = undefined;
	}

	if (executable && !path.isAbsolute(executable)) {
		const first = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0];
		if (first) {
			executable = vscode.Uri.joinPath(first.uri, executable).fsPath;
		} else {
			executable = undefined;
		}
	} else if (!executable) {
		executable = await getLivecodescriptPath();
	}

	const trigger = RunLCSTrigger.from(section.get<string>(Setting.Run, RunLCSTrigger.strings.onSave));
	return {
		executable,
		executableIsUserDefined,
		trigger
	};
}

async function getLivecodescriptPath(): Promise<string | undefined> {
	try {
		return await which('livecodescript');
	} catch (e) {
		return undefined;
	}
}
