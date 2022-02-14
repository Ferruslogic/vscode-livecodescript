# VS Code support for Livecode language

[![CI](https://github.com/ferruslogic/vscode-livecodescript/actions/workflows/ci.yml/badge.svg)](https://github.com/ferruslogic/vscode-livecodescript/actions/workflows/ci.yml) [![CI](https://badgen.net/vs-marketplace/v/ferruslogic.livecodescript)](https://marketplace.visualstudio.com/items?itemName=ferruslogic.livecodescript)

# Features

Lots of new improvements happening! We now have a [Changelog](CHANGELOG.md)

## General Features

Learn more about the rich features of the Livecode extension:

- Linting
- Format your code
- Syntax highlighting
- Go to definition (across opened documents)
- Outline
- Breadcrumbs
- Livecode builder support

## Usage

Install the [VSCode Livecode Extension](https://marketplace.visualstudio.com/items?itemName=FerrusLogic.livecodescript).

**This extension requires Livecode server in order to support linting and formatting**.

Download and install livecode-server. When the plugin is loaded it will ask for Livecode-server executable.

Search for 'Livecode Server Executable Path' in VSCode configuration.

## Livecode builder (LCB) support

LiveCode Builder is a variant of the current LiveCode scripting language (LiveCode Script) which has been designed for 'systems' building. It is statically compiled with optional static typing and direct foreign code interconnect.
To use the lcb linter you must configure the lc-compile executable. Search for 'Livecodebuilder: LCBCompiler Path' and 'Livecodebuilder: LCBDependencies Path' on VScode configuration.

## Contributing

Contributions are welcome. Read more at [Contribute](CONTRIBUTING.md)

# License

[BSD 3](LICENSE.md) &copy; FerrusLogic
