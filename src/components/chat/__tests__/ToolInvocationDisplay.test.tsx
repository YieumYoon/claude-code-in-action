import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationDisplay } from "../ToolInvocationDisplay";

afterEach(() => {
  cleanup();
});

test("displays user-friendly message for str_replace_editor create command", () => {
  const toolInvocation = {
    toolCallId: "test-id",
    args: { command: "create", path: "/App.jsx" },
    toolName: "str_replace_editor",
    state: "result",
    result: "Success",
  };

  render(<ToolInvocationDisplay toolInvocation={toolInvocation} />);

  expect(screen.getByText("Creating file App.jsx")).toBeDefined();
});

test("displays user-friendly message for str_replace_editor edit command", () => {
  const toolInvocation = {
    toolCallId: "test-id",
    args: { command: "str_replace", path: "/components/Button.tsx" },
    toolName: "str_replace_editor",
    state: "result",
    result: "Success",
  };

  render(<ToolInvocationDisplay toolInvocation={toolInvocation} />);

  expect(screen.getByText("Editing file Button.tsx")).toBeDefined();
});

test("displays user-friendly message for str_replace_editor insert command", () => {
  const toolInvocation = {
    toolCallId: "test-id",
    args: { command: "insert", path: "/utils/helpers.js" },
    toolName: "str_replace_editor",
    state: "result",
    result: "Success",
  };

  render(<ToolInvocationDisplay toolInvocation={toolInvocation} />);

  expect(screen.getByText("Adding content to helpers.js")).toBeDefined();
});

test("displays user-friendly message for str_replace_editor view command", () => {
  const toolInvocation = {
    toolCallId: "test-id",
    args: { command: "view", path: "/README.md" },
    toolName: "str_replace_editor",
    state: "result",
    result: "Success",
  };

  render(<ToolInvocationDisplay toolInvocation={toolInvocation} />);

  expect(screen.getByText("Viewing file README.md")).toBeDefined();
});

test("displays user-friendly message for file_manager delete command", () => {
  const toolInvocation = {
    toolCallId: "test-id",
    args: { command: "delete", path: "/old-file.txt" },
    toolName: "file_manager",
    state: "result",
    result: "Success",
  };

  render(<ToolInvocationDisplay toolInvocation={toolInvocation} />);

  expect(screen.getByText("Deleting old-file.txt")).toBeDefined();
});

test("displays user-friendly message for file_manager rename command", () => {
  const toolInvocation = {
    toolCallId: "test-id",
    args: { 
      command: "rename", 
      path: "/old-name.js", 
      new_path: "/new-name.js" 
    },
    toolName: "file_manager",
    state: "result",
    result: "Success",
  };

  render(<ToolInvocationDisplay toolInvocation={toolInvocation} />);

  expect(screen.getByText("Renaming old-name.js to new-name.js")).toBeDefined();
});

test("shows loading state for uncompleted tool invocation", () => {
  const toolInvocation = {
    toolCallId: "test-id",
    args: { command: "create", path: "/App.jsx" },
    toolName: "str_replace_editor",
    state: "processing",
  };

  const { container } = render(<ToolInvocationDisplay toolInvocation={toolInvocation} />);

  expect(screen.getByText("Creating file App.jsx")).toBeDefined();
  
  const loadingIcon = container.querySelector(".animate-spin");
  expect(loadingIcon).toBeDefined();
});

test("shows completed state with green dot for completed tool invocation", () => {
  const toolInvocation = {
    toolCallId: "test-id",
    args: { command: "create", path: "/App.jsx" },
    toolName: "str_replace_editor",
    state: "result",
    result: "Success",
  };

  const { container } = render(<ToolInvocationDisplay toolInvocation={toolInvocation} />);

  expect(screen.getByText("Creating file App.jsx")).toBeDefined();
  
  const greenDot = container.querySelector(".bg-emerald-500");
  expect(greenDot).toBeDefined();
  
  const loadingIcon = container.querySelector(".animate-spin");
  expect(loadingIcon).toBeNull();
});

test("handles nested file paths correctly", () => {
  const toolInvocation = {
    toolCallId: "test-id",
    args: { command: "create", path: "/src/components/ui/Button.tsx" },
    toolName: "str_replace_editor",
    state: "result",
    result: "Success",
  };

  render(<ToolInvocationDisplay toolInvocation={toolInvocation} />);

  expect(screen.getByText("Creating file Button.tsx")).toBeDefined();
});

test("handles unknown str_replace_editor command gracefully", () => {
  const toolInvocation = {
    toolCallId: "test-id",
    args: { command: "unknown_command", path: "/test.js" },
    toolName: "str_replace_editor",
    state: "result",
    result: "Success",
  };

  render(<ToolInvocationDisplay toolInvocation={toolInvocation} />);

  expect(screen.getByText("Working on file test.js")).toBeDefined();
});

test("handles unknown file_manager command gracefully", () => {
  const toolInvocation = {
    toolCallId: "test-id",
    args: { command: "unknown_command", path: "/test.js" },
    toolName: "file_manager",
    state: "result",
    result: "Success",
  };

  render(<ToolInvocationDisplay toolInvocation={toolInvocation} />);

  expect(screen.getByText("Managing file test.js")).toBeDefined();
});

test("handles unknown tool name gracefully", () => {
  const toolInvocation = {
    toolCallId: "test-id",
    args: { some: "args" },
    toolName: "unknown_tool_name",
    state: "result",
    result: "Success",
  };

  render(<ToolInvocationDisplay toolInvocation={toolInvocation} />);

  expect(screen.getByText("unknown tool name")).toBeDefined();
});

test("handles missing path in args", () => {
  const toolInvocation = {
    toolCallId: "test-id",
    args: { command: "create" },
    toolName: "str_replace_editor",
    state: "result",
    result: "Success",
  };

  render(<ToolInvocationDisplay toolInvocation={toolInvocation} />);

  expect(screen.getByText("Creating file")).toBeDefined();
});

test("handles empty path in args", () => {
  const toolInvocation = {
    toolCallId: "test-id",
    args: { command: "create", path: "" },
    toolName: "str_replace_editor",
    state: "result",
    result: "Success",
  };

  render(<ToolInvocationDisplay toolInvocation={toolInvocation} />);

  expect(screen.getByText("Creating file")).toBeDefined();
});

test("handles missing args gracefully", () => {
  const toolInvocation = {
    toolCallId: "test-id",
    args: undefined,
    toolName: "str_replace_editor",
    state: "result",
    result: "Success",
  };

  render(<ToolInvocationDisplay toolInvocation={toolInvocation} />);

  expect(screen.getByText("Working on file")).toBeDefined();
});

test("displays correct styling classes", () => {
  const toolInvocation = {
    toolCallId: "test-id",
    args: { command: "create", path: "/App.jsx" },
    toolName: "str_replace_editor",
    state: "result",
    result: "Success",
  };

  const { container } = render(<ToolInvocationDisplay toolInvocation={toolInvocation} />);

  const mainContainer = container.firstChild as HTMLElement;
  expect(mainContainer.className).toContain("inline-flex");
  expect(mainContainer.className).toContain("items-center");
  expect(mainContainer.className).toContain("gap-2");
  expect(mainContainer.className).toContain("mt-2");
  expect(mainContainer.className).toContain("px-3");
  expect(mainContainer.className).toContain("py-1.5");
  expect(mainContainer.className).toContain("bg-neutral-50");
  expect(mainContainer.className).toContain("rounded-lg");
  expect(mainContainer.className).toContain("text-xs");
  expect(mainContainer.className).toContain("border");
  expect(mainContainer.className).toContain("border-neutral-200");
});

test("shows appropriate icon for different commands", () => {
  const createToolInvocation = {
    toolCallId: "test-id",
    args: { command: "create", path: "/App.jsx" },
    toolName: "str_replace_editor",
    state: "result",
    result: "Success",
  };

  const { container: createContainer } = render(
    <ToolInvocationDisplay toolInvocation={createToolInvocation} />
  );

  const deleteToolInvocation = {
    toolCallId: "test-id",
    args: { command: "delete", path: "/App.jsx" },
    toolName: "file_manager",
    state: "result",
    result: "Success",
  };

  cleanup();
  const { container: deleteContainer } = render(
    <ToolInvocationDisplay toolInvocation={deleteToolInvocation} />
  );

  expect(createContainer.querySelector("svg")).toBeDefined();
  expect(deleteContainer.querySelector("svg")).toBeDefined();
});