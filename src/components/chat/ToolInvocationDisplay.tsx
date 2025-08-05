"use client";

import { Loader2, FileText, FilePlus, FileEdit, Trash2, FolderInput } from "lucide-react";

interface ToolInvocation {
  toolCallId: string;
  args: any;
  toolName: string;
  state: string;
  result?: string;
}

interface ToolInvocationDisplayProps {
  toolInvocation: ToolInvocation;
}

function getFileName(path: string): string {
  if (!path) return "";
  return path.split("/").pop() || path;
}

function getToolIcon(toolName: string, command?: string) {
  if (toolName === "str_replace_editor") {
    switch (command) {
      case "create":
        return FilePlus;
      case "str_replace":
      case "insert":
        return FileEdit;
      case "view":
        return FileText;
      default:
        return FileEdit;
    }
  }
  
  if (toolName === "file_manager") {
    switch (command) {
      case "delete":
        return Trash2;
      case "rename":
        return FolderInput;
      default:
        return FileText;
    }
  }
  
  return FileText;
}

function generateUserFriendlyMessage(toolName: string, args: any): string {
  if (toolName === "str_replace_editor") {
    const { command, path } = args || {};
    const fileName = getFileName(path);
    
    switch (command) {
      case "create":
        return `Creating file${fileName ? ` ${fileName}` : ""}`;
      case "str_replace":
        return `Editing file${fileName ? ` ${fileName}` : ""}`;
      case "insert":
        return `Adding content to${fileName ? ` ${fileName}` : ""}`;
      case "view":
        return `Viewing file${fileName ? ` ${fileName}` : ""}`;
      default:
        return `Working on file${fileName ? ` ${fileName}` : ""}`;
    }
  }
  
  if (toolName === "file_manager") {
    const { command, path, new_path } = args || {};
    const fileName = getFileName(path);
    
    switch (command) {
      case "delete":
        return `Deleting${fileName ? ` ${fileName}` : ""}`;
      case "rename":
        const newFileName = getFileName(new_path);
        return `Renaming${fileName ? ` ${fileName}` : ""}${newFileName ? ` to ${newFileName}` : ""}`;
      default:
        return `Managing file${fileName ? ` ${fileName}` : ""}`;
    }
  }
  
  return toolName.replace(/_/g, " ");
}

export function ToolInvocationDisplay({ toolInvocation }: ToolInvocationDisplayProps) {
  const { toolName, args, state, result } = toolInvocation;
  const isCompleted = state === "result" && result;
  const userFriendlyMessage = generateUserFriendlyMessage(toolName, args);
  const Icon = getToolIcon(toolName, args?.command);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {isCompleted ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <Icon className="w-3 h-3 text-neutral-600" />
          <span className="text-neutral-700">{userFriendlyMessage}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          <Icon className="w-3 h-3 text-neutral-600" />
          <span className="text-neutral-700">{userFriendlyMessage}</span>
        </>
      )}
    </div>
  );
}