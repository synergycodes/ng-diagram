import { Extractor, ExtractorConfig } from '@microsoft/api-extractor';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const extractorConfig = ExtractorConfig.loadFileAndPrepare(join(rootDir, 'api-extractor.json'));

const isCI = process.env.CI === 'true';

console.log(isCI ? 'Checking API report...' : 'Generating API report...');

const extractorResult = Extractor.invoke(extractorConfig, {
  localBuild: !isCI, // Allow updates locally, not in CI
  showVerboseMessages: false,
  showDiagnostics: true,
});

if (extractorResult.succeeded) {
  console.log('✅ API Extractor completed successfully');

  if (extractorResult.apiReportChanged) {
    if (isCI) {
      console.error('\n❌ API report has changed!');
      console.error('The public API surface has been modified.');
      console.error('If this is intentional:');
      console.error('  1. Run: pnpm api:update');
      console.error('  2. Review changes in api-report/ng-diagram.api.md');
      console.error('  3. Commit the updated API report');
      console.error('  4. Document breaking changes in CHANGELOG.md\n');
      process.exit(1);
    } else {
      console.log('\n⚠️  API report has been updated');
      console.log('Review changes: git diff api-report/ng-diagram.api.md');
      console.log('Commit the updated report with your changes\n');
    }
  } else {
    console.log('No API changes detected');
  }

  process.exit(0);
} else {
  console.error('\n❌ API Extractor completed with errors');
  console.error(`Encountered ${extractorResult.errorCount} errors`);
  console.error(`Encountered ${extractorResult.warningCount} warnings\n`);

  if (extractorResult.errorCount > 0) {
    console.error('Common issues:');
    console.error('  - Missing @public, @beta, or @experimental tags on exported APIs');
    console.error('  - Exported types that reference non-exported types');
    console.error('  - Circular dependencies in type definitions\n');
  }

  process.exit(1);
}
