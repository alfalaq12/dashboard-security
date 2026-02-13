package remote

import (
	"encoding/base64"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"time"
)

// FileInfo represents a file or directory
type FileInfo struct {
	Name        string    `json:"name"`
	Path        string    `json:"path"`
	Type        string    `json:"type"` // "file", "directory", "symlink"
	Size        int64     `json:"size"`
	ModifiedAt  time.Time `json:"modified_at"`
	Permissions string    `json:"permissions"`
}

// FileSystem handles file operations
type FileSystem struct{}

// NewFileSystem creates a new file system handler
func NewFileSystem() *FileSystem {
	return &FileSystem{}
}

// sanitizePath cleans the path to prevent traversal
func (fs *FileSystem) sanitizePath(path string) (string, error) {
	cleaned := filepath.Clean(path)
	// Additional checks can be added here (e.g., restricting to a root directory)
	// For now, we ensure it's a valid path format and cleaned
	// Check for null bytes which can be used in exploits
	for i := 0; i < len(cleaned); i++ {
		if cleaned[i] == 0 {
			return "", fmt.Errorf("invalid path: contains null byte")
		}
	}
	return cleaned, nil
}

// ListDirectory lists contents of a directory
func (fs *FileSystem) ListDirectory(path string) ([]FileInfo, error) {
	cleanPath, err := fs.sanitizePath(path)
	if err != nil {
		return nil, err
	}

	entries, err := os.ReadDir(cleanPath)
	if err != nil {
		return nil, err
	}

	var files []FileInfo
	for _, entry := range entries {
		info, err := entry.Info()
		if err != nil {
			continue // Skip if info cannot be read
		}

		fileType := "file"
		if entry.IsDir() {
			fileType = "directory"
		} else if info.Mode()&os.ModeSymlink != 0 {
			fileType = "symlink"
		}

		files = append(files, FileInfo{
			Name:        info.Name(),
			Path:        filepath.Join(cleanPath, info.Name()),
			Type:        fileType,
			Size:        info.Size(),
			ModifiedAt:  info.ModTime(),
			Permissions: info.Mode().String(),
		})
	}

	// Sort: directories first, then by name
	sort.Slice(files, func(i, j int) bool {
		if files[i].Type == "directory" && files[j].Type != "directory" {
			return true
		}
		if files[i].Type != "directory" && files[j].Type == "directory" {
			return false
		}
		return files[i].Name < files[j].Name
	})

	return files, nil
}

// ReadFile reads a file and returns base64 encoded content
func (fs *FileSystem) ReadFile(path string) (string, error) {
	cleanPath, err := fs.sanitizePath(path)
	if err != nil {
		return "", err
	}

	data, err := os.ReadFile(cleanPath)
	if err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(data), nil
}

// WriteFile writes base64 encoded content to a file
func (fs *FileSystem) WriteFile(path string, contentBase64 string) error {
	cleanPath, err := fs.sanitizePath(path)
	if err != nil {
		return err
	}

	data, err := base64.StdEncoding.DecodeString(contentBase64)
	if err != nil {
		return fmt.Errorf("invalid base64 content: %v", err)
	}
	return os.WriteFile(cleanPath, data, 0644)
}

// DeleteFile deletes a file or directory
func (fs *FileSystem) DeleteFile(path string) error {
	cleanPath, err := fs.sanitizePath(path)
	if err != nil {
		return err
	}
	return os.RemoveAll(cleanPath)
}

// MakeDirectory creates a new directory
func (fs *FileSystem) MakeDirectory(path string) error {
	cleanPath, err := fs.sanitizePath(path)
	if err != nil {
		return err
	}
	return os.MkdirAll(cleanPath, 0755)
}
