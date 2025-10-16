# Contributing to LingoFlow

Thanks for your interest in improving LingoFlow!

## Ways to contribute

* Report bugs
* Suggest features and UX improvements
* Add new decks - this one is especially welcome!
* Tweak styles, accessibility, or copy
* Improve CSV parsing/validation and export
* Add new documentation

## Development

1. Track all issues feature requests, and new ideas in the [GitHub Issues](https://github.com/Nikolichnik/lingo-flow/issues)
2. Fork the repo and create a branch: `<issue_number>_bugfix-or-feature-or-new-idea`
3. Make your changes (HTML/CSS/JS only; no build step).
4. Run a local static server (or open `index.html` directly).
5. Verify:
   * CSV import/export works
   * Playback (voice/speed/volume) behaves as expected
   * Familiarity persists and filters correctly
   * Light/Dark themes look good
6. Lint/format if applicable and submit a Pull Request:
   * Describe **What**, **Why**, and **How to test**
   * Add screenshots for UI changes
   * Link related issues

## Commit style

Use clear messages. Add issue tags where applicable. Example:

* `#123 Normalizes CSV header matching`
* `#456 Adds keyboard shortcut for autoplay`
* `#789 Expands help overlay`

## Code review

Maintainers will review for usability, performance, and scope. We may request changes to keep the app simple and offline-first.

By contributing, you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).