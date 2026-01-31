//go:build windows
// +build windows

package remote

import (
	"io"
	"os/exec"

	"github.com/UserExistsError/conpty"
)

// Terminal wraps a pseudo-terminal for Windows systems using ConPTY
type Terminal struct {
	cpty   *conpty.ConPty
	cmd    *exec.Cmd
	stdin  io.Writer
	stdout io.Reader
}

// NewTerminal creates a new terminal with the specified size
func NewTerminal(cols, rows int) (*Terminal, error) {
	// Use PowerShell on Windows
	shell := "powershell.exe"
	if _, err := exec.LookPath("pwsh.exe"); err == nil {
		shell = "pwsh.exe"
	}

	// Create ConPTY
	cpty, err := conpty.Start(shell, conpty.ConPtyDimensions(cols, rows))
	if err != nil {
		return nil, err
	}

	return &Terminal{
		cpty:   cpty,
		stdin:  cpty,
		stdout: cpty,
	}, nil
}

// Read reads from the terminal output
func (t *Terminal) Read(buf []byte) (int, error) {
	return t.stdout.Read(buf)
}

// Write writes to the terminal input
func (t *Terminal) Write(data []byte) (int, error) {
	return t.stdin.Write(data)
}

// Resize changes the terminal size
func (t *Terminal) Resize(cols, rows int) error {
	return t.cpty.Resize(cols, rows)
}

// Close closes the terminal
func (t *Terminal) Close() error {
	if t.cpty != nil {
		t.cpty.Close()
	}
	return nil
}
