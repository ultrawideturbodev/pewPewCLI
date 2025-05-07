## v0.4.1

### Bug fixes
- Fixed TypeScript type compatibility error in `YamlService.writeYamlFile` method to properly handle any type of object serialization
- Updated generic type parameters in `YamlService` to allow serialization of DTOs without requiring index signatures 

## v0.4.2

### Bug fixes
- Fixed missing `chalk` dependency in package.json that was causing module not found errors 