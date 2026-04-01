package models

// Bangladeshi Payment Methods:
// "cash" | "bkash" | "nagad" | "rocket" | "bank_transfer" | "card" | "dbbl_nexus" | "upay"

type Sale struct {
	ID              string     `json:"id"`
	InvoiceNumber   string     `json:"invoice_number"`
	CustomerName    string     `json:"customer_name"`
	CustomerEmail   string     `json:"customer_email"`
	CustomerPhone   string     `json:"customer_phone"`
	CustomerAddress string     `json:"customer_address"`
	Items           []SaleItem `json:"items"`
	SubTotal        float64    `json:"sub_total"`
	DiscountAmount  float64    `json:"discount_amount"`
	TaxAmount       float64    `json:"tax_amount"`
	TotalAmount     float64    `json:"total_amount"`
	PaidAmount      float64    `json:"paid_amount"`
	PaymentMethod   string     `json:"payment_method"`
	TransactionID   string     `json:"transaction_id"` // bKash/Nagad/Rocket/Bank TrxID
	Status          string     `json:"status"`         // "pending" | "completed" | "cancelled" | "refunded"
	Note            string     `json:"note"`
	CreatedBy       string     `json:"created_by"`
	CreatedAt       string     `json:"created_at"`
	UpdatedAt       string     `json:"updated_at"`
}

type SaleItem struct {
	ProductID   string  `json:"product_id"`
	ProductName string  `json:"product_name"`
	SKU         string  `json:"sku"`
	Quantity    int     `json:"quantity"`
	UnitPrice   float64 `json:"unit_price"`
	CostPrice   float64 `json:"cost_price"` // COGS: product cost at time of sale
	Discount    float64 `json:"discount"`
	Subtotal    float64 `json:"subtotal"`
}
