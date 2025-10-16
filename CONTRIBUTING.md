# Contributing to LingoFlow

Thanks for your interest in improving LingoFlow!

## Ways to contribute

- Report bugs
- Suggest features and UX improvements
- Tweak styles, accessibility, or copy
- Improve CSV parsing/validation and export
- Add new documentation

## Development

1. Fork the repo and create a branch: `feat/your-idea`
2. Make your changes (HTML/CSS/JS only; no build step).
3. Run a local static server (or open `index.html` directly).
4. Verify:
   - CSV import/export works
   - Playback (voice/speed/volume) behaves as expected
   - Familiarity persists and filters correctly
   - Light/Dark themes look good
5. Lint/format if applicable and submit a Pull Request:
   - Describe **What**, **Why**, and **How to test**
   - Add screenshots for UI changes
   - Link related issues

## Commit style

Use clear messages. Example:

- `fix: normalize CSV header matching`
- `feat: add keyboard shortcut for autoplay`
- `docs: expand help overlay`

## Code review

Maintainers will review for usability, performance, and scope. We may request changes to keep the app simple and offline-first.

By contributing, you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).