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

// collect gathers current service status using batched systemctl calls
func (c *ServiceCollector) collect() ServiceData {
	services := []ServiceStatus{}

	// Get all running services in a single call
	runningServices := c.getRunningServices()

	// Build a map for quick lookup
	runningMap := make(map[string]bool)
	for _, svc := range runningServices {
		runningMap[svc] = true
	}

	// Common services to check (even if not running)
	commonServices := []string{
		"nginx", "apache2", "httpd", "mysql", "mysqld", "mariadb",
		"postgresql", "postgres", "redis", "redis-server", "memcached",
		"docker", "php-fpm", "ssh", "sshd", "fail2ban", "ufw",
		"firewalld", "cron", "rsyslog", "elasticsearch", "kibana",
		"mongodb", "mongod", "rabbitmq-server", "supervisor",
	}

	added := make(map[string]bool)

	// Get batch resource info for all running services (single ps call)
	resourceMap := c.getBatchServiceResources(runningServices)

	// Add common services with their status
	for _, svc := range commonServices {
		var status string
		var cpu, mem float64

		if runningMap[svc] {
			status = "running"
			if res, ok := resourceMap[svc]; ok {
				cpu, mem = res.cpu, res.mem
			}
		} else {
			// Quick check if service exists but isn't running
			status = c.getServiceStatusQuick(svc)
			if status == "unknown" {
				continue // Skip services that don't exist
			}
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

	// Add remaining running services not in common list
	for _, svc := range runningServices {
		if !added[svc] {
			res := resourceMap[svc]
			services = append(services, ServiceStatus{
				Name:     svc,
				Status:   "running",
				Active:   true,
				CPU:      res.cpu,
				MemoryMB: res.mem,
			})
		}
	}

	return ServiceData{Services: services}
}

type serviceResource struct {
	cpu float64
	mem float64
}

// getBatchServiceResources gets CPU and memory for all services in a single ps call
func (c *ServiceCollector) getBatchServiceResources(services []string) map[string]serviceResource {
	result := make(map[string]serviceResource)

	if len(services) == 0 {
		return result
	}

	// Get all service PIDs in a single systemctl call
	cmd := exec.Command("systemctl", "show", "--property=MainPID,Id")
	cmd.Args = append(cmd.Args, services...)

	var out bytes.Buffer
	cmd.Stdout = &out
	if err := cmd.Run(); err != nil {
		return result
	}

	// Parse output to build PID -> service name map
	pidToService := make(map[string]string)
	var pids []string

	output := out.String()
	blocks := strings.Split(output, "\n\n")

	for i, block := range blocks {
		if i >= len(services) {
			break
		}
		lines := strings.Split(strings.TrimSpace(block), "\n")
		for _, line := range lines {
			if strings.HasPrefix(line, "MainPID=") {
				pid := strings.TrimPrefix(line, "MainPID=")
				if pid != "" && pid != "0" {
					pidToService[pid] = services[i]
					pids = append(pids, pid)
				}
			}
		}
	}

	if len(pids) == 0 {
		return result
	}

	// Get all process stats in a single ps call
	psCmd := exec.Command("ps", "-p", strings.Join(pids, ","), "-o", "pid,%cpu,rss", "--no-headers")
	var psOut bytes.Buffer
	psCmd.Stdout = &psOut
	if err := psCmd.Run(); err != nil {
		return result
	}

	// Parse ps output
	lines := strings.Split(strings.TrimSpace(psOut.String()), "\n")
	for _, line := range lines {
		fields := strings.Fields(line)
		if len(fields) >= 3 {
			pid := fields[0]
			if svcName, ok := pidToService[pid]; ok {
				var cpu, memKB float64
				fmt.Sscanf(fields[1], "%f", &cpu)
				fmt.Sscanf(fields[2], "%f", &memKB)
				result[svcName] = serviceResource{cpu: cpu, mem: memKB / 1024.0}
			}
		}
	}

	return result
}

// getServiceStatusQuick checks service status without resource info
func (c *ServiceCollector) getServiceStatusQuick(name string) string {
	cmd := exec.Command("systemctl", "is-active", name)
	var out bytes.Buffer
	cmd.Stdout = &out
	cmd.Run()

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
