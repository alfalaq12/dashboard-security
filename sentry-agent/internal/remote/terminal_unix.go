//go:build !windows
// +build !windows

package remote

import (
	"os"
	"os/exec"
	"syscall"

	"github.com/creack/pty"
)

// Terminal wraps a pseudo-terminal for Unix systems
type Terminal struct {
	cmd *exec.Cmd
	pty *os.File
}

// NewTerminal creates a new terminal with the specified size
func NewTerminal(cols, rows int) (*Terminal, error) {
	// Get user's shell
	shell := os.Getenv("SHELL")
	if shell == "" {
		shell = "/bin/bash"
	}

	cmd := exec.Command(shell)
	cmd.Env = append(os.Environ(),
		"TERM=xterm-256color",
	)

	// Start with PTY
	ptmx, err := pty.StartWithSize(cmd, &pty.Winsize{
		Cols: uint16(cols),
		Rows: uint16(rows),
	})
	if err != nil {
		return nil, err
	}

	return &Terminal{
		cmd: cmd,
		pty: ptmx,
	}, nil
}

// Read reads from the terminal output
func (t *Terminal) Read(buf []byte) (int, error) {
	return t.pty.Read(buf)
}

// Write writes to the terminal input
func (t *Terminal) Write(data []byte) (int, error) {
	return t.pty.Write(data)
}

// Resize changes the terminal size
func (t *Terminal) Resize(cols, rows int) error {
	return pty.Setsize(t.pty, &pty.Winsize{
		Cols: uint16(cols),
		Rows: uint16(rows),
	})
}

// Close closes the terminal
func (t *Terminal) Close() error {
	if t.cmd != nil && t.cmd.Process != nil {
		t.cmd.Process.Signal(syscall.SIGTERM)
	}
	if t.pty != nil {
		t.pty.Close()
	}
	return nil
}
