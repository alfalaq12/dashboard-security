package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/bintang/sentry-agent/internal/collector"
	"github.com/bintang/sentry-agent/internal/config"
	"github.com/bintang/sentry-agent/internal/remote"
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

		// Process Active SSH Sessions (every 1 minute)
		go func() {
			ticker := time.NewTicker(1 * time.Minute)
			defer ticker.Stop()

			for range ticker.C {
				sessions, err := collector.CollectActiveSessions()
				if err != nil {
					log.Printf("⚠️  Failed to collect active SSH sessions: %v", err)
					continue
				}

				if len(sessions) > 0 {
					log.Printf("bust Active SSH Sessions: %d users", len(sessions))
				}

				if err := client.Send("active_ssh_sessions", sessions); err != nil {
					log.Printf("❌ Failed to send active SSH sessions: %v", err)
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

	// Initialize Threat collector (backdoor + crypto mining detection)
	if cfg.EnableThreatScan {
		threatCollector := collector.NewThreatCollector(
			cfg.ScanPaths,
			cfg.ScanExclude,
			cfg.ThreatInterval,
			cfg.CPUThreshold,
		)
		threatCollector.Start()
		log.Printf("🛡️  Threat scanner started (paths: %v, interval: %ds)", cfg.ScanPaths, cfg.ThreatInterval)

		// Process threat findings
		go func() {
			for finding := range threatCollector.Findings() {
				icon := "🐚"
				if finding.Category == "cryptominer" {
					icon = "⛏️"
				}
				log.Printf("%s THREAT: [%s] %s - %s (Level: %s)",
					icon, finding.Category, finding.ThreatType,
					finding.MatchedRules, finding.ThreatLevel)

				if err := client.Send("threat_scan", finding); err != nil {
					log.Printf("❌ Failed to send threat finding: %v", err)
				}
			}
		}()
	} else {
		log.Println("⚠️  Threat scanning disabled (set SENTRY_ENABLE_THREAT_SCAN=true to enable)")
	}

	// Initialize Remote Terminal tunnel
	var tunnel *remote.Tunnel
	if cfg.EnableRemoteTerminal {
		tunnel = remote.NewTunnel(cfg.RemoteGatewayURL, cfg.NodeName, cfg.APIKey)
		tunnel.Start()
		log.Printf("🔌 Remote terminal enabled (gateway: %s)", cfg.RemoteGatewayURL)
	} else {
		log.Println("⚠️  Remote terminal disabled (set SENTRY_ENABLE_REMOTE_TERMINAL=true to enable)")
	}

	// Wait for shutdown signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	log.Println("🛑 Sentry Agent shutting down...")

	// Cleanup
	if tunnel != nil {
		tunnel.Stop()
	}
}
