# MCP Submodule Integration

This document explains how the `tekup-mcp-servers` Git submodule is integrated into the main `Tekup` monorepo and how to manage it.

## What is a Git Submodule?

A Git submodule allows you to embed a Git repository inside another Git repository as a subdirectory. It lets you keep that repository's history separate but still track it within the parent repository. This is useful for managing dependencies or separating concerns within a larger project.

In our case, `tekup-mcp-servers` is a submodule within the `Tekup` monorepo.

## How it Works

The `tekup-mcp-servers` repository is located at `Tekup/tekup-mcp-servers`. When you clone the `Tekup` monorepo, the submodule directory will be empty initially. You need to explicitly initialize and update submodules to get their content.

## Initializing and Updating the Submodule

### First-time setup (after cloning the main monorepo):

1.  **Clone the main `Tekup` monorepo:**
    ```bash
    git clone [URL_OF_TEKUP_MONOREPO]
    cd Tekup
    ```
2.  **Initialize and update submodules:**
    ```bash
    git submodule update --init --recursive
    ```
    This command will clone the `tekup-mcp-servers` repository into the `Tekup/tekup-mcp-servers` directory.

### Updating the submodule to the latest commit from its remote:

If there are new changes in the `tekup-mcp-servers` remote repository that you want to pull into your local monorepo:

1.  **Navigate into the submodule directory:**
    ```bash
    cd Tekup/tekup-mcp-servers
    ```
2.  **Pull the latest changes:**
    ```bash
    git pull origin main # Or the relevant branch name
    ```
3.  **Navigate back to the main monorepo root:**
    ```bash
    cd ../..
    ```
4.  **Commit the submodule update in the main monorepo:**
    ```bash
    git add Tekup/tekup-mcp-servers
    git commit -m "Update tekup-mcp-servers submodule to latest"
    ```
    This commits the new reference to the submodule's commit in the main monorepo's history.

### Updating the main monorepo to a specific submodule commit:

If someone else has updated the submodule reference in the main monorepo and you pull those changes:

1.  **Pull changes in the main monorepo:**
    ```bash
    git pull origin main # Or the relevant branch name
    ```
2.  **Update the submodule to the commit referenced by the main monorepo:**
    ```bash
    git submodule update --remote
    ```
    This will checkout the specific commit of `tekup-mcp-servers` that the main `Tekup` monorepo is tracking.

## PNPM Workspace Integration

The `tekup-mcp-servers` submodule's packages are included in the main `Tekup` monorepo's PNPM workspace configuration (`pnpm-workspace.yaml`). This means that packages defined within `tekup-mcp-servers` (e.g., `tekup-mcp-servers/packages/base-mcp-server`) are recognized as part of the monorepo.

To install dependencies across the entire monorepo, including the submodule's packages:

```bash
pnpm install
```

This command should be run from the root of the `Tekup` monorepo.