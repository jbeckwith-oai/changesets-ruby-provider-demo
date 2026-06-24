require_relative "demo_ruby_gem/version"

module DemoRubyGem
  def self.greeting
    "hello from #{VERSION}"
  end

  def self.feature_flag
    :changesets_ruby_provider_demo
  end
end
