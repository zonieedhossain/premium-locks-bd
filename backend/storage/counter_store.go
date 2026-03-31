package storage

import (
	"encoding/json"
	"fmt"
	"os"
	"sync"
)

// CounterStore is a thread-safe persistent counter map.
type CounterStore struct {
	mu       sync.Mutex
	filepath string
}

// NewCounterStore returns a CounterStore backed by filepath.
func NewCounterStore(filepath string) *CounterStore {
	return &CounterStore{filepath: filepath}
}

// Next atomically increments the named counter and returns its new value.
func (s *CounterStore) Next(name string) (int, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	counters, err := s.read()
	if err != nil {
		return 0, err
	}
	counters[name]++
	if err := s.write(counters); err != nil {
		return 0, err
	}
	return counters[name], nil
}

func (s *CounterStore) read() (map[string]int, error) {
	data, err := os.ReadFile(s.filepath)
	if os.IsNotExist(err) {
		return map[string]int{}, nil
	}
	if err != nil {
		return nil, fmt.Errorf("read counters: %w", err)
	}
	if len(data) == 0 {
		return map[string]int{}, nil
	}
	var m map[string]int
	if err := json.Unmarshal(data, &m); err != nil {
		return nil, fmt.Errorf("unmarshal counters: %w", err)
	}
	return m, nil
}

func (s *CounterStore) write(counters map[string]int) error {
	data, err := json.MarshalIndent(counters, "", "  ")
	if err != nil {
		return fmt.Errorf("marshal counters: %w", err)
	}
	return os.WriteFile(s.filepath, data, 0o644)
}
