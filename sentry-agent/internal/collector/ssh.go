package collector

import (
	"bufio"
	"os"
	"regexp"
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
	acceptedPasswordRegex = regexp.MustCompile(`Accepted (?:password|publickey) for (\S+) from (\S+) port (\d+)`)
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
