const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Get the new version from command line argument
const newVersion = process.argv[2];
if (!newVersion) {
    console.error('Please provide a version number');
    process.exit(1);
}

// Validate version format
if (!/^\d+\.\d+\.\d+(-[a-zA-Z0-9]+(\.[0-9]+)?)?$/.test(newVersion)) {
    console.error('Invalid version format. Use semantic versioning (e.g., 0.1.0)');
    process.exit(1);
}

// Update package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

// Update CHANGELOG.md
const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');
const changelog = fs.readFileSync(changelogPath, 'utf8');

// Check if version already exists in changelog
if (changelog.includes(`## [${newVersion}]`)) {
    console.error(`Version ${newVersion} already exists in CHANGELOG.md`);
    process.exit(1);
}

// Add new version to changelog
const today = new Date().toISOString().split('T')[0];
const newChangelog = changelog.replace(
    '# Changelog',
    `# Changelog\n\n## [${newVersion}] - ${today}\n\n### Added\n- Version ${newVersion} release\n`
);
fs.writeFileSync(changelogPath, newChangelog);

// Create git tag
try {
    execSync(`git add package.json CHANGELOG.md`);
    execSync(`git commit -m "chore: bump version to ${newVersion}"`);
    execSync(`git tag -a v${newVersion} -m "Version ${newVersion}"`);
    console.log(`Successfully updated to version ${newVersion}`);
} catch (error) {
    console.error('Error creating git tag:', error.message);
    process.exit(1);
} 