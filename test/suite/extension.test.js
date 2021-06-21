const assert = require('assert');
const { before, after } = require('mocha');
const vscode = require('vscode');
const path = require('path');
const { decorateSourceCode } = require("../../extension");

const testFolderLocation = "/../../test/suite/test_files/"

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

let singleDocEditor;
let doubleDocEditor;

suite('C# prettier docs', () => {
	vscode.window.showInformationMessage('Start all tests.');

	before(async () => {
		const uri1 = vscode.Uri.file(
			path.join(__dirname + testFolderLocation + 'OneXMLDoc.cs')
		);
		const document1 = await vscode.workspace.openTextDocument(uri1);
		singleDocEditor = await vscode.window.showTextDocument(document1);

		const uri2 = vscode.Uri.file(
			path.join(__dirname + testFolderLocation + 'TwoXMLDoc.cs')
		);
		const document2 = await vscode.workspace.openTextDocument(uri2);
		doubleDocEditor = await vscode.window.showTextDocument(document2);
	})

	test('should perform no decorations when there are no docs', () => {
		const sourceCodeArr = ["test", "test"];
		const decoratorOptions = [];

		decorateSourceCode(sourceCodeArr, decoratorOptions, null);

		assert.strictEqual(decoratorOptions.length, 0)
	});

	test('should perform 2 decorations per summary, 1 per param, and 1 per return', () => {
		const sourceCodeArr = singleDocEditor.document.getText().split("\n");

		const decoratorOptions = [];
		decorateSourceCode(sourceCodeArr, decoratorOptions, null);

		// OneXMLDoc has 1 summary, 2 params, and 1 return
		assert.strictEqual(decoratorOptions.length, 5, singleDocEditor);
	})

	test('should perform 2 decorations per summary, 1 per param, and 1 per return for multiple docs', () => {
		const sourceCodeArr = doubleDocEditor.document.getText().split("\n");

		const decoratorOptions = [];
		decorateSourceCode(sourceCodeArr, decoratorOptions, null);

		// OneXMLDoc has 2 summary, 3 params, and 1 return
		assert.strictEqual(decoratorOptions.length, 8, doubleDocEditor);
	})

	test('should perform no decoration when cursor is within the docs line', () => {
		const sourceCodeArr = singleDocEditor.document.getText().split("\n");

		const decoratorOptions = [];
		decorateSourceCode(sourceCodeArr, decoratorOptions, 9);

		assert.strictEqual(decoratorOptions.length, 0, singleDocEditor);
	})

	// test('should display the correct background color', () => {

	// })
});
