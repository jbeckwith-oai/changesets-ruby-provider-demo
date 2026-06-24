#!/usr/bin/env bash
set -euo pipefail

CHANGESETS_ROOT="${CHANGESETS_ROOT:-/Users/jbeckwith/code/changesets}"
CHANGESET_BIN="$CHANGESETS_ROOT/packages/cli/bin.js"

assert_contains() {
  local file="$1"
  local expected="$2"

  if ! grep -F "$expected" "$file" >/dev/null; then
    echo "Expected $file to contain: $expected" >&2
    exit 1
  fi
}

assert_json_version() {
  local expected="$1"
  local actual

  actual="$(node -e 'console.log(JSON.parse(require("fs").readFileSync("package.json", "utf8")).version)')"
  if [[ "$actual" != "$expected" ]]; then
    echo "Expected package.json version $expected, got $actual" >&2
    exit 1
  fi
}

assert_ruby_version() {
  local expected="$1"
  local actual

  actual="$(ruby -Ilib -e 'require "demo_ruby_gem"; print DemoRubyGem::VERSION')"
  if [[ "$actual" != "$expected" ]]; then
    echo "Expected Ruby version $expected, got $actual" >&2
    exit 1
  fi
}

echo "Using Changesets from $CHANGESETS_ROOT"

node "$CHANGESET_BIN" version

assert_contains lib/demo_ruby_gem/version.rb 'VERSION = "0.2.0"'
assert_contains demo-ruby-gem.gemspec 'spec.version = "0.2.0"'
assert_contains Gemfile.lock 'demo-ruby-gem (0.2.0)'
assert_json_version "0.1.0"
assert_ruby_version "0.2.0"

git diff -- lib/demo_ruby_gem/version.rb demo-ruby-gem.gemspec Gemfile.lock package.json

git add .
git commit -m "Version Ruby gem to 0.2.0"

node -e 'const fs = require("fs"); fs.writeFileSync(".changeset/second-release.md", "---\n\"demo-ruby-gem\": patch\n---\n\nAdd another tiny Ruby feature.\n")'
node -e 'const fs = require("fs"); const path = "lib/demo_ruby_gem.rb"; const content = fs.readFileSync(path, "utf8"); fs.writeFileSync(path, content.replace("  def self.feature_flag\n    :changesets_ruby_provider_demo\n  end\n", "  def self.feature_flag\n    :changesets_ruby_provider_demo\n  end\n\n  def self.second_feature_flag\n    :changesets_ruby_provider_demo_second_release\n  end\n"))'

git add .
git commit -m "Add second demo feature with changeset"

node "$CHANGESET_BIN" version

assert_contains lib/demo_ruby_gem/version.rb 'VERSION = "0.2.1"'
assert_contains demo-ruby-gem.gemspec 'spec.version = "0.2.1"'
assert_contains Gemfile.lock 'demo-ruby-gem (0.2.1)'
assert_json_version "0.1.0"
assert_ruby_version "0.2.1"

git diff -- lib/demo_ruby_gem/version.rb demo-ruby-gem.gemspec Gemfile.lock package.json

git add .
git commit -m "Version Ruby gem to 0.2.1"

echo "Ruby provider demo completed successfully."
