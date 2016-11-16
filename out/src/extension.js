'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const utils_1 = require('./helpers/utils');
const testHelper_1 = require('./helpers/testHelper');
function createButtons(context) {
    const ghciButton = vscode.window.createStatusBarItem(1, 0);
    ghciButton.text = "Load GHCi";
    ghciButton.command = "editor.ghci";
    ghciButton.show();
    const runButton = vscode.window.createStatusBarItem(1, 0);
    runButton.text = "Run file";
    runButton.command = "editor.runHaskell";
    runButton.show();
    const terminalInput = vscode.window.createStatusBarItem(1, 0);
    terminalInput.text = "Run QuickCheck";
    terminalInput.command = "editor.runQuickCheck";
    terminalInput.show();
}
function activate(context) {
    createButtons(context);
    const loadGHCi = (src) => {
        const term = vscode.window.createTerminal('Haskell GHCi');
        term.show();
        term.sendText(`node ${context.extensionPath}/src/helpers/runHelper.js ghci ${src}`);
    };
    const runHaskell = (src) => {
        const term = vscode.window.createTerminal('Haskell Run');
        term.show();
        term.sendText(`node ${context.extensionPath}/src/helpers/runHelper.js run ${src}`);
    };
    const testHaskell = (src) => {
        let counter = -1;
        var doneTesting = false;
        const loader = () => {
            counter = (counter + 1) % 4;
            const sign = ['|', '/', '-', '\\'][counter];
            if (!doneTesting)
                setTimeout(loader, 200);
            vscode.window.setStatusBarMessage(`${sign}  Running QuickCheck`, 200);
        };
        loader();
        testHelper_1.testHaskellFile(src).then(testResults => {
            doneTesting = true;
            const passed = testResults['passedTests'];
            const failed = testResults['failedTests'];
            if (failed.length > 0) {
                if (failed.length === 1) {
                    vscode.window.showErrorMessage(`${failed[0].name} test failed!`);
                }
                else {
                    vscode.window.showErrorMessage(`${failed.length} tests failed!`);
                }
            }
            else if (passed.length > 0) {
                vscode.window.showInformationMessage('All tests passed!');
            }
            else {
                vscode.window.showErrorMessage('No tests were found!');
            }
        }).catch(error => {
            vscode.window.showErrorMessage('VS Code can\'t execute this file. Check the terminal.');
            doneTesting = true;
            const errorFilePath = `${context.extensionPath}/${utils_1.guid()}.txt`;
            fs.writeFile(errorFilePath, error, 'utf-8', err => {
                const term = vscode.window.createTerminal('Haskell Tests');
                term.sendText(`cat ${errorFilePath}`);
                term.show();
                setTimeout(() => fs.unlinkSync(errorFilePath), 1000);
            });
        });
    };
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('editor.ghci', editor => {
        vscode.window.setStatusBarMessage('Loading module in GHCi...', 1000);
        loadGHCi(editor.document.uri.path);
    }));
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('editor.runHaskell', editor => {
        vscode.window.setStatusBarMessage('Running your code...', 1000);
        runHaskell(editor.document.uri.path);
    }));
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('editor.runQuickCheck', editor => {
        testHaskell(editor.document.uri.path);
    }));
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map