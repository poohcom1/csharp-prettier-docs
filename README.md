# C# Prettier Docs

[![](https://vsmarketplacebadge.apphb.com/version/poohcom1.csharp-prettier-docs.svg)](https://marketplace.visualstudio.com/items?itemName=poohcom1.csharp-prettier-docs)

A Visual Studio Code extension that makes your C# XML docs look just a tad bit nicer.

## Features

![alt text](https://raw.githubusercontent.com/poohcom1/csharp-prettier-docs/master/cs-prettier-screenshot.png)

- (Mostly) Hides the default C# XML docs and replaces it with pretty text decorators.

- Fully customizable styling and decorative marks.

- Use the Toggle command to quickly enable/disable the extension.


## Configurations

| Name | Description | Default Value | 
| ---- | ---- | ---- | 
| `csharp-prettier-docs.general.borderRadius` | Border radius of the background card | 5 | 
| `csharp-prettier-docs.general.horizontalPadding` | Right and left padding of the background card | 4 | 
| `csharp-prettier-docs.general.margin` | Margins for the background card | 2 | 
| `csharp-prettier-docs.general.opacity` | Opacity of the actual doc comment | 0.3 | 
| `csharp-prettier-docs.general.verticalPadding` | Top and bottom padding of the background card | 1 | 
| `csharp-prettier-docs.param.markers.delimiter` | Decorative mark placed between the parameter name and description | " -- " | 
| `csharp-prettier-docs.param.markers.linePrefix` | Decorative mark placed before the param line | " │ " | 
| `csharp-prettier-docs.param.markers.lineSuffix` | Decorative mark placed after the param line | "" | 
| `csharp-prettier-docs.param.markers.namePrefix` | Decorative mark placed before the param name | "" | 
| `csharp-prettier-docs.param.markers.nameSuffix` | Decorative mark placed after the param name | "" | 
| `csharp-prettier-docs.param.markers.textPrefix` | Decorative mark placed before the param description | "" | 
| `csharp-prettier-docs.param.markers.textSuffix` | Decorative mark placed after the param description | "" | 
| `csharp-prettier-docs.param.style.fontSize` | Font size for the params decorator | 14 | 
| `csharp-prettier-docs.param.style.fontStyle` | Font style for param decorator | "normal" | 
| `csharp-prettier-docs.param.style.fontWeight` | Font weight for the params decorator | 500 | 
| `csharp-prettier-docs.returns.markers.linePrefix` | Decorative mark placed before the returns line | " ➥ " | 
| `csharp-prettier-docs.returns.markers.lineSuffix` | Decorative mark placed after the returns line | "" | 
| `csharp-prettier-docs.returns.style.fontSize` | Font size for the returns decorator | 14 | 
| `csharp-prettier-docs.returns.style.fontStyle` | Font style for return decorator | "italic" | 
| `csharp-prettier-docs.returns.style.fontWeight` | Font weight for the returns decorator | 500 | 
| `csharp-prettier-docs.summary.markers.linePrefix` | Decorative mark placed before the summary line | "═══ " | 
| `csharp-prettier-docs.summary.markers.lineSuffix` | Decorative mark placed after the summary line | " ═══" | 
| `csharp-prettier-docs.summary.style.fontSize` | Font size for the summary decorator | 15 | 
| `csharp-prettier-docs.summary.style.fontStyle` | Font style for summary decorator | "normal" | 
| `csharp-prettier-docs.summary.style.fontWeight` | Font weight for the summary decorator | 600 | 


## Colors
| Name | Description | 
| ---- | ---- | 
| `csPrettierDoc.background` | The background color of the markers | 
| `csPrettierDoc.summary` | Summary text color | 
| `csPrettierDoc.param` | Param text color | 
| `csPrettierDoc.returns` | Returns text color | 


## Commands
| Name | Description | 
| ---- | ---- | 
| `csPrettierDoc.toggle` | Toggles the pretty docs | 

## Repository

[Github](https://github.com/poohcom1/csharp-prettier-docs/)

## License

[MIT](https://github.com/poohcom1/csharp-prettier-docs/blob/master/LICENSE)

### Open-source Credits

_The text decorator and configurations were based off of [robertgr991/php-parameter-hint](https://github.com/robertgr991/php-parameter-hint)._
