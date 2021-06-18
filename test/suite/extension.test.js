const assert = require('assert');
const vscode = require('vscode');
const path = require('path')
const { decorateSourceCode } = require("../../extension");

const testFolderLocation = "/../../test/suite/test_files/"

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

suite('C# prettier docs', () => {
	vscode.window.showInformationMessage('Start all tests.');


	test('should perform no decorations when there are no docs', () => {
		const sourceCodeArr = ["test", "test"];
		const decoratorOptions = [];

		decorateSourceCode(sourceCodeArr, decoratorOptions, null);

		assert.strictEqual(decoratorOptions.length, 0)
	});

	test('should perform 2 decorations per summary, 1 per param, and 1 per return', async () => {
		const uri = vscode.Uri.file(
			path.join(__dirname + testFolderLocation + 'OneXMLDoc.cs')
		)
		const document = await vscode.workspace.openTextDocument(uri)
		const editor = await vscode.window.showTextDocument(document)

		sleep(500);

		const sourceCodeArr = editor.document.getText().split("\n");

		const decoratorOptions = [];
		decorateSourceCode(sourceCodeArr, decoratorOptions, null);

		assert.strictEqual(decoratorOptions.length, 5, editor);
	})

	test('should perform no decoration when cursor is within the docs line', async () => {
		const uri = vscode.Uri.file(
			path.join(__dirname + testFolderLocation + 'OneXMLDoc.cs')
		)
		const document = await vscode.workspace.openTextDocument(uri)
		const editor = await vscode.window.showTextDocument(document)

		sleep(500);

		const sourceCodeArr = editor.document.getText().split("\n");

		const decoratorOptions = [];
		decorateSourceCode(sourceCodeArr, decoratorOptions, 9);

		assert.strictEqual(decoratorOptions.length, 0, editor);
	})
});
