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
	// For other tags
	const otherReg = /(< *.* *>)/

	// String for the comment xml
	let docXml = "";

	// Line numbers for the tags
	let summaryIndex = -1;
	let summaryEndIndex = -1;
	let paramIndexes = [];
	let returnIndex = -1;

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
			docXml += match[0] + "\n"; // Add comment (without the triple backslash) to the docXml string

			indent = currentLine.match(/(\/\/\/)/).index; // Set indent based on index of the triple backslash

			// Store index of tag lines
			if (currentLine.match(summaryReg))
				summaryIndex = line;

			if (currentLine.match(summaryEndReg))
				summaryEndIndex = line;

			if (currentLine.match(paramReg))
				paramIndexes.push(line)
			else if (currentLine.match(returnReg))
				returnIndex = line;

			// If cursor is within line, raise skipCurrent flag to skip the decoration
			if (cursorLine && cursorLine === line) skipCurrent = true;

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

				if (summaryIndex !== -1 && summaryElements[0]) {
					const summaryLines = summaryElements[0].textContent.trim().split("\n");

					/// STRING EDITING
					// Apply line markers to all
					for (let i = 0; i < summaryLines.length; i++) {
						summaryLines[i] = configSummary.get("markers.linePrefix") + summaryLines[i] + configSummary.get("markers.lineSuffix");
					}

					// Apply block marker if exists
					if (configGeneral.get("markers.blockPrefix") !== "") {
						summaryLines.splice(0, 0, configGeneral.get("markers.blockPrefix"))
					}

					/// DECORATIONS

					// For one line summaries
					if (summaryIndex === summaryEndIndex) {
						decorationsArray.push(...applyDecoToElement("summary", summaryLines, {
							prefix: "",
							linePrefix: "",
							lineSuffix: ""
						}, summaryIndex, indent))
					} else {
						// Clear the lines until the first lines
						for (let i = 0; i < summaryEndIndex - summaryIndex - summaryLines.length + 1; i++) {
							decorationsArray.push(getRangeOptions(summaryIndex + i, 0, summaryIndex + i + 1, 0));
						}

						// Add decorator for each line of summary
						for (let i = 0; i < summaryLines.length; i++) {
							decorationsArray.push(
								getDecorator(summaryLines[i],
									// Starting from the end, go back 'length' amounts of line
									getRange(summaryEndIndex - summaryLines.length + 1 + i, indent,
										summaryEndIndex + 1 - summaryLines.length + 1 + i, 0), "summary")
							)
						}
					}


				}

				const paramPrefix = configParam.get("markers.linePrefix");
				const paramSuffix = configParam.get("markers.lineSuffix");

				const paramTextPrefix = configParam.get("markers.textPrefix");
				const paramTextSuffix = configParam.get("markers.textSuffix")

				const delimiter = configParam.get("markers.delimiter");

				paramIndexes.forEach((l, i) => {
					const paramElement = paramElements[i];

					if (!paramElement) return;

					const addedDeco = applyDecoToNamedElement(
						"param",
						paramElement.getAttribute("name"),
						paramElement.textContent.split("\n"),
						{
							prefix: paramPrefix,
							suffix: paramSuffix,
							namePrefix: configParam.get("markers.namePrefix"),
							nameSuffix: configParam.get("markers.nameSuffix"),
							textPrefix: paramTextPrefix,
							textSuffix: paramTextSuffix,
							delimiter: delimiter
						},
						l,
						indent)

					decorationsArray.push(...addedDeco)
				})

				const returnLinePrefix = configReturns.get("markers.linePrefix");
				const returnLineSuffix = configReturns.get("markers.lineSuffix");

				const returnPrefix = configReturns.get("markers.name")

				if (returnIndex !== -1 && returnElements[0]) {
					const returnLines = returnElements[0].textContent.split("\n")

					decorationsArray.push(...applyDecoToElement("returns", returnLines, {
						prefix: returnPrefix,
						linePrefix: returnLinePrefix,
						lineSuffix: returnLineSuffix
					}, returnIndex, indent))
				}
			} catch (err) {
				console.log("Parse error: ")
				console.log(err)
			} finally {
				// Reset values
				docXml = ""
				paramIndexes = []
			}

		} else {
			// If no match is found, no need to skip because the cursor can't possibly be on an XML doc
			skipCurrent = false;
		}
	}
}

/**
 * 
 * @param {string} tag
 * @param {string[]} valueLines
 * @param {string} markers.prefix
 * @param {string} markers.linePrefix
 * @param {string} markers.lineSuffix
 * @param {number} line 
 * @param {number} indent 
 * @returns {vscode.workspace.DecorationOptions[]}
 */
function applyDecoToElement(tag, valueLines, markers, line, indent) {
	const decorationsArray = []

	valueLines[0] = markers.prefix + valueLines[0]

	for (let i = 0; i < valueLines.length; i++) {
		valueLines[i] = markers.linePrefix + valueLines[i] + markers.lineSuffix;
	}

	for (let i = 0; i < valueLines.length; i++) {
		decorationsArray.push(getDecorator(valueLines[i],
			getRange(line + i, indent,
				line + 1 + i, 0), tag))
	}

	return decorationsArray;
}



/**
 * 
 * @param {string} tag
 * @param {string} name
 * @param {string[]} valueLines
 * @param {string} markers.prefix
 * @param {string} markers.suffix
 * @param {string} markers.namePrefix
 * @param {string} markers.nameSuffix
 * @param {string} markers.delimiter
 * @param {string} markers.textPrefix
 * @param {string} markers.textSuffix
 * @param {number} line 
 * @param {number} indent 
 * @returns {vscode.workspace.DecorationOptions[]}
 */
function applyDecoToNamedElement(tag, name, valueLines, markers, line, indent) {
	const decorationsArray = []

	const nameAttr = markers.namePrefix + name + markers.nameSuffix;

	// When there is no param description
	if (valueLines.length === 0) {
		decorationsArray.push(getDecorator(markers.prefix + nameAttr + markers.suffix, getRange(line, indent, line + 1, 0), tag))
		return;
	}

	valueLines[0] = markers.prefix + nameAttr + markers.delimiter + markers.textPrefix + valueLines[0];
	valueLines[valueLines.length - 1] += markers.textSuffix;

	for (let i = 1; i < valueLines.length; i++) {
		valueLines[i] = markers.prefix + " " + valueLines[i];
	}

	for (let i = 0; i < valueLines.length; i++) {
		decorationsArray.push(getDecorator(valueLines[i],
			getRange(line + i, indent,
				line + 1 + i, 0), tag))
	}

	return decorationsArray;
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
	const decoratorConfig = vscode.workspace.getConfiguration("csharp-prettier-docs." + configurationType)

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
				backgroundColor: new vscode.ThemeColor("csPrettierDoc.background"),
				margin: `0px ${configGeneral.get("margin")}px 0px ${configGeneral.get("margin")}px;padding: ${configGeneral.get("verticalPadding")}px ${configGeneral.get(
					"horizontalPadding"
				)}px;`,
				borderRadius: `${configGeneral.get("borderRadius")}px`,
				fontWeight: weight + `; font-size: ${fontSize}px;`,
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
