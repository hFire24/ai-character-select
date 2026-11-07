// Read the same typed authoring source and validator used by the Angular preview.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../src/app/components/quizzes');
require.extensions['.ts'] = (module, filename) => {
  if (!filename.startsWith(root + path.sep)) throw new Error('Unexpected TypeScript source');
  const source = fs.readFileSync(filename, 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } });
  module._compile(compiled.outputText, filename);
};
const { QUIZ_CONTENT } = require(path.join(root, 'personality-quiz.content.ts'));
const { validateContent } = require(path.join(root, 'personality-quiz.validation.ts'));
const report = validateContent(QUIZ_CONTENT);
console.log(`Personality Girls: ${report.errors.length} structure errors; ${report.pending.length} missing/placeholder content slots.`);
report.errors.forEach(error => console.error(error));
if (!report.ready) {
  console.log('AUTHORING PREVIEW ONLY. Not ready to publish. Add owner content in personality-quiz.author.ts.');
  if (process.argv.includes('--publish')) report.pending.forEach(slot => console.error(`Pending: ${slot}`));
}
if (report.errors.length || (process.argv.includes('--publish') && !report.ready)) process.exitCode = 1;
