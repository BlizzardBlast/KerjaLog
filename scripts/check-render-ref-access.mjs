import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const sourceRoot = fileURLToPath(new URL('../src', import.meta.url));
const sourceFiles = collectSourceFiles(sourceRoot);
const violations = sourceFiles.flatMap(checkFile);

if (violations.length > 0) {
  console.error(
    'Render-phase ref access is not allowed. Move ref reads and writes to effects, event handlers, or other non-render code:',
  );

  for (const violation of violations) {
    console.error(`- ${violation}`);
  }

  process.exitCode = 1;
}

function collectSourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = `${directory}/${entry.name}`;

    if (entry.isDirectory()) {
      return collectSourceFiles(path);
    }

    return /\.(?:ts|tsx)$/u.test(entry.name) ? [path] : [];
  });
}

function checkFile(path) {
  const sourceText = readFileSync(path, 'utf8');
  const sourceFile = ts.createSourceFile(
    path,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const violations = [];

  for (const statement of sourceFile.statements) {
    if (
      ts.isFunctionDeclaration(statement) &&
      statement.name &&
      statement.body &&
      isRenderFunctionName(statement.name.text)
    ) {
      collectRenderBodyViolations(statement.body, sourceFile, violations);
      continue;
    }

    if (!ts.isVariableStatement(statement)) {
      continue;
    }

    for (const declaration of statement.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.initializer &&
        isRenderFunctionName(declaration.name.text) &&
        (ts.isArrowFunction(declaration.initializer) ||
          ts.isFunctionExpression(declaration.initializer)) &&
        ts.isBlock(declaration.initializer.body)
      ) {
        collectRenderBodyViolations(
          declaration.initializer.body,
          sourceFile,
          violations,
        );
      }
    }
  }

  return violations;
}

function isRenderFunctionName(name) {
  return /^use[A-Z0-9_]/u.test(name) || /^[A-Z]/u.test(name);
}

function collectRenderBodyViolations(body, sourceFile, violations) {
  const visit = (node) => {
    if (node !== body && isNestedFunction(node)) {
      return;
    }

    if (isCurrentProperty(node)) {
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(
        node.getStart(sourceFile),
      );
      const relativePath = sourceFile.fileName
        .slice(sourceRoot.length + 1)
        .replaceAll('\\', '/');
      const accessKind = getRefAccessKind(node);
      violations.push(
        `${relativePath}:${line + 1}:${character + 1} (${accessKind})`,
      );
    }

    ts.forEachChild(node, visit);
  };

  visit(body);
}

function isNestedFunction(node) {
  return (
    ts.isArrowFunction(node) ||
    ts.isFunctionExpression(node) ||
    ts.isFunctionDeclaration(node) ||
    ts.isMethodDeclaration(node)
  );
}

function getRefAccessKind(node) {
  const parent = node.parent;

  if (
    parent &&
    ts.isBinaryExpression(parent) &&
    parent.left === node &&
    isAssignmentOperator(parent.operatorToken.kind)
  ) {
    return 'write';
  }

  if (
    parent &&
    (ts.isPrefixUnaryExpression(parent) ||
      ts.isPostfixUnaryExpression(parent)) &&
    parent.operand === node &&
    (parent.operator === ts.SyntaxKind.PlusPlusToken ||
      parent.operator === ts.SyntaxKind.MinusMinusToken)
  ) {
    return 'write';
  }

  return 'read';
}

function isAssignmentOperator(kind) {
  return (
    kind >= ts.SyntaxKind.FirstAssignment &&
    kind <= ts.SyntaxKind.LastAssignment
  );
}

function isCurrentProperty(node) {
  if (ts.isPropertyAccessExpression(node)) {
    return node.name.text === 'current';
  }

  if (!ts.isElementAccessExpression(node) || !node.argumentExpression) {
    return false;
  }

  return (
    ts.isStringLiteral(node.argumentExpression) &&
    node.argumentExpression.text === 'current'
  );
}
