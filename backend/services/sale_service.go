package services

import (
	"fmt"
	"log/slog"
	"sync"
	"time"

	"github.com/google/uuid"
	"premium-locks-bd/models"
	"premium-locks-bd/repository"
	"premium-locks-bd/storage"
)

type SaleService struct {
	mu           sync.Mutex
	saleRepo     repository.SaleRepository
	productRepo  repository.ProductRepository
	counterStore *storage.CounterStore
	taxRate      float64
}

func NewSaleService(saleRepo repository.SaleRepository, productRepo repository.ProductRepository, counterStore *storage.CounterStore, taxRate float64) *SaleService {
	return &SaleService{
		saleRepo:     saleRepo,
		productRepo:  productRepo,
		counterStore: counterStore,
		taxRate:      taxRate,
	}
}

func (s *SaleService) GetAll() ([]models.Sale, error) {
	return s.saleRepo.GetAll()
}

func (s *SaleService) GetByID(id string) (*models.Sale, error) {
	return s.saleRepo.GetByID(id)
}

type SaleInput struct {
	CustomerName    string
	CustomerEmail   string
	CustomerPhone   string
	CustomerAddress string
	Items           []SaleItemInput
	DiscountAmount  float64
	PaidAmount      float64
	PaymentMethod   string
	TransactionID   string
	Note            string
	CreatedBy       string
}

type SaleItemInput struct {
	ProductID string
	Quantity  int
	UnitPrice float64
	Discount  float64
}

// Create validates stock, decreases stock atomically, and saves the sale.
func (s *SaleService) Create(input SaleInput) (*models.Sale, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if input.CustomerName == "" {
		return nil, fmt.Errorf("customer name is required")
	}
	if len(input.Items) == 0 {
		return nil, fmt.Errorf("at least one item is required")
	}

	products, err := s.productRepo.GetAll()
	if err != nil {
		return nil, err
	}
	productMap := make(map[string]int)
	for i, p := range products {
		productMap[p.ID] = i
	}

	// Validate stock for all items first
	for _, item := range input.Items {
		idx, ok := productMap[item.ProductID]
		if !ok {
			return nil, fmt.Errorf("product not found: %s", item.ProductID)
		}
		if products[idx].StockQuantity < item.Quantity {
			return nil, fmt.Errorf("insufficient stock for: %s (available: %d, requested: %d)", products[idx].Name, products[idx].StockQuantity, item.Quantity)
		}
	}

	// Build sale items and decrease stock
	var items []models.SaleItem
	var subTotal float64
	for _, item := range input.Items {
		idx := productMap[item.ProductID]
		p := products[idx]
		subtotal := float64(item.Quantity)*item.UnitPrice - item.Discount
		subTotal += subtotal
		items = append(items, models.SaleItem{
			ProductID:   item.ProductID,
			ProductName: p.Name,
			SKU:         p.SKU,
			Quantity:    item.Quantity,
			UnitPrice:   item.UnitPrice,
			CostPrice:   p.CostPrice,
			Discount:    item.Discount,
			Subtotal:    subtotal,
		})
		products[idx].StockQuantity -= item.Quantity
		slog.Info("stock decrease", "product_id", item.ProductID, "delta", -item.Quantity, "reason", "sale_created", "ts", time.Now().UTC())
	}

	// Write product stock atomically
	for _, p := range products {
		if err := s.productRepo.Update(p); err != nil {
			return nil, fmt.Errorf("update product stock: %w", err)
		}
	}

	invoiceNum, err := s.nextInvoiceNumber()
	if err != nil {
		return nil, err
	}

	taxAmount := (subTotal - input.DiscountAmount) * s.taxRate / 100
	total := subTotal - input.DiscountAmount + taxAmount
	now := time.Now().UTC().Format(time.RFC3339)

	sale := models.Sale{
		ID:              uuid.NewString(),
		InvoiceNumber:   invoiceNum,
		CustomerName:    input.CustomerName,
		CustomerEmail:   input.CustomerEmail,
		CustomerPhone:   input.CustomerPhone,
		CustomerAddress: input.CustomerAddress,
		Items:           items,
		SubTotal:        subTotal,
		DiscountAmount:  input.DiscountAmount,
		TaxAmount:       taxAmount,
		TotalAmount:     total,
		PaidAmount:      input.PaidAmount,
		PaymentMethod:   input.PaymentMethod,
		TransactionID:   input.TransactionID,
		Status:          "pending",
		Note:            input.Note,
		CreatedBy:       input.CreatedBy,
		CreatedAt:       now,
		UpdatedAt:       now,
	}

	if err := s.saleRepo.Save(sale); err != nil {
		return nil, err
	}
	return &sale, nil
}

func (s *SaleService) Update(id string, input SaleInput) (*models.Sale, error) {
	existing, err := s.saleRepo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if existing.Status != "pending" {
		return nil, fmt.Errorf("can only update pending sales")
	}

	existing.CustomerName = input.CustomerName
	existing.CustomerEmail = input.CustomerEmail
	existing.CustomerPhone = input.CustomerPhone
	existing.CustomerAddress = input.CustomerAddress
	existing.PaymentMethod = input.PaymentMethod
	existing.PaidAmount = input.PaidAmount
	existing.Note = input.Note
	existing.UpdatedAt = time.Now().UTC().Format(time.RFC3339)

	if err := s.saleRepo.Update(*existing); err != nil {
		return nil, err
	}
	return existing, nil
}

// Cancel restores stock for all items.
func (s *SaleService) Cancel(id string) (*models.Sale, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	sale, err := s.saleRepo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if sale.Status == "cancelled" {
		return nil, fmt.Errorf("sale is already cancelled")
	}

	products, err := s.productRepo.GetAll()
	if err != nil {
		return nil, err
	}
	productMap := make(map[string]int)
	for i, p := range products {
		productMap[p.ID] = i
	}

	for _, item := range sale.Items {
		idx, ok := productMap[item.ProductID]
		if !ok {
			continue
		}
		products[idx].StockQuantity += item.Quantity
		slog.Info("stock increase", "product_id", item.ProductID, "delta", item.Quantity, "reason", "sale_cancelled", "sale_id", id, "ts", time.Now().UTC())
	}

	for _, p := range products {
		if err := s.productRepo.Update(p); err != nil {
			return nil, fmt.Errorf("update product stock: %w", err)
		}
	}

	sale.Status = "cancelled"
	sale.UpdatedAt = time.Now().UTC().Format(time.RFC3339)
	if err := s.saleRepo.Update(*sale); err != nil {
		return nil, err
	}
	return sale, nil
}

func (s *SaleService) Complete(id string) (*models.Sale, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	sale, err := s.saleRepo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if sale.Status != "pending" {
		return nil, fmt.Errorf("only pending sales can be marked as complete")
	}

	sale.Status = "completed"
	sale.UpdatedAt = time.Now().UTC().Format(time.RFC3339)
	if err := s.saleRepo.Update(*sale); err != nil {
		return nil, err
	}
	return sale, nil
}

func (s *SaleService) Delete(id string) error {
	sale, err := s.saleRepo.GetByID(id)
	if err != nil {
		return err
	}
	_ = sale
	return s.saleRepo.Delete(id)
}

func (s *SaleService) nextInvoiceNumber() (string, error) {
	n, err := s.counterStore.Next("sale_invoice")
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("INV-SALE-%04d", n), nil
}
