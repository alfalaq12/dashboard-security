package collector

import (
	"bufio"
	"os"
	"os/exec"
	"regexp"
	"strings"
	"time"
)

// SSHEvent represents a parsed SSH login event
type SSHEvent struct {
	Timestamp time.Time `json:"timestamp"`
	EventType string    `json:"event_type"` // "failed" or "success"
	User      string    `json:"user"`
	IP        string    `json:"ip"`
	Port      string    `json:"port"`
	RawLog    string    `json:"raw_log"`
}

// SSHCollector watches auth.log for SSH events
type SSHCollector struct {
	logPath string
	events  chan SSHEvent
}

// Regex patterns for SSH log parsing
var (
	// Failed password for invalid user admin from 192.168.1.100 port 22 ssh2
	failedPasswordRegex = regexp.MustCompile(`Failed password for (?:invalid user )?(\S+) from (\S+) port (\d+)`)
	// Accepted password for user from 192.168.1.100 port 22 ssh2
	// Using \s+ to be more flexible with spaces
	acceptedPasswordRegex = regexp.MustCompile(`Accepted\s+(?:password|publickey)\s+for\s+(\S+)\s+from\s+(\S+)\s+port\s+(\d+)`)
)

// NewSSHCollector creates a new SSH log collector
func NewSSHCollector(logPath string) *SSHCollector {
	return &SSHCollector{
		logPath: logPath,
		events:  make(chan SSHEvent, 100),
	}
}

// Events returns the channel of SSH events
func (c *SSHCollector) Events() <-chan SSHEvent {
	return c.events
}

// Start begins tailing the log file
func (c *SSHCollector) Start() error {
	file, err := os.Open(c.logPath)
	if err != nil {
		return err
	}

	// Seek to end of file (tail behavior)
	file.Seek(0, os.SEEK_END)

	go func() {
		defer file.Close()
		reader := bufio.NewReader(file)

		for {
			line, err := reader.ReadString('\n')
			if err != nil {
				// No new line, wait and retry
				time.Sleep(500 * time.Millisecond)
				continue
			}

			// Parse the line
			if event := c.parseLine(line); event != nil {
				c.events <- *event
			}
		}
	}()

	return nil
}

// parseLine attempts to extract SSH event from a log line
func (c *SSHCollector) parseLine(line string) *SSHEvent {
	// Check for failed password
	if matches := failedPasswordRegex.FindStringSubmatch(line); matches != nil {
		return &SSHEvent{
			Timestamp: time.Now(),
			EventType: "failed",
			User:      matches[1],
			IP:        matches[2],
			Port:      matches[3],
			RawLog:    line,
		}
	}

	// Check for accepted password
	if matches := acceptedPasswordRegex.FindStringSubmatch(line); matches != nil {
		return &SSHEvent{
			Timestamp: time.Now(),
			EventType: "success",
			User:      matches[1],
			IP:        matches[2],
			Port:      matches[3],
			RawLog:    line,
		}
	}

	return nil
}

// ActiveSession represents a currently logged in user
type ActiveSession struct {
	User      string    `json:"user"`
	IP        string    `json:"ip"`
	LoginTime time.Time `json:"login_time"`
	TTY       string    `json:"tty"`
}

// CollectActiveSessions returns a list of currently logged in users
func CollectActiveSessions() ([]ActiveSession, error) {
	// Use 'who' command with -u flag for idle time and PID
	cmd := exec.Command("who", "-u", "--ips") // --ips flag might not be available on all who versions, try default
	// If --ips fails, fallback to standard who

	// Try standard 'who' first, parsing output
	// Format: user     tty          date time             (ip)
	// root     pts/0        2023-10-27 10:00             (192.168.1.100)

	cmd = exec.Command("who")
	output, err := cmd.Output()
	if err != nil {
		return nil, err
	}

	var sessions []ActiveSession
	lines := strings.Split(string(output), "\n")

	for _, line := range lines {
		fields := strings.Fields(line)
		if len(fields) >= 5 {
			// Extract IP from last field like (192.168.1.100)
			ip := fields[len(fields)-1]
			ip = strings.Trim(ip, "()")

			// Parse time
			// Layout depends on locale, but usually "2006-01-02 15:04"
			// Just store as string or simplify for now, maybe current time is fine if we can't parse

			sessions = append(sessions, ActiveSession{
				User:      fields[0],
				TTY:       fields[1],
				LoginTime: time.Now(), // Approximation
				IP:        ip,
			})
		}
	}

	return sessions, nil
}
