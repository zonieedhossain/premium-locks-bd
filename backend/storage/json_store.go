package storage

import (
	"encoding/json"
	"fmt"
	"os"
	"sync"
)

// JSONStore is a generic, thread-safe file-backed JSON store.
type JSONStore[T any] struct {
	mu       sync.RWMutex
	filepath string
}

// NewJSONStore returns a new JSONStore backed by the given file.
func NewJSONStore[T any](filepath string) *JSONStore[T] {
	return &JSONStore[T]{filepath: filepath}
}

// Read deserialises the JSON file into a slice of T.
func (s *JSONStore[T]) Read() ([]T, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	data, err := os.ReadFile(s.filepath)
	if os.IsNotExist(err) {
		return []T{}, nil
	}
	if err != nil {
		return nil, fmt.Errorf("read %s: %w", s.filepath, err)
	}
	if len(data) == 0 || string(data) == "null" {
		return []T{}, nil
	}

	var items []T
	if err := json.Unmarshal(data, &items); err != nil {
		return nil, fmt.Errorf("unmarshal %s: %w", s.filepath, err)
	}
	return items, nil
}

// Write serialises items and atomically overwrites the JSON file.
func (s *JSONStore[T]) Write(items []T) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	data, err := json.MarshalIndent(items, "", "  ")
	if err != nil {
		return fmt.Errorf("marshal: %w", err)
	}
	if err := os.WriteFile(s.filepath, data, 0o644); err != nil {
		return fmt.Errorf("write %s: %w", s.filepath, err)
	}
	return nil
}
