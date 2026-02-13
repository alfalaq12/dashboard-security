package remote

// handleFileList handles listing directory contents
func (t *Tunnel) handleFileList(msg Message) {
	path, ok := msg.Data.(string)
	if !ok {
		t.sendError(msg, "Invalid data format for file_list")
		return
	}

	files, err := t.fs.ListDirectory(path)
	if err != nil {
		t.sendError(msg, err.Error())
		return
	}

	t.sendMessage(Message{
		Type:      MsgTypeFileList,
		SessionID: msg.SessionID, // Match request ID
		Data:      files,
	})
}

// handleFileRead handles reading a file
func (t *Tunnel) handleFileRead(msg Message) {
	path, ok := msg.Data.(string)
	if !ok {
		t.sendError(msg, "Invalid data format for file_read")
		return
	}

	content, err := t.fs.ReadFile(path)
	if err != nil {
		t.sendError(msg, err.Error())
		return
	}

	t.sendMessage(Message{
		Type:      MsgTypeFileRead,
		SessionID: msg.SessionID,
		Data:      content, // Base64 encoded string
	})
}

// handleFileWrite handles writing to a file
func (t *Tunnel) handleFileWrite(msg Message) {
	dataMap, ok := msg.Data.(map[string]interface{})
	if !ok {
		t.sendError(msg, "Invalid schema for file_write")
		return
	}

	path, _ := dataMap["path"].(string)
	content, _ := dataMap["content"].(string)

	if err := t.fs.WriteFile(path, content); err != nil {
		t.sendError(msg, err.Error())
		return
	}

	t.sendSuccess(msg)
}

// handleFileDelete handles deleting a file or directory
func (t *Tunnel) handleFileDelete(msg Message) {
	path, ok := msg.Data.(string)
	if !ok {
		t.sendError(msg, "Invalid data format for file_delete")
		return
	}

	if err := t.fs.DeleteFile(path); err != nil {
		t.sendError(msg, err.Error())
		return
	}

	t.sendSuccess(msg)
}

// handleFileMkdir handles creating a directory
func (t *Tunnel) handleFileMkdir(msg Message) {
	path, ok := msg.Data.(string)
	if !ok {
		t.sendError(msg, "Invalid data format for file_mkdir")
		return
	}

	if err := t.fs.MakeDirectory(path); err != nil {
		t.sendError(msg, err.Error())
		return
	}

	t.sendSuccess(msg)
}

// Helper: Send Error
func (t *Tunnel) sendError(origin Message, errStr string) {
	t.sendMessage(Message{
		Type:      MsgTypeError,
		SessionID: origin.SessionID,
		Error:     errStr,
		Data:      origin.Data, // Optional: return original data for context
	})
}

// Helper: Send Success (Ack)
func (t *Tunnel) sendSuccess(origin Message) {
	t.sendMessage(Message{
		Type:      origin.Type, // Echo type back
		SessionID: origin.SessionID,
		Data:      "success",
	})
}
