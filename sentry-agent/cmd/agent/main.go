package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/bintang/sentry-agent/internal/collector"
	"github.com/bintang/sentry-agent/internal/config"
	"github.com/bintang/sentry-agent/internal/sender"
)

func main() {
	log.Println("🛡️  Sentry Agent starting...")

	// Load configuration
	cfg := config.Load()
	log.Printf("📡 Server URL: %s", cfg.ServerURL)
	log.Printf("🖥️  Node Name: %s", cfg.NodeName)
	log.Printf("📂 Log Path: %s", cfg.LogPath)

	// Validate API Key
	if cfg.APIKey == "" {
		log.Println("⚠️  Warning: No API key configured. Set SENTRY_API_KEY environment variable.")
	}

	// Initialize sender client
	client := sender.NewClient(cfg.ServerURL, cfg.APIKey, cfg.NodeName)

	// Initialize SSH collector
	sshCollector := collector.NewSSHCollector(cfg.LogPath)
	if err := sshCollector.Start(); err != nil {
		log.Printf("⚠️  Warning: Could not start SSH collector: %v", err)
		log.Println("   SSH monitoring will be disabled. Check if log file exists.")
	} else {
		log.Println("✅ SSH log monitoring started")
		// Process SSH events
		go func() {
			for event := range sshCollector.Events() {
				log.Printf("🔐 SSH Event: %s - User: %s, IP: %s", event.EventType, event.User, event.IP)
				if err := client.Send("ssh_event", event); err != nil {
					log.Printf("❌ Failed to send SSH event: %v", err)
				}
			}
		}()
	}

	// Initialize System stats collector (legacy, keeping for backward compatibility)
	systemCollector := collector.NewSystemCollector(cfg.Interval)
	systemCollector.Start()
	log.Printf("✅ System stats collector started (interval: %ds)", cfg.Interval)

	// Process system stats
	go func() {
		for stats := range systemCollector.Stats() {
			log.Printf("📊 System Stats: CPU=%d, Mem=%dMB", stats.NumCPU, stats.MemoryAlloc/1024/1024)
			if err := client.Send("system_stats", stats); err != nil {
				log.Printf("❌ Failed to send system stats: %v", err)
			}
		}
	}()

	// Initialize Heartbeat collector (new, with real metrics)
	heartbeatCollector := collector.NewHeartbeatCollector(cfg.Interval)
	heartbeatCollector.Start()
	log.Println("✅ Heartbeat collector started")

	// Process heartbeat data
	go func() {
		for data := range heartbeatCollector.Data() {
			log.Printf("💓 Heartbeat: CPU=%.1f%%, Mem=%.1f%%, Disk=%.1f%%",
				data.CPUPercent, data.MemoryPercent, data.DiskPercent)
			if err := client.Send("heartbeat", data); err != nil {
				log.Printf("❌ Failed to send heartbeat: %v", err)
			}
		}
	}()

	// Initialize Service collector (auto-detect services)
	serviceCollector := collector.NewServiceCollector(cfg.Interval * 3) // Check services less frequently
	serviceCollector.Start()
	log.Println("✅ Service collector started (auto-detect mode)")

	// Process service status
	go func() {
		for data := range serviceCollector.Data() {
			runningCount := 0
			for _, svc := range data.Services {
				if svc.Active {
					runningCount++
				}
			}
			log.Printf("🔧 Services: %d running, %d total", runningCount, len(data.Services))
			if err := client.Send("service_status", data); err != nil {
				log.Printf("❌ Failed to send service status: %v", err)
			}
		}
	}()

	// Wait for shutdown signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	log.Println("🛑 Sentry Agent shutting down...")
}
