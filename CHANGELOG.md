# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-06-16

### Added
- Initial release
- Basic wallet analysis features
  - Transaction timing analysis
    - Busiest periods detection
    - Work/Sleep window analysis
    - Timezone inference
    - Transaction distribution patterns
  - Related wallets analysis
    - Smart detection of related wallets
    - Arkham entity/label integration
    - Scam transaction filtering
  - Interacted contracts list
    - Most frequently interacted contracts
    - Contract metadata and proxy information
  - Transfer list
    - ETH and token transfers
- Command-line interface with interactive prompts
- Excel export functionality
  - XLSX formatting and export
  - Multiple sheet exports
  - Color-coded distribution tables
- Integration with external APIs
  - Etherscan for contract verification
  - Arkham for entity data
  - HyperSync for efficient blockchain queries