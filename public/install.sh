#!/usr/bin/env bash
# iTE One-Shot Installer
#   curl -fsSL https://ite.kiishi.space/install.sh | sh
#
# Detects OS/arch, downloads the correct iTE release,
# verifies the checksum, and installs to ~/.ite/bin/ite.
#
# Environment overrides:
#   ITE_INSTALL_MANIFEST_URL   - override manifest URL for dev/testing
#   ITE_INSTALL_DIR            - override install directory
#   ITE_INSTALL_VERSION        - pin a specific version
#   ITE_INSTALL_SKIP_PATH      - skip PATH modification

set -eu
if (set -o pipefail) 2>/dev/null; then
    set -o pipefail
fi

# ── Configuration ────────────────────────────────────────────
ITE_MANIFEST_URL="${ITE_INSTALL_MANIFEST_URL:-https://ite.kiishi.space/releases/manifest.json}"
ITE_MANAGED_ROOT="${ITE_INSTALL_DIR:-$HOME/.ite}"
ITE_APP_DIR="${ITE_MANAGED_ROOT}/app"
ITE_BIN_DIR="${ITE_MANAGED_ROOT}/bin"
ITE_EXECUTABLE="${ITE_BIN_DIR}/ite"
ITE_APP_EXECUTABLE="${ITE_APP_DIR}/ite/ite"

# ── Terminal helpers ─────────────────────────────────────────
# Avoid dim text for user-visible output. Some terminals render it too dark.
BOLD=""; GREEN=""; YELLOW=""; RED=""; CYAN=""; RESET=""
if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
    BOLD="\033[1m"
    GREEN="\033[32m"; YELLOW="\033[33m"
    RED="\033[31m"; CYAN="\033[36m"
    RESET="\033[0m"
fi

info()    { printf "  %b\n" "$*"; }
success() { printf "  ${GREEN}✓${RESET} %b\n" "$*"; }
warn()    { printf "  ${YELLOW}!${RESET} %b\n" "$*" >&2; }
error()   { printf "  ${RED}✗${RESET} %b\n" "$*" >&2; }
detail()  { printf "    %-10s %b\n" "$1" "$2"; }
location() { printf "  ${CYAN}→${RESET} Location: ${BOLD}%b${RESET}\n" "$1"; }

# ── Spinner ──────────────────────────────────────────────────
spinner() {
    local pid="$1"
    local msg="$2"
    local frames="⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠧ ⠇ ⠏"
    local frame

    while kill -0 "$pid" 2>/dev/null; do
        for frame in $frames; do
            printf "\r  %s %b" "$frame" "$msg" >&2
            sleep 0.1
            if ! kill -0 "$pid" 2>/dev/null; then
                break
            fi
        done
    done

    wait "$pid"
}

finish_spinner() {
    printf "\r%80s\r" "" >&2
}

file_size() {
    if [ -f "$1" ]; then
        wc -c < "$1" 2>/dev/null | tr -d ' '
    else
        echo 0
    fi
}

format_bytes() {
    awk -v bytes="${1:-0}" 'BEGIN {
        if (bytes >= 1073741824) printf "%.1fGB", bytes / 1073741824;
        else if (bytes >= 1048576) printf "%.1fMB", bytes / 1048576;
        else if (bytes >= 1024) printf "%.1fKB", bytes / 1024;
        else printf "%dB", bytes;
    }'
}

format_progress() {
    awk -v current="${1:-0}" -v total="${2:-0}" 'BEGIN {
        if (total >= 1073741824) {
            printf "%.1f/%.1fGB", current / 1073741824, total / 1073741824;
        } else if (total >= 1048576) {
            printf "%.1f/%.1fMB", current / 1048576, total / 1048576;
        } else if (total >= 1024) {
            printf "%.1f/%.1fKB", current / 1024, total / 1024;
        } else {
            printf "%d/%dB", current, total;
        }
    }'
}

download_spinner() {
    local pid="$1"
    local archive_path="$2"
    local total_size="${3:-0}"
    local frames="⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠧ ⠇ ⠏"
    local frame current progress
    local last_current=0

    while kill -0 "$pid" 2>/dev/null; do
        for frame in $frames; do
            current=$(file_size "$archive_path")
            if [ "$current" -lt "$last_current" ] 2>/dev/null; then
                current="$last_current"
            else
                last_current="$current"
            fi
            if [ -n "$total_size" ] && [ "$total_size" -gt 0 ] 2>/dev/null; then
                progress=$(format_progress "$current" "$total_size")
            else
                progress=$(format_bytes "$current")
            fi
            printf "\r  %s Downloading %s%20s" "$frame" "$progress" "" >&2
            sleep 0.1
            if ! kill -0 "$pid" 2>/dev/null; then
                break
            fi
        done
    done

    wait "$pid"
}

# ── Banner ───────────────────────────────────────────────────
show_banner() {
    printf "\n"
    printf "  ${CYAN}██╗████████╗███████╗${RESET}\n"
    printf "  ${CYAN}╚═╝╚══██╔══╝██╔════╝${RESET}\n"
    printf "  ${CYAN}██╗   ██║   █████╗  ${RESET}\n"
    printf "  ${CYAN}██║   ██║   ██╔══╝  ${RESET}\n"
    printf "  ${CYAN}██║   ██║   ███████╗${RESET}\n"
    printf "  ${CYAN}╚═╝   ╚═╝   ╚══════╝${RESET}\n"
    printf "\n"
}

# ── OS / Arch detection ──────────────────────────────────────
detect_target() {
    local os arch

    case "$(uname -s)" in
        Darwin)  os="darwin" ;;
        Linux)   os="linux" ;;
        *)
            error "Unsupported operating system: $(uname -s)"
            error "iTE supports macOS and Linux. Windows: use install.ps1"
            exit 1
            ;;
    esac

    case "$(uname -m)" in
        arm64|aarch64) arch="arm64" ;;
        x86_64|amd64)  arch="x64" ;;
        *)
            error "Unsupported architecture: $(uname -m)"
            exit 1
            ;;
    esac

    echo "${os}-${arch}"
}

# Convert target to human-friendly display name
target_to_display() {
    local target="$1"
    local os="${target%-*}"
    local arch="${target#*-}"

    case "$os" in
        darwin) os="macOS" ;;
        linux)  os="Linux" ;;
        win32)  os="Windows" ;;
    esac

    case "$arch" in
        arm64) arch="Apple Silicon" ;;
        x64)   arch="Intel" ;;
    esac

    echo "${os} ${arch}"
}

# ── Dependency checks ────────────────────────────────────────
check_deps() {
    local missing=""
    for cmd in curl tar; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            missing="$missing $cmd"
        fi
    done
    if [ -n "$missing" ]; then
        error "Missing required tools:${missing}"
        error "Please install them and try again."
        exit 1
    fi
}

# ── Fetch manifest ───────────────────────────────────────────
fetch_manifest() {
    local manifest_json manifest_tmp curl_pid
    manifest_tmp=$(mktemp)

    curl -fsSL --connect-timeout 10 --max-time 60 "$ITE_MANIFEST_URL" > "$manifest_tmp" 2>/dev/null &
    curl_pid=$!

    if ! spinner "$curl_pid" "Checking latest release"; then
        finish_spinner
        rm -f "$manifest_tmp"
        error "Could not reach release server"
        error "URL: $ITE_MANIFEST_URL"
        error "Check your internet connection or try again later."
        exit 1
    fi

    finish_spinner
    manifest_json=$(cat "$manifest_tmp")
    rm -f "$manifest_tmp"
    echo "$manifest_json"
}

# ── Check existing install ───────────────────────────────────
check_existing() {
    local target="$1"
    local version="$2"
    local sha256="$3"
    local stamp_file="${ITE_MANAGED_ROOT}/.sha256"

    if [ -f "$ITE_APP_EXECUTABLE" ]; then
        local installed_sha256=""
        if [ -f "$stamp_file" ]; then
            installed_sha256=$(head -1 "$stamp_file")
        fi

        if [ -n "$sha256" ] && [ "$installed_sha256" = "$sha256" ]; then
            success "iTE ${BOLD}v${version}${RESET} is already installed"
            location "$ITE_EXECUTABLE"
            ensure_path
            exit 0
        fi

        if [ -n "$installed_sha256" ]; then
            info "Existing iTE build differs; refreshing"
        else
            info "Existing iTE install found; refreshing"
        fi
    fi
}

# ── Download and verify ──────────────────────────────────────
download_artifact() {
    local url="$1"
    local sha256_expected="$2"
    local archive_path="$3"

    local curl_pid

    curl -fsSL --connect-timeout 10 --max-time 1800 --retry 3 --retry-delay 5 \
        -C - -o "$archive_path" \
        "$url" 2>/dev/null &
    curl_pid=$!

    if ! download_spinner "$curl_pid" "$archive_path"; then
        finish_spinner
        error "Download failed"
        rm -f "$archive_path"
        exit 1
    fi

    finish_spinner

    local size
    size=$(ls -lh "$archive_path" 2>/dev/null | awk '{print $5}')
    success "Downloaded ${size}"

    if [ -n "$sha256_expected" ] && command -v shasum >/dev/null 2>&1; then
        local sha256_actual sha_pid sha_tmp
        sha_tmp=$(mktemp)
        shasum -a 256 "$archive_path" > "$sha_tmp" &
        sha_pid=$!
        if ! spinner "$sha_pid" "Verifying download"; then
            finish_spinner
            rm -f "$sha_tmp" "$archive_path"
            error "Checksum verification failed"
            exit 1
        fi
        finish_spinner
        sha256_actual=$(awk '{print $1}' "$sha_tmp")
        rm -f "$sha_tmp"
        if [ "$sha256_actual" != "$sha256_expected" ]; then
            error "Checksum mismatch"
            error "Expected: $sha256_expected"
            error "Got:      $sha256_actual"
            rm -f "$archive_path"
            exit 1
        fi
        success "Verified download"
    elif [ -n "$sha256_expected" ] && command -v sha256sum >/dev/null 2>&1; then
        local sha256_actual sha_pid sha_tmp
        sha_tmp=$(mktemp)
        sha256sum "$archive_path" > "$sha_tmp" &
        sha_pid=$!
        if ! spinner "$sha_pid" "Verifying download"; then
            finish_spinner
            rm -f "$sha_tmp" "$archive_path"
            error "Checksum verification failed"
            exit 1
        fi
        finish_spinner
        sha256_actual=$(awk '{print $1}' "$sha_tmp")
        rm -f "$sha_tmp"
        if [ "$sha256_actual" != "$sha256_expected" ]; then
            error "Checksum mismatch"
            error "Expected: $sha256_expected"
            error "Got:      $sha256_actual"
            rm -f "$archive_path"
            exit 1
        fi
        success "Verified download"
    fi
}

# ── Install ──────────────────────────────────────────────────
install_artifact() {
    local archive_path="$1"
    local archive_type="$2"
    local executable_name="$3"
    local sha256="$4"
    local version="$5"

    mkdir -p "$ITE_BIN_DIR"

    local tmp_extract
    tmp_extract=$(mktemp -d /tmp/ite-install.XXXXXX)
    trap "rm -rf $tmp_extract" EXIT

    if [ "$archive_type" = "tar.gz" ]; then
        local tar_pid
        tar -xzf "$archive_path" -C "$tmp_extract" &
        tar_pid=$!
        if ! spinner "$tar_pid" "Unpacking iTE"; then
            finish_spinner
            error "Archive extraction failed"
            exit 1
        fi
        finish_spinner
        success "Unpacked iTE"
    else
        error "Unsupported archive type: $archive_type"
        exit 1
    fi

    local extracted_dir
    extracted_dir=$(find "$tmp_extract" -maxdepth 1 -mindepth 1 -type d | head -1)

    if [ ! -d "$extracted_dir" ]; then
        error "Archive extraction produced unexpected layout"
        exit 1
    fi

    local install_pid
    (
        rm -rf "${ITE_APP_DIR:?}"
        mkdir -p "$ITE_APP_DIR"
        mkdir -p "$ITE_BIN_DIR"

        # Copy extracted directory contents into ITE_APP_DIR
        cp -R "$extracted_dir"/* "$ITE_APP_DIR"/

        # Create symlink for PATH: ~/.ite/bin/ite -> ../app/ite/ite
        ln -sf ../app/ite/ite "$ITE_EXECUTABLE"
        chmod +x "$ITE_APP_EXECUTABLE" 2>/dev/null || true

        if [ -n "$sha256" ]; then
            echo "$sha256" > "${ITE_MANAGED_ROOT}/.sha256"
        fi
    ) &
    install_pid=$!

    if ! spinner "$install_pid" "Installing iTE v${version}"; then
        finish_spinner
        error "Install failed"
        exit 1
    fi

    finish_spinner

    success "Installed iTE v${version}"
    location "$ITE_EXECUTABLE"
}

# ── PATH management ──────────────────────────────────────────
ensure_path() {
    if [ "${ITE_INSTALL_SKIP_PATH:-}" = "1" ]; then
        return
    fi

    if echo "$PATH" | tr ':' '\n' | grep -qxF "$ITE_BIN_DIR"; then
        return
    fi

    local shell_profile=""
    local shell_name
    shell_name=$(basename "${SHELL:-/bin/sh}")

    case "$shell_name" in
        zsh)
            if [ -f "$HOME/.zshrc" ]; then
                shell_profile="$HOME/.zshrc"
            elif [ -f "$HOME/.zprofile" ]; then
                shell_profile="$HOME/.zprofile"
            fi
            ;;
        bash)
            if [ -f "$HOME/.bash_profile" ]; then
                shell_profile="$HOME/.bash_profile"
            elif [ -f "$HOME/.bashrc" ]; then
                shell_profile="$HOME/.bashrc"
            elif [ -f "$HOME/.profile" ]; then
                shell_profile="$HOME/.profile"
            fi
            ;;
        *)
            if [ -f "$HOME/.profile" ]; then
                shell_profile="$HOME/.profile"
            fi
            ;;
    esac

    local path_line="export PATH=\"\$HOME/.ite/bin:\$PATH\""

    if [ -n "$shell_profile" ]; then
        if grep -qF ".ite/bin" "$shell_profile" 2>/dev/null; then
            return
        fi
        printf '\n# iTE\n%s\n' "$path_line" >> "$shell_profile"
        success "Added iTE to PATH"
        detail "Profile" "$shell_profile"
        detail "Reload" "source ${shell_profile}"
    else
        warn "Could not detect shell profile to update PATH."
        echo ""
        echo "  Add this to your shell profile:"
        echo "  ${path_line}"
        echo ""
    fi
}

# ── Main ─────────────────────────────────────────────────────
main() {
    show_banner

    check_deps

    local target
    target=$(detect_target)

    local display_name
    display_name=$(target_to_display "$target")
    success "Detected ${BOLD}${display_name}${RESET}"

    local manifest_json
    manifest_json=$(fetch_manifest)

    # Parse manifest
    local version url sha256 archive_type executable_name
    if command -v jq >/dev/null 2>&1; then
        local manifest_tmp
        manifest_tmp=$(mktemp)
        printf '%s' "$manifest_json" > "$manifest_tmp"
        version=$(jq -r '.version' "$manifest_tmp")
        url=$(jq -r ".assets[\"$target\"].url" "$manifest_tmp")
        sha256=$(jq -r ".assets[\"$target\"].sha256" "$manifest_tmp")
        archive_type=$(jq -r ".assets[\"$target\"].archiveType" "$manifest_tmp")
        executable_name=$(jq -r ".assets[\"$target\"].executable" "$manifest_tmp")
        rm -f "$manifest_tmp"
    elif command -v python3 >/dev/null 2>&1; then
        local manifest_tmp parsed_tmp
        manifest_tmp=$(mktemp)
        parsed_tmp=$(mktemp)
        printf '%s' "$manifest_json" > "$manifest_tmp"
        python3 -c "
import json, sys
with open(sys.argv[1], 'r', encoding='utf-8') as f:
    m = json.load(f)
a = m['assets'].get(sys.argv[2], {})
print(
    m.get('version', ''),
    a.get('url', ''),
    a.get('sha256', ''),
    a.get('archiveType', 'tar.gz'),
    a.get('executable', 'ite'),
    sep=chr(10))
" "$manifest_tmp" "$target" > "$parsed_tmp"
        {
            read -r version
            read -r url
            read -r sha256
            read -r archive_type
            read -r executable_name
        } < "$parsed_tmp"
        rm -f "$manifest_tmp" "$parsed_tmp"
    else
        error "Need jq or python3 to parse the release manifest"
        exit 1
    fi

    if [ -z "$url" ] || [ "$url" = "null" ]; then
        error "No build available for: ${target}"
        error "Supported: darwin-arm64, darwin-x64, linux-x64"
        exit 1
    fi

    version="${ITE_INSTALL_VERSION:-$version}"
    success "Release found ${BOLD}v${version}${RESET}"

    check_existing "$target" "$version" "$sha256"

    local archive_ext="tar.gz"
    [ "$archive_type" = "zip" ] && archive_ext="zip"
    local archive_name="ite-${version}-${target}.${archive_ext}"
    local archive_path="/tmp/${archive_name}"

    rm -f "$archive_path"

    download_artifact "$url" "$sha256" "$archive_path"

    install_artifact "$archive_path" "$archive_type" "$executable_name" "$sha256" "$version"
    ensure_path

    rm -f "$archive_path"

    echo ""
    success "Ready? Run ${BOLD}ite${RESET}"
    echo ""
}

main "$@"
