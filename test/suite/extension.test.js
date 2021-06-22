const assert = require('assert');
const { before } = require('mocha');
const vscode = require('vscode');
const path = require('path');
const { decorateSourceCode } = require("../../extension");

const testFolderLocation = "/../../test/suite/test_files/"

// function sleep(ms) {
// 	return new Promise(resolve => setTimeout(resolve, ms));
// }

let docEditor1;
let docEditor2;

let sourceCodeArray1;
let sourceCodeArray2;

const doc1SummaryIndex = 1;
const doc1ParamIndex = 3;
const doc1ReturnsIndex = 5;


suite('C# prettier docs', () => {
	vscode.window.showInformationMessage('Start all tests.');

	before(async () => {
		const uri1 = vscode.Uri.file(
			path.join(__dirname + testFolderLocation + 'TestDoc1.cs')
		);
		const document1 = await vscode.workspace.openTextDocument(uri1);
		docEditor1 = await vscode.window.showTextDocument(document1);
		sourceCodeArray1 = docEditor1.document.getText().split("\n");

		const uri2 = vscode.Uri.file(
			path.join(__dirname + testFolderLocation + 'TestDoc2.cs')
		);
		const document2 = await vscode.workspace.openTextDocument(uri2);
		docEditor2 = await vscode.window.showTextDocument(document2);
		sourceCodeArray2 = docEditor2.document.getText().split("\n");
	})

	test('should perform no decorations when there are no docs', () => {
		const sourceCodeArr = ["test", "test"];
		const decoratorOptions = [];

		decorateSourceCode(sourceCodeArr, decoratorOptions, null);

		assert.strictEqual(decoratorOptions.length, 0)
	});

	test('should perform 2 decorations per summary, 1 per param, and 1 per return', () => {
		const decoratorOptions = [];
		decorateSourceCode(sourceCodeArray1, decoratorOptions, null);

		// TestDoc1 has 1 summary, 2 params, and 1 return
		assert.strictEqual(decoratorOptions.length, 6);
	})

	test('should perform 2 decorations per summary, 1 per param, and 1 per return for multiple docs', () => {
		const decoratorOptions = [];
		decorateSourceCode(sourceCodeArray2, decoratorOptions, null);

		// TestDoc2 has 2 summary, 3 params, and 1 return
		assert.strictEqual(decoratorOptions.length, 10);
	})

	test('should perform no decoration when cursor is within the docs line', () => {
		const decoratorOptions = [];
		decorateSourceCode(sourceCodeArray1, decoratorOptions, 9);

		assert.strictEqual(decoratorOptions.length, 0);
	})

	suite("Summary docs", () => {
		test('should configure the correct text style', () => {
			const decoratorOptions = [];
			decorateSourceCode(sourceCodeArray1, decoratorOptions);

			assert.deepStrictEqual(decoratorOptions[doc1SummaryIndex].renderOptions.before.fontStyle,
				vscode.workspace.getConfiguration("csharp-prettier-docs.summary.style").get("fontStyle"))
		})


		test('should configure the correct text weight and style', () => {
			const decoratorOptions = [];
			decorateSourceCode(sourceCodeArray1, decoratorOptions);

			const weight = vscode.workspace.getConfiguration("csharp-prettier-docs.summary.style").get("fontWeight")
			const size = vscode.workspace.getConfiguration("csharp-prettier-docs.summary.style").get("fontSize")

			assert.deepStrictEqual(decoratorOptions[doc1SummaryIndex].renderOptions.before.fontWeight,
				weight + `; font-size: ${size}px;`)
		})


		test('should configure the correct text colors', () => {

			const decoratorOptions = [];
			decorateSourceCode(sourceCodeArray1, decoratorOptions);

			const color = new vscode.ThemeColor(`csPrettierDoc.summary`);

			assert.deepStrictEqual(decoratorOptions[doc1SummaryIndex].renderOptions.before.color,
				color)
		})
	})

	test('should configure the correct background color', () => {
		const decoratorOptions = [];
		decorateSourceCode(sourceCodeArray1, decoratorOptions);

		assert.deepStrictEqual(decoratorOptions[doc1SummaryIndex].renderOptions.before.backgroundColor,
			new vscode.ThemeColor("csPrettierDoc.background"))
	})

	test('should configure the correct border radius', () => {
		const decoratorOptions = [];
		decorateSourceCode(sourceCodeArray1, decoratorOptions);

		assert.deepStrictEqual(decoratorOptions[doc1SummaryIndex].renderOptions.before.borderRadius,
			vscode.workspace.getConfiguration("csharp-prettier-docs.general").get("borderRadius") + "px")
	})

	suite("Param docs", () => {
		test('should configure the correct text style', () => {
			const decoratorOptions = [];
			decorateSourceCode(sourceCodeArray1, decoratorOptions);

			assert.deepStrictEqual(decoratorOptions[doc1ParamIndex].renderOptions.before.fontStyle,
				vscode.workspace.getConfiguration("csharp-prettier-docs.param.style").get("fontStyle"))
		})


		test('should configure the correct text weight and style', () => {
			const decoratorOptions = [];
			decorateSourceCode(sourceCodeArray1, decoratorOptions);

			const weight = vscode.workspace.getConfiguration("csharp-prettier-docs.param.style").get("fontWeight")
			const size = vscode.workspace.getConfiguration("csharp-prettier-docs.param.style").get("fontSize")

			assert.deepStrictEqual(decoratorOptions[doc1ParamIndex].renderOptions.before.fontWeight,
				weight + `; font-size: ${size}px;`)
		})


		test('should configure the correct text colors', () => {
			const decoratorOptions = [];
			decorateSourceCode(sourceCodeArray1, decoratorOptions);

			const color = new vscode.ThemeColor(`csPrettierDoc.param`);

			assert.deepStrictEqual(decoratorOptions[doc1ParamIndex].renderOptions.before.color,
				color)
		})
	})

	suite("Returns docs", () => {
		test('should configure the correct text style', () => {
			const decoratorOptions = [];
			decorateSourceCode(sourceCodeArray1, decoratorOptions);

			assert.deepStrictEqual(decoratorOptions[doc1ReturnsIndex].renderOptions.before.fontStyle,
				vscode.workspace.getConfiguration("csharp-prettier-docs.returns.style").get("fontStyle"))
		})


		test('should configure the correct text weight and style', () => {
			const decoratorOptions = [];
			decorateSourceCode(sourceCodeArray1, decoratorOptions);

			const weight = vscode.workspace.getConfiguration("csharp-prettier-docs.returns.style").get("fontWeight")
			const size = vscode.workspace.getConfiguration("csharp-prettier-docs.returns.style").get("fontSize")

			assert.deepStrictEqual(decoratorOptions[doc1ReturnsIndex].renderOptions.before.fontWeight,
				weight + `; font-size: ${size}px;`)
		})


		test('should configure the correct text colors', () => {
			const decoratorOptions = [];
			decorateSourceCode(sourceCodeArray1, decoratorOptions);

			const color = new vscode.ThemeColor(`csPrettierDoc.returns`);

			assert.deepStrictEqual(decoratorOptions[doc1ReturnsIndex].renderOptions.before.color,
				color)
		})
	})
});
