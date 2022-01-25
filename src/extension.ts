'use strict';
import * as vscode from 'vscode';
//import { DocumentSymbol } from 'vscode';
import * as path from 'path';
import * as nls from 'vscode-nls';

import LivecodescriptValidationProvider from './features/livecodescript/validationProvider';
import { LivecodescriptFormattingProvider } from "./features/livecodescript/format";
import { LivecodescriptDefinitionProvider } from "./features/livecodescript/definitionProvider";
import { livecodescriptConfigDocumentSymbolProvider } from "./features/livecodescript/symbolProvider";

import LivecodebuilderValidationProvider from "./features/livecodebuilder/validationProvider";
import { LivecodebuilderFormattingProvider } from "./features/livecodebuilder/format";
import { LivecodebuilderDefinitionProvider } from "./features/livecodebuilder/definitionProvider";
import { livecodebuilderConfigDocumentSymbolProvider } from "./features/livecodebuilder/symbolProvider";


export function activate(context: vscode.ExtensionContext) {
    
    let validator = new LivecodescriptValidationProvider();
    let LCBuilderValidator = new LivecodebuilderValidationProvider();
    
    let formatProvider = new LivecodescriptFormattingProvider();
    let definitionProvider = new LivecodescriptDefinitionProvider();
    let symbolProvider = new livecodescriptConfigDocumentSymbolProvider();

    
   let LCBuilderFormatProvider = new LivecodebuilderFormattingProvider();
    let LCBuilderDefinitionProvider = new LivecodebuilderDefinitionProvider();
    let LCBsymbolProvider = new livecodebuilderConfigDocumentSymbolProvider();

    LCBuilderValidator.activate(context.subscriptions);
    validator.activate(context.subscriptions);


    context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider({ scheme: "file", language: "livecodescript" }, symbolProvider));
    context.subscriptions.push(vscode.languages.registerDefinitionProvider({ scheme: "file", language: "livecodescript" }, definitionProvider));
    context.subscriptions.push(vscode.languages.registerDocumentRangeFormattingEditProvider({ scheme: "file", language: "livecodescript" }, formatProvider));


    context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider({ scheme: "file", language: "livecodebuilder" }, LCBsymbolProvider));
    context.subscriptions.push(vscode.languages.registerDefinitionProvider({ scheme: "file", language: "livecodebuilder" }, LCBuilderDefinitionProvider));
    context.subscriptions.push(vscode.languages.registerDocumentRangeFormattingEditProvider({ scheme: "file", language: "livecodebuilder" }, LCBuilderFormatProvider));

}
