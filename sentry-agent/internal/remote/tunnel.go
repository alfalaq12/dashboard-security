package remote

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// Message types for WebSocket communication
const (
	MsgTypeRegister   = "register"
	MsgTypeRegistered = "registered"
	MsgTypeStartShell = "start_shell"
	MsgTypeData       = "data"
	MsgTypeResize     = "resize"
	MsgTypeCloseShell = "close_shell"
	MsgTypeError      = "error"
	MsgTypePing       = "ping"
	MsgTypePong       = "pong"
)

// Message represents a WebSocket message
type Message struct {
	Type      string `json:"type"`
	SessionID string `json:"sessionId,omitempty"`
	Data      string `json:"data,omitempty"`
	Cols      int    `json:"cols,omitempty"`
	Rows      int    `json:"rows,omitempty"`
	NodeName  string `json:"nodeName,omitempty"`
	Error     string `json:"error,omitempty"`
}

// Tunnel manages WebSocket connection to dashboard
type Tunnel struct {
	gatewayURL string
	nodeName   string
	apiKey     string
	conn       *websocket.Conn
	connMu     sync.Mutex
	terminals  map[string]*Terminal
	termMu     sync.RWMutex
	done       chan struct{}
	reconnect  chan struct{}
}

// NewTunnel creates a new tunnel instance
func NewTunnel(gatewayURL, nodeName, apiKey string) *Tunnel {
	return &Tunnel{
		gatewayURL: gatewayURL,
		nodeName:   nodeName,
		apiKey:     apiKey,
		terminals:  make(map[string]*Terminal),
		done:       make(chan struct{}),
		reconnect:  make(chan struct{}, 1),
	}
}

// Start begins the tunnel connection with auto-reconnect
func (t *Tunnel) Start() {
	go t.connectLoop()
}

// Stop closes the tunnel
func (t *Tunnel) Stop() {
	close(t.done)
	t.connMu.Lock()
	if t.conn != nil {
		t.conn.Close()
	}
	t.connMu.Unlock()

	// Close all terminals
	t.termMu.Lock()
	for _, term := range t.terminals {
		term.Close()
	}
	t.termMu.Unlock()
}

func (t *Tunnel) connectLoop() {
	backoff := time.Second
	maxBackoff := 30 * time.Second

	for {
		select {
		case <-t.done:
			return
		default:
		}

		err := t.connect()
		if err != nil {
			log.Printf("🔌 Tunnel connection failed: %v", err)
			log.Printf("🔄 Reconnecting in %v...", backoff)

			select {
			case <-t.done:
				return
			case <-time.After(backoff):
			}

			// Exponential backoff
			backoff *= 2
			if backoff > maxBackoff {
				backoff = maxBackoff
			}
		} else {
			// Reset backoff on successful connection
			backoff = time.Second
		}
	}
}

func (t *Tunnel) connect() error {
	// Add API key to header
	header := http.Header{}
	header.Set("X-API-Key", t.apiKey)
	header.Set("X-Node-Name", t.nodeName)

	log.Printf("🔌 Connecting to dashboard: %s", t.gatewayURL)

	conn, _, err := websocket.DefaultDialer.Dial(t.gatewayURL, header)
	if err != nil {
		return err
	}

	t.connMu.Lock()
	t.conn = conn
	t.connMu.Unlock()

	log.Printf("✅ Connected to dashboard gateway")

	// Register this agent
	t.sendMessage(Message{
		Type:     MsgTypeRegister,
		NodeName: t.nodeName,
	})

	// Handle messages
	return t.readLoop()
}

func (t *Tunnel) readLoop() error {
	for {
		select {
		case <-t.done:
			return nil
		default:
		}

		_, data, err := t.conn.ReadMessage()
		if err != nil {
			log.Printf("❌ WebSocket read error: %v", err)
			return err
		}

		var msg Message
		if err := json.Unmarshal(data, &msg); err != nil {
			log.Printf("⚠️ Invalid message: %v", err)
			continue
		}

		t.handleMessage(msg)
	}
}

func (t *Tunnel) handleMessage(msg Message) {
	switch msg.Type {
	case MsgTypeRegistered:
		log.Printf("✅ Agent registered with dashboard")

	case MsgTypePing:
		t.sendMessage(Message{Type: MsgTypePong})

	case MsgTypeStartShell:
		t.handleStartShell(msg)

	case MsgTypeData:
		t.handleData(msg)

	case MsgTypeResize:
		t.handleResize(msg)

	case MsgTypeCloseShell:
		t.handleCloseShell(msg)

	default:
		log.Printf("⚠️ Unknown message type: %s", msg.Type)
	}
}

func (t *Tunnel) handleStartShell(msg Message) {
	log.Printf("🖥️ Starting shell for session: %s", msg.SessionID)

	cols := msg.Cols
	rows := msg.Rows
	if cols == 0 {
		cols = 80
	}
	if rows == 0 {
		rows = 24
	}

	term, err := NewTerminal(cols, rows)
	if err != nil {
		log.Printf("❌ Failed to start terminal: %v", err)
		t.sendMessage(Message{
			Type:      MsgTypeError,
			SessionID: msg.SessionID,
			Error:     err.Error(),
		})
		return
	}

	t.termMu.Lock()
	t.terminals[msg.SessionID] = term
	t.termMu.Unlock()

	// Stream terminal output to dashboard
	go t.streamOutput(msg.SessionID, term)
}

func (t *Tunnel) streamOutput(sessionID string, term *Terminal) {
	buf := make([]byte, 4096)
	for {
		n, err := term.Read(buf)
		if err != nil {
			log.Printf("📴 Terminal closed for session: %s", sessionID)
			t.sendMessage(Message{
				Type:      MsgTypeCloseShell,
				SessionID: sessionID,
			})
			t.removeTerminal(sessionID)
			return
		}

		if n > 0 {
			t.sendMessage(Message{
				Type:      MsgTypeData,
				SessionID: sessionID,
				Data:      string(buf[:n]),
			})
		}
	}
}

func (t *Tunnel) handleData(msg Message) {
	t.termMu.RLock()
	term, exists := t.terminals[msg.SessionID]
	t.termMu.RUnlock()

	if exists {
		term.Write([]byte(msg.Data))
	}
}

func (t *Tunnel) handleResize(msg Message) {
	t.termMu.RLock()
	term, exists := t.terminals[msg.SessionID]
	t.termMu.RUnlock()

	if exists {
		term.Resize(msg.Cols, msg.Rows)
	}
}

func (t *Tunnel) handleCloseShell(msg Message) {
	t.removeTerminal(msg.SessionID)
}

func (t *Tunnel) removeTerminal(sessionID string) {
	t.termMu.Lock()
	if term, exists := t.terminals[sessionID]; exists {
		term.Close()
		delete(t.terminals, sessionID)
	}
	t.termMu.Unlock()
}

func (t *Tunnel) sendMessage(msg Message) {
	t.connMu.Lock()
	defer t.connMu.Unlock()

	if t.conn == nil {
		return
	}

	data, err := json.Marshal(msg)
	if err != nil {
		log.Printf("❌ Failed to marshal message: %v", err)
		return
	}

	if err := t.conn.WriteMessage(websocket.TextMessage, data); err != nil {
		log.Printf("❌ Failed to send message: %v", err)
	}
}
