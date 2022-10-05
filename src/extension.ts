'use strict';
import * as vscode from 'vscode';
//import { DocumentSymbol } from 'vscode';
import * as path from 'path';
import * as nls from 'vscode-nls';

import LivecodescriptValidationProvider from './features/livecodescript/LCSvalidationProvider';
import { LivecodescriptFormattingProvider } from "./features/livecodescript/LCSformat";
import { LivecodescriptDefinitionProvider } from "./features/livecodescript/LCSdefinitionProvider";
import { livecodescriptConfigDocumentSymbolProvider } from "./features/livecodescript/LCSsymbolProvider";
import LivecodescriptServerProvider from "./features/livecodescript/LCSserverProvider";

import LivecodebuilderValidationProvider from "./features/livecodebuilder/LCBvalidationProvider";
import { LivecodebuilderFormattingProvider } from "./features/livecodebuilder/LCBformat";
import { LivecodebuilderDefinitionProvider } from "./features/livecodebuilder/LCBdefinitionProvider";
import { livecodebuilderConfigDocumentSymbolProvider } from "./features/livecodebuilder/LCBsymbolProvider";


export function activate(context: vscode.ExtensionContext) {
    
    let validator = new LivecodescriptValidationProvider();
    let LCBuilderValidator = new LivecodebuilderValidationProvider();

    let server = new LivecodescriptServerProvider();

    let formatProvider = new LivecodescriptFormattingProvider();
    let definitionProvider = new LivecodescriptDefinitionProvider();
    let symbolProvider = new livecodescriptConfigDocumentSymbolProvider();

    
   let LCBuilderFormatProvider = new LivecodebuilderFormattingProvider();
    let LCBuilderDefinitionProvider = new LivecodebuilderDefinitionProvider();
    let LCBsymbolProvider = new livecodebuilderConfigDocumentSymbolProvider();

    LCBuilderValidator.activate(context.subscriptions);
    validator.activate(context.subscriptions);
    server.activate(context.subscriptions);


    context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider({ scheme: "file", language: "livecodescript" }, symbolProvider));
    context.subscriptions.push(vscode.languages.registerDefinitionProvider({ scheme: "file", language: "livecodescript" }, definitionProvider));
    context.subscriptions.push(vscode.languages.registerDocumentRangeFormattingEditProvider({ scheme: "file", language: "livecodescript" }, formatProvider));


    context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider({ scheme: "file", language: "livecodebuilder" }, LCBsymbolProvider));
    context.subscriptions.push(vscode.languages.registerDefinitionProvider({ scheme: "file", language: "livecodebuilder" }, LCBuilderDefinitionProvider));
    context.subscriptions.push(vscode.languages.registerDocumentRangeFormattingEditProvider({ scheme: "file", language: "livecodebuilder" }, LCBuilderFormatProvider));

}
