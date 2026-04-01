package utils

import (
	"strconv"

	"github.com/gin-gonic/gin"
)

const DefaultPage = 1
const DefaultLimit = 10

// ParsePagination extracts page and limit from query params with defaults.
func ParsePagination(c *gin.Context) (page, limit int) {
	page, _ = strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ = strconv.Atoi(c.DefaultQuery("limit", "10"))
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}
	return
}

// Paginate slices a generic array by page and limit, returning the slice and total count.
func Paginate[T any](items []T, page, limit int) ([]T, int) {
	total := len(items)
	start := (page - 1) * limit
	if start >= total {
		return []T{}, total
	}
	end := start + limit
	if end > total {
		end = total
	}
	return items[start:end], total
}
