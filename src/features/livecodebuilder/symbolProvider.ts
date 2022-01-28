import * as vscode from "vscode";


export class livecodebuilderConfigDocumentSymbolProvider implements vscode.DocumentSymbolProvider {

    private format(cmd: string): string {
        return cmd.substr(1).toLowerCase().replace(/^\w/, c => c.toUpperCase())
    }



    public provideDocumentSymbols(
        document: vscode.TextDocument,
        token: vscode.CancellationToken): Promise<vscode.DocumentSymbol[]> {
        return new Promise((resolve, reject) => {
            let symbols: vscode.DocumentSymbol[] = [];
            let nodes = [symbols]
            var line = document.lineAt(1);

            let handler_Symbol = new vscode.DocumentSymbol("start", "start", vscode.SymbolKind.Method, line.range, line.range)
            let blockcomment_Symbol = new vscode.DocumentSymbol("start", "start", vscode.SymbolKind.Method, line.range, line.range)



            let inside_handler = false
            let inside_blockcomment = false



            let symbolkind_module = vscode.SymbolKind.Module
            let symbolkind_marker = vscode.SymbolKind.Field
            let symbolkind_private_handler = vscode.SymbolKind.Method
            let symbolkind_ftn = vscode.SymbolKind.Function
            let symbolkind_public_handler = vscode.SymbolKind.Method
            let symbolkind_getprop = vscode.SymbolKind.Property
            let symbolkind_setprop = vscode.SymbolKind.Property
            let symbolkind_blockcomment = vscode.SymbolKind.String
            let symbolkind_comment = vscode.SymbolKind.String
            let symbolkind_variable = vscode.SymbolKind.Variable

            let re = /([(=\"])/gi;
            var lineText;

            for (var i = 0; i < document.lineCount; i++) {
                var line = document.lineAt(i);
                lineText = line.text.replace(re, " $1 ");

                let tokensDirty = lineText.split(/[\s]+/)


                var tokens = tokensDirty.filter(function (el) {
                    return el != '';

                });



                ////use
                if (lineText.match(/^\s*(use)\s+/)) {
                    handler_Symbol = new vscode.DocumentSymbol(tokens[1], '', symbolkind_module, line.range, line.range)
                    nodes[nodes.length - 1].push(handler_Symbol)
                }



                ////Foreign Handler
                /*   if (lineText.match(/^\s*(public\s*)?(__safe\s*)?(foreign\s*){1}(handler)\s+/)) {
                       let thandlerName = tokens[2];
   
                       if (tokens[0] == 'public') thandlerName = tokens[2];
                       
   
                       handler_Symbol = new vscode.DocumentSymbol(thandlerName, '', symbolkind_public_handler, line.range, line.range)
                  
                       if (inside_handler) {
                           handler_Symbol.children.push(handler_Symbol)
                       }
                       else {
                           nodes[nodes.length - 1].push(handler_Symbol)
                       }
                  
                   }*/



                   // TODO extent to LCS symbolprovider

                ////Handler
                if (lineText.match(/^\s*(public\s+)?(private\s+)?(unsafe\s+)?(handler)\s+/)) {
                    let tNameDepth = 0;
                    let tIcons = '';

                    for (var index1 in tokens) {
                        if (tokens[index1] == "public") {
                            ++tNameDepth;
                        } else if (tokens[index1] == "private") {
                            ++tNameDepth;
                            tIcons += '🔒';
                        } else if (tokens[index1] == "unsafe") {
                            ++tNameDepth;
                            tIcons += '⚠️';
                        }
                    }
                    handler_Symbol = new vscode.DocumentSymbol(tokens[tNameDepth+1], tIcons, symbolkind_public_handler, line.range, line.range)
                    inside_handler = true
                }
                else if (lineText.match(/^\s*end\s+handler\s*/)) {
                    if (inside_handler) {
                        handler_Symbol.range = new vscode.Range(handler_Symbol.range.start, line.range.end);
                        handler_Symbol.selectionRange = handler_Symbol.range
                        nodes[nodes.length - 1].push(handler_Symbol)
                        //nodes.pop()
                        inside_handler = false
                    }
                }


                ////Foreign Handlers --managed independently since they'r single lined
                if (lineText.match(/^\s*(public\s+)?(__safe\s+)?(private\s+)?(foreign)\s+(handler)\s+/)) {
                    let tNameDepth = 0;
                    let tIcons = '⚠️';

                    for (var index1 in tokens) {
                        if (tokens[index1] == "public") {
                            ++tNameDepth;
                        } else if (tokens[index1] == "foreign") {
                            ++tNameDepth;
                            tIcons += '👽';
                        } else if (tokens[index1] == "private") {
                            ++tNameDepth;
                            tIcons += '🔒';
                        } else if (tokens[index1] == "__safe") {
                            ++tNameDepth;
                            tIcons.replace("⚠️.*","🛡️");
                            tIcons = tIcons.replace(/⚠️/, "🛡️");
                        }
                    }
                    handler_Symbol = new vscode.DocumentSymbol(tokens[tNameDepth+1], tIcons, symbolkind_public_handler, line.range, line.range)
                    nodes[nodes.length - 1].push(handler_Symbol)
                }
        


                ////block comment
                //           if (lineText.match(/\/\*/i)) {
                //              blockcomment_Symbol = new vscode.DocumentSymbol("comment", tokens[1], symbolkind_comment, line.range, line.range)
                //              inside_blockcomment = true
                //           }
                //           if (lineText.match(/\*\//i) && inside_blockcomment) {
                /*             if (inside_blockcomment) {
                                 blockcomment_Symbol.range = new vscode.Range(blockcomment_Symbol.range.start, line.range.end);
                                 blockcomment_Symbol.selectionRange = blockcomment_Symbol.range
                                 if (inside_handler) {
                                     handler_Symbol.children.push(blockcomment_Symbol)
                                 }
                                 else {
                                     nodes[nodes.length - 1].push(blockcomment_Symbol)
                                 }
                                 inside_blockcomment = false
                             }
                         }
         */

                ////variables
                if (lineText.match(/(^\s*private\s*variable|^\s*variable)\s+[\w]+/)) {
                    let tInQuotes: Boolean = false;

                    for (var index1 in tokens) {
                        if (tokens[index1] == "\"") tInQuotes = !tInQuotes;
                        if (tInQuotes == true || index1 == '0' || tokens[index1] == '=' || tokens[index1] == '"' || tokens[String(Number(index1) - 1)] == '=' || tokens[index1] == ',') continue;
                        if (tokens[index1] == 'variable') { continue; }
                        if (tokens[index1] == 'as') { break; }

                        let localvar_Symbol = new vscode.DocumentSymbol(tokens[index1], '', symbolkind_variable, line.range, line.range);

                        if (inside_blockcomment) {


                        }
                        else {
                            localvar_Symbol.range = new vscode.Range(localvar_Symbol.range.start, line.range.end);
                            localvar_Symbol.selectionRange = localvar_Symbol.range
                            if (inside_handler) {
                                handler_Symbol.children.push(localvar_Symbol)
                            }
                            else {
                                nodes[nodes.length - 1].push(localvar_Symbol)
                            }

                        }
                    }

                }







            }

            resolve(symbols);
        });
    }
}


