
var vscode = require('vscode');
var fs = require('fs');

var ConnectionsProvider = require('./extension/ConnectionsProvider');
var connectionsProvider = new ConnectionsProvider();

var StructureProvider = require('./extension/StructureProvider');
var structureProvider = new StructureProvider();

var Config = require('./extension/action/helpers/Config.js');
var config = new Config();

var Menager = require('./extension/Menager.js');
var menager = new Menager(connectionsProvider, structureProvider);

function activate(context) {

    context.subscriptions.push(vscode.languages.registerCompletionItemProvider('sql',{
        
        provideCompletionItems(document, position, token) {
            return menager.getCompletionItem();
        },
        resolveCompletionItem(item, token) {
            return item;
        }
        
    },' '));

    config.getDatabases().then((databases) => {

        for(let index in databases){

            menager.connectPromise(databases[index].type, databases[index].host, databases[index].user, databases[index].password, databases[index].database).then((server) => {
                server.name = databases[index].name;
                menager.showStatus();
            }).catch(function(err){
                vscode.window.showErrorMessage(err);
                console.log(err);
            });
        }
    });
    
    vscode.window.registerTreeDataProvider('Table', structureProvider);

    vscode.window.registerTreeDataProvider('Connections', connectionsProvider);

    addCommand(context, 'extension.queryBuild');

    addCommand(context, 'extension.runQueryBuild');

    addCommand(context, 'extension.saveConfig');
    
    addCommand(context, 'extension.changeDB');
    
    addCommand(context, 'extension.changeServer');
    
    addCommand(context, 'extension.connectToSQLServer');

    addCommand(context, 'extension.querySQL');

    addTextEditorCommand(context, 'extension.querySelectedSQL');

}
exports.activate = activate;

function addCommand(context, name) {
    const func = getCommandFunction(name);
    const command = vscode.commands.registerCommand(name, func);
    context.subscriptions.push(command);
}

function addTextEditorCommand(context, name) {
    const func = getCommandFunction(name);
    const command = vscode.commands.registerTextEditorCommand(name, func);
    context.subscriptions.push(command);
}

function getCommandFunction(name) {
    const actionClass = require('./extension/action/' + name + '.js');
    const actionObject = new actionClass(menager);
    return actionObject.execution.bind(actionObject);
}

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;