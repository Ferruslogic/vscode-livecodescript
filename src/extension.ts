'use strict';
import * as vscode from 'vscode';
//import { DocumentSymbol } from 'vscode';

import LivecodescriptValidationProvider from './features/validationProvider';
import { LivecodescriptFormattingProvider } from "./features/format";

export function activate(context: vscode.ExtensionContext) {

    let validator = new LivecodescriptValidationProvider();
    let formatProvider = new LivecodescriptFormattingProvider();
	validator.activate(context.subscriptions);
    
    context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider({ scheme: "file", language: "livecodescript" }, new livecodescriptConfigDocumentSymbolProvider()));
    context.subscriptions.push(vscode.languages.registerDefinitionProvider({ scheme: "file", language: "livecodescript" }, { provideDefinition }));
    context.subscriptions.push(vscode.languages.registerDocumentRangeFormattingEditProvider({ scheme: "file", language: "livecodescript" }, formatProvider));

}




    







function provideDefinition(document, position, token) {

   
        const fileName = document.fileName;
        // const workDir = path.dirname(fileName);
        const word = document.getText(document.getWordRangeAtPosition(position));
        //const line = document.lineAt(position);
        //const projectPath = util.getProjectPath(document);
    
        // console.log ('= = = = = enter provideddefinition method = = = =');
        ///  console.log ('filename: '+ filename); // full path of current file
        //  console.log ('workdir: '+ workdir); // directory of the current file
        // console.log ('word: '+ word); // the word of the current cursor
        // console.log ('line: ' +  line.text ）; // current cursor line
        // console.log ('projectpath: '+ projectpath); // current project directory
        //Processing only package.json file
        // if (/\/package\.json$/.test(fileName)) {
    
        const json = document.getText();
        const defPattern = new RegExp(`(((\\s)*(private|on|command|function|setprop|getprop)+(\\s))|((\\s)*(global|local|constant)+(\\s)+.*))${word}`, 'gm')
        //const defPattern = new RegExp(`(global|local|constant)`, 'gm')
    
        if (defPattern.test(json)) {  //Primero verificamos si el patron esta en el archivo (mas rapido)
            // let destPath = `${workDir}/node_modules/${word.replace(/"/g, '')}/package.json`;
            // if (fs.existsSync(destPath)) {
            // new  vscode.Position (0, 0) means to jump to the first line and first column of a file
            for (var i = 0; i < document.lineCount; i++) {
                var currentline = document.lineAt(i);
                
                if (defPattern.test(currentline.text)) {
                    return new vscode.Location(vscode.Uri.file(document.uri.fsPath), currentline.range.start);
                }
            }
        }






}






















//----------------------------------------




export class livecodescriptConfigDocumentSymbolProvider implements vscode.DocumentSymbolProvider {

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



            let symbolkind_marker = vscode.SymbolKind.Field
            let symbolkind_cmd = vscode.SymbolKind.Method
            let symbolkind_ftn = vscode.SymbolKind.Function
            let symbolkind_event = vscode.SymbolKind.Event
            let symbolkind_getprop = vscode.SymbolKind.Property
            let symbolkind_setprop = vscode.SymbolKind.Property
            let symbolkind_blockcomment = vscode.SymbolKind.String
            let symbolkind_comment = vscode.SymbolKind.String
            let symbolkind_variable = vscode.SymbolKind.Variable


            for (var i = 0; i < document.lineCount; i++) {
                var line = document.lineAt(i);

                let tokensDirty = line.text.split(/\s/)


                var tokens = tokensDirty.filter(function (el) {
                    return el != '';

                });



                ////Event (On)
                if (line.text.match(/^on\s+[\w]+/i)) {
                    handler_Symbol = new vscode.DocumentSymbol(tokens[1], tokens[2], symbolkind_event, line.range, line.range)
                    handler_Symbol.kind = symbolkind_event
                    handler_Symbol.name = tokens[1]
                    handler_Symbol.range = line.range
                    handler_Symbol.selectionRange = line.range
                    handler_Symbol.range = line.range

                    inside_handler = true

                }
                else if (line.text.match(/^end\s/)) {

                    if (inside_handler) {

                        handler_Symbol.range = new vscode.Range(handler_Symbol.range.start, line.range.end);
                        handler_Symbol.selectionRange = handler_Symbol.range

                        nodes[nodes.length - 1].push(handler_Symbol)
                        //nodes.pop()
                        inside_handler = false
                    }
                }



                ////Event (before or afer)

                if (line.text.match(/^before|^after\s+[\w]+/i)) {
                    handler_Symbol = new vscode.DocumentSymbol(tokens[1], tokens[2], symbolkind_event, line.range, line.range)
                    handler_Symbol.kind = symbolkind_cmd
                    handler_Symbol.name = tokens[1]
                    handler_Symbol.range = line.range
                    handler_Symbol.selectionRange = line.range
                    handler_Symbol.range = line.range

                    inside_handler = true

                }
                else if (line.text.match(/^end\s/)) {

                    if (inside_handler) {

                        handler_Symbol.range = new vscode.Range(handler_Symbol.range.start, line.range.end);
                        handler_Symbol.selectionRange = handler_Symbol.range

                        nodes[nodes.length - 1].push(handler_Symbol)
                        //nodes.pop()
                        inside_handler = false
                    }
                }










                //////Command
                if (line.text.match(/^command\s+[\w]+/i)) {
                    handler_Symbol = new vscode.DocumentSymbol(tokens[1], tokens[2], symbolkind_cmd, line.range, line.range)

                    inside_handler = true

                }
                else if (line.text.match(/^end\s/)) {

                    if (inside_handler) {

                        handler_Symbol.range = new vscode.Range(handler_Symbol.range.start, line.range.end);
                        handler_Symbol.selectionRange = handler_Symbol.range

                        nodes[nodes.length - 1].push(handler_Symbol)
                        //nodes.pop()
                        inside_handler = false
                    }
                }


                //////Private Command
                if (line.text.match(/^(private)\s+command\s+[\w]+/i)) {
                    handler_Symbol = new vscode.DocumentSymbol(tokens[2], tokens[3], symbolkind_cmd, line.range, line.range)



                    inside_handler = true

                }
                else if (line.text.match(/^end\s/)) {

                    if (inside_handler) {

                        handler_Symbol.range = new vscode.Range(handler_Symbol.range.start, line.range.end);
                        handler_Symbol.selectionRange = handler_Symbol.range

                        nodes[nodes.length - 1].push(handler_Symbol)
                        //nodes.pop()
                        inside_handler = false
                    }
                }







                ////Function

                if (line.text.match(/^function\s+[\w]+/i)) {
                    handler_Symbol = new vscode.DocumentSymbol(tokens[1], tokens[2], symbolkind_ftn, line.range, line.range)
                    handler_Symbol.kind = symbolkind_ftn

                    handler_Symbol.name = tokens[1]
                    handler_Symbol.range = line.range
                    handler_Symbol.selectionRange = line.range
                    handler_Symbol.range = line.range

                    inside_handler = true

                }
                else if (line.text.match(/^end\s/)) {

                    if (inside_handler) {

                        handler_Symbol.range = new vscode.Range(handler_Symbol.range.start, line.range.end);
                        handler_Symbol.selectionRange = handler_Symbol.range

                        nodes[nodes.length - 1].push(handler_Symbol)
                        //nodes.pop()
                        inside_handler = false
                    }
                }


                //////Private function
                if (line.text.match(/^(private)\s+function\s+[\w]+/i)) {
                    handler_Symbol = new vscode.DocumentSymbol(tokens[2], tokens[3], symbolkind_ftn, line.range, line.range)
                    inside_handler = true

                }
                else if (line.text.match(/^end\s/)) {

                    if (inside_handler) {

                        handler_Symbol.range = new vscode.Range(handler_Symbol.range.start, line.range.end);
                        handler_Symbol.selectionRange = handler_Symbol.range

                        nodes[nodes.length - 1].push(handler_Symbol)
                        //nodes.pop()
                        inside_handler = false
                    }
                }




                ////getprop

                if (line.text.match(/^getprop\s+[\w]+/i)) {
                    handler_Symbol = new vscode.DocumentSymbol(tokens[1], tokens[2], symbolkind_getprop, line.range, line.range)

                    inside_handler = true

                }
                else if (line.text.match(/^end\s/)) {

                    if (inside_handler) {

                        handler_Symbol.range = new vscode.Range(handler_Symbol.range.start, line.range.end);
                        handler_Symbol.selectionRange = handler_Symbol.range

                        nodes[nodes.length - 1].push(handler_Symbol)
                        //nodes.pop()
                        inside_handler = false
                    }
                }





                ////setprop
                if (line.text.match(/^setprop\s+[\w]+/i)) {
                    handler_Symbol = new vscode.DocumentSymbol(tokens[1], tokens[2], symbolkind_setprop, line.range, line.range)

                    inside_handler = true
                }
                else if (line.text.match(/^end\s/)) {
                    if (inside_handler) {
                        handler_Symbol.range = new vscode.Range(handler_Symbol.range.start, line.range.end);
                        handler_Symbol.selectionRange = handler_Symbol.range
                        nodes[nodes.length - 1].push(handler_Symbol)
                        inside_handler = false
                    }
                }






                ////block comment
                if (line.text.match(/\/\*/i)) {
                    blockcomment_Symbol = new vscode.DocumentSymbol("comment", tokens[1], symbolkind_comment, line.range, line.range)
                    inside_blockcomment = true
                }
                if (line.text.match(/\*\//i) && inside_blockcomment) {
                    if (inside_blockcomment) {
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


                ////variables
                if (line.text.match(/^\s*global|^\s*local\s+[\w]+/i)) {

                    for (var index1 in tokens) {
                        if (index1 == '0' || tokens[index1] == '=' || tokens[String(Number(index1) - 1)] == '=') continue;
                        let localvar_Symbol = new vscode.DocumentSymbol(tokens[index1], tokens[0], symbolkind_variable, line.range, line.range);

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





                /*  if (line.text.match(/^\s*global|^\s*local\s+[\w]+/i)) {
                     let variable_Symbol = new vscode.DocumentSymbol(tokens[1], tokens[2], symbolkind_variable, line.range, line.range)
  
                      if (inside_handler) {
                       //   variable_Symbol.range=  new vscode.Range(variable_Symbol.range.start, line.range.end);
                       //variable_Symbol.selectionRange=variable_Symbol.range
                          nodes[nodes.length - 1].push(variable_Symbol)
                          nodes.pop()
                          //inside_handler = false
                      }
  
  
                    //  inside_handler = true               
                      
                   
                  }*/




            }

            resolve(symbols);
        });
    }
}




