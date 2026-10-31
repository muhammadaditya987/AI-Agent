const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { test } = require('node:test');

const { HttpMetricsMiddleware } = require('../dist/monitoring/http-metrics.middleware.js');
const { MetricsController } = require('../dist/monitoring/metrics.controller.js');
const { MetricsService } = require('../dist/monitoring/metrics.service.js');

test('HTTP metrics expose bounded route labels and exclude the scrape endpoint', async () => {
  const metrics = new MetricsService();
  const middleware = new HttpMetricsMiddleware(metrics);
  const request = {
    method: 'GET',
    path: '/api/v1/runs/6fc09e',
    baseUrl: '',
    route: { path: '/api/v1/runs/:runId' },
  };
  const response = new EventEmitter();
  response.statusCode = 200;

  middleware.use(request, response, () => {});
  response.emit('finish');

  metrics.recordHttpRequest('UNBOUNDED_CUSTOM_METHOD', '/unmatched', 501, 0.001);

  const scrapeResponse = new EventEmitter();
  middleware.use(
    { ...request, path: '/metrics' },
    scrapeResponse,
    () => {},
  );
  assert.equal(scrapeResponse.listenerCount('finish'), 0);

  const exposition = await metrics.metrics();
  assert.match(exposition, /ai_agency_http_requests_total/);
  assert.match(exposition, /route="\/api\/v1\/runs\/:runId"/);
  assert.match(exposition, /status_code="200"/);
  assert.match(exposition, /method="OTHER"/);
  assert.doesNotMatch(exposition, /UNBOUNDED_CUSTOM_METHOD/);
  assert.doesNotMatch(exposition, /6fc09e/);
  assert.match(exposition, /process_cpu_seconds_total/);
  assert.match(exposition, /process_resident_memory_bytes/);
  assert.match(exposition, /nodejs_heap_size_used_bytes/);
  assert.match(exposition, /nodejs_eventloop_utilization_histogram_bucket/);
});

test('metrics controller returns the Prometheus exposition content type and body', async () => {
  const metrics = new MetricsService();
  const controller = new MetricsController(metrics);
  const response = {
    headers: {},
    body: '',
    setHeader(name, value) {
      this.headers[name] = value;
    },
    send(body) {
      this.body = body;
    },
  };

  await controller.scrape(response);

  assert.match(response.headers['Content-Type'], /^text\/plain; version=0\.0\.4/);
  assert.match(response.body, /ai_agency_http_requests_total/);
  assert.match(response.body, /process_cpu_seconds_total/);
});
