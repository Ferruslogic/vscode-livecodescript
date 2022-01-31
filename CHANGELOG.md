# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/) and this project adheres to [Semantic Versioning](http://semver.org/).


# [Unreleased]

### Fixed

- [LCB] Fixed problem with variable outlines when inline comments are present

### Added

- Minor speed improvements
- [LCB] Basic snippets
  - If
  - Repeat
  - Handlers
- [LCB] Added Outlines for properties
- [LCB] Added Outlines for constants

### Removed

- Removed obsolete code on symbol Providers

## [1.1.3] - 2022-01-28

### Fixed

- Fixed definition resolution for LCB handlers and module variables
- Removed unnecessary logs when linting LCB

## [1.1.2] - 2022-01-28

### Fixed

- Fixed LCB handler names showing extra "(" on outlines
- Fixed several problems when Linting LCB
- Extension load times improved

### Added

- Enhanced outlines
  - Private handlers now shows a 🔒 icon on outlines
  - Unsafe (LCB) handlers now shows a ⚠️ icon on outlines
  - Foreign (LCB) handlers now shows a 👽 icon on outlines
  - global (LCS) variables now shows a 🌐 icon on outlines

## [1.1.1] - 2022-01-25

### Fixed

- Fixed linting not activating when onSave mode is selected

## [1.1.0] - 2022-01-25

### Added

- Added Basic language support for Livecode Builder
- Added linting support for Livecode Builder

  - Needs Livecode server executable and lc-compiler executable configured

- Added "go to definition" support for Livecode Builder
- Added "outlines" support for Livecode Builder

### Fixed

- Fixed typos in readme
- Minor bug fixes

## [1.0.6] - 2022-01-23

### Fixed

- Fixed Typo in the readme
- Fixed LivecodeServerExecutablePath no applying correctly

### Added

- Basic documentation on Readme.md
- Added contributor guidelines
- Added code of conduct

### Removed

- Removed unused configuration entry

## [1.0.5] - 2022-01-22

### Fixed

- Fixed CI targets

## [1.0.4] - 2022-01-22

### Added

- Adds symbol definition resolution across multiple files
  - Currently only supported for opened and loaded files

### Changed

-

### Fixed

- Fixed Incorrect resolution of symbols with trailing characters
- Fixed outlines giving wrong results for inline variable value assignation
- Fixed local variables definition resolution on files different from the current document

## [1.0.3] - 2022-01-22

### Fixed

- Minor Bugfixes
