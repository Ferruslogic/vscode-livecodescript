import * as vscode from "vscode";
import * as cp from "child_process";
import * as path from 'path';


const enum Setting {
	LivecodeServerExecutablePath = 'livecodescript.validate.LivecodeServerExecutablePath',
}


export class LivecodescriptFormattingProvider implements vscode.DocumentRangeFormattingEditProvider {
    public async provideDocumentRangeFormattingEdits(
        document: vscode.TextDocument,
        range: vscode.Range,
        options: vscode.FormattingOptions,
        token: vscode.CancellationToken
    ): Promise<vscode.TextEdit[]> {
        
        // if perltidy is not defined, then skip the formatting
        let config = vscode.workspace.getConfiguration('livecodescript');
        let executable = config.get("LivecodeServerExecutablePath", "");
        let formatter = config.get("formatter.enable");

        if (!vscode.workspace.getConfiguration('livecodescript').get("LivecodeServerExecutablePath") || !formatter) {
            return [];
        }

        return new Promise<vscode.TextEdit[]>((resolve, reject) => {
            if (range.start.line !== range.end.line) {
                range = range.with(
                    range.start.with(range.start.line, 0),
                    range.end.with(range.end.line, Number.MAX_VALUE)
                );
            }

            let config = vscode.workspace.getConfiguration('livecodescript');
            let executable = config.get("LivecodeServerExecutablePath", "");
            let indentation = config.get("indentation", "");
            let indentationSize = config.get("indentationSize", "");

            let args: string[] = [
                path
                    .resolve(__dirname, "../../../tools/Formatter.lc")
                    .replace(/[\\]+/g, "/"),
                "-scope=.source.livecodescript",
                `-indentation=${indentation}`,
                `-indentationSize=${indentationSize}`,
            ];

          /*  let container = config.get("perltidyContainer", "");
            if (container !== "") {
                args = ["exec", "-i", container, executable].concat(args);
                executable = "docker";
            }*/

            let text = document.getText(range);
            let child = cp.spawn(executable, args, {
                cwd: vscode.workspace.rootPath
            });
            child.stdin.write(text);
            child.stdin.end();

            let stdout = "";
            child.stdout.on("data", (out: Buffer) => {
                stdout += out.toString();
            });

            let stderr = "";
            child.stderr.on("data", (out: Buffer) => {
                stderr += out.toString();
            });

            let error: Error;
            child.on("error", (err: Error) => {
                error = err;
            });

            child.on("close", (code, signal) => {
                let message = "";

                if (error) {
                    message = error.message;
                } else if (stderr) {
                    message = stderr;
                } else if (code !== 0) {
                    message = stdout;
                }

                if (code !== 0) {
                    message = message.trim();
                    let formatted = `Could not format, code: ${code}, error: ${message}`;
                    reject(formatted);
                } else {
                    if (!text.endsWith("\n")) {
                        stdout = stdout.slice(0, -1); // remove trailing newline
                    }
                    resolve([new vscode.TextEdit(range, stdout)]);
                }
            });
        }).catch(reason => {
            console.error(reason);
            return [];
        });
    }
}
