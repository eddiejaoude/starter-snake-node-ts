@Basic
Feature: Make first move

    Scenario: Make a simple move
        Given I append the object "game" in the POST request to the API endpoint "/move" as "move" using:
            | id       | timeout |
            | game-123 | 500     |
        And I append the object "game.ruleset" in the POST request to the API endpoint "/move" as "move" using:
            | name     | version |
            | standard | v.1.2.3 |
        And I append the property "turn" in the POST request to the API endpoint "/move" as "move" using:
            | turn |
            | 14   |
        When I send the POST request to the API endpoint "/move" as "move"
        Then there should be a 200 response from the "move" request that contains:
            | move |
            | up   |
