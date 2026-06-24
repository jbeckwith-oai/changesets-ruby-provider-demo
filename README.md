# Changesets Ruby Provider Demo

This repository is a small Ruby gem used to demonstrate Changesets version-provider behavior.

It intentionally keeps `package.json` as package metadata for Changesets discovery while the Ruby provider owns Ruby version files:

- `lib/demo_ruby_gem/version.rb`
- `demo-ruby-gem.gemspec`
- `Gemfile.lock`

The evidence workflow is:

1. Start from a Ruby gem at version `0.1.0`.
2. Apply a Changesets minor release.
3. Verify Ruby files move to `0.2.0` while `package.json` remains metadata-only.
4. Apply a second patch release.
5. Verify Ruby files move from `0.2.0` to `0.2.1`.

Run the local proof script from this repository:

```sh
./scripts/run-demo.sh
```
