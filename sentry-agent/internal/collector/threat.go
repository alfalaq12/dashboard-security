package collector

import (
	"bufio"
	"fmt"
	"io/fs"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/shirou/gopsutil/v4/net"
	"github.com/shirou/gopsutil/v4/process"
)

// ThreatFinding represents a detected security threat
type ThreatFinding struct {
	FilePath       string   `json:"file_path,omitempty"`
	ProcessName    string   `json:"process_name,omitempty"`
	ProcessID      int32    `json:"process_id,omitempty"`
	ProcessCmdline string   `json:"process_cmdline,omitempty"`
	CPUPercent     float64  `json:"cpu_percent,omitempty"`
	FileName       string   `json:"file_name,omitempty"`
	FileSize       int64    `json:"file_size,omitempty"`
	ModifiedAt     string   `json:"modified_at,omitempty"`
	Permissions    string   `json:"permissions,omitempty"`
	Category       string   `json:"category"`      // "backdoor", "cryptominer"
	ThreatType     string   `json:"threat_type"`   // specific type
	ThreatLevel    string   `json:"threat_level"`  // "critical", "high", "medium", "low"
	MatchedRules   []string `json:"matched_rules"` // rules that matched
	Snippet        string   `json:"snippet,omitempty"`
	NetworkConn    string   `json:"network_conn,omitempty"`
}

// ThreatCollector monitors for backdoors and crypto miners
type ThreatCollector struct {
	scanPaths    []string
	excludePaths []string
	interval     int
	cpuThreshold float64
	findings     chan ThreatFinding
	stopChan     chan struct{}
	seenThreats  map[string]bool // track already reported threats
}

// Known miner process names
var minerProcesses = []string{
	"xmrig", "minerd", "cpuminer", "cgminer", "bfgminer",
	"ethminer", "t-rex", "phoenixminer", "nbminer", "gminer",
	"lolminer", "claymore", "excavator", "ccminer", "sgminer",
	"cryptonight", "stratum", "nicehash", "kryptex",
}

// Known mining pool domains/patterns
var miningPools = []string{
	"pool.minexmr.com", "xmrpool.eu", "pool.supportxmr.com",
	"monerohash.com", "nanopool.org", "2miners.com",
	"f2pool.com", "antpool.com", "poolin.com", "slushpool.com",
	"ethermine.org", "sparkpool.com", "hiveon.net",
}

// Common stratum ports
var stratumPorts = []uint32{3333, 4444, 5555, 7777, 8888, 14444, 14433, 45560}

// Known webshell filenames
var suspiciousFilenames = []string{
	"c99.php", "r57.php", "b374k.php", "weevely.php", "wso.php",
	"shell.php", "cmd.php", "backdoor.php", "hack.php", "exploit.php",
	"webshell.php", "phpspy.php", "1.php", "x.php", "test.php",
}

// Backdoor pattern rules
type backdoorRule struct {
	Pattern string
	Level   string
	Type    string
	Name    string
}

var backdoorPatterns = []backdoorRule{
	// Critical - Direct code execution
	{`eval\s*\(\s*\$_(GET|POST|REQUEST|COOKIE)`, "critical", "php_shell", "eval with user input"},
	{`base64_decode\s*\(\s*\$_(GET|POST|REQUEST)`, "critical", "php_shell", "base64_decode with user input"},
	{`assert\s*\(\s*\$_(GET|POST|REQUEST)`, "critical", "php_shell", "assert with user input"},
	{`create_function\s*\(.*\$_(GET|POST)`, "critical", "php_shell", "create_function with user input"},
	{`preg_replace\s*\(\s*['"]/.*?/e['"]`, "critical", "php_shell", "preg_replace with /e modifier"},

	// High - Command execution functions
	{`(shell_exec|exec|system|passthru|popen|proc_open)\s*\(\s*\$`, "high", "php_shell", "command execution with variable"},
	{`\$\w+\s*\(\s*\$_(GET|POST|REQUEST)`, "high", "php_shell", "variable function call with user input"},

	// Medium - Obfuscation patterns
	{`(gzinflate|gzuncompress|str_rot13|base64_decode)\s*\(.*\)`, "medium", "obfuscated", "obfuscation function"},
	{`eval\s*\(\s*(gzinflate|gzuncompress|base64_decode)`, "critical", "obfuscated", "eval with deobfuscation"},
	{`\$\w+\s*=\s*str_replace\s*\(.*\)\s*;\s*\$\w+\s*\(`, "high", "obfuscated", "dynamic function construction"},

	// Medium - File operations
	{`(file_put_contents|fwrite)\s*\(\s*\$_(GET|POST|REQUEST)`, "high", "file_write", "file write with user input"},
	{`move_uploaded_file.*\$_(GET|POST|REQUEST)`, "high", "file_upload", "unrestricted file upload"},
}

// NewThreatCollector creates a new threat collector
func NewThreatCollector(scanPaths, excludePaths []string, interval int, cpuThreshold float64) *ThreatCollector {
	return &ThreatCollector{
		scanPaths:    scanPaths,
		excludePaths: excludePaths,
		interval:     interval,
		cpuThreshold: cpuThreshold,
		findings:     make(chan ThreatFinding, 100),
		stopChan:     make(chan struct{}),
		seenThreats:  make(map[string]bool),
	}
}

// Findings returns the channel for receiving threat findings
func (tc *ThreatCollector) Findings() <-chan ThreatFinding {
	return tc.findings
}

// Start begins the threat monitoring
func (tc *ThreatCollector) Start() {
	go tc.run()
}

// Stop stops the threat monitoring
func (tc *ThreatCollector) Stop() {
	close(tc.stopChan)
}

func (tc *ThreatCollector) run() {
	// Initial scan
	tc.scanAll()

	ticker := time.NewTicker(time.Duration(tc.interval) * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-tc.stopChan:
			return
		case <-ticker.C:
			tc.scanAll()
		}
	}
}

func (tc *ThreatCollector) scanAll() {
	// Scan for backdoors in configured paths
	for _, scanPath := range tc.scanPaths {
		tc.scanDirectory(scanPath)
	}

	// Scan for mining processes
	tc.scanProcesses()

	// Scan for mining network connections
	tc.scanNetworkConnections()

	// Scan crontab for persistence
	tc.scanCrontab()
}

func (tc *ThreatCollector) scanDirectory(rootPath string) {
	// Check if path exists
	if _, err := os.Stat(rootPath); os.IsNotExist(err) {
		return
	}

	err := filepath.WalkDir(rootPath, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return nil // Skip errors
		}

		// Check exclusions
		for _, exclude := range tc.excludePaths {
			if strings.Contains(path, exclude) {
				if d.IsDir() {
					return filepath.SkipDir
				}
				return nil
			}
		}

		if d.IsDir() {
			return nil
		}

		// Only scan PHP files and suspicious extensions
		ext := strings.ToLower(filepath.Ext(path))
		if ext != ".php" && ext != ".phtml" && ext != ".php5" && ext != ".php7" {
			return nil
		}

		tc.scanFile(path)
		return nil
	})

	if err != nil {
		log.Printf("Error scanning directory %s: %v", rootPath, err)
	}
}

func (tc *ThreatCollector) scanFile(filePath string) {
	// Check filename first
	fileName := filepath.Base(filePath)
	fileNameLower := strings.ToLower(fileName)

	// Check for suspicious filenames
	for _, suspicious := range suspiciousFilenames {
		if fileNameLower == suspicious {
			tc.reportThreat(ThreatFinding{
				FilePath:     filePath,
				FileName:     fileName,
				Category:     "backdoor",
				ThreatType:   "suspicious_filename",
				ThreatLevel:  "high",
				MatchedRules: []string{fmt.Sprintf("Known webshell filename: %s", suspicious)},
			})
		}
	}

	// Check for hidden PHP files
	if strings.HasPrefix(fileName, ".") && strings.HasSuffix(fileNameLower, ".php") {
		tc.reportThreat(ThreatFinding{
			FilePath:     filePath,
			FileName:     fileName,
			Category:     "backdoor",
			ThreatType:   "hidden_file",
			ThreatLevel:  "medium",
			MatchedRules: []string{"Hidden PHP file detected"},
		})
	}

	// Get file info
	info, err := os.Stat(filePath)
	if err != nil {
		return
	}

	// Check file permissions (world-writable)
	mode := info.Mode()
	if mode&0002 != 0 { // World writable
		tc.reportThreat(ThreatFinding{
			FilePath:     filePath,
			FileName:     fileName,
			FileSize:     info.Size(),
			Permissions:  mode.String(),
			Category:     "backdoor",
			ThreatType:   "permission_issue",
			ThreatLevel:  "medium",
			MatchedRules: []string{"World-writable PHP file"},
		})
	}

	// Read file content for pattern matching
	content, err := os.ReadFile(filePath)
	if err != nil {
		return
	}

	contentStr := string(content)

	// Check against backdoor patterns
	for _, rule := range backdoorPatterns {
		re, err := regexp.Compile("(?i)" + rule.Pattern)
		if err != nil {
			continue
		}

		if matches := re.FindStringSubmatch(contentStr); matches != nil {
			// Extract snippet around match
			loc := re.FindStringIndex(contentStr)
			snippet := ""
			if loc != nil {
				start := loc[0] - 50
				if start < 0 {
					start = 0
				}
				end := loc[1] + 50
				if end > len(contentStr) {
					end = len(contentStr)
				}
				snippet = contentStr[start:end]
				if len(snippet) > 200 {
					snippet = snippet[:200]
				}
			}

			tc.reportThreat(ThreatFinding{
				FilePath:     filePath,
				FileName:     fileName,
				FileSize:     info.Size(),
				ModifiedAt:   info.ModTime().Format(time.RFC3339),
				Category:     "backdoor",
				ThreatType:   rule.Type,
				ThreatLevel:  rule.Level,
				MatchedRules: []string{rule.Name},
				Snippet:      snippet,
			})
		}
	}
}

func (tc *ThreatCollector) scanProcesses() {
	processes, err := process.Processes()
	if err != nil {
		log.Printf("Error getting processes: %v", err)
		return
	}

	for _, p := range processes {
		name, err := p.Name()
		if err != nil {
			continue
		}

		nameLower := strings.ToLower(name)

		// Check for known miner processes
		for _, miner := range minerProcesses {
			if strings.Contains(nameLower, miner) {
				cmdline, _ := p.Cmdline()
				cpu, _ := p.CPUPercent()

				tc.reportThreat(ThreatFinding{
					ProcessName:    name,
					ProcessID:      p.Pid,
					ProcessCmdline: cmdline,
					CPUPercent:     cpu,
					Category:       "cryptominer",
					ThreatType:     "known_miner",
					ThreatLevel:    "critical",
					MatchedRules:   []string{fmt.Sprintf("Known cryptocurrency miner process: %s", miner)},
				})
				break
			}
		}

		// Check for high CPU usage (potential mining)
		cpu, err := p.CPUPercent()
		if err == nil && cpu > tc.cpuThreshold {
			cmdline, _ := p.Cmdline()
			exe, _ := p.Exe()

			// Skip system processes
			if isSystemProcess(name, exe) {
				continue
			}

			// Check if running from suspicious location
			suspiciousLoc := false
			suspiciousLocations := []string{"/tmp", "/dev/shm", "/var/tmp", "/run"}
			for _, loc := range suspiciousLocations {
				if strings.HasPrefix(exe, loc) {
					suspiciousLoc = true
					break
				}
			}

			if suspiciousLoc {
				tc.reportThreat(ThreatFinding{
					ProcessName:    name,
					ProcessID:      p.Pid,
					ProcessCmdline: cmdline,
					CPUPercent:     cpu,
					Category:       "cryptominer",
					ThreatType:     "suspicious_process",
					ThreatLevel:    "high",
					MatchedRules:   []string{fmt.Sprintf("High CPU process (%.1f%%) from suspicious location: %s", cpu, exe)},
				})
			}
		}
	}
}

func (tc *ThreatCollector) scanNetworkConnections() {
	conns, err := net.Connections("tcp")
	if err != nil {
		log.Printf("Error getting network connections: %v", err)
		return
	}

	for _, conn := range conns {
		// Check for stratum ports
		for _, port := range stratumPorts {
			if conn.Raddr.Port == port {
				tc.reportThreat(ThreatFinding{
					ProcessID:   conn.Pid,
					NetworkConn: fmt.Sprintf("%s:%d", conn.Raddr.IP, conn.Raddr.Port),
					Category:    "cryptominer",
					ThreatType:  "pool_connection",
					ThreatLevel: "critical",
					MatchedRules: []string{
						fmt.Sprintf("Connection to mining stratum port %d", port),
					},
				})
			}
		}
	}
}

func (tc *ThreatCollector) scanCrontab() {
	crontabPaths := []string{
		"/etc/crontab",
		"/var/spool/cron/crontabs/root",
		"/var/spool/cron/root",
	}

	suspiciousPatterns := []string{
		"curl.*\\|.*sh",
		"wget.*\\|.*sh",
		"curl.*\\|.*bash",
		"wget.*\\|.*bash",
		"/tmp/",
		"/dev/shm/",
		"xmrig",
		"minerd",
		"stratum",
	}

	for _, crontabPath := range crontabPaths {
		file, err := os.Open(crontabPath)
		if err != nil {
			continue
		}
		defer file.Close()

		scanner := bufio.NewScanner(file)
		lineNum := 0
		for scanner.Scan() {
			lineNum++
			line := scanner.Text()

			// Skip comments and empty lines
			if strings.HasPrefix(strings.TrimSpace(line), "#") || strings.TrimSpace(line) == "" {
				continue
			}

			for _, pattern := range suspiciousPatterns {
				re, err := regexp.Compile("(?i)" + pattern)
				if err != nil {
					continue
				}

				if re.MatchString(line) {
					tc.reportThreat(ThreatFinding{
						FilePath:     crontabPath,
						Category:     "cryptominer",
						ThreatType:   "cron_persistence",
						ThreatLevel:  "high",
						MatchedRules: []string{fmt.Sprintf("Suspicious crontab entry (line %d): %s", lineNum, pattern)},
						Snippet:      line,
					})
				}
			}
		}
	}
}

func (tc *ThreatCollector) reportThreat(finding ThreatFinding) {
	// Generate unique key for deduplication
	key := fmt.Sprintf("%s:%s:%s:%s:%d",
		finding.Category,
		finding.ThreatType,
		finding.FilePath,
		finding.ProcessName,
		finding.ProcessID,
	)

	// Skip if already reported
	if tc.seenThreats[key] {
		return
	}
	tc.seenThreats[key] = true

	// Send finding
	select {
	case tc.findings <- finding:
	default:
		log.Println("Warning: Threat findings channel full, dropping finding")
	}
}

func isSystemProcess(name, exe string) bool {
	systemProcesses := []string{
		"systemd", "kthread", "init", "kernel", "rcu",
		"migration", "watchdog", "kworker", "ksoftirqd",
		"kdevtmpfs", "khungtaskd", "kauditd", "kswapd",
	}

	nameLower := strings.ToLower(name)
	for _, sp := range systemProcesses {
		if strings.Contains(nameLower, sp) {
			return true
		}
	}
	return false
}
