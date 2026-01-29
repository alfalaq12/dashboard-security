package collector

import (
	"os"
	"runtime"
	"time"

	"github.com/shirou/gopsutil/v4/cpu"
	"github.com/shirou/gopsutil/v4/disk"
	"github.com/shirou/gopsutil/v4/host"
	"github.com/shirou/gopsutil/v4/mem"
)

// HeartbeatData represents system health metrics
type HeartbeatData struct {
	Hostname      string  `json:"hostname"`
	OS            string  `json:"os"`
	CPUPercent    float64 `json:"cpu_percent"`
	MemoryPercent float64 `json:"memory_percent"`
	DiskPercent   float64 `json:"disk_percent"`
	UptimeSeconds uint64  `json:"uptime_seconds"`
}

// HeartbeatCollector collects system health metrics periodically
type HeartbeatCollector struct {
	interval time.Duration
	data     chan HeartbeatData
	hostname string
}

// NewHeartbeatCollector creates a new heartbeat collector
func NewHeartbeatCollector(intervalSec int) *HeartbeatCollector {
	hostname, _ := os.Hostname()
	return &HeartbeatCollector{
		interval: time.Duration(intervalSec) * time.Second,
		data:     make(chan HeartbeatData, 10),
		hostname: hostname,
	}
}

// Data returns the channel of heartbeat data
func (c *HeartbeatCollector) Data() <-chan HeartbeatData {
	return c.data
}

// Start begins collecting heartbeat data at the configured interval
func (c *HeartbeatCollector) Start() {
	go func() {
		ticker := time.NewTicker(c.interval)
		defer ticker.Stop()

		// Send initial heartbeat immediately
		c.data <- c.collect()

		for range ticker.C {
			c.data <- c.collect()
		}
	}()
}

// collect gathers current system health metrics
func (c *HeartbeatCollector) collect() HeartbeatData {
	data := HeartbeatData{
		Hostname: c.hostname,
		OS:       runtime.GOOS,
	}

	// Get CPU usage (average over 1 second)
	cpuPercent, err := cpu.Percent(time.Second, false)
	if err == nil && len(cpuPercent) > 0 {
		data.CPUPercent = cpuPercent[0]
	}

	// Get Memory usage
	memInfo, err := mem.VirtualMemory()
	if err == nil {
		data.MemoryPercent = memInfo.UsedPercent
	}

	// Get Disk usage (root partition)
	diskInfo, err := disk.Usage("/")
	if err == nil {
		data.DiskPercent = diskInfo.UsedPercent
	}

	// Get system uptime
	uptime, err := host.Uptime()
	if err == nil {
		data.UptimeSeconds = uptime
	}

	return data
}
