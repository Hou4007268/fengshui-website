<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
$method = $_SERVER['REQUEST_METHOD'] ?? 'CLI';
if ($method === 'OPTIONS') { http_response_code(204); exit; }
if ($method !== 'POST' && $method !== 'CLI') {
  http_response_code(405);
  echo json_encode(['success' => false, 'error' => ['code' => 'METHOD_NOT_ALLOWED', 'message' => 'POST required']], JSON_UNESCAPED_UNICODE);
  exit;
}
$raw = file_get_contents('php://input');
if ($method === 'CLI' && !$raw) {
  $raw = stream_get_contents(STDIN);
}
$payload = json_decode($raw, true);
if (!is_array($payload)) {
  http_response_code(400);
  echo json_encode(['success' => false, 'error' => ['code' => 'INVALID_JSON', 'message' => 'Invalid JSON payload']], JSON_UNESCAPED_UNICODE);
  exit;
}
$required = ['gender', 'calendar_mode', 'is_deceased', 'allow_approximation'];
$missing = [];
foreach ($required as $k) {
  if (!array_key_exists($k, $payload)) $missing[] = $k;
}
if ($missing) {
  http_response_code(400);
  echo json_encode(['success' => false, 'error' => ['code' => 'INPUT_INVALID', 'message' => 'Missing required fields', 'extra' => ['missing_fields' => $missing]]], JSON_UNESCAPED_UNICODE);
  exit;
}
$base = '/opt/bazi-tool-web';
$tmpIn = tempnam(sys_get_temp_dir(), 'bazi_in_');
file_put_contents($tmpIn, json_encode($payload, JSON_UNESCAPED_UNICODE));
$cmd = 'bash -lc ' . escapeshellarg('cd ' . $base . ' && source ./bootstrap_env.sh >/dev/null 2>&1 && python3 ./bazi_cli.py --mode compute-basic --input ' . escapeshellarg($tmpIn));
$output = [];
$exit = 0;
exec($cmd . ' 2>&1', $output, $exit);
@unlink($tmpIn);
if ($exit !== 0) {
  http_response_code(500);
  echo json_encode(['success' => false, 'error' => ['code' => 'BAZI_CLI_FAILED', 'message' => 'CLI execution failed', 'extra' => ['output' => implode("\n", $output)]]], JSON_UNESCAPED_UNICODE);
  exit;
}
$jsonText = implode("\n", $output);
$result = json_decode($jsonText, true);
if (!is_array($result)) {
  http_response_code(500);
  echo json_encode(['success' => false, 'error' => ['code' => 'BAZI_BAD_OUTPUT', 'message' => 'CLI returned invalid JSON', 'extra' => ['output' => $jsonText]]], JSON_UNESCAPED_UNICODE);
  exit;
}
echo json_encode(['success' => true, 'mode' => 'compute-basic', 'result' => $result], JSON_UNESCAPED_UNICODE);
