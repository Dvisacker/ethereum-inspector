# Arkham CLI

A command-line interface for interacting with the Arkham Intelligence API.

## Installation

```bash
npm install -g arkham-cli
```

## Setup

You need to set your Arkham cookie as an environment variable:

```bash
export ARKHAM_COOKIE="your_cookie_here"
```

## Usage

### Fetch Entity Information

Get detailed information about an entity:

```bash
arkham info <entity-id>
```

Example:
```bash
arkham info dcfgod
```

Options:
- `-o, --output <type>`: Output format (default: "pretty")
  - `pretty`: Human-readable format
  - `json`: Raw JSON response

### Fetch Entity Addresses

Get all addresses associated with an entity:

```bash
arkham addresses <entity-id>
```

Example:
```bash
arkham addresses dcfgod
```

Options:
- `-o, --output <type>`: Output format (default: "line")
  - `line`: One address per line with label
  - `csv`: Comma-separated values
  - `json`: Raw JSON response

## Examples

### Pretty Entity Information
```bash
$ arkham info dcfgod
Name: DCF GOD
ID: dcfgod
Type: individual
Twitter: https://twitter.com/dcfgod

Tags:
- Individual
- OpenSea User (OpenSea User)
- Contract Deployer
- MultiSig Deployer
- sudoswap Pool Deployer (sudoswap Pool)
...
```

### Addresses in Line Format
```bash
$ arkham addresses dcfgod
0x123...abc DCF GOD
0x456...def DCF GOD (Wallet 2)
```

### JSON Output
```bash
$ arkham info dcfgod -o json
{
  "name": "DCF GOD",
  "id": "dcfgod",
  ...
}
```

## License

MIT 