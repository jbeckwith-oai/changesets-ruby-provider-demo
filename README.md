# Changesets Ruby Provider Demo

This repository is a small Ruby gem used to demonstrate Changesets version-provider behavior.

It intentionally keeps `package.json` as package metadata for Changesets discovery while the Ruby provider owns Ruby version files:

- `lib/demo_ruby_gem/version.rb`
- `demo-ruby-gem.gemspec`
- `Gemfile.lock`

The evidence workflow is:

1. Start from the `demo-start` tag, where the Ruby gem is at version `0.1.0` and has a pending minor changeset.
2. Run `changeset version`.
3. Verify Ruby files move to `0.2.0` while `package.json` remains metadata-only at `0.1.0`.
4. Commit a second Ruby change and patch changeset.
5. Run `changeset version` again.
6. Verify Ruby files move from `0.2.0` to `0.2.1`, proving Changesets reads the current Ruby provider version instead of stale `package.json` metadata.

Run the local proof script from this repository:

```sh
CHANGESETS_ROOT=/path/to/changesets ./scripts/run-demo.sh
```

When run from the final repository state, the script creates a temporary git worktree at `demo-start` and replays both release cycles there.

## What To Inspect

The committed history is part of the evidence:

```sh
git log --oneline --decorate --reverse
git diff demo-start..HEAD -- lib/demo_ruby_gem/version.rb demo-ruby-gem.gemspec Gemfile.lock package.json
```

Expected proof points:

- `lib/demo_ruby_gem/version.rb`, `demo-ruby-gem.gemspec`, and `Gemfile.lock` advance from `0.1.0` to `0.2.0`, then to `0.2.1`.
- `package.json` remains at `0.1.0`.
- The second release is `0.2.1`, not `0.1.1`, showing the Ruby provider supplies the current version for release-plan calculation.

## GitHub Actions

The `Ruby provider proof` workflow runs on pushes and pull requests in this demo repository. It can also be run manually against any Changesets branch, tag, SHA, or pull-request ref.

By default, the workflow checks out:

- repository: `jbeckwith-oai/changesets`
- ref: `main`

For manual runs, set the workflow inputs to the Changesets repository and ref you want to test. For example, to test a Changesets pull request from the upstream repository, use:

- repository: `changesets/changesets`
- ref: `pull/<PR_NUMBER>/head`
