package models

type PaginatedResponse[T any] struct {
	Data  []T `json:"data"`
	Total int `json:"total"`
	Page  int `json:"page"`
	Limit int `json:"limit"`
}

func (p *PaginatedResponse[T]) TotalPages() int {
	if p.Limit == 0 {
		return 0
	}
	return (p.Total + p.Limit - 1) / p.Limit
}
