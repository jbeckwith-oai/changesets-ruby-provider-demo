require_relative "demo_ruby_gem/version"

module DemoRubyGem
  def self.greeting
    "hello from #{VERSION}"
  end
end
