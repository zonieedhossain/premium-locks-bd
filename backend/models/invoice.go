package models

type Invoice struct {
	ID            string `json:"id"`
	InvoiceNumber string `json:"invoice_number"`
	Type          string `json:"type"`       // "sale" | "purchase"
	LinkedID      string `json:"linked_id"`  // sale or purchase ID
	FilePath      string `json:"file_path"`  // path to PDF file
	CreatedAt     string `json:"created_at"`
}
