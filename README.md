# C# Prettier Docs

[![](https://vsmarketplacebadge.apphb.com/version-short/poohcom1.csharp-prettier-docs.svg)](https://marketplace.visualstudio.com/items?itemName=poohcom1.csharp-prettier-docs)

A Visual Studio Code extension that makes your C# XML docs look just a tad bit nicer.

## Features

![alt text](https://raw.githubusercontent.com/poohcom1/csharp-prettier-docs/master/cs-prettier-screenshot.png)

- Hides the default C# XML docs and replaces it with pretty text decorators.

- Use the Toggle command to quickly enable/disable the extension.

- Edit the look and feel of the decorators through various settings.

## Configurations

| Name                                                      | Description                                                       | Default Value |
| --------------------------------------------------------- | ----------------------------------------------------------------- | ------------- |
| `csharp-prettier-docs.general.borderRadius`               | Border radius of the background card                              | 5             |
| `csharp-prettier-docs.general.horizontalPadding`          | Right and left padding of the background card                     | 4             |
| `csharp-prettier-docs.general.margin`                     | Marins for the background card                                    | 2             |
| `csharp-prettier-docs.general.opacity`                    | Opacity of the actual doc comment                                 | 0.3           |
| `csharp-prettier-docs.general.verticalPadding`            | Top and bottom padding of the background card                     | 1             |
| `csharp-prettier-docs.param.decorators.delimiter`         | Decorative mark placed between the parameter name and description | " "           |
| `csharp-prettier-docs.param.decorators.descriptionPrefix` | Decorative mark placed before the param description               | ""            |
| `csharp-prettier-docs.param.decorators.descriptionSuffix` | Decorative mark placed after the param description                | ""            |
| `csharp-prettier-docs.param.decorators.linePrefix`        | Decorative mark placed before the param line                      | " │ "         |
| `csharp-prettier-docs.param.decorators.lineSuffix`        | Decorative mark placed after the param line                       | ""            |
| `csharp-prettier-docs.param.decorators.namePrefix`        | Decorative mark placed before the param name                      | " {"          |
| `csharp-prettier-docs.param.decorators.nameSuffix`        | Decorative mark placed after the param name                       | "}"           |
| `csharp-prettier-docs.param.style.fontSize`               | Font size for the params decorator                                | 13            |
| `csharp-prettier-docs.param.style.fontStyle`              | Font style for param decorator                                    | "normal"      |
| `csharp-prettier-docs.param.style.fontWeight`             | Font weight for the params decorator                              | 500           |
| `csharp-prettier-docs.returns.decorators.linePrefix`      | Decorative mark placed before the returns line                    | " ➥ "         |
| `csharp-prettier-docs.returns.decorators.lineSuffix`      | Decorative mark placed after the returns line                     | ""            |
| `csharp-prettier-docs.returns.style.fontSize`             | Font size for the returns decorator                               | 13            |
| `csharp-prettier-docs.returns.style.fontStyle`            | Font style for return decorator                                   | "italic"      |
| `csharp-prettier-docs.returns.style.fontWeight`           | Font weight for the returns decorator                             | 500           |
| `csharp-prettier-docs.summary.decorators.linePrefix`      | Decorative mark placed before the summary line                    | "═══ "        |
| `csharp-prettier-docs.summary.decorators.lineSuffix`      | Decorative mark placed after the summary line                     | " ═══"        |
| `csharp-prettier-docs.summary.style.fontSize`             | Font size for the summary decorator                               | 15            |
| `csharp-prettier-docs.summary.style.fontStyle`            | Font style for summary decorator                                  | "normal"      |
| `csharp-prettier-docs.summary.style.fontWeight`           | Font weight for the summary decorator                             | 600           |

---

## Repository

[Github](https://github.com/poohcom1/csharp-prettier-docs/)

## License

[MIT](https://github.com/poohcom1/csharp-prettier-docs/blob/master/LICENSE)

### Open-source Credits

_The text decorator and configurations were based off of [robertgr991/php-parameter-hint](https://github.com/robertgr991/php-parameter-hint)._
