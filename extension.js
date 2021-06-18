const vscode = require("vscode")
const JSDOM = require("jsdom");

// Get the config
let configGeneral;
let configSummary;
let configParam;
let configReturns;

function getConfigs() {
	configGeneral = vscode.workspace.getConfiguration("csharp-prettier-docs.general");
	configSummary = vscode.workspace.getConfiguration("csharp-prettier-docs.summary");
	configParam = vscode.workspace.getConfiguration("csharp-prettier-docs.param");
	configReturns = vscode.workspace.getConfiguration("csharp-prettier-docs.returns");
}

getConfigs();


// For disabling with the toggle command
let enabled = true;

function activate(context) {
	const getActiveEditor = () => vscode.window.activeTextEditor;

	// When switching documents
	vscode.window.onDidChangeActiveTextEditor(editor => {
		if (!enabled) {
			editor.setDecorations(decorationType, [])
			return
		};

		decorate(editor);
	})

	// When moving the cursor and highlighting
	vscode.window.onDidChangeTextEditorSelection(editor => {
		if (!enabled) {
			editor.setDecorations(decorationType, [])
			return
		};

		decorate(getActiveEditor());
	})

	// When editing text
	vscode.workspace.onDidChangeTextDocument((event) => {
		const openEditor = vscode.window.visibleTextEditors.filter(
			(editor) => editor.document.uri === event.document.uri
		)[0];

		if (!enabled) {
			openEditor.setDecorations(decorationType, [])
			return
		};

		decorate(openEditor);
	});

	// When configurations updated
	vscode.workspace.onDidChangeConfiguration(() => {
		getConfigs();

		if (!enabled) {
			getActiveEditor().setDecorations(decorationType, [])
			return
		};

		decorate(getActiveEditor());
	})

	// Add toggle command
	context.subscriptions.push(
		vscode.commands.registerCommand("csPrettierDoc.toggle", () => {
			enabled = !enabled;

			if (!enabled) {
				getActiveEditor().setDecorations(decorationType, []) // Remove decorations

				vscode.window.showInformationMessage("Disabled C# Pretty Docs!")
			} else {
				decorate(getActiveEditor())

				vscode.window.showInformationMessage("Enabled C# Pretty Docs!")
			}
		})
	)

	decorate(getActiveEditor());
}


/**
 * Decorates the C# docs in the given editors
 * @param {vscode.TextEditor} editor 
 */
function decorate(editor) {
	let sourceCode = editor.document.getText();

	if (!sourceCode || sourceCode === "") return;

	const sourceCodeArr = sourceCode.split("\n");

	// Get cursor position
	let cursorPosition = null;
	if (editor && editor.selection.isEmpty) {
		cursorPosition = editor.selection.active;
	}

	let decorationsArray = [];

	decorateSourceCode(sourceCodeArr, decorationsArray, cursorPosition.line);

	editor.setDecorations(decorationType, decorationsArray);
}

/**
 * Generates a vscode Decorator Option with only range
 * @param {number} beginLine
 * @param {number} beginColumn
 * @param {number} endLine
 * @param {number} endColumn
 * @returns {vscode.DecorationOptions}
 */
function getRangeOptions(beginLine, beginColumn, endLine, endColumn) {
	return {
		range: getRange(beginLine, beginColumn, endLine, endColumn)
	}
}

/**
 * Generates a vscode range
 * @param {number} beginLine
 * @param {number} beginColumn
 * @param {number} endLine
 * @param {number} endColumn
 * @returns {vscode.Range}
 */
function getRange(beginLine, beginColumn, endLine, endColumn) {
	return new vscode.Range(
		new vscode.Position(beginLine, beginColumn),
		new vscode.Position(endLine, endColumn)
	)
}

/**
 * Scans the lines of source code and fills up the decorationsArray with the appropriate decoration options
 * @param {string[]} sourceCodeArr Array of lines of the source code
 * @param {vscode.DecorationOptions[]} decorationsArray Array of vscode Decoration Options
 * @param {number} cursorLine Position of the cursor
 */
function decorateSourceCode(sourceCodeArr, decorationsArray, cursorLine = null) {
	const dom = new JSDOM.JSDOM("");
	const DOMParser = dom.window.DOMParser;
	const parser = new DOMParser;

	// For lines beginning with triple backslashes
	const commentRegex = /(?<=\/\/\/ +)(.*)/
	// For summary tag
	const summaryReg = /(< *summary)/
	// For summary ending tag
	const summaryEndReg = /(<\/summary)/
	// For param tag
	const paramReg = /(< *param)/
	// For return tag
	const returnReg = /(< *returns)/

	// String for the comment xml
	let docXml = "";

	// Line numbers for the tags
	let summaryLine = -1;
	let summaryEndLine = -1;
	let paramLines = [];
	let returnLine = -1;

	// Use to skip the current doc xml chunk when a cursor is found
	let skipCurrent = false;

	// The amount of indent for the doc xml chunk
	let indent = 0


	// Loop through entire code
	for (let line = 0; line < sourceCodeArr.length; line++) {
		const currentLine = sourceCodeArr[line]
		const match = currentLine.match(commentRegex); // Match triple backslash comments

		// If there's a match for comment, add comment to docXml and store other values
		if (match) {
			//print(match[0])
			docXml += match[0]; // Add comment (without the triple backslash) to the docXml string

			indent = currentLine.match(/(\/\/\/)/).index; // Set indent based on index of the triple backslash

			// Store index of tag lines
			if (currentLine.match(summaryReg))
				summaryLine = line;
			else if (currentLine.match(summaryEndReg))
				summaryEndLine = line;
			else if (currentLine.match(paramReg))
				paramLines.push(line)
			else if (currentLine.match(returnReg))
				returnLine = line;

			// If cursor is within line,  raise skipCurrent flag to skip the decoration
			if (cursorLine === line) skipCurrent = true;

		} else if (docXml !== "") {
			// If there's no match and docXml has values, xml chunk end has been reached

			// Attempt to parse the XML
			parseXML: try {
				// Skip if skipCurrent flag is raised
				if (skipCurrent) break parseXML;

				const document = parser.parseFromString("<root>" + docXml + "</root>", "text/xml");

				// Parse document for rags
				const summaryElements = document.getElementsByTagName("summary")
				const paramElements = document.getElementsByTagName("param")
				const returnElements = document.getElementsByTagName("returns")

				if (summaryLine !== -1 && summaryElements[0]) {
					const summaryText = summaryElements[0].textContent;

					// Clear the lines until the last line
					decorationsArray.push(getRangeOptions(summaryLine, 0, summaryEndLine, 0));

					decorationsArray.push(
						getDecorator(configSummary.get("decorators.linePrefix") + summaryText + configSummary.get("decorators.lineSuffix"),
							getRange(summaryEndLine, indent, summaryEndLine + 1, 0),
							"summary"
						)
					)
				}

				paramLines.forEach((l, i) => {
					const paramElement = paramElements[i];

					if (!paramElement) return;

					const paramPrefix = configParam.get("decorators.linePrefix");

					const paramName = configParam.get("decorators.namePrefix") + paramElement.getAttribute("name") + configParam.get("decorators.nameSuffix");

					let paramDescription = "";

					if (paramElement.textContent.trim() != "") {
						paramDescription += configParam.get("decorators.delimiter") + configParam.get("decorators.descriptionPrefix") + paramElement.textContent + configParam.get("decorators.descriptionSuffix")
					}

					const paramSuffix = configParam.get("decorators.lineSuffix");

					decorationsArray.push(getDecorator(paramPrefix + paramName + paramDescription + paramSuffix, getRange(l, indent, l + 1, 0), "param"))
				})

				if (returnLine !== -1 && returnElements[0]) {
					const returnText = configReturns.get("decorators.linePrefix") + returnElements[0].textContent + configReturns.get("decorators.lineSuffix");

					decorationsArray.push(getDecorator(returnText, getRange(returnLine, indent, returnLine + 1, 0), "returns"))
				}
			} catch (err) {
				console.log(err)
			} finally {
				// Reset values
				docXml = ""
				paramLines = []
			}

		} else {
			// If no match is found, no need to skip because the cursor can't possibly be on an XML doc
			skipCurrent = false;
		}
	}
}

/**
 * Decorator for the actual comments to hide them
 */
const decorationType = vscode.window.createTextEditorDecorationType({
	opacity: `${configGeneral.get("opacity")}`,
});


/**
 * Generates the decorator for params and returns
 * @param {string} message
 * @param {vscode.Range} range
 * @param {string} configurationType
 * @returns
 */
function getDecorator(message, range, configurationType) {
	const decoratorConfig = vscode.workspace.getConfiguration(configurationType)

	const color = new vscode.ThemeColor(`csPrettierDoc.${configurationType}`);
	const weight = decoratorConfig.get("style.fontWeight");
	const style = decoratorConfig.get("style.fontStyle");
	const fontSize = decoratorConfig.get("style.fontSize");
	return {
		range,
		renderOptions: {
			before: {
				opacity: "0.9",
				color: color,
				contentText: message,
				backgroundColor: new vscode.ThemeColor("csPrettierDoc.hintBackground"),
				margin: `0px 3px 0px 3px;padding: ${configGeneral.get("verticalPadding")}px ${configGeneral.get(
					"horizontalPadding"
				)}px;`,
				borderRadius: `${configGeneral.get("borderRadius")}px`,
				fontWeight: weight + `; font-size: ${fontSize} px;`,
				fontStyle: style
			},
		},
	};
}





// this method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate,
	decorateSourceCode
}
