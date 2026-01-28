package sender

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// Client sends data to the central dashboard server
type Client struct {
	serverURL  string
	apiKey     string
	nodeName   string
	httpClient *http.Client
}

// Payload is the data structure sent to the server
type Payload struct {
	NodeName  string      `json:"node_name"`
	Type      string      `json:"type"` // "ssh_event" or "system_stats"
	Timestamp time.Time   `json:"timestamp"`
	Data      interface{} `json:"data"`
}

// NewClient creates a new sender client
func NewClient(serverURL, apiKey, nodeName string) *Client {
	return &Client{
		serverURL: serverURL,
		apiKey:    apiKey,
		nodeName:  nodeName,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// Send transmits a payload to the server
func (c *Client) Send(payloadType string, data interface{}) error {
	payload := Payload{
		NodeName:  c.nodeName,
		Type:      payloadType,
		Timestamp: time.Now(),
		Data:      data,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %w", err)
	}

	req, err := http.NewRequest("POST", c.serverURL+"/api/ingest", bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", c.apiKey)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return fmt.Errorf("server returned status: %d", resp.StatusCode)
	}

	return nil
}
