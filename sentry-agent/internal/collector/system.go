package collector

import (
	"os"
	"runtime"
	"time"
)

// SystemStats represents system resource usage
type SystemStats struct {
	Timestamp   time.Time `json:"timestamp"`
	Hostname    string    `json:"hostname"`
	OS          string    `json:"os"`
	NumCPU      int       `json:"num_cpu"`
	GoRoutines  int       `json:"go_routines"`
	MemoryAlloc uint64    `json:"memory_alloc_bytes"`
	MemoryTotal uint64    `json:"memory_total_bytes"`
	MemorySys   uint64    `json:"memory_sys_bytes"`
}

// SystemCollector collects system stats periodically
type SystemCollector struct {
	interval time.Duration
	stats    chan SystemStats
	hostname string
}

// NewSystemCollector creates a new system stats collector
func NewSystemCollector(intervalSec int) *SystemCollector {
	hostname, _ := os.Hostname()
	return &SystemCollector{
		interval: time.Duration(intervalSec) * time.Second,
		stats:    make(chan SystemStats, 10),
		hostname: hostname,
	}
}

// Stats returns the channel of system stats
func (c *SystemCollector) Stats() <-chan SystemStats {
	return c.stats
}

// Start begins collecting system stats at the configured interval
func (c *SystemCollector) Start() {
	go func() {
		ticker := time.NewTicker(c.interval)
		defer ticker.Stop()

		// Send initial stats immediately
		c.stats <- c.collect()

		for range ticker.C {
			c.stats <- c.collect()
		}
	}()
}

// collect gathers current system stats
func (c *SystemCollector) collect() SystemStats {
	var memStats runtime.MemStats
	runtime.ReadMemStats(&memStats)

	return SystemStats{
		Timestamp:   time.Now(),
		Hostname:    c.hostname,
		OS:          runtime.GOOS,
		NumCPU:      runtime.NumCPU(),
		GoRoutines:  runtime.NumGoroutine(),
		MemoryAlloc: memStats.Alloc,
		MemoryTotal: memStats.TotalAlloc,
		MemorySys:   memStats.Sys,
	}
}
