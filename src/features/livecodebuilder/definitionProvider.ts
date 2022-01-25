import * as vscode from "vscode";
import * as cp from "child_process";
import * as path from 'path';




export class LivecodebuilderDefinitionProvider implements vscode.DefinitionProvider {

    provideDefinition(origDocument, position, token) {
        const word = origDocument.getText(origDocument.getWordRangeAtPosition(position));

         const  defPattern = new RegExp(`(((\\s)*(private|public|handler)+(\\s))|((\\s)*(private|variable|constant)+(\\s)+.*))${word}(?:\\s|$)`, 'gim');
         const  localPattern = new RegExp(`(((\\s)*(private)+(\\s))|((\\s)*(local)+(\\s)+.*))${word}(?:\\s|$)`, 'gim');
     
        
    
        const json = origDocument.getText();
        if (defPattern.test(json)) {  //Primero verificamos si el patron esta en el archivo (mas rapido)
            for (var i = 0; i < origDocument.lineCount; i++) {
                currentline = origDocument.lineAt(i);
                if (defPattern.test(currentline.text)) {
                    return new vscode.Location(vscode.Uri.file(origDocument.uri.fsPath), currentline.range.start);
                }
            }
        }
    
    
    
        for (let document of vscode.workspace.textDocuments) {
            //  if (origDocument==document) continue;
            const json = document.getText();
    
            if (defPattern.test(json)) {  //Primero verificamos si el patron esta en el archivo (mas rapido)
                for (var i = 0; i < document.lineCount; i++) {
                    var currentline = document.lineAt(i);
    
                    if (defPattern.test(currentline.text)) {
                        if (localPattern.test(currentline.text) && origDocument !== document) {
                            return;
                        } else {
                            return new vscode.Location(vscode.Uri.file(document.uri.fsPath), currentline.range.start);
                        }
                    }
                }
            }
    
        }
    
    
    
    }
    

}
