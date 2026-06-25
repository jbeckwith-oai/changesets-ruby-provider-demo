require_relative "demo_ruby_gem/version"

module DemoRubyGem
  def self.greeting
    "hello from #{VERSION}"
  end

  def self.feature_flag
    :changesets_ruby_provider_demo
  end

  def self.second_feature_flag
    :changesets_ruby_provider_demo_second_release
  end

  def self.release_pr_feature_flag
    :changesets_ruby_provider_release_pr_demo
  end

  def self.release_summary
    "demo-ruby-gem #{VERSION}"
  end

  def self.provider_capabilities
    [:version_file, :gemspec, :gemfile_lock]
  end
end
