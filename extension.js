// @ts-check
const vscode = require("vscode")
const JSDOM = require("jsdom");

// Get the config (not using )
let configGeneral = vscode.workspace.getConfiguration("csharp-prettier-docs.general");
let configSummary = vscode.workspace.getConfiguration("csharp-prettier-docs.summary");
let configParam = vscode.workspace.getConfiguration("csharp-prettier-docs.param");
let configReturns = vscode.workspace.getConfiguration("csharp-prettier-docs.returns");
let configOther = vscode.workspace.getConfiguration("csharp-prettier-docs.other");

function getConfigs() {
	configGeneral = vscode.workspace.getConfiguration("csharp-prettier-docs.general");
	configSummary = vscode.workspace.getConfiguration("csharp-prettier-docs.summary");
	configParam = vscode.workspace.getConfiguration("csharp-prettier-docs.param");
	configReturns = vscode.workspace.getConfiguration("csharp-prettier-docs.returns");
	configOther = vscode.workspace.getConfiguration("csharp-prettier-docs.other");
}


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
	vscode.window.onDidChangeTextEditorSelection(() => {
		if (!enabled) {
			getActiveEditor().setDecorations(decorationType, [])
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
	// For other tags
	const tagReg = /(?<=<).*?(?=>)/

	// String for the comment xml
	let docXml = "";

	// Line numbers for the tags
	let summaryIndex = -1;
	let summaryEndIndex = -1;

	/**
	 * @type {Object.<string, number[]>} lineNumber: tag
	 */
	let tagIndexes = {};

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

			let matchFound = false;

			// Store index of tag lines
			if (currentLine.match(summaryReg)) {
				summaryIndex = line;
				matchFound = true;
			}

			if (currentLine.match(summaryEndReg)) {
				summaryEndIndex = line;
				matchFound = true;
			}

			if (!matchFound) {
				let match = currentLine.match(tagReg);

				if (match) {
					const tagName = match[0].trim().split(" ")[0];

					if (tagIndexes[tagName]) {
						tagIndexes[tagName].push(line);
					} else {
						tagIndexes[tagName] = [line]
					}
				}

			}


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


				if (summaryIndex !== -1 && summaryElements[0]) {
					const summaryLines = summaryElements[0].textContent.trim().split("\n");

					const linePrefix = configSummary.get("markers.linePrefix");
					const lineSuffix = configSummary.get("markers.lineSuffix");

					const tag = configSummary.get("markers.tag")

					const blockPrefix = configGeneral.get("markers.blockPrefix");

					/// STRING EDITING

					/// DECORATIONS

					// For one line summaries
					if (summaryIndex === summaryEndIndex) {
						decorationsArray.push(...applyDecoToElement("summary", summaryLines, {
							prefix: "",
							linePrefix: "",
							lineSuffix: ""
						}, summaryIndex, indent))
					} else {
						// Apply line markers to all
						for (let i = 0; i < summaryLines.length; i++) {
							summaryLines[i] = linePrefix + tag + summaryLines[i] + lineSuffix;
						}

						// Apply block marker if exists
						if (blockPrefix !== "") {
							summaryLines.splice(0, 0, blockPrefix)
						}

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


				for (const [tag, lines] of Object.entries(tagIndexes)) {
					const tagElements = document.getElementsByTagName(tag);

					if (!tagElements || tagElements.length === 0) continue;

					lines.forEach((line, i) => {
						const element = tagElements[i];

						if (!element) return;

						const name = element.getAttribute("name");

						if (name) {
							const config = tag === "param" ? configParam : configOther;

							const prefix = config.get("markers.linePrefix");
							const suffix = config.get("markers.lineSuffix");

							let namePrefix = config.get("markers.namePrefix")
							const nameSuffix = config.get("markers.nameSuffix")

							if (tag !== "param") namePrefix = tag + namePrefix;

							const textPrefix = config.get("markers.textPrefix");
							const textSuffix = config.get("markers.textSuffix")

							const delimiter = config.get("markers.delimiter");

							decorationsArray.push(...applyDecoToNamedElement(
								tag,
								name,
								element.textContent.split("\n"),
								{
									prefix: prefix,
									suffix: suffix,
									namePrefix: namePrefix,
									nameSuffix: nameSuffix,
									textPrefix: textPrefix,
									textSuffix: textSuffix,
									delimiter: delimiter
								},
								line,
								indent))

						} else {
							const config = tag === "returns" ? configReturns : configOther;

							const returnLinePrefix = config.get("markers.linePrefix");
							const returnLineSuffix = config.get("markers.lineSuffix");

							let prefixTag = config.get("markers.tag");

							if (tag !== "returns") {
								prefixTag = tag + config.get("markers.delimiter");
							}

							decorationsArray.push(
								...applyDecoToElement(tag,
									element.textContent.split("\n"), {
									prefix: prefixTag,
									linePrefix: returnLinePrefix,
									lineSuffix: returnLineSuffix
								}, line, indent))
						}
					})
				}

			} catch (err) {
				console.log("Parse error: ")
				console.log(err)
			} finally {
				// Reset values
				docXml = ""
				summaryIndex = summaryEndIndex = -1;
				tagIndexes = {}
			}

		} else {
			// If no match is found, no need to skip because the cursor can't possibly be on an XML doc
			skipCurrent = false;
		}
	}
}

/**
 * Apply decorations for regular tag
 * @param {string} tag
 * @param {string[]} descriptionLines
 * @param {object} markers
 * @param {string} markers.prefix
 * @param {string} markers.linePrefix
 * @param {string} markers.lineSuffix
 * @param {number} line 
 * @param {number} indent 
 * @returns {vscode.DecorationOptions[]}
 */
function applyDecoToElement(tag, descriptionLines, markers, line, indent) {
	const decorationsArray = []

	descriptionLines[0] = markers.prefix + descriptionLines[0]

	for (let i = 0; i < descriptionLines.length; i++) {
		descriptionLines[i] = markers.linePrefix + descriptionLines[i] + markers.lineSuffix;
	}

	for (let i = 0; i < descriptionLines.length; i++) {
		decorationsArray.push(getDecorator(descriptionLines[i],
			getRange(line + i, indent,
				// Use return for all none standard, nameless tags
				line + 1 + i, 0), tag))
	}

	return decorationsArray;
}


/**
 * Applies decoration for a tag with a name attribute
 * @param {string} tag
 * @param {string} name
 * @param {string[]} descriptionLines
 * @param {object} markers
 * @param {string} markers.prefix
 * @param {string} markers.suffix
 * @param {string} markers.namePrefix
 * @param {string} markers.nameSuffix
 * @param {string} markers.delimiter
 * @param {string} markers.textPrefix
 * @param {string} markers.textSuffix
 * @param {number} line 
 * @param {number} indent 
 * @returns {vscode.DecorationOptions[]}
 */
function applyDecoToNamedElement(tag, name, descriptionLines, markers, line, indent) {
	const decorationsArray = []

	const nameAttr = markers.namePrefix + name + markers.nameSuffix;

	// When there is no param description
	if (descriptionLines.length === 0) {
		decorationsArray.push(getDecorator(markers.prefix + nameAttr + markers.suffix, getRange(line, indent, line + 1, 0), "param"))
		return;
	}

	descriptionLines[0] = markers.prefix + nameAttr + markers.delimiter + markers.textPrefix + descriptionLines[0];
	descriptionLines[descriptionLines.length - 1] += markers.textSuffix;

	for (let i = 1; i < descriptionLines.length; i++) {
		descriptionLines[i] = markers.prefix + " " + descriptionLines[i];
	}

	for (let i = 0; i < descriptionLines.length; i++) {
		decorationsArray.push(getDecorator(descriptionLines[i],
			getRange(line + i, indent,
				line + 1 + i, 0), tag))
	}

	return decorationsArray;
}

/**
 * Decorator for the actual comments to hide them
 */
const decorationType = vscode.window.createTextEditorDecorationType({
	opacity: `${configGeneral.get("opacity")}`
});


/**
 * Generates the decorator for params and returns
 * @param {string} message
 * @param {vscode.Range} range
 * @param {string} configurationType
 * @returns {vscode.DecorationOptions}
 */
function getDecorator(message, range, configurationType) {
	if (configurationType !== "summary" && configurationType !== "returns" && configurationType !== "param") {
		configurationType = "other";
	}

	const decoratorConfig = vscode.workspace.getConfiguration("csharp-prettier-docs." + configurationType)

	const color = new vscode.ThemeColor(`csPrettierDoc.${configurationType}`);
	const weight = decoratorConfig.get("style.fontWeight");
	const style = decoratorConfig.get("style.fontStyle");
	const fontSize = decoratorConfig.get("style.fontSize");
	return {
		range,
		renderOptions: {
			before: {
				color: color,
				contentText: message,
				backgroundColor: new vscode.ThemeColor("csPrettierDoc.background"),
				margin: `0px ${configGeneral.get("margin")}px 0px ${configGeneral.get("margin")}px;padding: ${configGeneral.get("verticalPadding")}px ${configGeneral.get(
					"horizontalPadding"
				)}px;`,
				// @ts-ignore
				opacity: "0.9",
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
