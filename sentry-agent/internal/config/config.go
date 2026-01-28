package config

import (
	"os"
)

// Config holds the agent configuration
type Config struct {
	ServerURL string // URL of the central dashboard server
	APIKey    string // API key for authentication
	NodeName  string // Name identifier for this VM/server
	LogPath   string // Path to auth.log (e.g., /var/log/auth.log)
	Interval  int    // Interval in seconds for sending stats
}

// Load reads configuration from environment variables
func Load() *Config {
	cfg := &Config{
		ServerURL: getEnv("SENTRY_SERVER_URL", "http://localhost:3000"),
		APIKey:    getEnv("SENTRY_API_KEY", ""),
		NodeName:  getEnv("SENTRY_NODE_NAME", getHostname()),
		LogPath:   getEnv("SENTRY_LOG_PATH", "/var/log/auth.log"),
		Interval:  10, // default 10 seconds
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
