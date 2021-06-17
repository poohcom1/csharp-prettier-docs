const vscode = require("vscode")
const JSDOM = require("jsdom");

//Create output channel
const debug = vscode.window.createOutputChannel("CS Prettier Debug");

const DEBUG = true;

function print(message) {
	if (!DEBUG) return;
	//Write to output.
	debug.appendLine(message);
}

let enabled = true;

function activate(context) {

	const getActiveEditor = () => vscode.window.activeTextEditor;

	vscode.window.onDidChangeActiveTextEditor(editor => {
		if (!enabled) {
			editor.setDecorations(decorationType, [])
			return
		};

		decorate(editor);
	})

	vscode.window.onDidChangeTextEditorSelection(editor => {
		if (!enabled) {
			editor.setDecorations(decorationType, [])
			return
		};

		decorate(getActiveEditor());
	})

	vscode.workspace.onDidChangeTextDocument((event) => {
		const openEditor = vscode.window.visibleTextEditors.filter(
			(editor) => editor.document.uri === event.document.uri
		)[0];

		decorate(openEditor);
	});



	context.subscriptions.push(
		vscode.commands.registerCommand("csPrettierDoc.toggle", () => {
			enabled = !enabled;

			if (!enabled) {
				getActiveEditor().setDecorations(decorationType, [])
			} else {
				decorate(getActiveEditor())
			}

			print(enabled)
		})
	)

	decorate(getActiveEditor());
}

const config = vscode.workspace.getConfiguration("csPrettierDoc");


const decorationType = vscode.window.createTextEditorDecorationType({
	opacity: `${config.get("opacity")}`,
});

function summaryHint(message, range) {
	return {
		range,
		renderOptions: {
			before: {
				opacity: "1.0",
				color: new vscode.ThemeColor("csPrettierDoc.summary"),
				contentText: message,
				backgroundColor: new vscode.ThemeColor("csPrettierDoc.hintBackground"),
				margin: `0px 3px 0px 3px;padding: ${config.get("verticalPadding")}px ${config.get(
					"horizontalPadding"
				)}px;`,
				borderRadius: `${config.get("borderRadius")}px`,
				fontWeight: 500 + `; font- size: ${config.get("fontSize") + 2} px;`,
				fontStyle: "normal"
			},
		},
	};
}

function paramHint(message, range, color = "#449944",
	weight = `${config.get("fontWeight")}`,
	style = `${config.get("fontStyle")}`,
	fontSize = `${config.get("fontSize")}`) {
	return {
		range,
		renderOptions: {
			before: {
				opacity: "0.9",
				color: color,
				contentText: message,
				backgroundColor: new vscode.ThemeColor("csPrettierDoc.hintBackground"),
				margin: `0px 3px 0px 3px;padding: ${config.get("verticalPadding")}px ${config.get(
					"horizontalPadding"
				)}px;`,
				borderRadius: `${config.get("borderRadius")}px`,
				fontWeight: weight + `; font- size: ${fontSize} px;`,
				fontStyle: style
			},
		},
	};
}

function decorate(editor) {
	let sourceCode = editor.document.getText();

	if (!sourceCode || sourceCode === "") return;

	const sourceCodeArr = sourceCode.split("\n");

	let decorationsArray = [];

	matchTags(sourceCodeArr, decorationsArray);

	// matchReturns(sourceCodeArr, decorationsArray);

	//matchSummary(sourceCodeArr, decorationsArray)

	editor.setDecorations(decorationType, decorationsArray);
}


function matchTags(sourceCodeArr, decorationsArray) {
	// Create empty DOM, the imput param here is for HTML not XML, and we don want to parse HTML
	const dom = new JSDOM.JSDOM("");
	// Get DOMParser, same API as in browser
	const DOMParser = dom.window.DOMParser;
	const parser = new DOMParser;

	const regex = /(?<=\/\/\/ +)(.*)/
	const summaryReg = /(< *summary)/
	const summaryEndReg = /(<\/summary)/
	const paramReg = /(< *param)/
	const returnReg = /(< *returns)/

	let docXml = "";

	let summaryLine = -1;
	let summaryEndLine = -1;
	let paramLines = [];
	let returnLine = -1;

	let skipCurrent = false;

	let indent = 0;

	let cursorLine = null;

	// current editor
	const editor = vscode.window.activeTextEditor;

	// check if there is no selection
	if (editor.selection.isEmpty) {
		// the Position object gives you the line and character where the cursor is
		cursorLine = editor.selection.active;
		print(cursorLine.line)
	}

	for (let line = 0; line < sourceCodeArr.length; line++) {
		const currentLine = sourceCodeArr[line]
		const match = currentLine.match(regex);

		if (match) {
			//print(match[0])
			docXml += match[0];

			indent = currentLine.match(/(\/\/\/)/).index;

			if (currentLine.match(summaryReg))
				summaryLine = line;
			else if (currentLine.match(summaryEndReg))
				summaryEndLine = line;
			else if (currentLine.match(paramReg))
				paramLines.push(line)
			else if (currentLine.match(returnReg))
				returnLine = line;

			if (cursorLine.line === line) skipCurrent = true;
		} else if (docXml !== "") {
			if (skipCurrent) {
				docXml = ""
				paramLines = []
				skipCurrent = false;
				continue;
			}
			// Create document by parsing XML
			const document = parser.parseFromString("<root>" + docXml + "</root>", "text/xml");

			const summaryElements = document.getElementsByTagName("summary")
			const paramElements = document.getElementsByTagName("param")
			const returnElements = document.getElementsByTagName("returns")

			if (summaryLine !== -1) {
				const summaryText = summaryElements[0].textContent;

				decorationsArray.push({
					range: new vscode.Range(
						new vscode.Position(summaryLine + 0, 0),
						new vscode.Position(summaryEndLine, 0)
					)
				})

				decorationsArray.push(summaryHint("═══ " + summaryText + " ═══", new vscode.Range(
					new vscode.Position(summaryEndLine, indent),
					new vscode.Position(summaryEndLine + 1, 0)
				)))
			} else {
				// If no match is found, no need to skip because the cursor can't possibly be on an XML doc
				skipCurrent = false;
			}

			paramLines.forEach((l, i) => {
				const paramElement = paramElements[i];

				let paramText = " │ " + paramElement.getAttribute("name");

				if (paramElement.textContent !== "") {
					paramText += " -- " + paramElement.textContent + " - ";
				}

				decorationsArray.push(paramHint(paramText, new vscode.Range(
					new vscode.Position(l, indent),
					new vscode.Position(l + 1, 0)
				), new vscode.ThemeColor("csPrettierDoc.param"), 500, "normal"))
			})

			if (returnLine !== -1) {
				const returnText = " ➥ " + returnElements[0].textContent;

				decorationsArray.push(paramHint(returnText, new vscode.Range(
					new vscode.Position(returnLine, indent),
					new vscode.Position(returnLine + 1, 0)
				), new vscode.ThemeColor("csPrettierDoc.return")))
			}

			docXml = ""
			paramLines = []
		}
	}
}

function matchSummary(sourceCodeArr, decorationsArray) {
	const tagBegin = /(<.*summary.*>)/;
	const paramValueRegex = /(?<=\<param.*\>)/

	for (let line = 0; line < sourceCodeArr.length; line++) {
		let paramMatch = sourceCodeArr[line].match(tagBegin);

		if (paramMatch !== null && paramMatch.index !== undefined) {
			let range = new vscode.Range(
				new vscode.Position(line, 0),
				new vscode.Position(line + 1, 0)
			);

			let decoration = paramHint("", range);

			decorationsArray.push(decoration);
		}
	}
}

function matchParams(sourceCodeArr, decorationsArray) {
	const startIndex = /(\/\/\/.*)/;

	const paramValueRegex = /(?<=\<param.*\>)(.*)(?=\<\/param\>)/;
	const paramValueRegexB = /(?<=\<param.*\>)(.*)/;
	const paramValueRegexE = /(.*)(?=\<\/param\>)/;

	const paramKeyRegex = /(?<=name=\")(.*)(?=\")/;

	for (let line = 0; line < sourceCodeArr.length; line++) {
		let lineIndex = sourceCodeArr[line].match(startIndex);
		let keyMatch = sourceCodeArr[line].match(paramKeyRegex);

		let paramMatch = sourceCodeArr[line].match(paramValueRegex);
		let paramMatchB = sourceCodeArr[line].match(paramValueRegexB);
		let paramMatchE = sourceCodeArr[line].match(paramValueRegexE);

		let decoration = null;

		if (paramMatch !== null && lineIndex.index !== undefined) {
			let range = new vscode.Range(
				new vscode.Position(line, lineIndex.index),
				new vscode.Position(line + 1, 0)
			);

			decoration = paramHint("[" + keyMatch[0] + "] " + paramMatch[0], range, new vscode.ThemeColor("csPrettierDoc.param"));
		} else if (paramMatchB !== null && lineIndex.index !== undefined) {
			let range = new vscode.Range(
				new vscode.Position(line, lineIndex.index),
				new vscode.Position(line + 1, 0)
			);

			decoration = paramHint("[" + keyMatch[0] + "] " + paramMatchB[0], range, new vscode.ThemeColor("csPrettierDoc.param"));
		} else if (paramMatchE !== null && lineIndex.index !== undefined) {
			let range = new vscode.Range(
				new vscode.Position(line, lineIndex.index),
				new vscode.Position(line + 1, 0)
			);

			decoration = paramHint(" " + paramMatchE[0], range, new vscode.ThemeColor("csPrettierDoc.param"));
		}

		if (decoration)
			decorationsArray.push(decoration);
	}
}

function matchReturns(sourceCodeArr, decorationsArray) {
	const startIndex = /(\/\/\/.*)/;
	const returnValueRegex = /(?<=\<returns.*\>)(.*)(?=\<\/returns\>)/;
	const returnRegex = /(?<=\<returns\>)(.*)(?=\<\/returns\>)/;

	for (let line = 0; line < sourceCodeArr.length; line++) {
		let lineIndex = sourceCodeArr[line].match(startIndex);
		let returnMatch = sourceCodeArr[line].match(returnRegex);
		let valueMatch = sourceCodeArr[line].match(returnValueRegex);

		if (returnMatch !== null && returnMatch.index !== undefined) {
			let range = new vscode.Range(
				new vscode.Position(line, lineIndex.index),
				new vscode.Position(line + 1, 0)
			);

			let decoration = paramHint("  ⇒ " + valueMatch[0], range, new vscode.ThemeColor("csPrettierDoc.return"));

			decorationsArray.push(decoration);
		}
	}
}

// this method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
