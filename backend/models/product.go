package models

type Product struct {
	ID               string   `json:"id"`
	Name             string   `json:"name"`
	Slug             string   `json:"slug"`
	SKU              string   `json:"sku"`
	Category         string   `json:"category"`
	Price            float64  `json:"price"`
	DiscountPrice    float64  `json:"discount_price"`
	ShortDescription string   `json:"short_description"`
	Description      string   `json:"description"`
	StockQuantity    int      `json:"stock_quantity"`
	CostPrice        float64  `json:"cost_price"`
	MainImage        string   `json:"main_image"`
	GalleryImages    []string `json:"gallery_images"`
	IsActive         bool     `json:"is_active"`
	CreatedAt        string   `json:"created_at"`
	UpdatedAt        string   `json:"updated_at"`
}
