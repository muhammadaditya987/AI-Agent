const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { test } = require('node:test');

const workflowPath = resolve(
  __dirname,
  '../../../n8n/exports/templates/ai-content-factory.json',
);
const workflow = JSON.parse(readFileSync(workflowPath, 'utf8'));

test('n8n API calls are authenticated, bounded, and contain no embedded secrets', () => {
  const requests = workflow.nodes.filter(
    (node) => node.type === 'n8n-nodes-base.httpRequest',
  );

  assert.equal(requests.length, 4);
  for (const node of requests) {
    assert.equal(node.parameters.authentication, 'genericCredentialType');
    assert.equal(node.parameters.genericAuthType, 'httpHeaderAuth');
    assert.ok(
      Number.isInteger(node.parameters.options?.timeout) &&
        node.parameters.options.timeout > 0,
      `${node.name} must have a finite timeout`,
    );
    assert.equal(node.retryOnFail, undefined);
  }

  const serializedWorkflow = JSON.stringify(workflow);
  assert.doesNotMatch(serializedWorkflow, /sk-[A-Za-z0-9_-]{20,}/);
  assert.doesNotMatch(serializedWorkflow, /x-automation-token["']?\s*:\s*["'][^"'$]/);
});

test('workflow connections reference known nodes and contain no execution cycles', () => {
  const nodeNames = new Set(workflow.nodes.map((node) => node.name));
  const graph = new Map(
    [...nodeNames].map((name) => [name, []]),
  );

  for (const [source, outputs] of Object.entries(workflow.connections)) {
    assert.ok(nodeNames.has(source), `Unknown source node: ${source}`);

    for (const output of outputs.main ?? []) {
      for (const edge of output ?? []) {
        assert.ok(nodeNames.has(edge.node), `Unknown target node: ${edge.node}`);
        graph.get(source).push(edge.node);
      }
    }
  }

  const visiting = new Set();
  const visited = new Set();
  const visit = (node) => {
    assert.ok(!visiting.has(node), `Workflow cycle detected at ${node}`);
    if (visited.has(node)) return;

    visiting.add(node);
    for (const target of graph.get(node)) visit(target);
    visiting.delete(node);
    visited.add(node);
  };

  for (const node of nodeNames) visit(node);

  assert.equal(workflow.active, false);
});

test('generation and Notion failures route to the failure-preview path', () => {
  assert.deepEqual(
    workflow.connections['Generate Content Assets'].main[1].map(
      (edge) => edge.node,
    ),
    ['Prepare OpenAI Failure Preview'],
  );
  assert.deepEqual(
    workflow.connections['Save Project to Notion'].main[1].map(
      (edge) => edge.node,
    ),
    ['Prepare Notion Failure Preview'],
  );
});
