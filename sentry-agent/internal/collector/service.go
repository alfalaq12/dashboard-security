package collector

import (
	"bytes"
	"fmt"
	"os/exec"
	"runtime"
	"strings"
	"time"
)

// ServiceStatus represents the status of a system service
type ServiceStatus struct {
	Name     string  `json:"name"`
	Status   string  `json:"status"` // running, stopped, failed, unknown
	Active   bool    `json:"active"`
	CPU      float64 `json:"cpu"`    // CPU usage percentage
	MemoryMB float64 `json:"memory"` // Memory usage in MB
}

// ServiceData contains all services status for a node
type ServiceData struct {
	Services []ServiceStatus `json:"services"`
}

// ServiceCollector collects service status periodically
type ServiceCollector struct {
	interval time.Duration
	data     chan ServiceData
}

// NewServiceCollector creates a new service status collector
func NewServiceCollector(intervalSec int) *ServiceCollector {
	return &ServiceCollector{
		interval: time.Duration(intervalSec) * time.Second,
		data:     make(chan ServiceData, 10),
	}
}

// Data returns the channel of service data
func (c *ServiceCollector) Data() <-chan ServiceData {
	return c.data
}

// Start begins collecting service status at the configured interval
func (c *ServiceCollector) Start() {
	// Only works on Linux with systemd
	if runtime.GOOS != "linux" {
		return
	}

	go func() {
		ticker := time.NewTicker(c.interval)
		defer ticker.Stop()

		// Send initial status immediately
		c.data <- c.collect()

		for range ticker.C {
			c.data <- c.collect()
		}
	}()
}

// collect gathers current service status
func (c *ServiceCollector) collect() ServiceData {
	services := []ServiceStatus{}

	// Common services to monitor
	commonServices := []string{
		"nginx",
		"apache2",
		"httpd",
		"mysql",
		"mysqld",
		"mariadb",
		"postgresql",
		"postgres",
		"redis",
		"redis-server",
		"memcached",
		"docker",
		"php-fpm",
		"php7.4-fpm",
		"php8.0-fpm",
		"php8.1-fpm",
		"php8.2-fpm",
		"php8.3-fpm",
		"ssh",
		"sshd",
		"fail2ban",
		"ufw",
		"firewalld",
		"cron",
		"rsyslog",
		"elasticsearch",
		"kibana",
		"logstash",
		"mongodb",
		"mongod",
		"rabbitmq-server",
		"supervisor",
		"jenkins",
		"gitlab-runner",
	}

	// Get all running services first
	runningServices := c.getRunningServices()

	// Helper to check if service already added
	added := make(map[string]bool)

	// Check each common service
	for _, svc := range commonServices {
		status := c.getServiceStatus(svc)
		if status != "unknown" {
			// Get resources only if running
			var cpu, mem float64
			if status == "running" {
				cpu, mem = c.getServiceResources(svc)
			}

			services = append(services, ServiceStatus{
				Name:     svc,
				Status:   status,
				Active:   status == "running",
				CPU:      cpu,
				MemoryMB: mem,
			})
			added[svc] = true
		}
	}

	// Also add any running services not in common list
	for _, svc := range runningServices {
		if !added[svc] {
			cpu, mem := c.getServiceResources(svc)
			services = append(services, ServiceStatus{
				Name:     svc,
				Status:   "running",
				Active:   true,
				CPU:      cpu,
				MemoryMB: mem,
			})
		}
	}

	return ServiceData{Services: services}
}

// getServiceResources attempts to get CPU and Memory usage for a service
func (c *ServiceCollector) getServiceResources(name string) (float64, float64) {
	// Try to get MainPID from systemctl
	cmd := exec.Command("systemctl", "show", "--property=MainPID", name)
	var out bytes.Buffer
	cmd.Stdout = &out
	err := cmd.Run()
	if err != nil {
		return 0, 0
	}

	output := strings.TrimSpace(out.String())
	// Output format: MainPID=1234
	parts := strings.Split(output, "=")
	if len(parts) != 2 || parts[1] == "0" {
		// Try to fallback to pgrep if PID is 0 (some services forks)
		// but for now return 0 to be safe
		return 0, 0
	}
	pid := parts[1]

	// Get usage using ps
	// %cpu, rss (resident set size in KB)
	psCmd := exec.Command("ps", "-p", pid, "-o", "%cpu,rss", "--no-headers")
	var psOut bytes.Buffer
	psCmd.Stdout = &psOut
	if err := psCmd.Run(); err != nil {
		return 0, 0
	}

	psOutput := strings.TrimSpace(psOut.String())
	// Output: 0.5 12345
	psParts := strings.Fields(psOutput)
	if len(psParts) != 2 {
		return 0, 0
	}

	var cpu float64
	var memKB float64

	fmt.Sscanf(psParts[0], "%f", &cpu)
	fmt.Sscanf(psParts[1], "%f", &memKB)

	return cpu, memKB / 1024.0 // Convert KB to MB
}

// getServiceStatus checks the status of a single service
func (c *ServiceCollector) getServiceStatus(name string) string {
	cmd := exec.Command("systemctl", "is-active", name)
	var out bytes.Buffer
	cmd.Stdout = &out
	cmd.Run() // Ignore error, just check output

	status := strings.TrimSpace(out.String())
	switch status {
	case "active":
		return "running"
	case "inactive":
		return "stopped"
	case "failed":
		return "failed"
	default:
		return "unknown"
	}
}

// getRunningServices returns a list of all running services
func (c *ServiceCollector) getRunningServices() []string {
	var services []string

	cmd := exec.Command("systemctl", "list-units", "--type=service", "--state=running", "--no-pager", "--no-legend")
	var out bytes.Buffer
	cmd.Stdout = &out
	err := cmd.Run()
	if err != nil {
		return services
	}

	lines := strings.Split(out.String(), "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		// Format: service-name.service loaded active running description
		parts := strings.Fields(line)
		if len(parts) > 0 {
			name := strings.TrimSuffix(parts[0], ".service")
			services = append(services, name)
		}
	}

	return services
}
