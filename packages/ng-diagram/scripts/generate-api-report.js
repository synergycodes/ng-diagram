import { Extractor, ExtractorConfig } from '@microsoft/api-extractor';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const extractorConfig = ExtractorConfig.loadFileAndPrepare(join(rootDir, 'api-extractor.json'));

const isCI = process.env.CI === 'true';

console.log(isCI ? 'Checking API report...' : 'Generating API report...');

const extractorResult = Extractor.invoke(extractorConfig, {
  localBuild: !isCI,
  showVerboseMessages: false,
  showDiagnostics: true,
});

const { errorCount, warningCount, apiReportChanged } = extractorResult;

if (warningCount > 0) {
  console.warn(`\n⚠️  Encountered ${warningCount} warnings`);
}

if (errorCount > 0) {
  console.error(`\n❌ Encountered ${errorCount} errors`);
  console.error('Common issues:');
  console.error('  - Missing @public, @beta, or @experimental tags on exported APIs');
  console.error('  - Exported types that reference non-exported types');
  console.error('  - Circular dependencies in type definitions\n');
  process.exit(1);
}

if (apiReportChanged) {
  if (isCI) {
    console.error('\n❌ API report has changed!');
    console.error('Run `pnpm api:update`, review and commit the changes.\n');
    process.exit(1);
  } else {
    console.log('\n⚠️  API report updated. Review and commit the changes.\n');
  }
}

console.log('✅ API Extractor completed successfully');
