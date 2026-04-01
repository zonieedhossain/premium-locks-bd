package models

type Purchase struct {
	ID            string         `json:"id"`
	SupplierName  string         `json:"supplier_name"`
	Items         []PurchaseItem `json:"items"`
	TotalAmount   float64        `json:"total_amount"`
	PaidAmount    float64        `json:"paid_amount"`
	PaymentMethod string         `json:"payment_method"` // "cash" | "bkash" | "nagad" | "rocket" | "bank_transfer" | "card"
	TransactionID string         `json:"transaction_id"` // bKash/Nagad/Rocket/Bank TrxID
	Status        string         `json:"status"`         // "pending" | "received" | "cancelled"
	Note          string         `json:"note"`
	CreatedBy     string         `json:"created_by"`
	CreatedAt     string         `json:"created_at"`
	UpdatedAt     string         `json:"updated_at"`
}

type PurchaseItem struct {
	ProductID   string  `json:"product_id"`
	ProductName string  `json:"product_name"`
	SKU         string  `json:"sku"`
	Quantity    int     `json:"quantity"`
	UnitCost    float64 `json:"unit_cost"`
	Subtotal    float64 `json:"subtotal"`
}
