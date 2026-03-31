package models

// Product represents a product in the store.
type Product struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Price       float64 `json:"price"`
	Category    string  `json:"category"`
	Stock       int     `json:"stock"`
	ImageURL    string  `json:"imageUrl"`
	CreatedAt   string  `json:"createdAt"`
	UpdatedAt   string  `json:"updatedAt"`
}

// ProductInput is used for create/update requests parsed from multipart form.
type ProductInput struct {
	Name        string  `form:"name"        binding:"required"`
	Description string  `form:"description" binding:"required"`
	Price       float64 `form:"price"       binding:"required,gt=0"`
	Category    string  `form:"category"    binding:"required"`
	Stock       int     `form:"stock"       binding:"gte=0"`
}
