Feature: Initialize pew CLI project

  Scenario: Initialize project in an empty directory
    Given I am in a clean temporary directory
    When I run `pew init`
    Then the user should not be prompted to overwrite configuration
    And the command should succeed

  Scenario: Initialize project when .pew directory exists
    Given I am in a clean temporary directory
    And a .pew directory exists
    When I run `pew init`
    Then the user should be prompted to overwrite configuration
    # We can't easily automate answering the prompt here when spawning the process
    # So we'll just check that the prompt appears. Further interaction (like answering 'y' or 'n')
    # would require more complex stdin manipulation or direct function calls with mocking. 