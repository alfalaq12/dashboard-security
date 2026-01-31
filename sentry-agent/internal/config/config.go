package config

import (
	"os"
	"strconv"
	"strings"
)

// Config holds the agent configuration
type Config struct {
	ServerURL string // URL of the central dashboard server
	APIKey    string // API key for authentication
	NodeName  string // Name identifier for this VM/server
	LogPath   string // Path to auth.log (e.g., /var/log/auth.log)
	Interval  int    // Interval in seconds for sending stats

	// Threat scanning config
	ScanPaths        []string // Paths to scan for backdoors (e.g., /var/www/html)
	ScanExclude      []string // Paths to exclude from scanning
	ThreatInterval   int      // Interval in seconds for threat scanning
	CPUThreshold     float64  // CPU threshold for mining detection (default 90%)
	EnableThreatScan bool     // Enable threat scanning
}

// Load reads configuration from environment variables
func Load() *Config {
	cfg := &Config{
		ServerURL: getEnv("SENTRY_SERVER_URL", "http://localhost:3000"),
		APIKey:    getEnv("SENTRY_API_KEY", ""),
		NodeName:  getEnv("SENTRY_NODE_NAME", getHostname()),
		LogPath:   getEnv("SENTRY_LOG_PATH", "/var/log/auth.log"),
		Interval:  30, // default 30 seconds (was 10, reduced for lower CPU usage)

		// Threat scanning defaults
		ScanPaths:        getEnvList("SENTRY_SCAN_PATHS", []string{"/var/www/html"}),
		ScanExclude:      getEnvList("SENTRY_SCAN_EXCLUDE", []string{"node_modules", "vendor", ".git"}),
		ThreatInterval:   getEnvInt("SENTRY_THREAT_INTERVAL", 120), // 120 seconds (was 60)
		CPUThreshold:     getEnvFloat("SENTRY_CPU_THRESHOLD", 90.0),
		EnableThreatScan: getEnvBool("SENTRY_ENABLE_THREAT_SCAN", true),
	}
	return cfg
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

func getHostname() string {
	hostname, err := os.Hostname()
	if err != nil {
		return "unknown"
	}
	return hostname
}

func getEnvList(key string, fallback []string) []string {
	if value, exists := os.LookupEnv(key); exists {
		return strings.Split(value, ",")
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if value, exists := os.LookupEnv(key); exists {
		if i, err := strconv.Atoi(value); err == nil {
			return i
		}
	}
	return fallback
}

func getEnvFloat(key string, fallback float64) float64 {
	if value, exists := os.LookupEnv(key); exists {
		if f, err := strconv.ParseFloat(value, 64); err == nil {
			return f
		}
	}
	return fallback
}

func getEnvBool(key string, fallback bool) bool {
	if value, exists := os.LookupEnv(key); exists {
		if b, err := strconv.ParseBool(value); err == nil {
			return b
		}
	}
	return fallback
}
