import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  getRuntime,
  isValidRuntimeId,
  listRuntimes,
} from "../src/modules/execution/runtimes";

test("registers all four supported execution runtimes", () => {
  assert.deepEqual(
    listRuntimes().map((runtime) => runtime.id).sort(),
    ["go", "node", "python", "shell"]
  );
});

test("builds workspace-scoped commands for each runtime", () => {
  assert.deepEqual(getRuntime("node").runCommand("src/index.js"), [
    "node",
    "/workspace/src/index.js",
  ]);
  assert.deepEqual(getRuntime("python").runCommand("main.py"), [
    "python3",
    "/workspace/main.py",
  ]);
  assert.deepEqual(getRuntime("go").runCommand("cmd/app/main.go"), [
    "go",
    "run",
    "/workspace/cmd/app/main.go",
  ]);
  assert.deepEqual(getRuntime("shell").runCommand("scripts/check.sh"), [
    "/bin/sh",
    "/workspace/scripts/check.sh",
  ]);
});

test("rejects workspace path traversal and malformed paths", () => {
  for (const path of [
    "../secrets.txt",
    "src/../../secrets.txt",
    "src//main.js",
    "src/./main.js",
    "",
  ]) {
    assert.throws(
      () => getRuntime("node").runCommand(path),
      /Invalid workspace file path/
    );
  }
});

test("validates runtime identifiers and falls back to shell for unknown values", () => {
  assert.equal(isValidRuntimeId("node"), true);
  assert.equal(isValidRuntimeId("python"), true);
  assert.equal(isValidRuntimeId("ruby"), false);
  assert.equal(getRuntime("unknown" as never).id, "shell");
});
