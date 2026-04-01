package storage

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
)

// PartitionedJSONStore manages JSON files partitioned by a key (e.g., date).
type PartitionedJSONStore[T any] struct {
	mu      sync.RWMutex
	baseDir string
}

// NewPartitionedJSONStore returns a new store within the baseDir.
func NewPartitionedJSONStore[T any](baseDir string) *PartitionedJSONStore[T] {
	if err := os.MkdirAll(baseDir, 0o755); err != nil {
		fmt.Printf("failed to create base dir: %v\n", err)
	}
	return &PartitionedJSONStore[T]{baseDir: baseDir}
}

// Read returns items for a specific partition key.
func (s *PartitionedJSONStore[T]) Read(key string) ([]T, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	return s.readFile(s.pathFor(key))
}

// ReadAll aggregates items from ALL partitions in the baseDir.
func (s *PartitionedJSONStore[T]) ReadAll() ([]T, error) {
	return s.ReadByRange("", "")
}

// ReadByRange aggregates items from partitions whose keys fall within [start, end] inclusive.
// If start is "", there is no lower bound. If end is "", there is no upper bound.
func (s *PartitionedJSONStore[T]) ReadByRange(start, end string) ([]T, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	entries, err := os.ReadDir(s.baseDir)
	if os.IsNotExist(err) {
		return []T{}, nil
	}
	if err != nil {
		return nil, fmt.Errorf("read base dir: %w", err)
	}

	var all []T
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".json") {
			continue
		}

		key := strings.TrimSuffix(entry.Name(), ".json")
		if (start != "" && key < start) || (end != "" && key > end) {
			continue
		}

		items, err := s.readFile(filepath.Join(s.baseDir, entry.Name()))
		if err != nil {
			fmt.Printf("warning: failed to read partition %s: %v\n", entry.Name(), err)
			continue
		}
		all = append(all, items...)
	}
	return all, nil
}

// Write overwrites items for a specific partition key.
func (s *PartitionedJSONStore[T]) Write(key string, items []T) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if err := os.MkdirAll(s.baseDir, 0o755); err != nil {
		return err
	}

	data, err := json.MarshalIndent(items, "", "  ")
	if err != nil {
		return fmt.Errorf("marshal: %w", err)
	}

	return os.WriteFile(s.pathFor(key), data, 0o644)
}

func (s *PartitionedJSONStore[T]) pathFor(key string) string {
	// Safeguard: sanitize key to prevent path traversal
	key = strings.ReplaceAll(key, "..", "")
	return filepath.Join(s.baseDir, key+".json")
}

func (s *PartitionedJSONStore[T]) readFile(path string) ([]T, error) {
	data, err := os.ReadFile(path)
	if os.IsNotExist(err) {
		return []T{}, nil
	}
	if err != nil {
		return nil, err
	}
	if len(data) == 0 || string(data) == "null" {
		return []T{}, nil
	}

	var items []T
	if err := json.Unmarshal(data, &items); err != nil {
		return nil, err
	}
	return items, nil
}
